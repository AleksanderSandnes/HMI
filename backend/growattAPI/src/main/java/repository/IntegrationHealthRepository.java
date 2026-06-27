package repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import entity.IntegrationHealth;

/** Postgres (JPA) repository for integration health rows (feeds the outage-monitor). */
public interface IntegrationHealthRepository extends JpaRepository<IntegrationHealth, UUID> {
}
