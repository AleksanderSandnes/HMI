import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { GRADIENTS, type StatGradient } from "../../lib/gradients";
import { hairline, useThemeColors } from "../../lib/theme";
import { useAvatar } from "../../lib/useAvatar";
import type { CoreApis } from "../../lib/useCore";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { GlassCard } from "../ui/GlassCard";
import { StatusBanner } from "../ui/StatusBanner";
import type { IconRender } from "../ui/types";

type Core = CoreApis;
type Banner = { kind: "success" | "error"; message: string } | null;

const mail: IconRender = (p) => <Ionicons name="mail-outline" {...p} />;
const user: IconRender = (p) => <Ionicons name="person-outline" {...p} />;
const keyIc: IconRender = (p) => <Ionicons name="key-outline" {...p} />;
const pin: IconRender = (p) => <Ionicons name="location-outline" {...p} />;
const sun: IconRender = (p) => <Ionicons name="sunny-outline" {...p} />;

function deriveInitials(name?: string | null): string {
  if (!name) return "·";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const PICKER_OPTS = { allowsEditing: true, aspect: [1, 1] as [number, number], quality: 0.6 };

type SetAvatar = (uri: string) => Promise<void>;

async function fromLibrary(setAvatar: SetAvatar) {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return;
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], ...PICKER_OPTS });
  const uri = res.canceled ? null : res.assets[0]?.uri;
  if (uri) await setAvatar(uri);
}

async function fromCamera(setAvatar: SetAvatar) {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return;
  const res = await ImagePicker.launchCameraAsync(PICKER_OPTS);
  const uri = res.canceled ? null : res.assets[0]?.uri;
  if (uri) await setAvatar(uri);
}

function chooseAvatar(setAvatar: SetAvatar) {
  Alert.alert("Profile picture", undefined, [
    { text: "Take photo", onPress: () => void fromCamera(setAvatar) },
    { text: "Choose from library", onPress: () => void fromLibrary(setAvatar) },
    { text: "Cancel", style: "cancel" },
  ]);
}

export function ConfiguredBadge({ on }: { on: boolean }) {
  return (
    <View
      className={`rounded-pill px-2.5 py-1 ${on ? "bg-[rgba(52,211,153,0.13)]" : "bg-glass-fill"}`}
    >
      <Text className={`text-[10.5px] font-extrabold ${on ? "text-positive" : "text-text-muted"}`}>
        {on ? "Connected" : "Not set"}
      </Text>
    </View>
  );
}

