import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import SettingsSection from './SettingsSection';
import StatusBanner from './StatusBanner';
import PremiumField from '../../premium/PremiumField';
import PremiumButton from '../../premium/PremiumButton';
import PremiumModal from '../../premium/PremiumModal';
import { premiumTheme } from '../../../theme/premiumTheme';
import {
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
  UserProfile,
  UpdateProfileData,
  UpdatePasswordData,
} from '../../../services/accountApiService';
import { loginUserAction } from '../../../redux/authSlice';

/**
 * Account card — shows profile summary with modal-based editing for
 * profile (username/email) and password.
 */
export default function AccountCard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.auth);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data: UserProfile = await getUserProfile();
        setUsername(data.username);
        setEmail(data.email);
      } catch (e: any) {
        setLoadError(e.message || 'Failed to load profile');
      }
    })();
  }, []);

  /* ---------- profile edit modal ---------- */
  const [pUsername, setPUsername] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pLoading, setPLoading] = useState(false);
  const [pError, setPError] = useState<string | null>(null);

  const openProfile = () => {
    setPUsername(username);
    setPEmail(email);
    setPError(null);
    setProfileOpen(true);
  };

  const saveProfile = async () => {
    setPError(null);
    if (!pUsername.trim() || !pEmail.trim()) {
      setPError('Username and email are required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(pEmail)) {
      setPError('Please enter a valid email address');
      return;
    }
    try {
      setPLoading(true);
      const payload: UpdateProfileData = {
        username: pUsername.trim(),
        email: pEmail.trim(),
      };
      const updated = await updateUserProfile(payload);
      setUsername(updated.username);
      setEmail(updated.email);
      if (user && user.token) {
        dispatch(
          loginUserAction({
            ...user,
            username: updated.username,
            email: updated.email,
          })
        );
      }
      setProfileOpen(false);
    } catch (e: any) {
      setPError(e.message || 'Failed to update profile');
    } finally {
      setPLoading(false);
    }
  };

  /* ---------- password modal ---------- */
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const openPassword = () => {
    setCurPw('');
    setNewPw('');
    setConfirmPw('');
    setPwError(null);
    setPasswordOpen(true);
  };

  const savePassword = async () => {
    setPwError(null);
    if (!curPw || !newPw || !confirmPw) {
      setPwError('All password fields are required');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('New password and confirmation do not match');
      return;
    }
    if (newPw.length < 6) {
      setPwError('New password must be at least 6 characters long');
      return;
    }
    try {
      setPwLoading(true);
      const payload: UpdatePasswordData = {
        currentPassword: curPw,
        newPassword: newPw,
      };
      await updateUserPassword(payload);
      setPasswordOpen(false);
    } catch (e: any) {
      setPwError(e.message || 'Failed to update password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <SettingsSection
      icon="user"
      gradient={premiumTheme.energy.gradient}
      title="Account"
      subtitle="Your profile and password"
    >
      {loadError ? <StatusBanner kind="error" message={loadError} /> : null}

      <View style={styles.rows}>
        <InfoRow icon="user" label="Username" value={username || '—'} />
        <InfoRow icon="envelope" label="Email" value={email || '—'} />
        <InfoRow icon="lock" label="Password" value="••••••••" last />
      </View>

      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <PremiumButton label="Edit profile" icon="pen" variant="ghost" onPress={openProfile} />
        </View>
        <View style={{ flex: 1 }}>
          <PremiumButton
            label="Change password"
            icon="key"
            variant="ghost"
            onPress={openPassword}
          />
        </View>
      </View>

      {/* Edit profile modal */}
      <PremiumModal
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
        icon="user-edit"
        gradient={premiumTheme.energy.gradient}
        title="Edit profile"
        subtitle="Update your username and email"
      >
        {pError ? <StatusBanner kind="error" message={pError} /> : null}
        <PremiumField
          label="USERNAME"
          icon="user"
          value={pUsername}
          onChangeText={setPUsername}
          placeholder="Enter your username"
          autoCapitalize="none"
          editable={!pLoading}
        />
        <PremiumField
          label="EMAIL"
          icon="envelope"
          value={pEmail}
          onChangeText={setPEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!pLoading}
        />
        <View style={styles.modalActions}>
          <View style={{ flex: 1 }}>
            <PremiumButton
              label="Cancel"
              variant="ghost"
              onPress={() => setProfileOpen(false)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PremiumButton label="Save" icon="check" onPress={saveProfile} loading={pLoading} />
          </View>
        </View>
      </PremiumModal>

      {/* Change password modal */}
      <PremiumModal
        visible={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        icon="shield-alt"
        gradient={premiumTheme.accent.gradient}
        title="Change password"
        subtitle="Choose a new account password"
      >
        {pwError ? <StatusBanner kind="error" message={pwError} /> : null}
        <PremiumField
          label="CURRENT PASSWORD"
          icon="key"
          secure
          value={curPw}
          onChangeText={setCurPw}
          placeholder="Enter current password"
          autoCapitalize="none"
          editable={!pwLoading}
        />
        <PremiumField
          label="NEW PASSWORD"
          icon="lock"
          secure
          value={newPw}
          onChangeText={setNewPw}
          placeholder="At least 6 characters"
          autoCapitalize="none"
          editable={!pwLoading}
        />
        <PremiumField
          label="CONFIRM NEW PASSWORD"
          icon="lock"
          secure
          value={confirmPw}
          onChangeText={setConfirmPw}
          placeholder="Re-enter new password"
          autoCapitalize="none"
          editable={!pwLoading}
        />
        <View style={styles.modalActions}>
          <View style={{ flex: 1 }}>
            <PremiumButton
              label="Cancel"
              variant="ghost"
              onPress={() => setPasswordOpen(false)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PremiumButton
              label="Update"
              icon="check"
              gradient={premiumTheme.accent.gradient}
              onPress={savePassword}
              loading={pwLoading}
            />
          </View>
        </View>
      </PremiumModal>
    </SettingsSection>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: React.ComponentProps<typeof FontAwesome5>['name'];
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <View style={styles.rowIcon}>
        <FontAwesome5 name={icon} size={13} color={premiumTheme.text.muted} solid />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rows: { marginBottom: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: premiumTheme.glass.border,
  },
  rowIcon: { width: 18, alignItems: 'center' },
  rowLabel: {
    fontSize: 13.5,
    color: premiumTheme.text.muted,
    fontWeight: '600',
    width: 92,
  },
  rowValue: {
    flex: 1,
    fontSize: 14.5,
    color: premiumTheme.text.primary,
    fontWeight: '700',
    textAlign: 'right',
  },
  actions: { flexDirection: 'row', gap: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
});
