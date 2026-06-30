package service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.Supplier;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import controller.GrowattWebClient;
import entity.DayResponse;
import entity.EnergyRequest;
import entity.GrowattResponse;
import entity.MonthResponse;
import entity.SolarDataCache;
import entity.TotalDataResponse;
import entity.WeekResponse;
import entity.YearResponse;
import io.micrometer.common.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import repository.SolarDataCacheRepository;

/**
 * Provides Growatt chart data with a transparent Postgres cache in front of the live
 * {@link GrowattWebClient}.
 *
 * <p>Cache-aside strategy keyed by {@code (type, plantId, date)}. Every range is cached:
 * check the DB first, fall back to the live API on a miss, save the result, then serve.</p>
 *
 * <ul>
 *   <li><b>Completed past periods</b> (older day, past month/year): served from cache
 *       forever; on a miss they are fetched live and saved (only when they carry real
 *       production).</li>
 *   <li><b>Current, still-incomplete periods</b> (today / ongoing month / ongoing year /
 *       the 5-year overview / the live totals snapshot): served from cache while fresh, then
 *       refreshed. Freshness is bounded by a per-type TTL so the upstream API is hit at most
 *       once per window per plant — {@value #DEFAULT_CURRENT_TTL} min for day/month/year/
 *       snapshot, {@value #DEFAULT_TOTAL_TTL} min (one day) for the slow-moving 5-year chart.
 *       Current-period results are always upserted (even empty) so the throttle holds even
 *       before the plant has produced anything for the day.</li>
 * </ul>
 *
 * <p>Any cache failure falls back to a live Growatt call, so caching never breaks the API.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GrowattDataService {

	/** Range discriminator stored alongside each cached entry. */
	public enum CacheType {
		DAY, WEEK, MONTH, YEAR, TOTAL, SNAPSHOT
	}

	private static final String DEFAULT_CURRENT_TTL = "60";
	private static final String DEFAULT_TOTAL_TTL = "1440";

	private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
	private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

	private final SolarDataCacheRepository repository;
	private final ObjectMapper objectMapper = new ObjectMapper();

	@Value("${growatt.cache.enabled:true}")
	private boolean cacheEnabled;

	/** TTL (minutes) for current, still-incomplete periods: today / this month / this year / snapshot. */
	@Value("${growatt.cache.currentTtlMinutes:" + DEFAULT_CURRENT_TTL + "}")
	private long currentTtlMinutes;

	/** TTL (minutes) for the 5-year overview — slow-moving, so a daily refresh is plenty. */
	@Value("${growatt.cache.totalTtlMinutes:" + DEFAULT_TOTAL_TTL + "}")
	private long totalTtlMinutes;

	public DayResponse getDayChart(Supplier<GrowattWebClient> client, EnergyRequest request) {
		return getOrFetch(CacheType.DAY, request, DayResponse.class,
				r -> client.get().getInvEnergyDayChart(r));
	}

	public MonthResponse getMonthChart(Supplier<GrowattWebClient> client, EnergyRequest request) {
		return getOrFetch(CacheType.MONTH, request, MonthResponse.class,
				r -> client.get().getInvEnergyMonthChart(r));
	}

	/**
	 * The cumulative "as of now" totals snapshot (lifetime / today / month generation + device
	 * status). Cached as {@link CacheType#SNAPSHOT} keyed by today's date with the current-period
	 * TTL, so the live Growatt login is hit at most once per TTL window per plant rather than on
	 * every dashboard load.
	 */
	public TotalDataResponse getTotalData(Supplier<GrowattWebClient> client, EnergyRequest request) {
		EnergyRequest keyed = new EnergyRequest(request.getPlantId(), LocalDate.now().format(DAY_FMT));
		return getOrFetch(CacheType.SNAPSHOT, keyed, TotalDataResponse.class,
				r -> client.get().getTotalData(request));
	}

	/**
	 * Build the aggregated weekly view (7 daily energy totals ending on the requested date).
	 *
	 * <p>Growatt exposes no native weekly endpoint, so the window is assembled from the daily
	 * totals already provided by the monthly chart. The 7-day window touches at most two
	 * calendar months, so this performs one or two {@link #getMonthChart} calls, each of which
	 * goes through the regular cache. The requested date is treated as the (inclusive) last day
	 * of the window; a blank/unparseable date falls back to today.</p>
	 *
	 * <p>The assembled response is itself cached (type {@code WEEK}, keyed by the window's end
	 * date) via the shared {@link #getOrFetch} cache-aside: a completed past week is saved on
	 * first request and served afterwards, while a week still including today is refreshed once
	 * per current-period TTL window.</p>
	 */
	public WeekResponse getWeekChart(Supplier<GrowattWebClient> client, EnergyRequest request) {
		return getOrFetch(CacheType.WEEK, request, WeekResponse.class, r -> assembleWeekChart(client, r));
	}

	/** Assemble the weekly view live from the daily totals of the covering month chart(s). */
	private WeekResponse assembleWeekChart(Supplier<GrowattWebClient> client, EnergyRequest request) {
		LocalDate end;
		try {
			end = LocalDate.parse(request.getDate(), DAY_FMT);
		} catch (Exception e) {
			log.warn("[Week] could not parse date '{}', defaulting to today", request.getDate());
			end = LocalDate.now();
		}
		LocalDate start = end.minusDays(6);

		Map<YearMonth, MonthResponse> monthsCache = new HashMap<>();
		List<Double> energy = new ArrayList<>();
		List<String> days = new ArrayList<>();

		for (LocalDate day = start; !day.isAfter(end); day = day.plusDays(1)) {
			YearMonth ym = YearMonth.from(day);
			MonthResponse month = monthsCache.computeIfAbsent(ym, key -> {
				EnergyRequest monthRequest = new EnergyRequest(request.getPlantId(), key.format(MONTH_FMT));
				try {
					return getMonthChart(client, monthRequest);
				} catch (Exception ex) {
					log.warn("[Week] month fetch failed for {} ({})", key, ex.getMessage());
					return null;
				}
			});

			energy.add(extractDayEnergy(month, day.getDayOfMonth()));
			days.add(day.format(DAY_FMT));
		}

		return new WeekResponse(1L, new WeekResponse.Obj(energy, days));
	}

	/** Pull a single day's energy (1-based day-of-month) from a month chart, defaulting to 0. */
	// Package-private (instead of private) so unit tests in the same package can verify the
	// pure energy-extraction logic directly.
	Double extractDayEnergy(MonthResponse month, int dayOfMonth) {
		if (month != null && month.getObj() != null && month.getObj().getEnergy() != null) {
			List<Double> values = month.getObj().getEnergy();
			int index = dayOfMonth - 1;
			if (index >= 0 && index < values.size() && values.get(index) != null) {
				return values.get(index);
			}
		}
		return 0.0;
	}

	public YearResponse getYearChart(Supplier<GrowattWebClient> client, EnergyRequest request) {
		return getOrFetch(CacheType.YEAR, request, YearResponse.class,
				r -> client.get().getInvEnergyYearChart(r));
	}

	/**
	 * Five-year chart (one energy total per year). The window always includes the current,
	 * still-incomplete year, so it is treated as a current period and refreshed once per
	 * {@link #totalTtlMinutes} window (a day by default) rather than on every request.
	 */
	public YearResponse getTotalChart(Supplier<GrowattWebClient> client, EnergyRequest request) {
		return getOrFetch(CacheType.TOTAL, request, YearResponse.class,
				r -> client.get().getInvEnergyTotalChart(r));
	}

	/**
	 * Force-persist a freshly fetched DAY chart for a past date. This is the explicit backfill
	 * hook the daily solar job uses to save yesterday's day chart. Upserts so a repeated run
	 * updates instead of violating the unique index. Empty/unsuccessful responses are skipped.
	 * Never throws.
	 */
	public void backfillDayChart(String plantId, String date, DayResponse response) {
		if (!isSuccessful(response) || !response.hasData()) {
			log.info("[Cache] SKIP backfill for {} - no successful production data",
					logKey(CacheType.DAY, plantId, date));
			return;
		}
		upsert(CacheType.DAY, plantId, date, response);
	}

	private <T extends GrowattResponse> T getOrFetch(CacheType type, EnergyRequest request, Class<T> clazz,
			Function<EnergyRequest, T> liveFetch) {
		String plantId = request.getPlantId();
		String date = request.getDate();

		// We need a stable, non-blank (type, plantId, date) key to cache against; otherwise go live.
		if (!cacheEnabled || StringUtils.isBlank(plantId) || StringUtils.isBlank(date)) {
			log.info("[Cache] BYPASS -> live fetch (type={}, plantId={}, date={})", type, plantId, date);
			return liveFetch.apply(request);
		}

		boolean current = isCurrentPeriod(type, date);

		// 1) Try the database first.
		try {
			Optional<SolarDataCache> cached = repository.findFirstByTypeAndPlantIdAndDate(type.name(), plantId, date);
			if (cached.isPresent() && (!current || isFresh(type, cached.get()))) {
				log.info("[Cache] HIT {} - served from DB, no Growatt call ({})", logKey(type, plantId, date),
						current ? "within TTL" : "completed period");
				return objectMapper.readValue(cached.get().getPayload(), clazz);
			}
			if (cached.isPresent()) {
				log.info("[Cache] STALE {} -> refetching", logKey(type, plantId, date));
			}
		} catch (Exception e) {
			log.warn("[Cache] read failed for {} ({}), falling back to live", logKey(type, plantId, date),
					e.getMessage());
		}

		// 2) Cache miss / stale -> call the Growatt API.
		log.info("[Cache] MISS {} -> calling Growatt", logKey(type, plantId, date));
		T result = liveFetch.apply(request);

		// 3) Persist. Current periods are always upserted (even empty) so the TTL throttle holds;
		// completed periods are only saved when they carry real production.
		if (isSuccessful(result) && (current || result.hasData())) {
			upsert(type, plantId, date, result);
		} else if (isSuccessful(result)) {
			log.info("[Cache] SKIP save for {} - completed period has no production data",
					logKey(type, plantId, date));
		}

		return result;
	}

	/** Insert or update the cache entry for {@code (type, plantId, date)} with a fresh timestamp. */
	private <T extends GrowattResponse> void upsert(CacheType type, String plantId, String date, T result) {
		try {
			SolarDataCache document = repository
					.findFirstByTypeAndPlantIdAndDate(type.name(), plantId, date)
					.orElseGet(() -> new SolarDataCache(type.name(), plantId, date, null, null));
			document.setPayload(objectMapper.writeValueAsString(result));
			document.setCachedAt(Instant.now());
			repository.save(document);
			log.info("[Cache] SAVE {}", logKey(type, plantId, date));
		} catch (Exception e) {
			log.warn("[Cache] save failed for {} ({})", logKey(type, plantId, date), e.getMessage());
		}
	}

	/** Whether a cached current-period entry is still within its per-type TTL window. */
	private boolean isFresh(CacheType type, SolarDataCache cache) {
		if (cache.getCachedAt() == null) {
			return false;
		}
		long ttl = type == CacheType.TOTAL ? totalTtlMinutes : currentTtlMinutes;
		return cache.getCachedAt().isAfter(Instant.now().minus(Duration.ofMinutes(ttl)));
	}

	private boolean isSuccessful(GrowattResponse response) {
		return response != null && response.getResult() != null && response.getResult() == 1L;
	}

	/**
	 * Whether the requested date refers to the current, still-ongoing period. Such data is
	 * incomplete and is served from cache only while fresh (within the TTL). A blank or
	 * unparseable date is treated as "current". The 5-year ({@code TOTAL}) and live totals
	 * ({@code SNAPSHOT}) views are always current — they keep changing as the day/year advances.
	 */
	// Package-private for unit testing of the period-classification logic.
	boolean isCurrentPeriod(CacheType type, String date) {
		if (StringUtils.isBlank(date)) {
			return true;
		}
		try {
			switch (type) {
				case DAY:
					return LocalDate.parse(date, DAY_FMT).isEqual(LocalDate.now());
				case WEEK:
					// A week is still in progress while its (inclusive) end date is today or later.
					return !LocalDate.parse(date, DAY_FMT).isBefore(LocalDate.now());
				case MONTH:
					return YearMonth.parse(date, MONTH_FMT).equals(YearMonth.now());
				case YEAR:
					return Year.parse(date).equals(Year.now());
				case TOTAL:
				case SNAPSHOT:
					return true;
				default:
					return true;
			}
		} catch (Exception e) {
			log.warn("[Cache] could not parse date '{}' for type {}, treating as live", date, type);
			return true;
		}
	}

	private String logKey(CacheType type, String plantId, String date) {
		return type.name() + "/" + plantId + "/" + date;
	}
}
