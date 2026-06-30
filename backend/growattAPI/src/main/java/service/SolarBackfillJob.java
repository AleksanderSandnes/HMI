package service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.function.Supplier;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import controller.GrowattWebClient;
import entity.DayResponse;
import entity.EnergyRequest;
import entity.IntegrationHealth;
import entity.Notification;
import entity.UserSettings;
import io.micrometer.common.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import repository.IntegrationHealthRepository;
import repository.NotificationRepository;
import repository.UserSettingsRepository;

/**
 * Daily background job that backfills <b>yesterday's</b> solar production for every user that
 * has Growatt credentials configured in Supabase, then records exactly one notification per
 * user.
 *
 * <p>Runs at 00:01 server time. For each user it reads the Growatt email/plant from
 * {@code user_settings}, decrypts the password from Vault, logs into Growatt, and refreshes
 * the day / week / month / year charts for yesterday. The day chart for yesterday is
 * force-persisted via {@link GrowattDataService#backfillDayChart}; the other ranges persist
 * themselves on a cache miss when they refer to a completed past period.</p>
 *
 * <p>Push is no longer sent from here: inserting a notification row triggers the
 * {@code notifications -> send-push} database webhook, which delivers the Expo push.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SolarBackfillJob {

	private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
	private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

	private final GrowattSessionService sessionService;
	private final GrowattDataService growattDataService;
	private final UserSettingsRepository userSettingsRepository;
	private final NotificationRepository notificationRepository;
	private final IntegrationHealthRepository integrationHealthRepository;

	/** Fire daily at 00:01 (second minute hour day month weekday). */
	@Scheduled(cron = "0 1 0 * * *")
	public void scheduledBackfill() {
		log.info("[SolarCron] Triggered by schedule (00:01).");
		try {
			runBackfill();
		} catch (Exception e) {
			log.error("[SolarCron] Scheduled run failed: {}", e.getMessage(), e);
		}
	}

	/** Backfill yesterday's solar data for all users with Growatt credentials. */
	public void runBackfill() {
		List<UserSettings> users = userSettingsRepository.findAll();
		log.info("[SolarCron] Starting solar backfill for {} candidate user(s).", users.size());

		for (UserSettings user : users) {
			if (StringUtils.isBlank(user.getGrowattEmail()) || user.getGrowattPasswordSecretId() == null) {
				continue; // user hasn't configured Growatt; nothing to do, no notification
			}
			backfillOne(user);
		}

		log.info("[SolarCron] Solar backfill complete.");
	}

	private void backfillOne(UserSettings user) {
		LocalDate yesterday = LocalDate.now().minusDays(1);
		String dayDate = yesterday.format(DAY_FMT);

		try {
			GrowattSession session = sessionService.loginFor(user.getAuthId());
			String plantId = session.plantId();
			// The session is already logged in here, so the supplier just hands back its client.
			Supplier<GrowattWebClient> client = session::client;

			// Day (force-persist yesterday) + the other ranges (self-persist when completed).
			DayResponse day = growattDataService.getDayChart(client, new EnergyRequest(plantId, dayDate));
			growattDataService.backfillDayChart(plantId, dayDate, day);
			growattDataService.getWeekChart(client, new EnergyRequest(plantId, dayDate));
			growattDataService.getMonthChart(client, new EnergyRequest(plantId, yesterday.format(MONTH_FMT)));
			growattDataService.getYearChart(client, new EnergyRequest(plantId, String.valueOf(yesterday.getYear())));

			double kwh = dayEnergyKwh(day);
			String message = kwh > 0
					? String.format("Saved %.1f kWh of solar production for %s (plant %s).", kwh, dayDate, plantId)
					: String.format("Synced solar data for %s — no production recorded (plant %s).", dayDate, plantId);

			saveNotification(user, "success", "Solar data synced", message);
			recordHealth(user, "ok", null);
			log.info("[SolarCron] Backfilled solar for user {} ({} kWh).", user.getAuthId(), kwh);
		} catch (Exception e) {
			log.error("[SolarCron] Backfill failed for user {}: {}", user.getAuthId(), e.getMessage());
			saveNotification(user, "error", "Solar sync failed",
					"Could not sync solar data for " + dayDate + ": " + e.getMessage());
			recordHealth(user, "error", e.getMessage());
		}
	}

	/** Append a growatt health row (best-effort) so the outage-monitor can detect outages. */
	private void recordHealth(UserSettings user, String status, String detail) {
		try {
			integrationHealthRepository.save(
					new IntegrationHealth(user.getAuthId(), "growatt", status, detail));
		} catch (Exception e) {
			log.warn("[SolarCron] Failed to record health for user {}: {}", user.getAuthId(), e.getMessage());
		}
	}

	/** Sum 5-minute average power (W) into kWh: Wh = W / 12 per interval, then / 1000. */
	private double dayEnergyKwh(DayResponse day) {
		if (day == null || day.getObj() == null || day.getObj().getPac() == null) {
			return 0.0;
		}
		double wh = day.getObj().getPac().stream()
				.filter(v -> v != null && v > 0)
				.mapToDouble(v -> v / 12.0)
				.sum();
		return wh / 1000.0;
	}

	private void saveNotification(UserSettings user, String level, String title, String message) {
		try {
			notificationRepository.save(
					new Notification(user.getAuthId(), "solar_sync", level, title, message));
		} catch (Exception e) {
			log.warn("[SolarCron] Failed to write notification for user {}: {}", user.getAuthId(), e.getMessage());
		}
	}
}
