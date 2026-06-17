package entity;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Read-only view of the shared {@code users} collection (owned and written by the Node
 * weatherAPI backend). The solar backfill job uses it to source per-user Growatt
 * credentials and Expo push tokens. Only the fields the job needs are mapped; everything
 * else in the document is ignored.
 */
@Document(collection = "users")
@Getter
@Setter
@NoArgsConstructor
public class UserAccount {

	@Id
	private String id;

	private String email;

	private ApiSettings apiSettings;

	/** Expo push tokens for this user's mobile/tablet devices. */
	private List<String> expoPushTokens;

	@Getter
	@Setter
	@NoArgsConstructor
	public static class ApiSettings {
		private Growatt growatt;
	}

	@Getter
	@Setter
	@NoArgsConstructor
	public static class Growatt {
		private String email;
		private String password;
		private String plantId;
	}

	/** Convenience accessor for the nested Growatt settings (null-safe). */
	public Growatt growatt() {
		return apiSettings != null ? apiSettings.getGrowatt() : null;
	}
}
