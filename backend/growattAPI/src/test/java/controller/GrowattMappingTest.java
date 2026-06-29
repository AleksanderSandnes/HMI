package controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

import entity.TotalDataResponse;
import entity.growatt.GwDevicesResponse;

/**
 * Unit test for {@link GrowattWebClient#mapTotals} — maps a real (sanitized)
 * {@code /panel/getDevicesByPlantList} v2 response into our cumulative-totals DTO.
 * No network: the JSON fixture is the shape captured from the live API.
 *
 * <p>Note: the v2 {@code getDevicesByPlantList} endpoint does <b>not</b> return
 * CO2 / revenue / trees / performance-ratio (those were v1-only and have no v2
 * backing endpoint — confirmed against the upstream blafoo/growatt client), so
 * only the production figures + device/plant metadata are asserted here.</p>
 */
class GrowattMappingTest {

	private static final ObjectMapper MAPPER = new ObjectMapper();

	/** Sanitized copy of a real getDevicesByPlantList response (one online device). */
	private static final String DEVICES_JSON = """
			{"result":1,"obj":{"currPage":1,"pages":1,"pageSize":4,"count":1,"ind":1,
			"datas":[{"deviceType":"1","ptoStatus":"0","timeServer":"2026-06-30 01:59:44",
			"accountName":"test@example.com","timezone":"2.0","plantId":"123456",
			"deviceTypeName":"max","bdcNum":"0","nominalPower":"12000.0","bdcStatus":"0",
			"eToday":"67.1","eMonth":"1240.7","datalogTypeTest":"ShineWiFi-X","eTotal":"33099.3",
			"pac":"944.6","datalogSn":"XGD0000000","alias":"TESTDEV","location":"",
			"deviceModel":"MID 12KTL3-XL","sn":"TESTSN","plantName":"TestPlant","status":"1",
			"lastUpdateTime":"2026-06-29 19:59:44"}],"notPager":false}}
			""";

	@Test
	void mapsProductionAndDeviceMetadata() throws Exception {
		GwDevicesResponse devices = MAPPER.readValue(DEVICES_JSON, GwDevicesResponse.class);

		TotalDataResponse mapped = GrowattWebClient.mapTotals(devices);
		assertTrue(mapped.hasData());
		assertEquals(1L, mapped.getResult());

		TotalDataResponse.Obj obj = mapped.getObj();
		// Production figures (numeric strings coerced to Double by Jackson).
		assertEquals(67.1, obj.getEToday());
		assertEquals(1240.7, obj.getEMonth());
		assertEquals(33099.3, obj.getETotal());
		assertEquals(944.6, obj.getPac());
		assertEquals("12000.0", obj.getNominalPower());
		assertEquals("123456", obj.getPlantId());

		// Newly surfaced device/plant metadata.
		assertEquals("1", obj.getStatus());
		assertEquals("MID 12KTL3-XL", obj.getDeviceModel());
		assertEquals("TestPlant", obj.getPlantName());
		assertEquals("2026-06-29 19:59:44", obj.getLastUpdateTime());
		assertEquals("1", obj.getDeviceNum());
		assertEquals("1", obj.getOnlineNum());

		// Fields with no v2 backing endpoint stay null (not fabricated).
		assertNull(obj.getCo2());
		assertNull(obj.getMToday());
		assertNull(obj.getPr());
	}

	@Test
	void onlineCountReflectsDeviceStatus() throws Exception {
		// Two devices, one offline (status != "1").
		String json = """
				{"obj":{"count":2,"datas":[
				{"status":"1","eToday":"10.0","plantId":"1"},
				{"status":"-1","eToday":"0.0","plantId":"1"}]}}
				""";
		GwDevicesResponse devices = MAPPER.readValue(json, GwDevicesResponse.class);
		TotalDataResponse.Obj obj = GrowattWebClient.mapTotals(devices).getObj();
		assertEquals("2", obj.getDeviceNum());
		assertEquals("1", obj.getOnlineNum());
	}

	@Test
	void nullAndEmptyResponsesYieldNoData() throws Exception {
		assertFalse(GrowattWebClient.mapTotals(null).hasData());

		GwDevicesResponse empty = MAPPER.readValue("{\"obj\":{\"datas\":[]}}", GwDevicesResponse.class);
		assertFalse(GrowattWebClient.mapTotals(empty).hasData());
	}
}
