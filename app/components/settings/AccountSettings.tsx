/**
 * AccountSettings Component
 * Allows users to update their username, email, and password
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import { solarTheme } from '../../theme/solarTheme';
import {
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
  UserProfile,
  UpdateProfileData,
  UpdatePasswordData,
} from '../../services/accountApiService';
import { loginUserAction } from '../../(redux)/authSlice';
import { logInfo, logError } from '../../services/graylogService';

interface AccountSettingsProps {
  onAccountChange?: () => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({
  onAccountChange,
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.auth);

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Success states
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);

  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsProfileLoading(true);
      setProfileError(null);

      logInfo('Loading user profile...', 'AccountSettings');
      const profileData = await getUserProfile();
      logInfo('Profile data received:', 'AccountSettings', profileData);

      setProfile(profileData);
      setUsername(profileData.username);
      setEmail(profileData.email);

      logInfo('Profile state updated successfully', 'AccountSettings');
    } catch (error: any) {
      logError('Failed to load profile:', 'AccountSettings', error);
      setProfileError(error.message || 'Failed to load profile');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setIsProfileLoading(true);
      setProfileError(null);
      setProfileUpdateSuccess(false);

      // Validation
      if (!username.trim() || !email.trim()) {
        throw new Error('Username and email are required');
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      const profileData: UpdateProfileData = {
        username: username.trim(),
        email: email.trim(),
      };

      const updatedProfile = await updateUserProfile(profileData);

      // Update local state
      setProfile(updatedProfile);
      setProfileUpdateSuccess(true);

      // Update Redux store with new user data
      if (user && user.token) {
        dispatch(
          loginUserAction({
            ...user,
            username: updatedProfile.username,
            email: updatedProfile.email,
          })
        );
      }

      // Show success message
      if (Platform.OS === 'web') {
        // Use a temporary success indicator instead of alert on web
        setTimeout(() => setProfileUpdateSuccess(false), 3000);
      } else {
        Alert.alert('Success', 'Profile updated successfully');
        setProfileUpdateSuccess(false);
      }

      onAccountChange?.();
    } catch (error: any) {
      logError('Profile update failed:', 'AccountSettings', error);
      setProfileError(error.message || 'Failed to update profile');

      if (Platform.OS !== 'web') {
        Alert.alert('Error', error.message || 'Failed to update profile');
      }
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      setIsPasswordLoading(true);
      setPasswordError(null);
      setPasswordUpdateSuccess(false);

      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('All password fields are required');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('New password and confirmation do not match');
      }

      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
      }

      const passwordData: UpdatePasswordData = {
        currentPassword,
        newPassword,
      };

      await updateUserPassword(passwordData);

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordUpdateSuccess(true);

      // Show success message
      if (Platform.OS === 'web') {
        // Use a temporary success indicator instead of alert on web
        setTimeout(() => setPasswordUpdateSuccess(false), 3000);
      } else {
        Alert.alert('Success', 'Password updated successfully');
        setPasswordUpdateSuccess(false);
      }

      onAccountChange?.();
    } catch (error: any) {
      logError('Password update failed:', 'AccountSettings', error);
      setPasswordError(error.message || 'Failed to update password');

      if (Platform.OS !== 'web') {
        Alert.alert('Error', error.message || 'Failed to update password');
      }
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Account Settings</Text>
        <Text style={styles.subtitle}>
          Manage your profile information and password
        </Text>
      </View>

      {/* Profile Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>

        {profileError && (
          <View style={styles.errorContainer}>
            <Icon name="exclamation-triangle" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{profileError}</Text>
          </View>
        )}

        {profileUpdateSuccess && (
          <View style={styles.successContainer}>
            <Icon name="check-circle" size={16} color="#10b981" />
            <Text style={styles.successText}>
              Profile updated successfully!
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor={solarTheme.text.secondary}
              autoCapitalize="none"
              editable={!isProfileLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={solarTheme.text.secondary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isProfileLoading}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              isProfileLoading && styles.buttonDisabled,
              profileUpdateSuccess && styles.buttonSuccess,
            ]}
            onPress={handleProfileUpdate}
            disabled={isProfileLoading}
          >
            <Text style={styles.buttonText}>
              {isProfileLoading ? 'Updating...' : 'Update Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Password Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password</Text>

        {passwordError && (
          <View style={styles.errorContainer}>
            <Icon name="exclamation-triangle" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{passwordError}</Text>
          </View>
        )}

        {passwordUpdateSuccess && (
          <View style={styles.successContainer}>
            <Icon name="check-circle" size={16} color="#10b981" />
            <Text style={styles.successText}>
              Password updated successfully!
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={solarTheme.text.secondary}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                editable={!isPasswordLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Text style={styles.eyeText}>
                  {showCurrentPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password (min 6 characters)"
                placeholderTextColor={solarTheme.text.secondary}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                editable={!isPasswordLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Text style={styles.eyeText}>
                  {showNewPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={solarTheme.text.secondary}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!isPasswordLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.eyeText}>
                  {showConfirmPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              isPasswordLoading && styles.buttonDisabled,
              passwordUpdateSuccess && styles.buttonSuccess,
            ]}
            onPress={handlePasswordUpdate}
            disabled={isPasswordLoading}
          >
            <Text style={styles.buttonText}>
              {isPasswordLoading ? 'Updating...' : 'Update Password'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Info */}
      {profile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Account created:</Text>
            <Text style={styles.infoValue}>
              {profile.createdAt
                ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Not available'}
            </Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Last updated:</Text>
            <Text style={styles.infoValue}>
              {profile.updatedAt
                ? new Date(profile.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Not available'}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: solarTheme.background.main,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: solarTheme.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: solarTheme.text.secondary,
    lineHeight: 20,
  },
  section: {
    backgroundColor: solarTheme.background.card,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: solarTheme.text.primary,
    marginBottom: 16,
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
    // Chrome autofill fix
    ...Platform.select({
      web: {
        '&:-webkit-autofill': {
          WebkitBoxShadow: `0 0 0 1000px ${solarTheme.background.cardLight} inset`,
          WebkitTextFillColor: solarTheme.text.primary,
        },
        '&:-webkit-autofill:focus': {
          WebkitBoxShadow: `0 0 0 1000px ${solarTheme.background.cardLight} inset`,
          WebkitTextFillColor: solarTheme.text.primary,
        },
      },
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
  button: {
    backgroundColor: solarTheme.primary.main,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonSuccess: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  successText: {
    color: '#10b981',
    fontSize: 14,
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79, 211, 204, 0.1)',
  },
  infoLabel: {
    fontSize: 14,
    color: solarTheme.text.secondary,
  },
  infoValue: {
    fontSize: 14,
    color: solarTheme.text.primary,
    fontWeight: '500',
  },
});

export default AccountSettings;
