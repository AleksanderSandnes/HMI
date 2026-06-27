package controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Properties;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import entity.DayResponse;
import entity.EnergyRequest;
import entity.LoginRequest;
import entity.MonthResponse;
import entity.TotalDataInvResponse;
import entity.TotalDataResponse;
import entity.YearResponse;

/**
 * Live integration test verifying the <b>Growatt v2.0.0</b> endpoint migration end-to-end:
 * one login + one of each chart/total call against the real API, asserting the new responses
 * map cleanly into our unchanged DTOs.
 *
 * <p><b>Run deliberately and sparingly</b> (hitting the live API repeatedly risks an IP
 * block). It is gated by the {@code GROWATT_LIVE_TEST=true} environment variable, so the
 * normal {@code mvn test} build skips it. Credentials are read from the git-ignored
 * {@code src/test/resources/application.properties} (keys: {@code growatt.account},
 * {@code growatt.password}, optional {@code proxy.url} / {@code proxy.port}).</p>
 *
 * <pre>GROWATT_LIVE_TEST=true mvn -q test -Dtest=GrowattWebClientTest</pre>
 */
@EnabledIfEnvironmentVariable(named = "GROWATT_LIVE_TEST", matches = "true")
class GrowattWebClientTest {

	private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("yyyy-MM-dd");
	private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("yyyy-MM");

	private static Properties loadCredentials() throws Exception {
		Properties p = new Properties();
		try (InputStream in = GrowattWebClientTest.class.getResourceAsStream("/application.properties")) {
			assertNotNull(in, "Create src/test/resources/application.properties with growatt.account/password");
			p.load(in);
		}
		return p;
	}

	@Test
	void verifiesV2Endpoints() throws Exception {
		Properties creds = loadCredentials();
		String account = creds.getProperty("growatt.account", "").trim();
		String password = creds.getProperty("growatt.password", "").trim();
		String proxyUrl = creds.getProperty("proxy.url", "").trim();
		assumeTrue(!account.isBlank() && !password.isBlank(),
				"growatt.account/password not set in application.properties — skipping");

		GrowattWebClient client = proxyUrl.isBlank()
				? new GrowattWebClient()
				: new GrowattWebClient(proxyUrl, Integer.parseInt(creds.getProperty("proxy.port").trim()));

		// 1) Login (body unchanged across v2.0.0).
		String login = client.login(new LoginRequest(account, password));
		assertEquals("{\"result\":1}", login == null ? null : login.trim());
		String plantId = client.getPlantId();
		assertNotNull(plantId, "No plant id captured from login cookies");

		// 2) Cumulative totals (now sourced from /panel/getDevicesByPlantList).
		TotalDataResponse total = client.getTotalData(new EnergyRequest(plantId));
		assertEquals(1L, total.getResult());
		assertNotNull(total.getObj());
		assertNotNull(total.getObj().getEToday(), "eToday should be present");

		TotalDataInvResponse inv = client.getInvTotalData(new EnergyRequest(plantId));
		assertEquals(1L, inv.getResult());

		// 3) Day chart for yesterday (within the new ~3-month window) -> 5-minute pac values.
		String day = LocalDate.now().minusDays(1).format(DAY);
		DayResponse dayChart = client.getInvEnergyDayChart(new EnergyRequest(plantId, day));
		assertEquals(1L, dayChart.getResult());
		assertNotNull(dayChart.getObj().getPac());
		assertFalse(dayChart.getObj().getPac().isEmpty(), "day pac series should be non-empty");

		// 4) Month chart (current month) -> per-day energy totals.
		MonthResponse monthChart = client.getInvEnergyMonthChart(new EnergyRequest(plantId, LocalDate.now().format(MONTH)));
		assertEquals(1L, monthChart.getResult());
		assertFalse(monthChart.getObj().getEnergy().isEmpty(), "month energy series should be non-empty");

		// 5) Year chart (current year) -> per-month energy totals.
		YearResponse yearChart = client.getInvEnergyYearChart(new EnergyRequest(plantId, String.valueOf(LocalDate.now().getYear())));
		assertEquals(1L, yearChart.getResult());
		assertFalse(yearChart.getObj().getEnergy().isEmpty(), "year energy series should be non-empty");

		System.out.printf(
				"[GrowattV2] OK plant=%s pac=%d monthDays=%d yearMonths=%d%n",
				plantId, dayChart.getObj().getPac().size(),
				monthChart.getObj().getEnergy().size(), yearChart.getObj().getEnergy().size());
	}
}
