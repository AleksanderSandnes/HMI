package controller;

import static org.junit.jupiter.api.Assertions.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import entity.EnergyRequest;
import entity.LoginRequest;
import reactor.core.publisher.Mono;

/** Real WebClient request/response processing with an isolated in-memory transport. */
class GrowattTransportTest {
    private final GrowattWebClient client = new GrowattWebClient();
    private final Logger logger = (Logger) LoggerFactory.getLogger(GrowattWebClient.class);
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();
    private final List<ClientRequest> requests = new ArrayList<>();
    private Level originalLevel;
    private ClientResponse response;

    @BeforeEach
    void configure() {
        originalLevel = logger.getLevel();
        logger.setLevel(Level.DEBUG);
        logs.start();
        logger.addAppender(logs);
        ReflectionTestUtils.setField(client, "client", WebClient.builder()
                .baseUrl("https://isolated.example")
                .exchangeFunction(request -> {
                    requests.add(request);
                    return Mono.just(response);
                }).build());
        response = response(HttpStatus.OK, "{\"result\":1}", "demo-plant", "fictional-session-secret");
    }

    @AfterEach
    void cleanup() {
        logger.detachAppender(logs);
        logger.setLevel(originalLevel);
        logs.stop();
    }

    private ClientResponse response(HttpStatus status, String body, String plant, String session) {
        return ClientResponse.create(status).body(body).cookies(cookies -> {
            cookies.add(GrowattWebClient.ONE_PLANT_ID, ResponseCookie.from(GrowattWebClient.ONE_PLANT_ID, plant).build());
            cookies.add("SESSION", ResponseCookie.from("SESSION", session).build());
        }).build();
    }

    @Test
    void loginCapturesCookiesAndUsesThemOnChartRequests() {
        assertEquals("{\"result\":1}", client.login(new LoginRequest("demo@example.com", "fictional-password")));
        assertEquals("demo-plant", client.getPlantId());
        response = chartResponse();
        assertEquals(List.of(12.0), client.getInvEnergyDayChart(new EnergyRequest("demo-plant", "2026-01-01")).getObj().getPac());
        assertEquals("/login", requests.get(0).url().getPath());
        assertEquals("fictional-session-secret", requests.get(1).cookies().getFirst("SESSION"));
        assertEquals("demo-plant", requests.get(1).cookies().getFirst(GrowattWebClient.ONE_PLANT_ID));
    }

    @Test
    void sessionCookiesAreNeverWrittenToDebugLogs() {
        client.login(new LoginRequest("demo@example.com", "fictional-password"));
        assertTrue(logs.list.stream().allMatch(event ->
                !event.getFormattedMessage().contains("fictional-session-secret")));
    }

    @Test
    void rejectedLoginDoesNotReturnAnAuthenticatedSession() {
        response = response(HttpStatus.OK, "{\"result\":0}", "demo-plant", "fictional-session-secret");
        assertThrows(IllegalStateException.class, () -> client.login(new LoginRequest("demo@example.com", "bad")));
        assertNull(client.getPlantId());
    }

    @Test
    void httpLoginFailuresDoNotReturnOrRetainCookies() {
        response = response(HttpStatus.UNAUTHORIZED, "fictional-provider-secret", "demo-plant", "fictional-session-secret");
        assertThrows(IllegalStateException.class, () -> client.login(new LoginRequest("demo@example.com", "bad")));
        assertNull(client.getPlantId());
    }