function IdentityRow({
  gradient,
  icon,
  name,
  desc,
  connected,
}: {
  gradient: StatGradient;
  icon: keyof typeof Ionicons.glyphMap;
  name: string;
  desc: string;
  connected?: boolean;
}) {
  return (
    <View className="mb-3 flex-row items-center gap-3">
      <LinearGradient
        colors={GRADIENTS[gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 42,
          height: 42,
          borderRadius: 13,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={20} color="#0a1124" />
      </LinearGradient>
      <View className="min-w-0 flex-1">
        <Text className="text-[15px] font-extrabold text-text-primary">{name}</Text>
        <Text className="mt-0.5 text-[11.5px] text-text-muted">{desc}</Text>
      </View>
      {connected !== undefined ? <ConfiguredBadge on={connected} /> : null}
    </View>
  );
}

function useSaver(run: () => Promise<void>) {
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setBanner(null);
    setSaving(true);
    try {
      await run();
      setBanner({ kind: "success", message: "Saved." });
    } catch (e) {
      setBanner({ kind: "error", message: e instanceof Error ? e.message : "Could not save." });
    } finally {
      setSaving(false);
    }
  };
  return { banner, saving, save };
}

export function AccountForm({
  username: initialUsername,
  email: initialEmail,
  account,
}: {
  username: string;
  email: string;
  account: Core["account"];
}) {
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const { uri, setAvatar } = useAvatar();
  const { banner, saving, save } = useSaver(async () => {
    await account.updateUserProfile({ username, email });
  });

  return (
    <>
      <View className="items-center">
        <Pressable onPress={() => chooseAvatar(setAvatar)} accessibilityLabel="Change photo">
          <Avatar initials={deriveInitials(username)} uri={uri} size={84} />
          <View className="absolute -bottom-0.5 -right-0.5 h-7 w-7 items-center justify-center rounded-pill border-[3px] border-bg-base bg-solar">
            <Ionicons name="pencil" size={13} color="#0a1124" />
          </View>
        </Pressable>
      </View>

      <GlassCard strong className="gap-1 p-[18px]">
        {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
        <Field
          label="USERNAME"
          icon={user}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <Field
          label="EMAIL"
          icon={mail}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </GlassCard>

      <Button
        label="Save profile"
        gradient="accent"
        onPress={save}
        loading={saving}
        className="w-full"
      />
    </>
  );
}

function pwStrength(pw: string): number {
  let s = 0;
  if (pw.length >= 4) s++;
  if (pw.length >= 8) s++;
  if (/[0-9]/.test(pw) && /[a-zA-Z]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

function StrengthMeter({ pw }: { pw: string }) {
  const { mode, colors } = useThemeColors();
  if (!pw) return null;
  const s = pwStrength(pw);
  const label = ["", "Weak", "Fair", "Good", "Strong"][s];
  const color = s >= 3 ? colors.energyTint : colors.solarTint;
  return (
    <View className="-mt-2 mb-3">
      <View className="flex-row gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className="h-1 flex-1 rounded-pill"
            style={{ backgroundColor: i < s ? color : hairline(mode, 0.12) }}
          />
        ))}
      </View>
      <Text className="mt-1.5 text-[9.5px] font-extrabold" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

export function PasswordForm({ account }: { account: Core["account"] }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const { banner, saving, save } = useSaver(async () => {
    if (pw.length < 4) throw new Error("Password must be at least 4 characters.");
    if (pw !== confirm) throw new Error("Passwords do not match.");
    await account.updateUserPassword({ currentPassword: "", newPassword: pw });
    setPw("");
    setConfirm("");
  });

  return (
    <>
      <GlassCard strong className="gap-1 p-[18px]">
        <IdentityRow
          gradient="revenue"
          icon="shield-checkmark"
          name="New password"
          desc="Use one you don't reuse elsewhere"
        />
        {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
        <Field label="NEW PASSWORD" icon={keyIc} secure value={pw} onChangeText={setPw} />
        <StrengthMeter pw={pw} />
        <Field
          label="CONFIRM PASSWORD"
          icon={keyIc}
          secure
          value={confirm}
          onChangeText={setConfirm}
        />
      </GlassCard>
      <Button
        label="Update password"
        gradient="revenue"
        onPress={save}
        loading={saving}
        className="w-full"
      />
    </>
  );
}

export function GrowattForm({
  initialEmail,
  connected,
  settings,
  onSaved,
}: {
  initialEmail: string;
  connected: boolean;
  settings: Core["settings"];
  onSaved: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const { banner, saving, save } = useSaver(async () => {
    await settings.saveGrowattApiSettings({ growatt: { email, password } });
    setPassword("");
    onSaved();
  });

  return (
    <>
      <GlassCard strong className="gap-1 p-[18px]">
        <IdentityRow
          gradient="energy"
          icon="sunny"
          name="Growatt account"
          desc="Used to fetch your solar data"
          connected={connected}
        />
        {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
        <Field
          label="ACCOUNT (EMAIL)"
          icon={mail}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <Field
          label="PASSWORD"
          icon={keyIc}
          secure
          placeholder="Enter to update"
          value={password}
          onChangeText={setPassword}
        />
      </GlassCard>
      <Button
        label="Save credentials"
        gradient="energy"
        onPress={save}
        loading={saving}
        className="w-full"
      />
    </>
  );
}

export function WeatherForm({
  initialStationId,
  connected,
  settings,
  onSaved,
}: {
  initialStationId: string;
  connected: boolean;
  settings: Core["settings"];
  onSaved: () => void;
}) {
  const [stationId, setStationId] = useState(initialStationId);
  const [apiKey, setApiKey] = useState("");
  const { banner, saving, save } = useSaver(async () => {
    await settings.saveWeatherApiSettings({ weather: { stationId, apiKey } });
    setApiKey("");
    onSaved();
  });

  return (
    <>
      <GlassCard strong className="gap-1 p-[18px]">
        <IdentityRow
          gradient="solar"
          icon="cloud"
          name="Weather station"
          desc="Personal weather data source"
          connected={connected}
        />
        {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
        <Field
          label="WEATHER STATION ID"
          icon={pin}
          autoCapitalize="characters"
          placeholder="e.g. ISANDN24"
          value={stationId}
          onChangeText={setStationId}
        />
        <Field
          label="API KEY"
          icon={sun}
          secure
          placeholder="Enter to update"
          value={apiKey}
          onChangeText={setApiKey}
        />
      </GlassCard>
      <Button
        label="Save credentials"
        gradient="solar"
        onPress={save}
        loading={saving}
        className="w-full"
      />
    </>
  );
}
