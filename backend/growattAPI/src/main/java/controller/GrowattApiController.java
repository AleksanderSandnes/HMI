package controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import entity.DayResponse;
import entity.EnergyRequest;
import entity.MonthResponse;
import entity.TotalDataInvResponse;
import entity.TotalDataResponse;
import entity.WeekResponse;
import entity.YearResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import service.GrowattDataService;
import service.GrowattSession;
import service.GrowattSessionService;

/**
 * Solar chart API. Every data route is authenticated with a Supabase JWT; the Growatt login
 * happens <b>server-side</b> using the caller's Vault-stored credentials (resolved by the
 * JWT subject = {@code auth_id}). The client never sends Growatt credentials — only its
 * Supabase access token — and the plant id always comes from the user's saved settings.
 */
@RestController
@RequestMapping("/api/growatt")
@RequiredArgsConstructor
@Slf4j
@Validated
public class GrowattApiController {

	private final GrowattSessionService sessionService;
	private final GrowattDataService growattDataService;

	@GetMapping("/health")
	public ResponseEntity<Map<String, Object>> health() {
		Map<String, Object> healthStatus = new HashMap<>();
		healthStatus.put("status", "healthy");
		healthStatus.put("service", "growatt-api");
		healthStatus.put("timestamp", LocalDateTime.now().toString());
		healthStatus.put("version", "2.0.0");
		return ResponseEntity.ok(healthStatus);
	}

	@PostMapping("/totalData")
	public ResponseEntity<TotalDataResponse> getTotalData(@Valid @RequestBody EnergyRequest request,
			@AuthenticationPrincipal Jwt jwt) {
		GrowattSession session = login(jwt, request);
		return ResponseEntity.ok(growattDataService.getTotalData(session.client(), request));
	}

	@PostMapping("/invTotalData")
	public ResponseEntity<TotalDataInvResponse> getInvTotalData(@Valid @RequestBody EnergyRequest request,
			@AuthenticationPrincipal Jwt jwt) {
		GrowattSession session = login(jwt, request);
		return ResponseEntity.ok(session.client().getInvTotalData(request));
	}

	@PostMapping("/dayChart")
	public ResponseEntity<DayResponse> getDayChart(@Valid @RequestBody EnergyRequest request,
			@AuthenticationPrincipal Jwt jwt) {
		GrowattSession session = login(jwt, request);
		return ResponseEntity.ok(growattDataService.getDayChart(session.client(), request));
	}

	@PostMapping("/weekChart")
	public ResponseEntity<WeekResponse> getWeekChart(@Valid @RequestBody EnergyRequest request,
			@AuthenticationPrincipal Jwt jwt) {
		GrowattSession session = login(jwt, request);
		return ResponseEntity.ok(growattDataService.getWeekChart(session.client(), request));
	}

	@PostMapping("/monthChart")
	public ResponseEntity<MonthResponse> getMonthChart(@Valid @RequestBody EnergyRequest request,
			@AuthenticationPrincipal Jwt jwt) {
		GrowattSession session = login(jwt, request);
		return ResponseEntity.ok(growattDataService.getMonthChart(session.client(), request));
	}

	@PostMapping("/yearChart")
	public ResponseEntity<YearResponse> getYearChart(@Valid @RequestBody EnergyRequest request,
			@AuthenticationPrincipal Jwt jwt) {
		GrowattSession session = login(jwt, request);
		return ResponseEntity.ok(growattDataService.getYearChart(session.client(), request));
	}

	/** Five-year overview: one energy total per year (v2 getDevicesTotalChart). */
	@PostMapping("/totalChart")
	public ResponseEntity<YearResponse> getTotalChart(@Valid @RequestBody EnergyRequest request,
			@AuthenticationPrincipal Jwt jwt) {
		GrowattSession session = login(jwt, request);
		return ResponseEntity.ok(growattDataService.getTotalChart(session.client(), request));
	}

	/**
	 * Log into Growatt for the authenticated user and force the request's plant id to the
	 * one resolved from their settings/login (so a client can never query another plant).
	 */
	private GrowattSession login(Jwt jwt, EnergyRequest request) {
		UUID authId = UUID.fromString(jwt.getSubject());
		GrowattSession session = sessionService.loginFor(authId);
		request.setPlantId(session.plantId());
		return session;
	}
}
