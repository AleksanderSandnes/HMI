package controller.config;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

@ExtendWith(SpringExtension.class)
@WebAppConfiguration
@ContextConfiguration(classes = SecurityConfigTest.TestConfiguration.class)
class SecurityConfigTest {
    @Autowired
    private WebApplicationContext context;
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void healthIsPublicButActuatorAndDataRequireAuthentication() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
        mvc.perform(get("/api/growatt/health")).andExpect(status().isOk());
        mvc.perform(get("/actuator/info")).andExpect(status().isUnauthorized());
        mvc.perform(get("/actuator/env")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/growatt/data")).andExpect(status().isUnauthorized());
    }

    @Test
    void authenticatedRequestCanReachData() throws Exception {
        mvc.perform(get("/api/growatt/data").with(jwt())).andExpect(status().isOk());
    }

    @Test
    void productionOriginCanSendBearerTokenWithoutCookies() throws Exception {
        mvc.perform(options("/api/growatt/data")
                .header("Origin", "https://hmi-six.vercel.app")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "authorization"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "https://hmi-six.vercel.app"))
            .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
    }

    @Test
    void productionRejectsLocalhostAndUnknownPreviewOrigins() throws Exception {
        for (String origin : new String[]{"http://localhost:3000", "https://untrusted.example",
                "https://hmi-unknown-aleksander-sandnes-projects.vercel.app"}) {
            mvc.perform(options("/api/growatt/data").header("Origin", origin)
                    .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
        }
    }

    @Test
    void wildcardAndEmptyOriginConfigurationFailClosed() {
        assertThrows(IllegalArgumentException.class, () -> new SecurityConfig("*"));
        assertThrows(IllegalArgumentException.class, () -> new SecurityConfig(" , "));
    }

    @Configuration
    @EnableWebMvc
    @Import(SecurityConfig.class)
    static class TestConfiguration {
        @Bean
        JwtDecoder jwtDecoder() { return mock(JwtDecoder.class); }
        @Bean
        ProbeController probeController() { return new ProbeController(); }
    }

    @RestController
    static class ProbeController {
        @GetMapping({"/actuator/health", "/api/growatt/health", "/api/growatt/data"})
        String probe() { return "ok"; }
    }
}
