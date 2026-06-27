package entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * In-app notification row in the Supabase Postgres {@code notifications} table.
 *
 * <p>Keyed by the Supabase auth user id ({@code auth_id}). Inserting a row is all the solar
 * job needs to do: a database webhook on insert invokes the {@code send-push} Edge Function,
 * which delivers the Expo push — so push is no longer sent from this service.</p>
 *
 * <p>"Mark as read" is a hard delete on the client side, so every stored row counts as unread.</p>
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
public class Notification {

	@Id
	private UUID id;

	/** Owner of the notification (Supabase auth.users id). */
	@Column(name = "auth_id")
	private UUID authId;

	/** Source: 'weather_sync', 'solar_sync' or 'system'. */
	private String type;

	/** Severity: 'success', 'error', 'info' or 'warning'. */
	private String level;

	private String title;

	private String message;

	@Column(name = "created_at")
	private Instant createdAt;

	public Notification(UUID authId, String type, String level, String title, String message) {
		this.id = UUID.randomUUID();
		this.authId = authId;
		this.type = type;
		this.level = level;
		this.title = title;
		this.message = message;
		this.createdAt = Instant.now();
	}
}
