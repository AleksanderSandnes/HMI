package controller;

import java.time.Duration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.client.reactive.ClientHttpConnector;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

import entity.DayResponse;
import entity.EnergyRequest;
import entity.LoginRequest;
import entity.MonthResponse;
import entity.TotalDataInvResponse;
import entity.TotalDataResponse;
import entity.YearResponse;
import entity.growatt.GwChartResponse;
import entity.growatt.GwDevicesResponse;
import io.micrometer.common.util.StringUtils;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.netty.transport.ProxyProvider;
import reactor.util.retry.Retry;

/**
 * Stateful client for {@code server.growatt.com}, updated to the Growatt <b>v2.0.0</b> web
 * API (the old {@code /indexbC/*} endpoints our app used were deprecated, which is the most
 * likely cause of the recurring multi-day live-data outages). The new endpoints are:
 * <ul>
 *   <li>{@code /energy/compare/getDevicesDayChart}   (params {@code pac})</li>
 *   <li>{@code /energy/compare/getDevicesMonthChart} (params {@code energy,autoEnergy})</li>
 *   <li>{@code /energy/compare/getDevicesYearChart}  (params {@code energy,autoEnergy})</li>
 *   <li>{@code /panel/getDevicesByPlantList}         (cumulative totals)</li>
 * </ul>
 * Each chart request sends a {@code jsonData=[{"type":"plant","sn":<plantId>,"params":...}]}
 * form field. Responses are parsed into raw {@link GwChartResponse}/{@link GwDevicesResponse}
 * shapes and then mapped into our existing public DTOs, so the controller, cache, and
 * frontend contracts are unchanged.
 *
 * <p>IP-block hardening (none of this exists upstream): browser-like request headers, a small
 * retry-with-backoff for transient upstream failures, and lenient JSON parsing. The existing
 * {@code PROXY_URL}/{@code PROXY_PORT} constructor remains the escalation lever if Growatt
 * starts blocking the server's egress IP.</p>
 */
@Slf4j
public class GrowattWebClient {

	public static final String ONE_PLANT_ID = "onePlantId";

	/** A real browser User-Agent — plain HTTP-client UAs are an easy bot-block signal. */
	private static final String USER_AGENT =
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
			+ "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

	private final MultiValueMap<String, String> cookieJar = new LinkedMultiValueMap<>();

	private final WebClient client;

	private final ObjectMapper objectMapper = new ObjectMapper()
			.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

	/** Constructor without a proxy. */
	public GrowattWebClient() {
		this(HttpClient.create().followRedirect(true));
	}

	/** Constructor when behind a proxy. */
	public GrowattWebClient(String proxyURL, int proxyPort) {
		this(HttpClient.create()
				.followRedirect(true)
				.proxy(proxy -> proxy.type(ProxyProvider.Proxy.HTTP).host(proxyURL).port(proxyPort)));
	}

	private GrowattWebClient(HttpClient httpClient) {
		ClientHttpConnector clientHttpConnector = new ReactorClientHttpConnector(httpClient);
		client = WebClient.builder()
				.baseUrl("https://server.growatt.com")
				.clientConnector(clientHttpConnector)
				.defaultHeader(HttpHeaders.USER_AGENT, USER_AGENT)
				.defaultHeader(HttpHeaders.REFERER, "https://server.growatt.com/index")
				.defaultHeader(HttpHeaders.ACCEPT, "application/json, text/javascript, */*; q=0.01")
				.defaultHeader("X-Requested-With", "XMLHttpRequest")
				.build();
	}

	/** Internal plant id, set as a cookie during login; needed for the chart requests. */
	public String getPlantId() {
		return cookieJar.getFirst(ONE_PLANT_ID);
	}

	private void writeCookies(MultiValueMap<String, String> cookies) {
		cookies.addAll(cookieJar);
	}

	private Mono<String> readCookies(ClientResponse response) {
		MultiValueMap<String, ResponseCookie> cookies = response.cookies();
		for (var key : cookies.keySet()) {
			cookieJar.add(key, cookies.getFirst(key).getValue());
			log.debug("{} : {}", key, cookies.getFirst(key).getValue());
		}
		return response.bodyToMono(String.class);
	}

