package repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import entity.UserSettings;

/**
 * Postgres (JPA) repository over {@code user_settings}. Used by the solar backfill job to
 * resolve per-user Growatt credentials. The Growatt password lives in Supabase Vault; it is
 * decrypted on demand via the service-role {@code public.get_vault_secret(uuid)} function.
 */
public interface UserSettingsRepository extends JpaRepository<UserSettings, UUID> {

	/** Decrypt a Growatt password from Vault by its secret id (null if absent). */
	@Query(value = "select public.get_vault_secret(:secretId)", nativeQuery = true)
	String findGrowattPassword(@Param("secretId") UUID secretId);
}
