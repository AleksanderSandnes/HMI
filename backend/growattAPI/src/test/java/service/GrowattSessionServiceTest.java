package service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import controller.GrowattWebClient;
import entity.LoginRequest;
import entity.UserSettings;
import md5.MD5;
import repository.UserSettingsRepository;

class GrowattSessionServiceTest {
    private final UUID authId = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private final UUID secretId = UUID.fromString("00000000-0000-4000-8000-000000000002");
    private final UserSettingsRepository repository = mock(UserSettingsRepository.class);
    private final GrowattClientFactory factory = mock(GrowattClientFactory.class);
    private final GrowattWebClient client = mock(GrowattWebClient.class);
    private final GrowattSessionService service = new GrowattSessionService(repository, factory);
    private UserSettings settings;

    @BeforeEach
    void configure() {
        settings = new UserSettings();
        settings.setAuthId(authId);
        settings.setGrowattEmail("demo@example.com");
        settings.setGrowattPasswordSecretId(secretId);
        settings.setGrowattPlantId("fictional-plant");
        when(repository.findById(authId)).thenReturn(Optional.of(settings));
        when(repository.findGrowattPassword(secretId)).thenReturn("fictional-password");
        when(factory.create()).thenReturn(client);
    }

    @Test
    void readsOnlyTheAuthenticatedUsersSettingsAndVaultSecret() {
        GrowattSession result = service.loginFor(authId);
        assertSame(client, result.client());
        assertEquals("fictional-plant", result.plantId());
        ArgumentCaptor<LoginRequest> login = ArgumentCaptor.forClass(LoginRequest.class);
        verify(client).login(login.capture());
        assertEquals("demo@example.com", login.getValue().getAccount());
        assertEquals(MD5.md5("fictional-password"), login.getValue().getPasswordCrc());
        verify(repository).findGrowattPassword(secretId);
        verify(client, never()).getPlantId();
        verify(repository, never()).updateGrowattPlantId(any(), any());
    }

    @Test
    void resolvesAndPersistsThePlantForTheAuthenticatedUser() {
        settings.setGrowattPlantId(" ");
        when(client.getPlantId()).thenReturn("resolved-demo-plant");
        assertEquals("resolved-demo-plant", service.loginFor(authId).plantId());
        verify(repository).updateGrowattPlantId(authId, "resolved-demo-plant");
    }

    @Test
    void missingSettingsCannotReadVaultOrStartALogin() {
        when(repository.findById(authId)).thenReturn(Optional.empty());
        assertThrows(IllegalStateException.class, () -> service.loginFor(authId));
        verify(repository, never()).findGrowattPassword(any());
        verifyNoInteractions(factory, client);
    }

    @Test
    void incompleteCredentialsCannotReadVaultOrStartALogin() {
        for (String email : new String[] { null, "", " " }) {
            settings.setGrowattEmail(email);
            assertThrows(IllegalStateException.class, () -> service.loginFor(authId));
        }
        settings.setGrowattEmail("demo@example.com");
        settings.setGrowattPasswordSecretId(null);
        assertThrows(IllegalStateException.class, () -> service.loginFor(authId));
        verify(repository, never()).findGrowattPassword(any());
        verifyNoInteractions(factory, client);
    }

    @Test
    void blankVaultPasswordsCannotStartALogin() {
        for (String password : new String[] { null, "", " " }) {
            when(repository.findGrowattPassword(secretId)).thenReturn(password);
            assertThrows(IllegalStateException.class, () -> service.loginFor(authId));
        }
        verifyNoInteractions(factory, client);
    }

    @Test
    void loginWithoutAPlantFailsWithoutPersistingAnEmptyPlant() {
        settings.setGrowattPlantId(null);
        when(client.getPlantId()).thenReturn(null);
        assertThrows(IllegalStateException.class, () -> service.loginFor(authId));
        verify(repository, never()).updateGrowattPlantId(any(), any());
    }

    @Test
    void providerFailuresDoNotPersistResolvedSettings() {
        doThrow(new IllegalStateException("upstream unavailable")).when(client).login(any());
        assertThrows(IllegalStateException.class, () -> service.loginFor(authId));
        verify(repository, never()).updateGrowattPlantId(any(), any());
    }

    @Test
    void storedPlantLookupDoesNotDecryptOrLogin() {
        assertEquals(Optional.of("fictional-plant"), service.storedPlantId(authId));
        settings.setGrowattPlantId(" ");
        assertTrue(service.storedPlantId(authId).isEmpty());
        settings.setGrowattPlantId(null);
        assertTrue(service.storedPlantId(authId).isEmpty());
        when(repository.findById(authId)).thenReturn(Optional.empty());
        assertTrue(service.storedPlantId(authId).isEmpty());
        verify(repository, never()).findGrowattPassword(any());
        verifyNoInteractions(factory, client);
    }
}