	/** Log into server.growatt.com and capture the session cookies (incl. the plant id). */
	public String login(LoginRequest loginRequest) {
		LinkedMultiValueMap<String, String> loginData = new LinkedMultiValueMap<>();
		loginData.add("account", loginRequest.getAccount());
		loginData.add("passwordCrc", loginRequest.getPasswordCrc());

		return client.post()
				.uri("/login")
				.contentType(MediaType.APPLICATION_FORM_URLENCODED)
				.body(BodyInserters.fromFormData(loginData))
				.exchangeToMono(this::readCookies)
				.block();
	}

	// ---- Cumulative "as of now" snapshots (from the plant's device list) -----------------

	public TotalDataResponse getTotalData(EnergyRequest request) {
		return mapTotals(devicesResponse(request.getPlantId()));
	}

	/**
	 * Map a {@code getDevicesByPlantList} response into our cumulative-totals DTO. Surfaces
	 * the production figures plus the device/plant metadata the dashboard uses (status,
	 * model, plant name, last update, device/online counts). Static + null-safe so it can
	 * be unit-tested against a captured JSON fixture without hitting the live API.
	 */
	static TotalDataResponse mapTotals(GwDevicesResponse devices) {
		GwDevicesResponse.Data d = devices != null ? devices.firstDevice() : null;
		if (d == null) {
			return new TotalDataResponse(null, null);
		}
		TotalDataResponse.Obj obj = new TotalDataResponse.Obj();
		obj.setEToday(d.getEToday());
		obj.setEMonth(d.getEMonth());
		obj.setETotal(d.getETotal());
		obj.setPac(d.getPac());
		obj.setNominalPower(d.getNominalPower());
		obj.setPlantId(d.getPlantId());
		// Device/plant metadata (v2 getDevicesByPlantList; CO2/revenue/PR are not returned here).
		obj.setStatus(d.getStatus());
		obj.setDeviceModel(d.getDeviceModel());
		obj.setPlantName(d.getPlantName());
		obj.setLastUpdateTime(d.getLastUpdateTime());
		obj.setDeviceNum(devices.deviceCount());
		obj.setOnlineNum(devices.onlineCount());
		return new TotalDataResponse(1L, obj);
	}

	public TotalDataInvResponse getInvTotalData(EnergyRequest request) {
		GwDevicesResponse.Data d = devicesByPlant(request.getPlantId());
		if (d == null) {
			return new TotalDataInvResponse(null, null);
		}
		TotalDataInvResponse.Obj obj = new TotalDataInvResponse.Obj(
				str(d.getEToday()), str(d.getETotal()), str(d.getPac()));
		return new TotalDataInvResponse(1L, obj);
	}

	private GwDevicesResponse.Data devicesByPlant(String plantId) {
		GwDevicesResponse devices = devicesResponse(plantId);
		return devices != null ? devices.firstDevice() : null;
	}

	private GwDevicesResponse devicesResponse(String plantId) {
		LinkedMultiValueMap<String, String> body = new LinkedMultiValueMap<>();
		body.add("currPage", "1");
		body.add("plantId", plantId);
		return postForm("/panel/getDevicesByPlantList", body, GwDevicesResponse.class);
	}

	// ---- Date-specific charts ------------------------------------------------------------

	/** Day chart (5-minute power values). Date as {@code yyyy-MM-dd}; only the last ~3 months. */
	public DayResponse getInvEnergyDayChart(EnergyRequest request) {
		GwChartResponse.Datas datas = chart("/energy/compare/getDevicesDayChart",
				request.getPlantId(), request.getDate(), null, "pac");
		if (datas == null) {
			return new DayResponse(null, null);
		}
		return new DayResponse(1L, new DayResponse.Obj(datas.getPac()));
	}

