import { Ionicons } from "@expo/vector-icons";
import type { AvatarUpload, Translator } from "@hmi/core";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { GRADIENTS, type StatGradient } from "../../lib/gradients";
import { useI18n } from "../../lib/i18n";
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

type SetAvatar = (upload: AvatarUpload) => Promise<void>;

/** Map a file extension to its image MIME type. */
function mimeFromExtension(ext: string): string {
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

/** Convert a picked expo-image-picker asset into an `AvatarUpload`. */
async function assetToUpload(asset: ImagePicker.ImagePickerAsset): Promise<AvatarUpload> {
  const source = asset.fileName ?? asset.uri;
  const rawExt = source.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "";
  const extension = rawExt === "jpeg" ? "jpg" : rawExt || "jpg";
  const contentType = asset.mimeType ?? mimeFromExtension(extension);
  const arrayBuffer = await (await fetch(asset.uri)).arrayBuffer();
  return { data: new Uint8Array(arrayBuffer), contentType, extension };
}

async function fromLibrary(setAvatar: SetAvatar) {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return;
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], ...PICKER_OPTS });
  const asset = res.canceled ? null : res.assets[0];
  if (asset) await setAvatar(await assetToUpload(asset));
}

async function fromCamera(setAvatar: SetAvatar) {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return;
  const res = await ImagePicker.launchCameraAsync(PICKER_OPTS);
  const asset = res.canceled ? null : res.assets[0];
  if (asset) await setAvatar(await assetToUpload(asset));
}

function chooseAvatar(setAvatar: SetAvatar, t: Translator) {
  Alert.alert(t("settings.profilePicture"), undefined, [
    { text: t("settings.takePhoto"), onPress: () => void fromCamera(setAvatar) },
    { text: t("settings.chooseFromLibrary"), onPress: () => void fromLibrary(setAvatar) },
    { text: t("common.cancel"), style: "cancel" },
  ]);
}

export function ConfiguredBadge({ on }: { on: boolean }) {
  const { t } = useI18n();
  return (
    <View
      className={`rounded-pill px-2.5 py-1 ${on ? "bg-[rgba(52,211,153,0.13)]" : "bg-glass-fill"}`}
    >
      <Text className={`text-[10.5px] font-extrabold ${on ? "text-positive" : "text-text-muted"}`}>
        {on ? t("settings.connected") : t("settings.notSet")}
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
  const { t } = useI18n();
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setBanner(null);
    setSaving(true);
    try {
      await run();
      setBanner({ kind: "success", message: t("settings.saved") });
    } catch (e) {
      setBanner({
        kind: "error",
        message: e instanceof Error ? e.message : t("settings.couldNotSave"),
      });
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
  const { t } = useI18n();
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const { uri, setAvatar } = useAvatar();
  const { banner, saving, save } = useSaver(async () => {
    await account.updateUserProfile({ username, email });
  });

  return (
    <>
      <View className="items-center">
        <Pressable
          onPress={() => chooseAvatar(setAvatar, t)}
          accessibilityLabel={t("a11y.changePhoto")}
        >
          <Avatar initials={deriveInitials(username)} uri={uri} size={84} />
          <View className="absolute -bottom-0.5 -right-0.5 h-7 w-7 items-center justify-center rounded-pill border-[3px] border-bg-base bg-solar">
            <Ionicons name="pencil" size={13} color="#0a1124" />
          </View>
        </Pressable>
      </View>

      <GlassCard strong className="gap-1 p-[18px]">
        {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
        <Field
          label={t("settings.usernameLabel")}
          icon={user}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <Field
          label={t("settings.emailLabel")}
          icon={mail}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </GlassCard>

      <Button
        label={t("settings.saveProfile")}
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
  const { t } = useI18n();
  if (!pw) return null;
  const s = pwStrength(pw);
  const label = [
    "",
    t("settings.pwWeak"),
    t("settings.pwFair"),
    t("settings.pwGood"),
    t("settings.pwStrong"),
  ][s];
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
  const { t } = useI18n();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const { banner, saving, save } = useSaver(async () => {
    if (pw.length < 4) throw new Error(t("validation.passwordMin"));
    if (pw !== confirm) throw new Error(t("settings.passwordsDoNotMatch"));
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
          name={t("settings.newPassword")}
          desc={t("settings.newPasswordDesc")}
        />
        {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
        <Field
          label={t("settings.newPasswordLabel")}
          icon={keyIc}
          secure
          value={pw}
          onChangeText={setPw}
        />
        <StrengthMeter pw={pw} />
        <Field
          label={t("settings.confirmPasswordLabel")}
          icon={keyIc}
          secure
          value={confirm}
          onChangeText={setConfirm}
        />
      </GlassCard>
      <Button
        label={t("settings.updatePassword")}
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
  const { t } = useI18n();
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
          name={t("settings.growattAccount")}
          desc={t("settings.growattAccountDesc")}
          connected={connected}
        />
        {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
        <Field
          label={t("settings.accountEmailLabel")}
          icon={mail}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <Field
          label={t("settings.passwordLabel")}
          icon={keyIc}
          secure
          placeholder={t("settings.enterToUpdate")}
          value={password}
          onChangeText={setPassword}
        />
      </GlassCard>
      <Button
        label={t("settings.saveCredentials")}
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
  const { t } = useI18n();
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
          name={t("settings.weatherStationName")}
          desc={t("settings.weatherStationDesc")}
          connected={connected}
        />
        {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
        <Field
          label={t("settings.stationIdLabel")}
          icon={pin}
          autoCapitalize="characters"
          placeholder={t("settings.stationIdPlaceholder")}
          value={stationId}
          onChangeText={setStationId}
        />
        <Field
          label={t("settings.apiKeyLabel")}
          icon={sun}
          secure
          placeholder={t("settings.enterToUpdate")}
          value={apiKey}
          onChangeText={setApiKey}
        />
      </GlassCard>
      <Button
        label={t("settings.saveCredentials")}
        gradient="solar"
        onPress={save}
        loading={saving}
        className="w-full"
      />
    </>
  );
}
