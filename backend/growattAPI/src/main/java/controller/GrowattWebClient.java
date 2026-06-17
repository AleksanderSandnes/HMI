package controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.client.reactive.ClientHttpConnector;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import entity.DayResponse;
import entity.EnergyRequest;
import entity.LoginRequest;
import entity.MonthResponse;
import entity.TotalDataInvResponse;
import entity.TotalDataResponse;
import entity.YearResponse;
import io.micrometer.common.util.StringUtils;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.netty.transport.ProxyProvider;
import org.springframework.http.HttpHeaders;

@Slf4j
@Component
public class GrowattWebClient {
	
	public static final String ONE_PLANT_ID = "onePlantId";

	public static final String SELECTED_USER_ID = "selectedUserId";

	private MultiValueMap<String, String> cookieJar = new LinkedMultiValueMap<>();
	
	private WebClient client;
	
	/**
	 * Constructor without a proxy
	 */
	public GrowattWebClient() {
		this(HttpClient
			.create()
			.followRedirect(true));
	}
	
	/**
	 * Constructor when behind a proxy
	 * 
	 * @param proxyURL
	 * @param proxyPort
	 */
	public GrowattWebClient(String proxyURL, int proxyPort) {
		this(HttpClient
			.create()
			.followRedirect(true)
			.proxy(proxy-> proxy.type(ProxyProvider.Proxy.HTTP).host(proxyURL).port(proxyPort)));
	}
	
	private GrowattWebClient(HttpClient httpClient) {
		ClientHttpConnector clientHttpConnector = new ReactorClientHttpConnector(httpClient);
		  
		client = WebClient.builder()
			.baseUrl("http://server.growatt.com")
			.clientConnector(clientHttpConnector)
			.build();
	}

	/** 
	 * Get the internal plant id. Needed for following requests.
	 * @return
	 */
	public String getPlantId() {
		return getCookie(ONE_PLANT_ID);
	}
	
	private String getCookie(String cookie) {
		return cookieJar.getFirst(cookie);
	}
		
	private void writeCookies(MultiValueMap<String, String> myCookies, MultiValueMap<String, String> cookies) {
		cookies.addAll(myCookies);
	}

	private Mono<String> readCookies(MultiValueMap<String, String> myCookies, ClientResponse response) {
		MultiValueMap<String, ResponseCookie> cookies = response.cookies();
		for (var key : cookies.keySet()) {
			myCookies.add(key, cookies.getFirst(key).getValue());
			log.debug(key + " : " + cookies.getFirst(key).getValue());
		}
		return response.bodyToMono(String.class);
	}

	/**
	 * Login into server.growatt.com. Initialize all needed cookies for the following requests.
	 * 
	 * @param loginRequest
	 * @return
	 */
	public String login(LoginRequest loginRequest) {
		LinkedMultiValueMap<String, String> loginData = new LinkedMultiValueMap<>();
		loginData.add("account", loginRequest.getAccount());
		loginData.add("passwordCrc", loginRequest.getPasswordCrc());
		
		String login = client
			.post()
			.uri("/login")
			.contentType(MediaType.APPLICATION_FORM_URLENCODED)
			.body(BodyInserters.fromFormData(loginData))
			.exchangeToMono(response -> readCookies(cookieJar, response))
			.block();
		
		/*
		var plantListTitle = client
			.get()
			.uri("/index/getPlantListTitle")
			.cookies(cookies -> writeCookies(cookieJar, cookies))
			.exchangeToMono(response -> readCookies(cookieJar, response))
			.block();
		*/
		
		return login;
	}
	
	/**
	 * Retrieve generic informations and about the power production.
	 *
	 * <p>This is a cumulative "as of now" snapshot and is <b>not</b> tied to a specific date.
	 * The {@code date} is intentionally not forwarded to Growatt: sending one (e.g. a future
	 * date relative to Growatt's server) makes the endpoint return {@code 400 Bad Request}.</p>
	 */
	public TotalDataResponse getTotalData(EnergyRequest energyRequest) {
		return (TotalDataResponse) request("/indexbC/getTotalData", energyRequest.getPlantId(), null, TotalDataResponse.class);
	}

	/**
	 * Retrieve the power production for a specific day. The date as part of the EnergyRequest must have the format yyyy-mm-dd, e.g. 2023-05-31.
	 * The response contains 288 values for each five minute intervall of the day.
	 */
	public DayResponse getInvEnergyDayChart(EnergyRequest energyRequest) {
		return (DayResponse) request("/indexbC/inv/getInvEnergyDayChart", energyRequest.getPlantId(), energyRequest.getDate(), DayResponse.class);
	}
	
	/**
	 * Retrieve the power production for a specific month. The date as part of the EnergyRequest must have the format yyyy-mm, e.g. 2023-05.
	 * The response contains one value for each day of the month.
	 */
	public MonthResponse getInvEnergyMonthChart(EnergyRequest energyRequest) {
		return (MonthResponse) request("/indexbC/inv/getInvEnergyMonthChart", energyRequest.getPlantId(), energyRequest.getDate(), MonthResponse.class);
	}
	
	/**
	 * Retrieve the power production for a specific year. The date as part of the EnergyRequest must have the format yyyy, e.g. 2023.
	 * The response contains one value for each month of the month.
	 */
	public YearResponse getInvEnergyYearChart(EnergyRequest energyRequest) {
		return (YearResponse) request("/indexbC/inv/getInvEnergyYearChart", energyRequest.getPlantId(), energyRequest.getDate(), YearResponse.class);
	}
	
	/**
	 * Retrieve some data about the power production for a specificc plant.
	 *
	 * <p>Like {@link #getTotalData}, this is a cumulative snapshot that is not tied to a date,
	 * so the {@code date} is intentionally not forwarded to Growatt.</p>
	 */
	public TotalDataInvResponse getInvTotalData(EnergyRequest energyRequest) {
		return (TotalDataInvResponse) request("/indexbC/inv/getInvTotalData", energyRequest.getPlantId(), null, TotalDataInvResponse.class);
	}

	private Object request(String uri, String plantId, String date, Class<?> clazz) {
		LinkedMultiValueMap<String, String> data = new LinkedMultiValueMap<>();
		if (StringUtils.isNotEmpty(plantId))
			data.add("plantId", plantId);
		if (StringUtils.isNotEmpty(date))
			data.add("date", date);
		
		String infos = client
			.post()
			.uri(uri)
			.cookies(cookies -> writeCookies(cookieJar, cookies))
			.contentType(MediaType.APPLICATION_FORM_URLENCODED)
			.body(BodyInserters.fromFormData(data))
            .retrieve()
            .bodyToMono(String.class)
            .block();
		
		try {
			if (StringUtils.isNotBlank(infos)) {
				ObjectMapper om = new ObjectMapper();
				return om.readValue(infos, clazz);
			} else 
				log.error("POST to {} returned 'null'", uri);
		} catch (JsonProcessingException e) {
			log.error("Error parsing JSON response from {}: {}", uri, e.getMessage());
		}
		
		return null;
	}
	
}
