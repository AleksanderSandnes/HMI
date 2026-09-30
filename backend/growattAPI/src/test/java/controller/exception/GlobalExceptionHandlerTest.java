package controller.exception;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.web.servlet.NoHandlerFoundException;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;

class GlobalExceptionHandlerTest {
    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();
    private final Logger logger = (Logger) LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();

    @BeforeEach
    void captureLogs() {
        logs.start();
        logger.addAppender(logs);
    }

    @AfterEach
    void cleanup() {
        logger.detachAppender(logs);
        logs.stop();
    }

    private void assertSecretNotLogged(String secret) {
        assertTrue(logs.list.stream().allMatch(event ->
                !event.getFormattedMessage().contains(secret) && event.getThrowableProxy() == null));
    }

    @Test
    void invalidArgumentsReturn400WithoutEchoingExceptionDetails() {
        String secret = "fictional-vault-password";
        var response = handler.handleIllegalArgument(new IllegalArgumentException(secret));
        assertEquals(400, response.getStatusCode().value());
        assertEquals("Invalid request parameters", response.getBody().get("message"));
        assertSecretNotLogged(secret);
    }

    @Test
    void unexpectedFailuresReturn500WithoutLoggingRawDetailsOrStackTraces() {
        String secret = "fictional-provider-response-secret";
        var response = handler.handleGenericException(new RuntimeException(secret));
        assertEquals(500, response.getStatusCode().value());
        assertEquals("An unexpected error occurred", response.getBody().get("message"));
        assertNotNull(response.getBody().get("timestamp"));
        assertSecretNotLogged(secret);
    }

    @Test
    void missingEndpointsReturn404WithoutLoggingUserSuppliedPaths() {
        String path = "/fictional-sensitive-path";
        var response = handler.handleNotFound(new NoHandlerFoundException("GET", path, new HttpHeaders()));
        assertEquals(404, response.getStatusCode().value());
        assertEquals(path, response.getBody().get("path"));
        assertSecretNotLogged(path);
    }
}