    @Test
    void malformedLoginResponsesFailWithAFixedMessage() {
        response = response(HttpStatus.OK, "fictional-provider-secret", "demo-plant", "fictional-session-secret");
        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> client.login(new LoginRequest("demo@example.com", "bad")));
        assertFalse(error.getMessage().contains("fictional-provider-secret"));
        assertNull(error.getCause());
        assertNull(client.getPlantId());
    }

    @Test
    void anotherLoginReplacesThePreviousSessionCookies() {
        client.login(new LoginRequest("demo-a@example.com", "fictional-password"));
        response = response(HttpStatus.OK, "{\"result\":1}", "other-demo-plant", "other-fictional-session");
        client.login(new LoginRequest("demo-b@example.com", "fictional-password"));
        assertEquals("other-demo-plant", client.getPlantId());
    }

    @Test
    void malformedChartResponsesDoNotLogProviderResponseDetails() {
        response = ClientResponse.create(HttpStatus.OK).body("fictional-provider-secret").build();
        assertNull(client.getInvEnergyDayChart(new EnergyRequest("demo-plant", "2026-01-01")).getResult());
        assertTrue(logs.list.stream().allMatch(event ->
                !event.getFormattedMessage().contains("fictional-provider-secret") && event.getThrowableProxy() == null));
    }

    private ClientResponse chartResponse() {
        return ClientResponse.create(HttpStatus.OK)
                .body("{\"result\":1,\"obj\":[{\"datas\":{\"pac\":[12.0],\"energy\":[3.0,4.0]}}]}")
                .build();
    }

    @Test
    void mapsEachChartEndpointFromTheActualProviderShape() {
        response = chartResponse();
        assertEquals(List.of(3.0, 4.0), client.getInvEnergyMonthChart(new EnergyRequest("demo-plant", "2025-01")).getObj().getEnergy());
        response = chartResponse();
        assertEquals(List.of(3.0, 4.0), client.getInvEnergyYearChart(new EnergyRequest("demo-plant", "2025")).getObj().getEnergy());
        response = chartResponse();
        assertEquals(List.of(3.0, 4.0), client.getInvEnergyTotalChart(new EnergyRequest("demo-plant", "invalid-year")).getObj().getEnergy());
        assertEquals(List.of("/energy/compare/getDevicesMonthChart", "/energy/compare/getDevicesYearChart",
                "/energy/compare/getDevicesTotalChart"), requests.stream().map(r -> r.url().getPath()).toList());
    }

    @Test
    void missingChartSeriesAndEmptyBodiesYieldNoData() {
        for (String body : new String[] {"", "{\"obj\":null}", "{\"obj\":[]}", "{\"obj\":[null]}"}) {
            response = ClientResponse.create(HttpStatus.OK).body(body).build();
            assertFalse(client.getInvEnergyMonthChart(new EnergyRequest("demo-plant", "2025-01")).hasData());
            response = ClientResponse.create(HttpStatus.OK).body(body).build();
            assertFalse(client.getInvEnergyYearChart(new EnergyRequest("demo-plant", "bad")).hasData());
            response = ClientResponse.create(HttpStatus.OK).body(body).build();
            assertFalse(client.getInvEnergyTotalChart(new EnergyRequest("demo-plant", null)).hasData());
        }
    }

    @Test
    void mapsInverterAndDeviceTotalsIncludingMissingValues() {
        String body = "{\"obj\":{\"datas\":[{\"eToday\":2.0,\"eTotal\":100.0,\"pac\":null}]}}";
        response = ClientResponse.create(HttpStatus.OK).body(body).build();
        var inverter = client.getInvTotalData(new EnergyRequest("demo-plant")).getObj();
        assertEquals("2.0", inverter.getEpvToday());
        assertEquals("100.0", inverter.getEpvTotal());
        assertNull(inverter.getPac());
        response = ClientResponse.create(HttpStatus.OK).body(body).build();
        assertEquals(100.0, client.getTotalData(new EnergyRequest("demo-plant")).getObj().getETotal());
        response = ClientResponse.create(HttpStatus.OK).body("{}").build();
        assertFalse(client.getInvTotalData(new EnergyRequest("demo-plant")).hasData());
        response = ClientResponse.create(HttpStatus.OK).body("invalid-json").build();
        assertFalse(client.getInvTotalData(new EnergyRequest("demo-plant")).hasData());
        assertTrue(requests.stream().allMatch(r -> r.url().getPath().equals("/panel/getDevicesByPlantList")));
    }

    @Test
    void clientErrorsAreNotRetried() {
        response = ClientResponse.create(HttpStatus.FORBIDDEN).body("fictional-provider-secret").build();
        assertThrows(org.springframework.web.reactive.function.client.WebClientResponseException.Forbidden.class,
                () -> client.getInvEnergyDayChart(new EnergyRequest("demo-plant", "2025-01-01")));
        assertEquals(1, requests.size());
    }

    @Test
    void retriesServerAndConnectionFailuresBeforeReturningData() {
        AtomicInteger attempts = new AtomicInteger();
        ReflectionTestUtils.setField(client, "client", WebClient.builder().baseUrl("https://isolated.example")
                .exchangeFunction(request -> switch (attempts.incrementAndGet()) {
                    case 1 -> Mono.just(ClientResponse.create(HttpStatus.SERVICE_UNAVAILABLE).build());
                    case 2 -> Mono.error(new java.io.IOException("fictional connection reset"));
                    default -> Mono.just(chartResponse());
                }).build());
        assertEquals(List.of(12.0), client.getInvEnergyDayChart(new EnergyRequest("demo-plant", "2025-01-01")).getObj().getPac());
        assertEquals(3, attempts.get());
    }

    @Test
    void persistentUpstreamFailuresStopAfterThreeAttempts() {
        AtomicInteger attempts = new AtomicInteger();
        ReflectionTestUtils.setField(client, "client", WebClient.builder().baseUrl("https://isolated.example")
                .exchangeFunction(request -> {
                    attempts.incrementAndGet();
                    return Mono.just(ClientResponse.create(HttpStatus.SERVICE_UNAVAILABLE).build());
                }).build());
        assertThrows(RuntimeException.class,
                () -> client.getInvEnergyDayChart(new EnergyRequest("demo-plant", "2025-01-01")));
        assertEquals(3, attempts.get());
    }
}
