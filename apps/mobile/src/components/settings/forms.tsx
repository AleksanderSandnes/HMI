import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, View } from "react-native";

import type { useCore } from "../../lib/useCore";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { StatusBanner } from "../ui/StatusBanner";
import type { IconRender } from "../ui/types";

type Core = ReturnType<typeof useCore>;
type Banner = { kind: "success" | "error"; message: string } | null;

const mail: IconRender = (p) => <Ionicons name="mail-outline" {...p} />;
const user: IconRender = (p) => <Ionicons name="person-outline" {...p} />;
const keyIc: IconRender = (p) => <Ionicons name="key-outline" {...p} />;
const pin: IconRender = (p) => <Ionicons name="location-outline" {...p} />;
const sun: IconRender = (p) => <Ionicons name="sunny-outline" {...p} />;

export function ConfiguredBadge({ on }: { on: boolean }) {
  return (
    <View
      className={`rounded-pill px-2.5 py-1 ${on ? "bg-[rgba(52,211,153,0.13)]" : "bg-glass-fill"}`}
    >
      <Text className={`text-[11px] font-bold ${on ? "text-positive" : "text-text-muted"}`}>
        {on ? "Connected" : "Not set"}
      </Text>
    </View>
  );
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
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setBanner(null);
    setSaving(true);
    try {
      await account.updateUserProfile({ username, email });
      setBanner({ kind: "success", message: "Profile updated." });
    } catch (e) {
      setBanner({ kind: "error", message: e instanceof Error ? e.message : "Could not update." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
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
      <Button label="Save profile" onPress={save} loading={saving} className="w-full" />
    </>
  );
}

export function PasswordForm({ account }: { account: Core["account"] }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setBanner(null);
    if (pw.length < 4)
      return setBanner({ kind: "error", message: "Password must be at least 4 characters." });
    if (pw !== confirm) return setBanner({ kind: "error", message: "Passwords do not match." });
    setSaving(true);
    try {
      await account.updateUserPassword({ currentPassword: "", newPassword: pw });
      setBanner({ kind: "success", message: "Password changed." });
      setPw("");
      setConfirm("");
    } catch (e) {
      setBanner({ kind: "error", message: e instanceof Error ? e.message : "Could not change." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {banner ? <StatusBanner kind={banner.kind} message={banner.message} /> : null}
      <Field label="NEW PASSWORD" icon={keyIc} secure value={pw} onChangeText={setPw} />
      <Field
        label="CONFIRM PASSWORD"
        icon={keyIc}
        secure
        value={confirm}
        onChangeText={setConfirm}
      />
      <Text className="mb-3 -mt-1 text-[11.5px] text-text-muted">
        Use at least 4 characters. Choose something you don&apos;t use elsewhere.
      </Text>
      <Button label="Change password" onPress={save} loading={saving} className="w-full" />
    </>
  );
}

export function GrowattForm({
  initialEmail,
  settings,
  onSaved,
}: {
  initialEmail: string;
  settings: Core["settings"];
  onSaved: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setBanner(null);
    setSaving(true);
    try {
      await settings.saveGrowattApiSettings({ growatt: { email, password } });
      setBanner({ kind: "success", message: "Growatt credentials saved." });
      setPassword("");
      onSaved();
    } catch (e) {
      setBanner({ kind: "error", message: e instanceof Error ? e.message : "Could not save." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
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
      <Button
        label="Save Growatt credentials"
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
  settings,
  onSaved,
}: {
  initialStationId: string;
  settings: Core["settings"];
  onSaved: () => void;
}) {
  const [stationId, setStationId] = useState(initialStationId);
  const [apiKey, setApiKey] = useState("");
  const [banner, setBanner] = useState<Banner>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setBanner(null);
    setSaving(true);
    try {
      await settings.saveWeatherApiSettings({ weather: { stationId, apiKey } });
      setBanner({ kind: "success", message: "Weather credentials saved." });
      setApiKey("");
      onSaved();
    } catch (e) {
      setBanner({ kind: "error", message: e instanceof Error ? e.message : "Could not save." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
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
      <Button label="Save weather credentials" onPress={save} loading={saving} className="w-full" />
    </>
  );
}
