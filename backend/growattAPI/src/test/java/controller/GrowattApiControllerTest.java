package controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import entity.*;
import service.GrowattDataService;
import service.GrowattSession;
import service.GrowattSessionService;

/** Verify the real route delegation and ownership boundary, including cache-hit laziness. */
class GrowattApiControllerTest {
    private final UUID authId = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private final GrowattSessionService sessions = mock(GrowattSessionService.class);
    private final GrowattDataService data = mock(GrowattDataService.class);
    private final GrowattWebClient client = mock(GrowattWebClient.class);
    private final GrowattApiController controller = new GrowattApiController(sessions, data);
    private final Jwt jwt = Jwt.withTokenValue("fictional-token").header("alg", "ES256")
            .subject(authId.toString()).build();
    private final EnergyRequest request = new EnergyRequest("another-users-plant", "2025-01-01");

    @BeforeEach
    void configure() {
        when(sessions.storedPlantId(authId)).thenReturn(Optional.of("owned-plant"));
        when(sessions.loginFor(authId)).thenReturn(new GrowattSession(client, "owned-plant"));
    }

    @Test
    void healthHasThePublicServiceContract() {
        var response = controller.health();
        assertEquals(200, response.getStatusCode().value());
        var body = response.getBody();
        assertNotNull(body);
        assertEquals("healthy", body.get("status"));
        assertEquals("growatt-api", body.get("service"));
        assertNotNull(LocalDateTime.parse((String) body.get("timestamp")));
        assertNotNull(body.get("version"));
        verifyNoInteractions(sessions, data, client);
    }

    @Test
    void allCachedRoutesOverrideCallerPlantWithoutLoggingIn() {
        var total = new TotalDataResponse(1L, new TotalDataResponse.Obj());
        var day = new DayResponse(1L, new DayResponse.Obj(List.of(12.0)));
        var week = new WeekResponse(1L, new WeekResponse.Obj(List.of(2.0), List.of("2025-01-01")));
        var month = new MonthResponse(1L, new MonthResponse.Obj(List.of(3.0)));
        var year = new YearResponse(1L, new YearResponse.Obj(List.of(4.0)));
        when(data.getTotalData(any(), same(request))).thenReturn(total);
        when(data.getDayChart(any(), same(request))).thenReturn(day);
        when(data.getWeekChart(any(), same(request))).thenReturn(week);
        when(data.getMonthChart(any(), same(request))).thenReturn(month);
        when(data.getYearChart(any(), same(request))).thenReturn(year);
        when(data.getTotalChart(any(), same(request))).thenReturn(year);
        assertSame(total, controller.getTotalData(request, jwt).getBody());
        assertSame(day, controller.getDayChart(request, jwt).getBody());
        assertSame(week, controller.getWeekChart(request, jwt).getBody());
        assertSame(month, controller.getMonthChart(request, jwt).getBody());
        assertSame(year, controller.getYearChart(request, jwt).getBody());
        assertSame(year, controller.getTotalChart(request, jwt).getBody());
        assertEquals("owned-plant", request.getPlantId());
        verify(sessions, times(6)).storedPlantId(authId);
        verify(sessions, never()).loginFor(any());
        verifyNoInteractions(client);
    }

    @Test
    void repeatedLiveFetchesInOneRequestShareOneSession() {
        when(data.getWeekChart(any(), same(request))).thenAnswer(invocation -> {
            Supplier<GrowattWebClient> supplier = invocation.getArgument(0);
            assertSame(client, supplier.get());
            assertSame(client, supplier.get());
            return new WeekResponse(1L, null);
        });
        controller.getWeekChart(request, jwt);
        verify(sessions).loginFor(authId);
        assertEquals("owned-plant", request.getPlantId());
    }

    @Test
    void missingStoredPlantIsResolvedOnceBeforeFetching() {
        when(sessions.storedPlantId(authId)).thenReturn(Optional.empty());
        when(data.getDayChart(any(), same(request))).thenAnswer(invocation -> {
            Supplier<GrowattWebClient> supplier = invocation.getArgument(0);
            assertSame(client, supplier.get());
            assertEquals("owned-plant", request.getPlantId());
            return new DayResponse(1L, null);
        });
        controller.getDayChart(request, jwt);
        verify(sessions).loginFor(authId);
    }

    @Test
    void inverterTotalsUseOnlyTheAuthenticatedUsersSession() {
        var expected = new TotalDataInvResponse(1L, new TotalDataInvResponse.Obj("1", "2", "3"));
        when(client.getInvTotalData(request)).thenReturn(expected);
        assertSame(expected, controller.getInvTotalData(request, jwt).getBody());
        assertEquals("owned-plant", request.getPlantId());
        verify(sessions).loginFor(authId);
        verifyNoInteractions(data);
    }

    @Test
    void failedPlantResolutionCannotReachDataServices() {
        when(sessions.storedPlantId(authId)).thenReturn(Optional.empty());
        when(sessions.loginFor(authId)).thenThrow(new IllegalStateException("login failed"));
        assertThrows(IllegalStateException.class, () -> controller.getDayChart(request, jwt));
        verifyNoInteractions(data, client);
    }

    @Test
    void invalidSubjectCannotReadAnotherUsersSettings() {
        var invalid = Jwt.withTokenValue("fictional-token").header("alg", "ES256")
                .subject("invalid-subject").build();
        assertThrows(IllegalArgumentException.class, () -> controller.getTotalData(request, invalid));
        verifyNoInteractions(sessions, data, client);
    }
}
