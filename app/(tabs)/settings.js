import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome';
import { solarTheme } from '../theme/solarTheme';
import { useResponsive } from '../utils/responsive';
import CredentialsSettings from '../components/settings/CredentialsSettings';
import WeatherCredentialsSettings from '../components/settings/WeatherCredentialsSettings';
import AccountSettings from '../components/settings/AccountSettings';
import {
  selectDataMode,
  selectSettingsLoading,
  selectSettingsError,
  saveDataMode,
  loadSettings,
} from '../(redux)/settingsSlice';
import { logoutAction } from '../(redux)/authSlice';

const Settings = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const currentDataMode = useSelector(selectDataMode);
  const isLoading = useSelector(selectSettingsLoading);
  const error = useSelector(selectSettingsError);
  const { user } = useSelector((state) => state.auth); // Add user selector for debugging
  const { isMobile, isTablet, getResponsiveValue } = useResponsive();

  // State for managing expanded sections - all closed by default
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedSubSection, setExpandedSubSection] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log('[Settings] Component mounted');
    console.log('[Settings] Current data mode:', currentDataMode);
    console.log('[Settings] Is loading:', isLoading);
    console.log('[Settings] Error:', error);
    console.log('[Settings] Is mobile:', isMobile);
    console.log('[Settings] User state:', user);
    console.log('[Settings] User token:', user?.token);

    // Ensure settings are loaded
    dispatch(loadSettings());
  }, [dispatch]);

  // Debug logging when user state changes
  useEffect(() => {
    console.log('[Settings] User state changed:', user);
    if (user) {
      console.log('[Settings] User ID:', user.id);
      console.log('[Settings] User email:', user.email);
      console.log('[Settings] Has token:', !!user.token);
    }
  }, [user]);

  // Debug logging when state changes
  useEffect(() => {
    console.log('[Settings] Data mode changed to:', currentDataMode);
  }, [currentDataMode]);

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const toggleSubSection = (subSectionId) => {
    console.log('[Settings] Toggling sub-section:', subSectionId);
    console.log('[Settings] Current expanded sub-section:', expandedSubSection);
    setExpandedSubSection(
      expandedSubSection === subSectionId ? null : subSectionId
    );
  };

  const handleCredentialsChange = () => {
    console.log('[Settings] API credentials updated');
  };

  const handleAccountChange = () => {
    console.log('[Settings] Account updated');
  };

  const handleLogout = () => {
    const logoutConfirm = () => {
      console.log('[Settings] User logging out');
      dispatch(logoutAction());
      // Force a hard navigation to break out of tabs
      if (typeof window !== 'undefined') {
        // On web, use window location to force navigation
        window.location.href = '/';
      } else {
        // On mobile, use router
        router.push('/');
      }
    };

    if (Platform.OS === 'web') {
      // Use confirm dialog on web
      const confirmed = window.confirm(
        'Are you sure you want to logout?\n\nYou will be redirected to the home page.'
      );

      if (confirmed) {
        logoutConfirm();
      }
    } else {
      // Use Alert on mobile
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?\n\nYou will be redirected to the home page.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => console.log('[Settings] User cancelled logout'),
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: logoutConfirm,
          },
        ]
      );
    }
  };

  const dataModes = [
    {
      value: 'production',
      label: 'Production Mode',
      description: 'Live data from production API',
      icon: 'cloud',
      color: '#10b981',
      subtitle: 'Real production data from render.com API',
    },
    {
      value: 'development',
      label: 'Development Mode',
      description: 'Data from local development API',
      icon: 'code',
      color: '#f59e0b',
      subtitle: 'Local Growatt API for development testing',
    },
  ];

  const handleDataModeChange = (newMode) => {
    console.log('[Settings] Attempting to change data mode to:', newMode);
    console.log('[Settings] Current data mode:', currentDataMode);
    console.log('[Settings] Are they the same?', newMode === currentDataMode);

    if (newMode === currentDataMode) {
      console.log('[Settings] Same mode selected, ignoring');
      return;
    }

    const selectedMode = dataModes.find((m) => m.value === newMode);
    console.log('[Settings] Selected mode object:', selectedMode);

    if (Platform.OS === 'web') {
      console.log('[Settings] Platform is web, showing confirm dialog');
      // Use confirm dialog on web
      const confirmed = window.confirm(
        `Switch to ${selectedMode?.label}?\n\nThis will change how the app fetches solar power data.`
      );

      console.log('[Settings] User response to confirm:', confirmed);
      if (confirmed) {
        console.log('[Settings] User confirmed mode change via web dialog');
        console.log('[Settings] Dispatching saveDataMode with:', newMode);
        dispatch(saveDataMode(newMode));
      }
    } else {
      // Use Alert on mobile
      Alert.alert(
        'Change Data Mode',
        `Switch to ${selectedMode?.label}?\n\nThis will change how the app fetches solar power data.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => console.log('[Settings] User cancelled mode change'),
          },
          {
            text: 'Change',
            onPress: () => {
              console.log(
                '[Settings] User confirmed mode change via mobile alert'
              );
              dispatch(saveDataMode(newMode));
            },
          },
        ]
      );
    }
  };

  const renderDataModeOption = (mode) => {
    const isSelected = currentDataMode === mode.value;

    return (
      <TouchableOpacity
        key={mode.value}
        style={[
          styles.dataModeOption,
          isSelected && styles.dataModeOptionActive,
        ]}
        onPress={() => {
          console.log('[Settings] Data mode option pressed:', mode.value);
          handleDataModeChange(mode.value);
        }}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <View style={styles.dataModeHeader}>
          <View style={[styles.dataModeIcon, { backgroundColor: mode.color }]}>
            <Icon name={mode.icon} size={isMobile ? 16 : 20} color="#ffffff" />
          </View>
          <View style={styles.dataModeContent}>
            <Text style={styles.dataModeLabel}>{mode.label}</Text>
            <Text style={styles.dataModeSubtitle}>{mode.subtitle}</Text>
          </View>
          {isSelected && (
            <Icon
              name="check-circle"
              size={isMobile ? 20 : 24}
              color={mode.color}
            />
          )}
        </View>
        <Text style={styles.dataModeDescription}>{mode.description}</Text>
      </TouchableOpacity>
    );
  };

  const renderSection = (sectionId, title, icon, iconColor, children) => {
    const isExpanded = expandedSection === sectionId;

    return (
      <View style={styles.section} key={sectionId}>
        <TouchableOpacity
          style={[
            styles.sectionHeader,
            isExpanded && styles.sectionHeaderExpanded,
          ]}
          onPress={() => toggleSection(sectionId)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIcon, { backgroundColor: iconColor }]}>
              <Icon name={icon} size={isMobile ? 16 : 18} color="#ffffff" />
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          <Icon
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={isMobile ? 16 : 18}
            color={solarTheme.text.secondary}
          />
        </TouchableOpacity>

        {isExpanded && <View style={styles.sectionContent}>{children}</View>}
      </View>
    );
  };

  const styles = createStyles(isMobile, isTablet);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Configure your solar dashboard preferences
          </Text>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Icon name="exclamation-triangle" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* API Credentials Section */}
        {renderSection(
          'api-credentials',
          'API Credentials',
          'key',
          '#10b981',
          <View>
            <Text style={styles.sectionDescription}>
              Configure your API credentials for secure data access
            </Text>

            {/* Growatt API Credentials */}
            <CredentialsSettings
              onCredentialsChange={handleCredentialsChange}
            />

            {/* Weather.com API Credentials */}
            <WeatherCredentialsSettings
              onCredentialsChange={handleCredentialsChange}
            />
          </View>
        )}

        {/* Data Source Settings */}
        {renderSection(
          'data-source',
          'Data Source',
          'database',
          '#3b82f6',
          <View>
            <Text style={styles.sectionDescription}>
              Choose how the app fetches solar power data. Each mode uses only
              its designated source with no fallbacks.
            </Text>

            {dataModes.map(renderDataModeOption)}

            <View style={styles.warningContainer}>
              <Icon name="info-circle" size={16} color="#f59e0b" />
              <Text style={styles.warningText}>
                Changes take effect immediately. Make sure your selected data
                source is available.
              </Text>
            </View>
          </View>
        )}

        {/* Application Settings */}
        {renderSection(
          'application',
          'Application',
          'cog',
          '#8b5cf6',
          <View>
            <Text style={styles.sectionDescription}>
              Manage your account, notifications, privacy settings and app
              information
            </Text>
            <TouchableOpacity
              style={styles.option}
              onPress={() => toggleSubSection('account')}
            >
              <View style={styles.optionIconContainer}>
                <Icon name="user" size={isMobile ? 18 : 22} color="#4caf50" />
              </View>
              <Text style={styles.optionText}>Account</Text>
              <Icon
                name={
                  expandedSubSection === 'account'
                    ? 'angle-down'
                    : 'angle-right'
                }
                size={isMobile ? 18 : 22}
                color="#999"
                style={styles.optionIcon}
              />
            </TouchableOpacity>

            {/* Account Settings Component */}
            {expandedSubSection === 'account' && (
              <View style={styles.expandedContent}>
                <AccountSettings onAccountChange={handleAccountChange} />
              </View>
            )}

            <TouchableOpacity style={styles.option}>
              <View style={styles.optionIconContainer}>
                <Icon name="bell" size={isMobile ? 18 : 22} color="#ff9800" />
              </View>
              <Text style={styles.optionText}>Notifications</Text>
              <Icon
                name="angle-right"
                size={isMobile ? 18 : 22}
                color="#999"
                style={styles.optionIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.option}>
              <View style={styles.optionIconContainer}>
                <Icon name="lock" size={isMobile ? 18 : 22} color="#f44336" />
              </View>
              <Text style={styles.optionText}>Privacy</Text>
              <Icon
                name="angle-right"
                size={isMobile ? 18 : 22}
                color="#999"
                style={styles.optionIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.option}>
              <View style={styles.optionIconContainer}>
                <Icon
                  name="info-circle"
                  size={isMobile ? 18 : 22}
                  color="#3f51b5"
                />
              </View>
              <Text style={styles.optionText}>About</Text>
              <Icon
                name="angle-right"
                size={isMobile ? 18 : 22}
                color="#999"
                style={styles.optionIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={handleLogout}>
              <View style={styles.optionIconContainer}>
                <Icon
                  name="sign-out"
                  size={isMobile ? 18 : 22}
                  color="#e91e63"
                />
              </View>
              <Text style={styles.optionText}>Logout</Text>
              <Icon
                name="angle-right"
                size={isMobile ? 18 : 22}
                color="#999"
                style={styles.optionIcon}
              />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Create responsive styles
const createStyles = (isMobile, isTablet) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: solarTheme.background.main,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40, // Normal padding without save button
    },
    header: {
      paddingTop: isMobile ? 50 : 60,
      paddingHorizontal: 20,
      paddingBottom: 20,
      backgroundColor: solarTheme.background.card,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(79, 211, 204, 0.2)',
    },
    headerTitle: {
      fontSize: isMobile ? 32 : 36,
      fontWeight: 'bold',
      color: solarTheme.text.primary,
      textAlign: 'center',
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: isMobile ? 14 : 16,
      color: solarTheme.text.secondary,
      textAlign: 'center',
      lineHeight: isMobile ? 20 : 22,
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 20,
      marginTop: 20,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    errorText: {
      color: '#ef4444',
      fontSize: 14,
      marginLeft: 8,
      flex: 1,
    },
    section: {
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 8,
      backgroundColor: solarTheme.background.card,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(79, 211, 204, 0.2)',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      backgroundColor: solarTheme.background.card,
    },
    sectionHeaderExpanded: {
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(79, 211, 204, 0.2)',
    },
    sectionHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    sectionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    sectionTitle: {
      fontSize: isMobile ? 18 : 20,
      fontWeight: '600',
      color: solarTheme.text.primary,
      flex: 1,
    },
    sectionContent: {
      padding: 20,
      paddingTop: 0,
    },
    sectionDescription: {
      fontSize: isMobile ? 13 : 14,
      color: solarTheme.text.secondary,
      marginTop: 16,
      marginBottom: 20,
      lineHeight: isMobile ? 18 : 20,
    },
    dataModeOption: {
      backgroundColor: solarTheme.background.cardLight,
      borderRadius: 12,
      padding: isMobile ? 16 : 18,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    dataModeOptionActive: {
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.05)',
    },
    dataModeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    dataModeIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    dataModeContent: {
      flex: 1,
    },
    dataModeLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: solarTheme.text.primary,
      marginBottom: 2,
    },
    dataModeSubtitle: {
      fontSize: 12,
      color: solarTheme.text.secondary,
    },
    dataModeDescription: {
      fontSize: 14,
      color: solarTheme.text.tertiary,
      lineHeight: 18,
    },
    warningContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    warningText: {
      color: '#f59e0b',
      fontSize: isMobile ? 12 : 13,
      marginLeft: 8,
      flex: 1,
      lineHeight: 16,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: isMobile ? 16 : 18,
      paddingHorizontal: 0,
      borderRadius: 12,
      backgroundColor: solarTheme.background.cardLight,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(79, 211, 204, 0.2)',
    },
    optionIconContainer: {
      width: isMobile ? 24 : 28,
      height: isMobile ? 24 : 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 16,
    },
    optionText: {
      flex: 1,
      fontSize: isMobile ? 15 : 16,
      marginLeft: 16,
      color: solarTheme.text.primary,
      fontWeight: '500',
    },
    optionIcon: {
      marginRight: 16,
    },
    expandedContent: {
      backgroundColor: solarTheme.background.main,
      borderRadius: 12,
      marginTop: 8,
      marginBottom: 24,
      overflow: 'hidden',
    },
  });

export default Settings;
