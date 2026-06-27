package entity;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.Test;

/**
 * Pure unit tests for the {@code hasData()} predicates used by the caching layer to decide
 * whether a Growatt response actually carries production data worth persisting.
 */
class EntityHasDataTest {

	private static List<Double> withProduction() {
		return Arrays.asList(null, 0.0, 3.5, 0.0);
	}

	private static List<Double> noProduction() {
		return Arrays.asList(null, 0.0, 0.0);
	}

	// ---- DayResponse (pac per 5-minute interval) ----

	@Test
	void dayResponse_hasData_trueWhenAnyIntervalPositive() {
		assertTrue(new DayResponse(1L, new DayResponse.Obj(withProduction())).hasData());
	}

	@Test
	void dayResponse_hasData_falseWhenAllNullOrZero() {
		assertFalse(new DayResponse(1L, new DayResponse.Obj(noProduction())).hasData());
	}

	@Test
	void dayResponse_hasData_falseWhenObjOrListNull() {
		assertFalse(new DayResponse(1L, null).hasData());
		assertFalse(new DayResponse(1L, new DayResponse.Obj(null)).hasData());
	}

	// ---- MonthResponse (energy per day) ----

	@Test
	void monthResponse_hasData_reflectsEnergyPresence() {
		assertTrue(new MonthResponse(1L, new MonthResponse.Obj(withProduction())).hasData());
		assertFalse(new MonthResponse(1L, new MonthResponse.Obj(noProduction())).hasData());
		assertFalse(new MonthResponse(1L, null).hasData());
	}

	// ---- YearResponse (energy per month) ----

	@Test
	void yearResponse_hasData_reflectsEnergyPresence() {
		assertTrue(new YearResponse(1L, new YearResponse.Obj(withProduction())).hasData());
		assertFalse(new YearResponse(1L, new YearResponse.Obj(noProduction())).hasData());
		assertFalse(new YearResponse(1L, null).hasData());
	}

	// ---- WeekResponse (static Obj with energy + days) ----

	@Test
	void weekResponse_hasData_reflectsEnergyPresence() {
		WeekResponse.Obj withData = new WeekResponse.Obj(withProduction(), Collections.emptyList());
		WeekResponse.Obj withoutData = new WeekResponse.Obj(noProduction(), Collections.emptyList());
		assertTrue(new WeekResponse(1L, withData).hasData());
		assertFalse(new WeekResponse(1L, withoutData).hasData());
		assertFalse(new WeekResponse(1L, null).hasData());
	}

	// ---- TotalDataResponse / TotalDataInvResponse (hasData == obj present) ----

	@Test
	void totalDataResponse_hasData_trueOnlyWhenObjPresent() {
		assertTrue(new TotalDataResponse(1L, new TotalDataResponse.Obj()).hasData());
		assertFalse(new TotalDataResponse(1L, null).hasData());
	}

	@Test
	void totalDataInvResponse_hasData_trueOnlyWhenObjPresent() {
		assertTrue(new TotalDataInvResponse(1L, new TotalDataInvResponse.Obj()).hasData());
		assertFalse(new TotalDataInvResponse(1L, null).hasData());
	}
}
