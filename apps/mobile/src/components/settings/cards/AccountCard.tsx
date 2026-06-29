import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import SettingsSection from './SettingsSection';
import StatusBanner from './StatusBanner';
import Field from '../../ui/Field';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { theme } from '../../../theme/theme';
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
export default function AccountCard({
  refreshSignal,
}: {
  refreshSignal?: number;
}) {
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
  }, [refreshSignal]);

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
      gradient={theme.energy.gradient}
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
          <Button label="Edit profile" icon="pen" variant="ghost" onPress={openProfile} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Change password"
            icon="key"
            variant="ghost"
            onPress={openPassword}
          />
        </View>
      </View>

      {/* Edit profile modal */}
      <Modal
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
        icon="user-edit"
        gradient={theme.energy.gradient}
        title="Edit profile"
        subtitle="Update your username and email"
      >
        {pError ? <StatusBanner kind="error" message={pError} /> : null}
        <Field
          label="USERNAME"
          icon="user"
          value={pUsername}
          onChangeText={setPUsername}
          placeholder="Enter your username"
          autoCapitalize="none"
          editable={!pLoading}
        />
        <Field
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
            <Button
              label="Cancel"
              variant="ghost"
              onPress={() => setProfileOpen(false)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Save" icon="check" onPress={saveProfile} loading={pLoading} />
          </View>
        </View>
      </Modal>

      {/* Change password modal */}
      <Modal
        visible={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        icon="shield-alt"
        gradient={theme.accent.gradient}
        title="Change password"
        subtitle="Choose a new account password"
      >
        {pwError ? <StatusBanner kind="error" message={pwError} /> : null}
        <Field
          label="CURRENT PASSWORD"
          icon="key"
          secure
          value={curPw}
          onChangeText={setCurPw}
          placeholder="Enter current password"
          autoCapitalize="none"
          editable={!pwLoading}
        />
        <Field
          label="NEW PASSWORD"
          icon="lock"
          secure
          value={newPw}
          onChangeText={setNewPw}
          placeholder="At least 6 characters"
          autoCapitalize="none"
          editable={!pwLoading}
        />
        <Field
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
            <Button
              label="Cancel"
              variant="ghost"
              onPress={() => setPasswordOpen(false)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Update"
              icon="check"
              gradient={theme.accent.gradient}
              onPress={savePassword}
              loading={pwLoading}
            />
          </View>
        </View>
      </Modal>
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
        <FontAwesome5 name={icon} size={13} color={theme.text.muted} solid />
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
    borderBottomColor: theme.glass.border,
  },
  rowIcon: { width: 18, alignItems: 'center' },
  rowLabel: {
    fontSize: 13.5,
    color: theme.text.muted,
    fontWeight: '600',
    width: 92,
  },
  rowValue: {
    flex: 1,
    fontSize: 14.5,
    color: theme.text.primary,
    fontWeight: '700',
    textAlign: 'right',
  },
  actions: { flexDirection: 'row', gap: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
});
