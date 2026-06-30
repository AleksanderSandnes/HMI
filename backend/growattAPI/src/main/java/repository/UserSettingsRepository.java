package repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

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

	/**
	 * Persist the plant id resolved from a Growatt login so later requests can build the cache
	 * key (and serve cache hits) without logging in. Targets only the {@code growatt_plant_id}
	 * column, leaving the weather columns untouched.
	 */
	@Modifying
	@Transactional
	@Query("update UserSettings u set u.growattPlantId = :plantId where u.authId = :authId")
	int updateGrowattPlantId(@Param("authId") UUID authId, @Param("plantId") String plantId);
}
