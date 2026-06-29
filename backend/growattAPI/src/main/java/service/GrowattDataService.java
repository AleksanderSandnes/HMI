package service;

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

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import controller.GrowattWebClient;
import entity.DayResponse;
import entity.EnergyRequest;
import entity.GrowattResponse;
import entity.MonthResponse;
import entity.SolarDataCache;
import entity.WeekResponse;
import entity.YearResponse;
import io.micrometer.common.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import repository.SolarDataCacheRepository;

/**
 * Provides Growatt chart data with a transparent MongoDB cache in front of the live
 * {@link GrowattWebClient}.
 *
 * <p>Only the genuinely historical, date-specific chart series are cached (day / month /
 * year). Cumulative "as of now" snapshots such as totalData are intentionally <b>not</b>
 * cached, because they are not tied to a past date.</p>
 *
 * <p>Cache-aside strategy keyed by {@code (type, plantId, date)}:</p>
 * <ul>
 *   <li><b>Current period</b> (today / ongoing month / ongoing year): always fetched
 *       live, never read from or written to the cache, because the data is still
 *       incomplete.</li>
 *   <li><b>Yesterday</b> (day type): read from cache first; on a miss it is fetched live
 *       but <i>not</i> saved, because a background job backfills the previous day.</li>
 *   <li><b>Older completed periods</b>: read from cache first; on a miss it is fetched
 *       live <i>and</i> saved for future historical look-ups.</li>
 * </ul>
 *
 * <p>Empty responses (no real production, e.g. all null/zero) are never saved, and any
 * cache failure falls back to a live Growatt call, so caching never breaks the API.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GrowattDataService {

	/** Range discriminator stored alongside each cached entry. */
	public enum CacheType {
		DAY, WEEK, MONTH, YEAR
	}

	private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
	private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

	private final SolarDataCacheRepository repository;
	private final ObjectMapper objectMapper = new ObjectMapper();

	@Value("${growatt.cache.enabled:true}")
	private boolean cacheEnabled;

	public DayResponse getDayChart(GrowattWebClient client, EnergyRequest request) {
		return getOrFetch(CacheType.DAY, request, DayResponse.class, client::getInvEnergyDayChart);
	}

	public MonthResponse getMonthChart(GrowattWebClient client, EnergyRequest request) {
		return getOrFetch(CacheType.MONTH, request, MonthResponse.class, client::getInvEnergyMonthChart);
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
	 * date) via the shared {@link #getOrFetch} cache-aside, so a completed past week is saved on
	 * first request and served from MongoDB afterwards without re-assembling. A week that still
	 * includes today is treated as the current, incomplete period and is never cached.</p>
	 */
	public WeekResponse getWeekChart(GrowattWebClient client, EnergyRequest request) {
		return getOrFetch(CacheType.WEEK, request, WeekResponse.class, r -> assembleWeekChart(client, r));
	}

	/** Assemble the weekly view live from the daily totals of the covering month chart(s). */
	private WeekResponse assembleWeekChart(GrowattWebClient client, EnergyRequest request) {
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

	public YearResponse getYearChart(GrowattWebClient client, EnergyRequest request) {
		return getOrFetch(CacheType.YEAR, request, YearResponse.class, client::getInvEnergyYearChart);
	}

	/**
	 * Five-year chart (one energy total per year). Always fetched live and never cached: the
	 * window always includes the current, still-incomplete year, so the most recent value
	 * keeps changing.
	 */
	public YearResponse getTotalChart(GrowattWebClient client, EnergyRequest request) {
		return client.getInvEnergyTotalChart(request);
	}

	/**
	 * Force-persist a freshly fetched DAY chart for a past date, bypassing the
	 * {@link #shouldPersist} "skip yesterday" rule. This is the explicit backfill hook the
	 * daily solar job uses to save yesterday's day chart (which the cache path deliberately
	 * never saves). Upserts so a repeated run updates instead of violating the unique index.
	 * Empty/unsuccessful responses are skipped. Never throws.
	 */
	public void backfillDayChart(String plantId, String date, DayResponse response) {
		if (!isSuccessful(response) || !response.hasData()) {
			log.info("[Cache] SKIP backfill for {} - no successful production data",
					logKey(CacheType.DAY, plantId, date));
			return;
		}
		try {
			SolarDataCache document = repository
					.findFirstByTypeAndPlantIdAndDate(CacheType.DAY.name(), plantId, date)
					.orElseGet(() -> new SolarDataCache(CacheType.DAY.name(), plantId, date, null, null));
			document.setPayload(objectMapper.writeValueAsString(response));
			document.setCachedAt(Instant.now());
			repository.save(document);
			log.info("[Cache] BACKFILL SAVE {}", logKey(CacheType.DAY, plantId, date));
		} catch (Exception e) {
			log.warn("[Cache] backfill save failed for {} ({})", logKey(CacheType.DAY, plantId, date),
					e.getMessage());
		}
	}

	private <T extends GrowattResponse> T getOrFetch(CacheType type, EnergyRequest request, Class<T> clazz,
			Function<EnergyRequest, T> liveFetch) {
		String plantId = request.getPlantId();
		String date = request.getDate();

		// Always go live for the current/ongoing period, when caching is disabled, or when
		// we have no plantId to build a stable key with.
		if (!cacheEnabled || StringUtils.isBlank(plantId) || isCurrentPeriod(type, date)) {
			log.info("[Cache] BYPASS -> live fetch (type={}, plantId={}, date={})", type, plantId, date);
			return liveFetch.apply(request);
		}

		// 1) Try the database first.
		try {
			Optional<SolarDataCache> cached = repository.findFirstByTypeAndPlantIdAndDate(type.name(), plantId, date);
			if (cached.isPresent()) {
				log.info("[Cache] HIT {}", logKey(type, plantId, date));
				return objectMapper.readValue(cached.get().getPayload(), clazz);
			}
		} catch (Exception e) {
			log.warn("[Cache] read failed for {} ({}), falling back to live", logKey(type, plantId, date),
					e.getMessage());
		}

		// 2) Cache miss -> call the Growatt API.
		log.info("[Cache] MISS {} -> calling Growatt", logKey(type, plantId, date));
		T result = liveFetch.apply(request);

		// 3) Persist successful, completed, non-empty historical results only.
		if (isSuccessful(result) && result.hasData() && shouldPersist(type, date)) {
			persist(type, plantId, date, result);
		} else if (isSuccessful(result) && !result.hasData()) {
			log.info("[Cache] SKIP save for {} - response has no production data", logKey(type, plantId, date));
		}

		return result;
	}

	private <T extends GrowattResponse> void persist(CacheType type, String plantId, String date, T result) {
		try {
			SolarDataCache document = new SolarDataCache(type.name(), plantId, date,
					objectMapper.writeValueAsString(result), Instant.now());
			repository.save(document);
			log.info("[Cache] SAVE {}", logKey(type, plantId, date));
		} catch (Exception e) {
			log.warn("[Cache] save failed for {} ({})", logKey(type, plantId, date), e.getMessage());
		}
	}

	private boolean isSuccessful(GrowattResponse response) {
		return response != null && response.getResult() != null && response.getResult() == 1L;
	}

	/**
	 * Whether the requested date refers to the current, still-ongoing period. Such data is
	 * incomplete and must always be fetched live. A blank or unparseable date is treated as
	 * "current" so we never cache an ambiguous key.
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
				default:
					return true;
			}
		} catch (Exception e) {
			log.warn("[Cache] could not parse date '{}' for type {}, treating as live", date, type);
			return true;
		}
	}

	/**
	 * Whether a freshly fetched response should be saved on a cache miss. The current period
	 * never reaches this check (it bypasses the cache entirely). For the day type we skip
	 * yesterday, because a background job is responsible for backfilling the previous day.
	 */
	// Package-private for unit testing of the persistence-eligibility logic.
	boolean shouldPersist(CacheType type, String date) {
		try {
			if (type == CacheType.DAY) {
				return !LocalDate.parse(date, DAY_FMT).isEqual(LocalDate.now().minusDays(1));
			}
			// Completed past months / years can be persisted immediately.
			return true;
		} catch (Exception e) {
			return false;
		}
	}

	private String logKey(CacheType type, String plantId, String date) {
		return type.name() + "/" + plantId + "/" + date;
	}
}
