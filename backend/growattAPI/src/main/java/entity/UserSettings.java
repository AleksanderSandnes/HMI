package entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Per-user integration settings, read from the Supabase Postgres {@code user_settings} table.
 *
 * <p>Replaces the old Mongo {@code users} view. The solar backfill job uses this to source
 * each user's Growatt email + plant id; the Growatt password is NOT stored here — only the
 * Vault secret id is, which is decrypted on demand via
 * {@code repository.UserSettingsRepository#findGrowattPassword}.</p>
 */
@Entity
@Table(name = "user_settings")
@Getter
@Setter
@NoArgsConstructor
public class UserSettings {

	@Id
	@Column(name = "auth_id")
	private UUID authId;

	@Column(name = "growatt_email")
	private String growattEmail;

	@Column(name = "growatt_plant_id")
	private String growattPlantId;

	@Column(name = "growatt_password_secret_id")
	private UUID growattPasswordSecretId;
}
