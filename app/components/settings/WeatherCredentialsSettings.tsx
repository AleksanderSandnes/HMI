/**
 * Weather Credentials Settings Component
 * Allows users to securely store and manage their Weather.com API credentials
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import { solarTheme } from '../../theme/solarTheme';
import { useResponsive } from '../../utils/responsive';
import {
  saveWeatherApiSettings,
  getApiSettings,
  clearWeatherApiSettings,
  ApiSettingsResponse,
} from '../../services/settingsApiService';
import { selectDataMode } from '../../(redux)/settingsSlice';
import { logInfo, logError, logWarn } from '../../services/graylogService';

interface WeatherCredentialsSettingsProps {
  onCredentialsChange?: () => void;
}

export default function WeatherCredentialsSettings({
  onCredentialsChange,
}: WeatherCredentialsSettingsProps) {
  const currentDataMode = useSelector(selectDataMode);
  const { isMobile } = useResponsive();

  const [apiKey, setApiKey] = useState('');
  const [stationId, setStationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [backendSyncStatus, setBackendSyncStatus] = useState<
    'synced' | 'pending' | 'error' | null
  >(null);

  useEffect(() => {
    checkStoredCredentials();
  }, []);

  const checkStoredCredentials = async () => {
    try {
      setIsLoading(true);

      // Check backend settings
      try {
        const backendSettings = await getApiSettings();
        if (backendSettings?.weather) {
          setBackendSyncStatus('synced');
          setStationId(backendSettings.weather.stationId || '');
          setApiKey(
            backendSettings.weather.hasApiKey ? '••••••••••••••••' : ''
          );
          setHasCredentials(!!backendSettings.weather.hasApiKey);
        } else {
          setBackendSyncStatus(null);
        }
      } catch (error) {
        setBackendSyncStatus('error');
        logWarn(
          'Could not sync with backend',
          'WeatherCredentialsSettings',
          error as Error
        );
      }
    } catch (error) {
      logWarn(
        'Could not check stored credentials',
        'WeatherCredentialsSettings',
        error as Error
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!stationId.trim()) {
      Alert.alert('Error', 'Please enter a weather station ID');
      return;
    }

    if (!apiKey.trim() || apiKey === '••••••••••••••••') {
      Alert.alert('Error', 'Please enter a valid API key');
      return;
    }

    setIsLoading(true);
    let backendSuccess = false;

    try {
      // Save to backend
      await saveWeatherApiSettings({
        weather: {
          apiKey: apiKey.trim(),
          stationId: stationId.trim(),
        },
      });
      backendSuccess = true;
      setBackendSyncStatus('synced');
      logInfo('✅ Saved to backend', 'WeatherCredentialsSettings');

      Alert.alert(
        'Success',
        'Weather API credentials saved securely to cloud',
        [
          {
            text: 'OK',
            onPress: () => {
              setHasCredentials(true);
              setApiKey('••••••••••••••••'); // Mask API key after saving
              onCredentialsChange?.();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save credentials. Please try again.');
      logError(
        'Failed to save weather credentials',
        'WeatherCredentialsSettings',
        error as Error
      );
      setBackendSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCredentials = () => {
    Alert.alert(
      'Clear Weather Credentials',
      'Are you sure you want to remove stored weather API credentials? You will need to enter them again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Clear backend (only weather settings)
              await saveWeatherApiSettings({
                weather: {
                  apiKey: '',
                  stationId: '',
                },
              });
              setBackendSyncStatus(null);
              logInfo('✅ Cleared from backend', 'WeatherCredentialsSettings');

              setApiKey('');
              setStationId('');
              setHasCredentials(false);
              Alert.alert('Success', 'Weather credentials cleared from cloud');
              onCredentialsChange?.();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear credentials');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleApiKeyFocus = () => {
    if (apiKey === '••••••••••••••••') {
      setApiKey(''); // Clear masked API key when editing
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weather.com API Credentials</Text>
        <Text style={styles.subtitle}>
          Configure your Weather.com API key and weather station
        </Text>

        {/* Sync Status Indicator */}
        {backendSyncStatus && (
          <View
            style={[
              styles.syncStatus,
              backendSyncStatus === 'synced' && styles.syncStatusSuccess,
              backendSyncStatus === 'pending' && styles.syncStatusPending,
              backendSyncStatus === 'error' && styles.syncStatusError,
            ]}
          >
            <Icon
              name={
                backendSyncStatus === 'synced'
                  ? 'check-circle'
                  : backendSyncStatus === 'pending'
                    ? 'clock-o'
                    : 'exclamation-triangle'
              }
              size={12}
              color={
                backendSyncStatus === 'synced'
                  ? '#10b981'
                  : backendSyncStatus === 'pending'
                    ? '#f59e0b'
                    : '#ef4444'
              }
            />
            <Text
              style={[
                styles.syncStatusText,
                backendSyncStatus === 'synced' && styles.syncStatusTextSuccess,
                backendSyncStatus === 'pending' && styles.syncStatusTextPending,
                backendSyncStatus === 'error' && styles.syncStatusTextError,
              ]}
            >
              {backendSyncStatus === 'synced'
                ? 'Synced with cloud'
                : backendSyncStatus === 'pending'
                  ? 'Pending cloud sync'
                  : backendSyncStatus === 'error'
                    ? 'Cloud sync failed'
                    : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Weather Station ID</Text>
          <TextInput
            style={styles.input}
            value={stationId}
            onChangeText={setStationId}
            placeholder="e.g., ISANDN24"
            placeholderTextColor={solarTheme.text.secondary}
            autoCapitalize="characters"
            editable={!isLoading}
          />
          <Text style={styles.helpText}>
            Find your local weather station ID at weather.com/weather/map
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>API Key</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={apiKey}
              onChangeText={setApiKey}
              onFocus={handleApiKeyFocus}
              placeholder="Enter your Weather.com API key"
              placeholderTextColor={solarTheme.text.secondary}
              secureTextEntry={!showApiKey}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowApiKey(!showApiKey)}
            >
              <Text style={styles.eyeText}>{showApiKey ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helpText}>
            Get your API key from Weather.com Developer Portal
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSaveCredentials}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={solarTheme.text.primary} size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {hasCredentials ? 'Update Credentials' : 'Save Credentials'}
              </Text>
            )}
          </TouchableOpacity>

          {hasCredentials && (
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClearCredentials}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, styles.clearButtonText]}>
                Clear Credentials
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            ℹ️ Credentials are stored securely in the cloud and used only for
            weather API authentication
          </Text>

          {currentDataMode === 'development' && (
            <Text style={styles.infoText}>
              🔧 Development Mode: Environment variables will be used as
              fallback if no credentials are set
            </Text>
          )}

          {hasCredentials && (
            <Text style={styles.statusText}>
              ✅ Weather credentials stored and ready for use
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: solarTheme.background.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 0,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: solarTheme.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: solarTheme.text.secondary,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: solarTheme.text.primary,
  },
  input: {
    backgroundColor: solarTheme.background.cardLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: solarTheme.text.primary,
    borderWidth: 1,
    borderColor: 'rgba(79, 211, 204, 0.3)',
    // Fix Chrome autofill white background
    ...(Platform.OS === 'web' && {
      transition: 'background-color 5000s ease-in-out 0s',
      WebkitBoxShadow: `0 0 0 1000px ${solarTheme.background.cardLight} inset`,
      WebkitTextFillColor: solarTheme.text.primary,
    }),
  },
  helpText: {
    fontSize: 12,
    color: solarTheme.text.secondary,
    fontStyle: 'italic',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    bottom: 12,
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeText: {
    fontSize: 16,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  saveButton: {
    backgroundColor: '#f59e0b', // Orange theme for weather
  },
  clearButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  clearButtonText: {
    color: '#ef4444',
  },
  infoContainer: {
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: solarTheme.text.secondary,
    lineHeight: 16,
  },
  statusText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  syncStatusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  syncStatusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  syncStatusError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  syncStatusText: {
    fontSize: 11,
    marginLeft: 6,
    fontWeight: '500',
  },
  syncStatusTextSuccess: {
    color: '#10b981',
  },
  syncStatusTextPending: {
    color: '#f59e0b',
  },
  syncStatusTextError: {
    color: '#ef4444',
  },
});
