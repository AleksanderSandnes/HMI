package entity;

import java.util.Date;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * In-app notification written into the shared {@code notifications} collection.
 *
 * <p>The same collection is read and written by the Node weatherAPI backend (Mongoose), so
 * the field names and types here must stay aligned with that model:
 * {@code userId} is stored as an {@link ObjectId} (matching the Mongoose ObjectId cast of
 * the authenticated user id), and {@code createdAt} is a {@link Date} the UI sorts by.</p>
 *
 * <p>"Mark as read" is a hard delete on the Node side, so every stored notification counts
 * as unread.</p>
 */
@Document(collection = "notifications")
// No explicit index name: Spring Data derives the default name "userId_1_createdAt_-1",
// which matches the index Mongoose auto-creates for the same keys in the Node backend.
// Using a custom name here would clash (MongoDB error 85) since both backends share this
// collection and MongoDB forbids two indexes with identical keys but different names.
@CompoundIndex(def = "{'userId': 1, 'createdAt': -1}")
@Getter
@Setter
@NoArgsConstructor
public class Notification {

	@Id
	private String id;

	/** Owner of the notification (Mongo ObjectId, matches the Node User _id). */
	private ObjectId userId;

	/** Source: 'weather_sync', 'solar_sync' or 'system'. */
	private String type;

	/** Severity: 'success', 'error', 'info' or 'warning'. */
	private String level;

	private String title;

	private String message;

	/** Creation timestamp (the web center sorts newest-first by this). */
	private Date createdAt;

	public Notification(ObjectId userId, String type, String level, String title, String message) {
		this.userId = userId;
		this.type = type;
		this.level = level;
		this.title = title;
		this.message = message;
		this.createdAt = new Date();
	}
}
