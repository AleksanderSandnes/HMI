package service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.time.Year;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;

import org.junit.jupiter.api.Test;

import entity.MonthResponse;
import service.GrowattDataService.CacheType;

/**
 * Pure unit tests for the cache-classification logic of {@link GrowattDataService}. These
 * methods only use date arithmetic, so the service is constructed with null collaborators
 * (the WebClient / repository are never touched on these paths).
 */
class GrowattDataServiceTest {

	private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
	private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

	private final GrowattDataService service = new GrowattDataService(null, null);

	// ---------------- isCurrentPeriod ----------------

	@Test
	void isCurrentPeriod_blankDateIsAlwaysCurrent() {
		assertTrue(service.isCurrentPeriod(CacheType.DAY, null));
		assertTrue(service.isCurrentPeriod(CacheType.DAY, "  "));
	}

	@Test
	void isCurrentPeriod_unparseableDateIsTreatedAsCurrent() {
		assertTrue(service.isCurrentPeriod(CacheType.DAY, "not-a-date"));
	}

	@Test
	void isCurrentPeriod_dayTodayVsPast() {
		String today = LocalDate.now().format(DAY_FMT);
		String yesterday = LocalDate.now().minusDays(1).format(DAY_FMT);
		assertTrue(service.isCurrentPeriod(CacheType.DAY, today));
		assertFalse(service.isCurrentPeriod(CacheType.DAY, yesterday));
	}

	@Test
	void isCurrentPeriod_weekIsCurrentWhileEndDateNotBeforeToday() {
		String today = LocalDate.now().format(DAY_FMT);
		String future = LocalDate.now().plusDays(3).format(DAY_FMT);
		String past = LocalDate.now().minusDays(1).format(DAY_FMT);
		assertTrue(service.isCurrentPeriod(CacheType.WEEK, today));
		assertTrue(service.isCurrentPeriod(CacheType.WEEK, future));
		assertFalse(service.isCurrentPeriod(CacheType.WEEK, past));
	}

	@Test
	void isCurrentPeriod_monthCurrentVsPast() {
		String thisMonth = YearMonth.now().format(MONTH_FMT);
		String lastMonth = YearMonth.now().minusMonths(1).format(MONTH_FMT);
		assertTrue(service.isCurrentPeriod(CacheType.MONTH, thisMonth));
		assertFalse(service.isCurrentPeriod(CacheType.MONTH, lastMonth));
	}

	@Test
	void isCurrentPeriod_yearCurrentVsPast() {
		String thisYear = Year.now().toString();
		String lastYear = Year.now().minusYears(1).toString();
		assertTrue(service.isCurrentPeriod(CacheType.YEAR, thisYear));
		assertFalse(service.isCurrentPeriod(CacheType.YEAR, lastYear));
	}

	// ---------------- shouldPersist ----------------

	@Test
	void shouldPersist_daySkipsYesterdayButSavesOlderDays() {
		String yesterday = LocalDate.now().minusDays(1).format(DAY_FMT);
		String twoDaysAgo = LocalDate.now().minusDays(2).format(DAY_FMT);
		assertFalse(service.shouldPersist(CacheType.DAY, yesterday));
		assertTrue(service.shouldPersist(CacheType.DAY, twoDaysAgo));
	}

	@Test
	void shouldPersist_monthAndYearAlwaysPersistWhenPast() {
		assertTrue(service.shouldPersist(CacheType.MONTH, "2023-05"));
		assertTrue(service.shouldPersist(CacheType.YEAR, "2023"));
	}

	@Test
	void shouldPersist_unparseableDayDateIsNotPersisted() {
		assertFalse(service.shouldPersist(CacheType.DAY, "garbage"));
	}

	// ---------------- extractDayEnergy ----------------

	@Test
	void extractDayEnergy_returnsValueForRequestedDay() {
		MonthResponse.Obj obj = new MonthResponse.Obj(Arrays.asList(1.0, 2.0, 3.0));
		MonthResponse month = new MonthResponse(1L, obj);
		assertEquals(1.0, service.extractDayEnergy(month, 1));
		assertEquals(3.0, service.extractDayEnergy(month, 3));
	}

	@Test
	void extractDayEnergy_returnsZeroForOutOfRangeOrNull() {
		MonthResponse.Obj obj = new MonthResponse.Obj(Arrays.asList(1.0, null, 3.0));
		MonthResponse month = new MonthResponse(1L, obj);
		assertEquals(0.0, service.extractDayEnergy(month, 2)); // null entry
		assertEquals(0.0, service.extractDayEnergy(month, 99)); // out of range
		assertEquals(0.0, service.extractDayEnergy(new MonthResponse(1L, null), 1)); // null obj
	}
}
