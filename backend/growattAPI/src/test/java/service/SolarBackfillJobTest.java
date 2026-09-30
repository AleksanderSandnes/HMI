package service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.slf4j.LoggerFactory;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import controller.GrowattWebClient;
import entity.DayResponse;
import entity.EnergyRequest;
import entity.IntegrationHealth;
import entity.Notification;
import entity.UserSettings;
import repository.IntegrationHealthRepository;
import repository.NotificationRepository;
import repository.UserSettingsRepository;

class SolarBackfillJobTest {
    private final GrowattSessionService sessions = mock(GrowattSessionService.class);
    private final GrowattDataService data = mock(GrowattDataService.class);
    private final UserSettingsRepository users = mock(UserSettingsRepository.class);
    private final NotificationRepository notifications = mock(NotificationRepository.class);
    private final IntegrationHealthRepository health = mock(IntegrationHealthRepository.class);
    private final GrowattWebClient client = mock(GrowattWebClient.class);
    private final SolarBackfillJob job = new SolarBackfillJob(sessions, data, users, notifications, health);
    private final Logger logger = (Logger) LoggerFactory.getLogger(SolarBackfillJob.class);
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();
    private UserSettings user;

    private UserSettings configuredUser(int number) {
        UserSettings result = new UserSettings();
        result.setAuthId(UUID.fromString("00000000-0000-4000-8000-%012d".formatted(number)));
        result.setGrowattEmail("demo@example.com");
        result.setGrowattPasswordSecretId(UUID.randomUUID());
        return result;
    }

    @BeforeEach
    void configure() {
        logs.start();
        logger.addAppender(logs);
        user = configuredUser(1);
        when(users.findAll()).thenReturn(List.of(user));
        when(sessions.loginFor(any())).thenReturn(new GrowattSession(client, "demo-plant"));
        when(data.getDayChart(any(), any())).thenReturn(new DayResponse(1L,
                new DayResponse.Obj(Arrays.asList(1200.0, null, -1.0, 0.0, 1200.0))));
    }

    @AfterEach
    void cleanup() {
        logger.detachAppender(logs);
        logs.stop();
    }

    @Test
    void backfillsYesterdayAndRecordsOneSuccessForTheUser() {
        job.runBackfill();
        String yesterday = LocalDate.now().minusDays(1).toString();
        ArgumentCaptor<EnergyRequest> request = ArgumentCaptor.forClass(EnergyRequest.class);
        verify(data).getDayChart(any(), request.capture());
        assertEquals("demo-plant", request.getValue().getPlantId());
        assertEquals(yesterday, request.getValue().getDate());
        verify(data).backfillDayChart(eq("demo-plant"), eq(yesterday), any());
        verify(data).getWeekChart(any(), any());
        verify(data).getMonthChart(any(), any());
        verify(data).getYearChart(any(), any());
        ArgumentCaptor<Notification> notice = ArgumentCaptor.forClass(Notification.class);
        verify(notifications).save(notice.capture());
        assertEquals(user.getAuthId(), notice.getValue().getAuthId());
        assertEquals("success", notice.getValue().getLevel());
        assertTrue(notice.getValue().getMessage().contains("0.2 kWh"));
        ArgumentCaptor<IntegrationHealth> observation = ArgumentCaptor.forClass(IntegrationHealth.class);
        verify(health).save(observation.capture());
        assertEquals("ok", observation.getValue().getStatus());
        assertNull(observation.getValue().getDetail());
    }

    @Test
    void skipsUsersWithIncompleteCredentials() {
        UserSettings noEmail = configuredUser(2);
        noEmail.setGrowattEmail(" ");
        UserSettings noSecret = configuredUser(3);
        noSecret.setGrowattPasswordSecretId(null);
        when(users.findAll()).thenReturn(List.of(noEmail, noSecret));
        job.runBackfill();
        verifyNoInteractions(sessions, data, notifications, health);
    }

    @Test
    void emptyDayDataStillRecordsSuccessfulSyncWithoutProduction() {
        for (DayResponse day : new DayResponse[] { null, new DayResponse(1L, null),
                new DayResponse(1L, new DayResponse.Obj(null)) }) {
            when(data.getDayChart(any(), any())).thenReturn(day);
            job.runBackfill();
        }
        ArgumentCaptor<Notification> notice = ArgumentCaptor.forClass(Notification.class);
        verify(notifications, times(3)).save(notice.capture());
        assertTrue(notice.getAllValues().stream().allMatch(item ->
                item.getLevel().equals("success") && item.getMessage().contains("no production recorded")));
    }

    @Test
    void rawFailureDetailsCannotReachNotificationsHealthOrLogs() {
        String secret = "fictional-password=DO_NOT_PERSIST_OR_LOG";
        when(sessions.loginFor(user.getAuthId())).thenThrow(new IllegalStateException(secret));
        job.runBackfill();
        ArgumentCaptor<Notification> notice = ArgumentCaptor.forClass(Notification.class);
        verify(notifications).save(notice.capture());
        assertEquals("error", notice.getValue().getLevel());
        assertFalse(notice.getValue().getMessage().contains(secret));
        ArgumentCaptor<IntegrationHealth> observation = ArgumentCaptor.forClass(IntegrationHealth.class);
        verify(health).save(observation.capture());
        assertEquals("error", observation.getValue().getStatus());
        assertFalse(observation.getValue().getDetail().contains(secret));
        assertTrue(logs.list.stream().allMatch(event ->
                !event.getFormattedMessage().contains(secret) && event.getThrowableProxy() == null));
    }

    @Test
    void failedUserDoesNotPreventAnotherUsersBackfill() {
        UserSettings other = configuredUser(2);
        when(users.findAll()).thenReturn(List.of(user, other));
        when(sessions.loginFor(user.getAuthId())).thenThrow(new IllegalStateException("offline"));
        job.runBackfill();
        verify(sessions).loginFor(other.getAuthId());
        verify(notifications, times(2)).save(any());
        verify(health, times(2)).save(any());
    }

    @Test
    void notificationAndHealthWritesAreIndependentBestEffort() {
        when(notifications.save(any())).thenThrow(new IllegalStateException("notification database unavailable"));
        when(health.save(any())).thenThrow(new IllegalStateException("health database unavailable"));
        assertDoesNotThrow(job::runBackfill);
        verify(health).save(any());
    }

    @Test
    void scheduledFailuresDoNotEscapeOrLogRawExceptions() {
        String secret = "fictional-database-password";
        when(users.findAll()).thenThrow(new IllegalStateException(secret));
        assertDoesNotThrow(job::scheduledBackfill);
        assertTrue(logs.list.stream().allMatch(event ->
                !event.getFormattedMessage().contains(secret) && event.getThrowableProxy() == null));
    }
}
