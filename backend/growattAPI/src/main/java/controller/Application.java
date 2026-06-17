package controller;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication(scanBasePackages = { "controller", "service" })
@EnableMongoRepositories(basePackages = "repository")
@EntityScan(basePackages = "entity")
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}