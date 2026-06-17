package service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.bson.types.ObjectId;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import controller.GrowattWebClient;
import entity.DayResponse;
import entity.EnergyRequest;
import entity.LoginRequest;
import entity.Notification;
import entity.UserAccount;
import io.micrometer.common.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import repository.NotificationRepository;
import repository.UserAccountRepository;

/**
 * Daily background job that backfills <b>yesterday's</b> solar production for every user
 * that has Growatt credentials configured, then records exactly one notification (and a
 * best-effort push) per user.
 *
 * <p>Runs at 00:01 server time. For each user it logs into Growatt with the stored
 * credentials and refreshes the day / week / month / year charts for yesterday. The day
 * chart for yesterday is deliberately skipped by the normal cache path, so it is
 * force-persisted via {@link GrowattDataService#backfillDayChart}; the other ranges persist
 * themselves on a cache miss when they refer to a completed past period.</p>
 *
 * <p>Notifications are written into the shared {@code notifications} collection, where the
 * web notification center (served by the Node backend) reads them.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SolarBackfillJob {

	private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
	private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

	/** Expo push endpoint (best-effort; requires a real Expo push token to deliver). */
	private static final WebClient PUSH_CLIENT = WebClient.create("https://exp.host");

	private final GrowattWebClient growattWebClient;
	private final GrowattDataService growattDataService;
	private final UserAccountRepository userRepository;
	private final NotificationRepository notificationRepository;

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
		List<UserAccount> users = userRepository.findAll();
		log.info("[SolarCron] Starting solar backfill for {} candidate user(s).", users.size());

		for (UserAccount user : users) {
			UserAccount.Growatt g = user.growatt();
			if (g == null || StringUtils.isBlank(g.getEmail()) || StringUtils.isBlank(g.getPassword())) {
				continue; // user hasn't configured Growatt; nothing to do, no notification
			}
			backfillOne(user, g);
		}

		log.info("[SolarCron] Solar backfill complete.");
	}

	private void backfillOne(UserAccount user, UserAccount.Growatt g) {
		LocalDate yesterday = LocalDate.now().minusDays(1);
		String dayDate = yesterday.format(DAY_FMT);

		try {
			growattWebClient.login(new LoginRequest(g.getEmail(), g.getPassword()));

			String plantId = StringUtils.isNotBlank(g.getPlantId())
					? g.getPlantId()
					: growattWebClient.getPlantId();
			if (StringUtils.isBlank(plantId)) {
				throw new IllegalStateException("No plant id available after Growatt login");
			}

			// Day (force-persist yesterday) + the other ranges (self-persist when completed).
			DayResponse day = growattDataService.getDayChart(new EnergyRequest(plantId, dayDate));
			growattDataService.backfillDayChart(plantId, dayDate, day);
			growattDataService.getWeekChart(new EnergyRequest(plantId, dayDate));
			growattDataService.getMonthChart(new EnergyRequest(plantId, yesterday.format(MONTH_FMT)));
			growattDataService.getYearChart(new EnergyRequest(plantId, String.valueOf(yesterday.getYear())));

			double kwh = dayEnergyKwh(day);
			String message = kwh > 0
					? String.format("Saved %.1f kWh of solar production for %s (plant %s).", kwh, dayDate, plantId)
					: String.format("Synced solar data for %s — no production recorded (plant %s).", dayDate, plantId);

			saveNotification(user, "success", "Solar data synced", message);
			sendPush(user, "Solar data synced",
					kwh > 0 ? String.format("%.1f kWh saved for %s.", kwh, dayDate)
							: String.format("No production recorded for %s.", dayDate));

			log.info("[SolarCron] Backfilled solar for user {} ({} kWh).", user.getId(), kwh);
		} catch (Exception e) {
			log.error("[SolarCron] Backfill failed for user {}: {}", user.getId(), e.getMessage());
			saveNotification(user, "error", "Solar sync failed",
					"Could not sync solar data for " + dayDate + ": " + e.getMessage());
			sendPush(user, "Solar sync failed", e.getMessage());
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

	private void saveNotification(UserAccount user, String level, String title, String message) {
		try {
			notificationRepository.save(
					new Notification(new ObjectId(user.getId()), "solar_sync", level, title, message));
		} catch (Exception e) {
			log.warn("[SolarCron] Failed to write notification for user {}: {}", user.getId(), e.getMessage());
		}
	}

	private boolean isExpoToken(String token) {
		return token != null
				&& (token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken["));
	}

	/** Best-effort Expo push. Never throws; silently skips empty/invalid tokens. */
	private void sendPush(UserAccount user, String title, String body) {
		List<String> tokens = user.getExpoPushTokens();
		if (tokens == null || tokens.isEmpty()) {
			return;
		}
		List<Map<String, Object>> messages = tokens.stream()
				.filter(this::isExpoToken)
				.map(token -> Map.<String, Object>of(
						"to", token,
						"sound", "default",
						"title", title,
						"body", body,
						"data", Map.of("type", "solar_sync")))
				.toList();
		if (messages.isEmpty()) {
			return;
		}
		try {
			PUSH_CLIENT.post()
					.uri("/--/api/v2/push/send")
					.contentType(MediaType.APPLICATION_JSON)
					.bodyValue(messages)
					.retrieve()
					.bodyToMono(String.class)
					.block();
			log.info("[SolarCron] Sent {} Expo push message(s) for user {}.", messages.size(), user.getId());
		} catch (Exception e) {
			log.warn("[SolarCron] Expo push delivery failed for user {}: {}", user.getId(), e.getMessage());
		}
	}
}
