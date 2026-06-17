package repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import entity.Notification;

/**
 * MongoDB repository for in-app notifications (shared with the Node weatherAPI backend).
 */
public interface NotificationRepository extends MongoRepository<Notification, String> {
}
