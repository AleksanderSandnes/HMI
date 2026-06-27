package controller.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Stateless security. Every Growatt data route now requires a valid Supabase-issued JWT,
 * validated against the project's JWKS (ES256). This replaces the previous {@code permitAll}
 * posture and the Node backend's hardcoded-{@code 'anykey'} JWT verification. Only the health
 * and actuator probes are public.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /** Supabase JWKS, e.g. https://<ref>.supabase.co/auth/v1/.well-known/jwks.json */
    @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}")
    private String jwkSetUri;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)

            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .headers(headers -> headers
                .frameOptions(options -> options.deny())
                .contentTypeOptions(options -> {})
                .httpStrictTransportSecurity(hstsConfig -> hstsConfig
                    .maxAgeInSeconds(31536000)
                    .includeSubDomains(true)
                )
                .referrerPolicy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
            )

            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Public health/actuator; everything else needs a valid Supabase JWT.
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/growatt/health", "/actuator/**").permitAll()
                .anyRequest().authenticated()
            )

            // Validate Supabase JWTs (ES256) via the project JWKS.
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwkSetUri(jwkSetUri))
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "https://hmi-seven.vercel.app",
            "https://hmi-git-main-apsandnes-projects.vercel.app",
            "http://localhost:8081",
            "http://localhost:19006",
            "http://localhost:3000"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
