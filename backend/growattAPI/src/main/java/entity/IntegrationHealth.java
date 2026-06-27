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
 * One health observation in the Supabase {@code integration_health} table. The solar job
 * appends an {@code ok}/{@code error} row per backfill attempt; the {@code outage-monitor}
 * Edge Function reads the latest success per (user, source) to raise outage alerts.
 */
@Entity
@Table(name = "integration_health")
@Getter
@Setter
@NoArgsConstructor
public class IntegrationHealth {

	@Id
	private UUID id;

	@Column(name = "auth_id")
	private UUID authId;

	/** 'growatt' or 'weather'. */
	private String source;

	/** 'ok' or 'error'. */
	private String status;

	private String detail;

	@Column(name = "checked_at")
	private Instant checkedAt;

	public IntegrationHealth(UUID authId, String source, String status, String detail) {
		this.id = UUID.randomUUID();
		this.authId = authId;
		this.source = source;
		this.status = status;
		this.detail = detail;
		this.checkedAt = Instant.now();
	}
}
