package entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;

import org.junit.jupiter.api.Test;

/**
 * Pure unit tests for {@link UserAccount#growatt()} — the null-safe accessor the backfill
 * job uses to read per-user Growatt credentials out of the shared users collection.
 */
class UserAccountTest {

	@Test
	void growatt_returnsNullWhenApiSettingsMissing() {
		UserAccount account = new UserAccount();
		assertNull(account.growatt());
	}

	@Test
	void growatt_returnsNullWhenGrowattSettingsMissing() {
		UserAccount account = new UserAccount();
		account.setApiSettings(new UserAccount.ApiSettings());
		assertNull(account.growatt());
	}

	@Test
	void growatt_returnsNestedGrowattSettingsWhenPresent() {
		UserAccount account = new UserAccount();
		UserAccount.ApiSettings settings = new UserAccount.ApiSettings();
		UserAccount.Growatt growatt = new UserAccount.Growatt();
		growatt.setEmail("solar@example.com");
		growatt.setPassword("secret");
		growatt.setPlantId("plant-1");
		settings.setGrowatt(growatt);
		account.setApiSettings(settings);

		assertSame(growatt, account.growatt());
		assertEquals("solar@example.com", account.growatt().getEmail());
		assertEquals("plant-1", account.growatt().getPlantId());
	}
}
