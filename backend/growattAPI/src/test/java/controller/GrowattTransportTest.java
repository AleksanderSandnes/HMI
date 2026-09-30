package controller;

import static org.junit.jupiter.api.Assertions.*;

import java.util.ArrayList;
import java.util.List;

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
        response = ClientResponse.create(HttpStatus.OK).body("{\"result\":1,\"obj\":{\"datas\":[{\"pac\":[12.0]}]}}").build();
        client.getInvEnergyDayChart(new EnergyRequest("demo-plant", "2026-01-01"));
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
}
