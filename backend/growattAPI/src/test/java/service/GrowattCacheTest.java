package service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import controller.GrowattWebClient;
import entity.DayResponse;
import entity.EnergyRequest;
import entity.MonthResponse;
import entity.SolarDataCache;
import entity.YearResponse;
import entity.TotalDataResponse;
import repository.SolarDataCacheRepository;

class GrowattCacheTest {
    private final SolarDataCacheRepository repository = mock(SolarDataCacheRepository.class);
    private final GrowattWebClient client = mock(GrowattWebClient.class);
    private final GrowattDataService service = new GrowattDataService(repository);
    private final DayResponse production = new DayResponse(1L, new DayResponse.Obj(List.of(1200.0)));

    @BeforeEach
    void configure() {
        ReflectionTestUtils.setField(service, "cacheEnabled", true);
        ReflectionTestUtils.setField(service, "currentTtlMinutes", 60L);
        ReflectionTestUtils.setField(service, "totalTtlMinutes", 1440L);
        when(repository.findFirstByTypeAndPlantIdAndDate(anyString(), anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(client.getInvEnergyDayChart(any())).thenReturn(production);
    }

    private SolarDataCache cache(String type, String date, String payload, Instant timestamp) {
        return new SolarDataCache(type, "demo-plant", date, payload, timestamp);
    }

    @Test
    void historicalCacheHitsNeverRequireAnUpstreamClient() {
        String date = "2025-01-01";
        when(repository.findFirstByTypeAndPlantIdAndDate("DAY", "demo-plant", date))
                .thenReturn(Optional.of(cache("DAY", date, "{\"result\":1,\"obj\":{\"pac\":[42.0]}}", null)));
        var result = service.getDayChart(() -> { fail("Cache hit must not log in"); return client; },
                new EnergyRequest("demo-plant", date));
        assertEquals(List.of(42.0), result.getObj().getPac());
        verifyNoInteractions(client);
        verify(repository, never()).save(any());
    }

    @Test
    void currentPeriodHonorsFreshnessAndRefreshesMissingTimestamps() {
        String today = LocalDate.now().toString();
        SolarDataCache cached = cache("DAY", today, "{\"result\":1,\"obj\":{\"pac\":[42.0]}}", Instant.now());
        when(repository.findFirstByTypeAndPlantIdAndDate("DAY", "demo-plant", today))
                .thenReturn(Optional.of(cached));
        assertEquals(List.of(42.0), service.getDayChart(() -> client, new EnergyRequest("demo-plant", today)).getObj().getPac());
        verifyNoInteractions(client);
        cached.setCachedAt(null);
        assertSame(production, service.getDayChart(() -> client, new EnergyRequest("demo-plant", today)));
        verify(repository).save(cached);
        assertNotNull(cached.getCachedAt());
    }

    @Test
    void emptyCurrentPeriodsAreCachedButEmptyHistoricalPeriodsAreNot() {
        when(client.getInvEnergyDayChart(any())).thenReturn(new DayResponse(1L, new DayResponse.Obj(List.of())));
        service.getDayChart(() -> client, new EnergyRequest("demo-plant", "2025-01-01"));
        verify(repository, never()).save(any());
        service.getDayChart(() -> client, new EnergyRequest("demo-plant", LocalDate.now().toString()));
        verify(repository).save(any());
    }

    @Test
    void readAndWriteFailuresCannotPreventLiveData() {
        when(repository.findFirstByTypeAndPlantIdAndDate(anyString(), anyString(), anyString()))
                .thenThrow(new IllegalStateException("fictional database failure"));
        assertSame(production, service.getDayChart(() -> client, new EnergyRequest("demo-plant", "2025-01-01")));
        doReturn(Optional.empty()).when(repository)
                .findFirstByTypeAndPlantIdAndDate(anyString(), anyString(), anyString());
        when(repository.save(any())).thenThrow(new IllegalStateException("fictional write failure"));
        assertSame(production, service.getDayChart(() -> client, new EnergyRequest("demo-plant", "2025-01-01")));
    }

    @Test
    void disabledCacheAndIncompleteKeysBypassDatabaseAccess() {
        ReflectionTestUtils.setField(service, "cacheEnabled", false);
        assertSame(production, service.getDayChart(() -> client, new EnergyRequest("demo-plant", "2025-01-01")));
        ReflectionTestUtils.setField(service, "cacheEnabled", true);
        assertSame(production, service.getDayChart(() -> client, new EnergyRequest(null, "2025-01-01")));
        assertSame(production, service.getDayChart(() -> client, new EnergyRequest("demo-plant", null)));
        verifyNoInteractions(repository);
    }

    @Test
    void corruptCachedPayloadFallsBackToLiveData() {
        when(repository.findFirstByTypeAndPlantIdAndDate("DAY", "demo-plant", "2025-01-01"))
                .thenReturn(Optional.of(cache("DAY", "2025-01-01", "invalid-json", null)));
        assertSame(production, service.getDayChart(() -> client, new EnergyRequest("demo-plant", "2025-01-01")));
    }

    @Test
    void totalChartUsesItsLongerTtlAndRefreshesExpiredEntries() {
        String year = Year.now().toString();
        SolarDataCache cached = cache("TOTAL", year, "{\"result\":1,\"obj\":{\"energy\":[42.0]}}", Instant.now().minusSeconds(7200));
        when(repository.findFirstByTypeAndPlantIdAndDate("TOTAL", "demo-plant", year))
                .thenReturn(Optional.of(cached));
        assertEquals(List.of(42.0), service.getTotalChart(() -> client, new EnergyRequest("demo-plant", year)).getObj().getEnergy());
        verifyNoInteractions(client);
        cached.setCachedAt(Instant.now().minusSeconds(90000));
        YearResponse response = new YearResponse(1L, new YearResponse.Obj(List.of(99.0)));
        when(client.getInvEnergyTotalChart(any())).thenReturn(response);
        assertSame(response, service.getTotalChart(() -> client, new EnergyRequest("demo-plant", year)));
    }

    @Test
    void weeklyChartFetchesEachCoveringMonthOnlyOnce() {
        MonthResponse month = new MonthResponse(1L, new MonthResponse.Obj(
                IntStream.rangeClosed(1, 31).mapToObj(value -> (double) value).toList()));
        when(client.getInvEnergyMonthChart(any())).thenReturn(month);
        var result = service.getWeekChart(() -> client, new EnergyRequest("demo-plant", "2025-02-04"));
        assertEquals(List.of(29.0, 30.0, 31.0, 1.0, 2.0, 3.0, 4.0), result.getObj().getEnergy());
        verify(client, times(2)).getInvEnergyMonthChart(any());
    }

    @Test
    void failedMonthIsNotRetriedForEveryDayOfTheWeek() {
        when(client.getInvEnergyMonthChart(any())).thenThrow(new IllegalStateException("provider offline"));
        var result = service.getWeekChart(() -> client, new EnergyRequest("demo-plant", "2025-01-20"));
        assertEquals(java.util.Collections.nCopies(7, 0.0), result.getObj().getEnergy());
        verify(client).getInvEnergyMonthChart(any());
    }

    @Test
    void snapshotUsesTodayAsCacheKeyAndPassesOriginalRequestUpstream() {
        var request = new EnergyRequest("demo-plant", "ignored-client-date");
        var response = new TotalDataResponse(1L, new TotalDataResponse.Obj());
        when(client.getTotalData(request)).thenReturn(response);
        assertSame(response, service.getTotalData(() -> client, request));
        verify(repository, times(2)).findFirstByTypeAndPlantIdAndDate("SNAPSHOT", "demo-plant", LocalDate.now().toString());
        verify(client).getTotalData(request);
    }

    @Test
    void yearChartDelegatesToTheYearEndpoint() {
        var request = new EnergyRequest("demo-plant", "2025");
        var response = new YearResponse(1L, new YearResponse.Obj(List.of(12.0)));
        when(client.getInvEnergyYearChart(request)).thenReturn(response);
        assertSame(response, service.getYearChart(() -> client, request));
        verify(repository).save(argThat(row -> row.getType().equals("YEAR") && row.getDate().equals("2025")));
    }

    @Test
    void backfillSavesOnlySuccessfulProductionAndToleratesWriteFailures() {
        service.backfillDayChart("demo-plant", "2025-01-01", null);
        service.backfillDayChart("demo-plant", "2025-01-01", new DayResponse(null, production.getObj()));
        service.backfillDayChart("demo-plant", "2025-01-01", new DayResponse(0L, production.getObj()));
        service.backfillDayChart("demo-plant", "2025-01-01", new DayResponse(1L, new DayResponse.Obj(List.of())));
        verify(repository, never()).save(any());
        service.backfillDayChart("demo-plant", "2025-01-01", production);
        verify(repository).save(argThat(row -> row.getPayload().contains("1200.0") && row.getCachedAt() != null));
        when(repository.save(any())).thenThrow(new IllegalStateException("fictional write failure"));
        assertDoesNotThrow(() -> service.backfillDayChart("demo-plant", "2025-01-01", production));
    }

    @Test
    void unsuccessfulLiveResponsesAreNeverCachedEvenForCurrentPeriods() {
        var request = new EnergyRequest("demo-plant", LocalDate.now().toString());
        for (DayResponse response : new DayResponse[] {null, new DayResponse(null, null), new DayResponse(0L, production.getObj())}) {
            when(client.getInvEnergyDayChart(request)).thenReturn(response);
            assertSame(response, service.getDayChart(() -> client, request));
        }
        verify(repository, never()).save(any());
    }

    @Test
    void invalidWeekDatesUseTodayAndMissingMonthsProduceSevenZeroes() {
        var result = service.getWeekChart(() -> client, new EnergyRequest("demo-plant", "invalid-date"));
        assertEquals(java.util.Collections.nCopies(7, 0.0), result.getObj().getEnergy());
        assertEquals(LocalDate.now().toString(), result.getObj().getDays().get(6));
    }
}
