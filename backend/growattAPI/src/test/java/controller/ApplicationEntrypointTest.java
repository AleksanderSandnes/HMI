package controller;

import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;

class ApplicationEntrypointTest {
    @Test
    void forwardsLaunchArgumentsToSpring() {
        String[] args = {"--server.port=0"};
        try (var spring = mockStatic(SpringApplication.class)) {
            Application.main(args);
            spring.verify(() -> SpringApplication.run(Application.class, args));
        }
    }
}
