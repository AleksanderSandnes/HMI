package repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import entity.Notification;

/**
 * Postgres (JPA) repository for in-app notifications. Inserting a row triggers the
 * notifications->send-push database webhook (Expo push delivery).
 */
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
}
