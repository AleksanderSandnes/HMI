/**
 * Credentials Settings Component
 * Allows users to securely store and manage their API credentials
 * Supports both local storage and backend MongoDB integration
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
  getGrowattCredentials,
  storeGrowattCredentials,
  clearStoredCredentials,
  hasStoredCredentials,
} from '../../services/credentialsService';
import {
  saveGrowattApiSettings,
  getApiSettings,
  clearApiSettings,
  ApiSettingsResponse,
} from '../../services/settingsApiService';
import { selectDataMode } from '../../(redux)/settingsSlice';

interface CredentialsSettingsProps {
  onCredentialsChange?: () => void;
}

export default function CredentialsSettings({
  onCredentialsChange,
}: CredentialsSettingsProps) {
  const currentDataMode = useSelector(selectDataMode);
  const { isMobile } = useResponsive();

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [plantId, setPlantId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [backendSyncStatus, setBackendSyncStatus] = useState<
    'synced' | 'pending' | 'error' | null
  >(null);

  useEffect(() => {
    checkStoredCredentials();
  }, []);

  const checkStoredCredentials = async () => {
    try {
      setIsLoading(true);

      // Check local storage first
      const stored = await hasStoredCredentials();
      setHasCredentials(stored);

      if (stored) {
        // Load existing credentials for display (password masked)
        const credentials = await getGrowattCredentials();
        setAccount(credentials.account);
        setPassword('••••••••'); // Mask the password
        setPlantId(credentials.plantId || '');
      }

      // Check backend sync status
      try {
        const backendSettings = await getApiSettings();
        if (backendSettings?.growatt) {
          setBackendSyncStatus('synced');
          // If no local credentials but backend has them, show backend data
          if (!stored) {
            setAccount(backendSettings.growatt.email);
            setPlantId(backendSettings.growatt.plantId || '');
            setPassword(backendSettings.growatt.hasPassword ? '••••••••' : '');
            setHasCredentials(!!backendSettings.growatt.hasPassword);
          }
        } else {
          setBackendSyncStatus(stored ? 'pending' : null);
        }
      } catch (error) {
        setBackendSyncStatus('error');
        console.warn('Could not sync with backend:', error);
      }
    } catch (error) {
      console.warn('Could not check stored credentials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!account.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both account and password');
      return;
    }

    if (!account.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    let localSuccess = false;
    let backendSuccess = false;

    try {
      // Save to local storage first
      await storeGrowattCredentials({
        account: account.trim(),
        password: password.trim(),
        plantId: plantId.trim(),
      });
      localSuccess = true;
      console.log('[CredentialsSettings] ✅ Saved to local storage');

      // Save to backend if authenticated
      try {
        await saveGrowattApiSettings({
          growatt: {
            email: account.trim(),
            password: password.trim(),
            plantId: plantId.trim(),
          },
        });
        backendSuccess = true;
        setBackendSyncStatus('synced');
        console.log('[CredentialsSettings] ✅ Saved to backend');
      } catch (backendError) {
        setBackendSyncStatus('error');
        console.warn(
          '[CredentialsSettings] ⚠️ Backend save failed:',
          backendError
        );
      }

      const successMessage = backendSuccess
        ? 'Credentials saved securely to device and cloud'
        : 'Credentials saved to device. Cloud sync failed - will retry later.';

      Alert.alert('Success', successMessage, [
        {
          text: 'OK',
          onPress: () => {
            setHasCredentials(true);
            setPassword('••••••••'); // Mask password after saving
            onCredentialsChange?.();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save credentials. Please try again.');
      console.error('Failed to save credentials:', error);
      setBackendSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCredentials = () => {
    Alert.alert(
      'Clear Credentials',
      'Are you sure you want to remove stored credentials from both device and cloud? You will need to enter them again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Clear local storage
              await clearStoredCredentials();

              // Clear backend
              try {
                await clearApiSettings();
                setBackendSyncStatus(null);
                console.log('[CredentialsSettings] ✅ Cleared from backend');
              } catch (error) {
                console.warn(
                  '[CredentialsSettings] ⚠️ Backend clear failed:',
                  error
                );
              }

              setAccount('');
              setPassword('');
              setPlantId('');
              setHasCredentials(false);
              Alert.alert(
                'Success',
                'Credentials cleared from device and cloud'
              );
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

  const handlePasswordFocus = () => {
    if (password === '••••••••') {
      setPassword(''); // Clear masked password when editing
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Growatt API Credentials</Text>
        <Text style={styles.subtitle}>
          Store your credentials securely for API access
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
          <Text style={styles.label}>Account (Email)</Text>
          <TextInput
            style={styles.input}
            value={account}
            onChangeText={setAccount}
            placeholder="your-email@domain.com"
            placeholderTextColor={solarTheme.text.secondary}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              onFocus={handlePasswordFocus}
              placeholder="Enter your password"
              placeholderTextColor={solarTheme.text.secondary}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Plant ID (Optional)</Text>
          <TextInput
            style={styles.input}
            value={plantId}
            onChangeText={setPlantId}
            placeholder="Enter your plant ID"
            placeholderTextColor={solarTheme.text.secondary}
            editable={!isLoading}
          />
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
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            ℹ️ Credentials are stored securely in the cloud and used only for
            API authentication
          </Text>

          {currentDataMode === 'development' && (
            <Text style={styles.infoText}>
              🔧 Development Mode: Environment variables will be used as
              fallback if no credentials are set
            </Text>
          )}

          {hasCredentials && (
            <Text style={styles.statusText}>
              ✅ Credentials stored and ready for use
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
    borderColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: 12,
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
    backgroundColor: solarTheme.primary.main,
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
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
