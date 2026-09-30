package controller;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.test.context.ActiveProfiles;

/** Exercise Boot's real server/security/JPA auto-configuration without live services. */
@ActiveProfiles("production")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.datasource.url=jdbc:h2:mem:startup;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://127.0.0.1:1/jwks",
    "spring.security.oauth2.resourceserver.jwt.issuer-uri=https://issuer.example.test"
})
class ApplicationStartupTest {
    @Value("${local.server.port}")
    private int port;

    @Test
    void productionHealthIsPublicAndDataAndActuatorRemainProtected() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        assertEquals(200, get(client, "/actuator/health"));
        assertEquals(200, get(client, "/api/growatt/health"));
        assertEquals(401, get(client, "/actuator/env"));
        assertEquals(401, get(client, "/api/growatt/data"));
    }

    private int get(HttpClient client, String path) throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).build(),
            HttpResponse.BodyHandlers.discarding()).statusCode();
    }
}
