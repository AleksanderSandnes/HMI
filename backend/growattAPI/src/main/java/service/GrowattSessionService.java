package service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;

import controller.GrowattWebClient;
import entity.LoginRequest;
import entity.UserSettings;
import io.micrometer.common.util.StringUtils;
import lombok.RequiredArgsConstructor;
import repository.UserSettingsRepository;

/**
 * Resolves a user's Growatt credentials from Supabase (settings + Vault) and performs a
 * server-side login, returning a per-request {@link GrowattSession}. The frontend never
 * handles the Growatt password — it only sends its Supabase JWT, whose subject is the
 * {@code auth_id} used here.
 */
@Service
@RequiredArgsConstructor
public class GrowattSessionService {

	private final UserSettingsRepository userSettingsRepository;
	private final GrowattClientFactory clientFactory;

	/**
	 * The plant id stored in the user's settings, if any. Lets callers build the solar cache
	 * key (and serve cache hits) without performing a Growatt login.
	 */
	public Optional<String> storedPlantId(UUID authId) {
		return userSettingsRepository.findById(authId)
				.map(UserSettings::getGrowattPlantId)
				.filter(StringUtils::isNotBlank);
	}

	/** Log into Growatt for the given Supabase user. Throws if Growatt isn't configured. */
	public GrowattSession loginFor(UUID authId) {
		UserSettings settings = userSettingsRepository.findById(authId)
				.orElseThrow(() -> new IllegalStateException("No settings for user"));

		if (StringUtils.isBlank(settings.getGrowattEmail()) || settings.getGrowattPasswordSecretId() == null) {
			throw new IllegalStateException("Growatt credentials are not configured. Add them in Settings.");
		}

		String password = userSettingsRepository.findGrowattPassword(settings.getGrowattPasswordSecretId());
		if (StringUtils.isBlank(password)) {
			throw new IllegalStateException("Growatt password could not be read from Vault.");
		}

		GrowattWebClient client = clientFactory.create();
		client.login(new LoginRequest(settings.getGrowattEmail(), password));

		String plantId = settings.getGrowattPlantId();
		if (StringUtils.isBlank(plantId)) {
			// Resolve it from the login and persist so future requests skip the login on cache hits.
			plantId = client.getPlantId();
			if (StringUtils.isNotBlank(plantId)) {
				userSettingsRepository.updateGrowattPlantId(authId, plantId);
			}
		}
		if (StringUtils.isBlank(plantId)) {
			throw new IllegalStateException("No plant id available after Growatt login.");
		}
		return new GrowattSession(client, plantId);
	}
}