	/** Month chart (per-day energy totals). Date as {@code yyyy-MM}. */
	public MonthResponse getInvEnergyMonthChart(EnergyRequest request) {
		GwChartResponse.Datas datas = chart("/energy/compare/getDevicesMonthChart",
				request.getPlantId(), request.getDate(), null, "energy,autoEnergy");
		if (datas == null) {
			return new MonthResponse(null, null);
		}
		return new MonthResponse(1L, new MonthResponse.Obj(datas.getEnergy()));
	}

	/** Year chart (per-month energy totals). Date as {@code yyyy}. */
	public YearResponse getInvEnergyYearChart(EnergyRequest request) {
		Integer year = parseYear(request.getDate());
		GwChartResponse.Datas datas = chart("/energy/compare/getDevicesYearChart",
				request.getPlantId(), null, year, "energy,autoEnergy");
		if (datas == null) {
			return new YearResponse(null, null);
		}
		return new YearResponse(1L, new YearResponse.Obj(datas.getEnergy()));
	}

	/**
	 * Total chart (per-year energy totals for the last ~5 years), via the v2
	 * {@code /energy/compare/getDevicesTotalChart} endpoint. Date as {@code yyyy} (the most
	 * recent year of the window); a blank/unparseable date falls back to the current year.
	 * Reuses {@link YearResponse} (one energy value per year).
	 */
	public YearResponse getInvEnergyTotalChart(EnergyRequest request) {
		Integer year = parseYear(request.getDate());
		if (year == null) {
			year = java.time.Year.now().getValue();
		}
		GwChartResponse.Datas datas = chart("/energy/compare/getDevicesTotalChart",
				request.getPlantId(), null, year, "energy,autoEnergy");
		if (datas == null) {
			return new YearResponse(null, null);
		}
		return new YearResponse(1L, new YearResponse.Obj(datas.getEnergy()));
	}

	private GwChartResponse.Datas chart(String uri, String plantId, String date, Integer year, String params) {
		GwChartResponse response = postForm(uri, createBody(plantId, date, year, params), GwChartResponse.class);
		return response != null ? response.firstDatas() : null;
	}

	/** Build the v2.0.0 form body: plantId (+ optional date/year) + the jsonData descriptor. */
	static LinkedMultiValueMap<String, String> createBody(String plantId, String date, Integer year, String params) {
		LinkedMultiValueMap<String, String> data = new LinkedMultiValueMap<>();
		data.add("plantId", plantId);
		if (StringUtils.isNotEmpty(date)) {
			data.add("date", date);
		}
		if (year != null) {
			data.add("year", String.valueOf(year));
		}
		if (params != null) {
			data.add("jsonData",
					"[{\"type\":\"plant\",\"sn\":\"%s\",\"params\":\"%s\"}]".formatted(plantId, params));
		}
		return data;
	}

	// ---- Transport ------------------------------------------------------------------------

	private <T> T postForm(String uri, MultiValueMap<String, String> form, Class<T> clazz) {
		String body = client.post()
				.uri(uri)
				.cookies(this::writeCookies)
				.contentType(MediaType.APPLICATION_FORM_URLENCODED)
				.body(BodyInserters.fromFormData(form))
				.retrieve()
				.bodyToMono(String.class)
				// Small backoff retry for transient upstream hiccups (not for 4xx).
				.retryWhen(Retry.backoff(2, Duration.ofMillis(500)).filter(this::isTransient))
				.block();
		return parse(uri, body, clazz);
	}

	private boolean isTransient(Throwable t) {
		if (t instanceof WebClientResponseException e) {
			return e.getStatusCode().is5xxServerError();
		}
		return true; // connection resets / timeouts
	}

	private <T> T parse(String uri, String body, Class<T> clazz) {
		try {
			if (StringUtils.isNotBlank(body)) {
				return objectMapper.readValue(body, clazz);
			}
			log.error("POST to {} returned an empty body", uri);
		} catch (Exception e) {
			log.error("Error parsing JSON response from {}: {}", uri, e.getMessage());
		}
		return null;
	}

	private static Integer parseYear(String date) {
		try {
			return date != null ? Integer.valueOf(date.trim().substring(0, 4)) : null;
		} catch (Exception e) {
			return null;
		}
	}

	private static String str(Double value) {
		return value != null ? String.valueOf(value) : null;
	}
}
