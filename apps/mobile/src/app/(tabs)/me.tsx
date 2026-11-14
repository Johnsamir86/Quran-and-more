import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Link } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, Switch, TextInput, View } from "react-native";

import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useFamily } from "@/lib/family";
import { useI18n } from "@/lib/i18n";
import { requestNotificationPermission } from "@/lib/azan";
import { sendTestNotification } from "@/lib/notifications";
import { useNotificationPrefs } from "@/lib/prefs";
import { useEntitlements } from "@/lib/purchases";
import { Body, Button, Card, Chip, H1, H2, Kicker, LanguagePicker, Muted, Pill, Row, Screen, SourcesBadge, ThemePicker, usePalette } from "@/lib/ui";

type IconName = keyof typeof Ionicons.glyphMap;

/** Me: who is using the app, how it looks, how it speaks, when it notifies, the account and the purchases. */
export default function MeScreen() {
  const c = usePalette();
  const { m, locale } = useI18n();
  const t = m.settings;
  const { profile, state } = useFamily();
  const auth = useAuth();
  const { prefs, update } = useNotificationPrefs();
  const ent = useEntitlements();
  const [email, setEmail] = useState("");
  const [authMsg, setAuthMsg] = useState<string | null>(null);
  const version = Constants.expoConfig?.version ?? "1.0.0";

  const signIn = async (p: "apple" | "google" | "email" | "quran") => {
    const r = await auth.signIn(p, email || undefined);
    setAuthMsg(r === "sent" ? t.magicLinkSent : r === "unavailable" ? t.signInUnavailable : r === "failed" ? m.common.unavailable : null);
  };

  const Section = ({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) => (
    <Card>
      <Row style={{ gap: 8 }}><Ionicons name={icon} size={18} color={c.accent} /><Kicker>{title}</Kicker></Row>
      {children}
    </Card>
  );
  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <Row style={{ justifyContent: "space-between" }}><Body>{label}</Body><Switch value={value} onValueChange={onChange} trackColor={{ true: c.accent }} /></Row>
  );

  return (
    <Screen>
      <Link href="/family" asChild>
        <Pressable accessibilityRole="button">
          <Card>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Kicker>{t.profile}</Kicker>
                <H1>{profile ? `${profile.avatar ?? ""} ${profile.displayName}`.trim() : m.common.noProfile}</H1>
                <Muted>{state.profiles.length} · {m.nav.family} · {t.switchProfile}</Muted>
              </View>
              <Ionicons name="chevron-forward" size={20} color={c.muted} />
            </Row>
          </Card>
        </Pressable>
      </Link>

      <Section icon="color-palette-outline" title={t.appearance}>
        <Muted>{t.themeHelp}</Muted>
        <ThemePicker />
      </Section>

      <Section icon="language-outline" title={t.language}>
        <LanguagePicker />
      </Section>

      <Section icon="notifications-outline" title={t.notifications}>
        <Link href="/azan" asChild><Pressable accessibilityRole="button"><Row style={{ justifyContent: "space-between" }}><Body>{t.notifAzan}</Body><Ionicons name="chevron-forward" size={18} color={c.muted} /></Row></Pressable></Link>
        <Toggle label={t.notifDaily} value={prefs.daily} onChange={(v) => update({ daily: v })} />
        {prefs.daily ? <Row style={{ justifyContent: "space-between" }}><Muted>{t.notifDailyTime}</Muted><Row>{["06:30", "07:30", "12:30", "20:30"].map((h) => <Chip key={h} label={h} active={prefs.dailyTime === h} onPress={() => update({ dailyTime: h })} />)}</Row></Row> : null}
        <Toggle label={t.notifHifz} value={prefs.hifz} onChange={(v) => update({ hifz: v })} />
        <Toggle label={t.notifStreak} value={prefs.streak} onChange={(v) => update({ streak: v })} />
        <Toggle label={t.notifFamily} value={prefs.family} onChange={(v) => update({ family: v })} />
        <Row><Chip label={t.notifTest} onPress={async () => { if (await requestNotificationPermission()) await sendTestNotification(locale); }} /></Row>
        <Row style={{ justifyContent: "space-between" }}><Body>{t.notifSound}</Body><Row><Chip label={t.notifSoundChime} active={prefs.sound === "chime"} onPress={() => update({ sound: "chime" })} /><Chip label={t.notifSoundSilent} active={prefs.sound === "silent"} onPress={() => update({ sound: "silent" })} /></Row></Row>
      </Section>

      <Section icon="person-outline" title={t.account}>
        {auth.user ? (
          <>
            <Body>{t.signedInAs} {auth.user.email ?? auth.user.name}</Body>
            <Button label={t.signOut} ghost onPress={auth.signOut} />
          </>
        ) : (
          <>
            <Muted>{auth.enabled ? t.signInHelp : t.signInUnavailable}</Muted>
            <Pill>{t.guest}</Pill>
            <View style={{ gap: 8, opacity: auth.enabled ? 1 : 0.55 }}>
              <Button label={t.signInApple} onPress={() => signIn("apple")} disabled={!auth.enabled || !!auth.busy} style={{ backgroundColor: "#000", borderColor: "#000" }} />
              <Button label={t.signInGoogle} ghost onPress={() => signIn("google")} disabled={!auth.enabled || !!auth.busy} />
              <Button label={t.signInQuran} ghost onPress={() => signIn("quran")} disabled={!auth.enabled || !!auth.busy} />
              <TextInput value={email} onChangeText={setEmail} placeholder={t.emailPlaceholder} placeholderTextColor={c.muted} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" editable={auth.enabled} style={{ borderWidth: 1, borderColor: c.line, borderRadius: c.radius.md, padding: 12, color: c.ink, backgroundColor: c.surface, fontSize: 16 }} />
              <Button label={t.signInEmail} ghost onPress={() => signIn("email")} disabled={!auth.enabled || !email.includes("@")} />
            </View>
            {authMsg ? <Muted>{authMsg}</Muted> : null}
          </>
        )}
      </Section>

      <Section icon="cloud-download-outline" title={t.purchases}>
        <H2>{t.offlineAudio}</H2>
        <Muted>{t.offlineAudioSub}</Muted>
        <Row style={{ justifyContent: "space-between" }}><Pill>{ent.entitlements.offlineAudio ? t.subscribed : t.notSubscribed}</Pill>{ent.enabled ? <Muted>{t.trial}</Muted> : null}</Row>
        {!ent.entitlements.offlineAudio ? (
          <Row>
            <Button label={`${t.monthly} · $1.99`} onPress={() => ent.purchase("monthly")} disabled={!ent.enabled || ent.busy} />
            <Button label={`${t.yearly} · $14.99`} onPress={() => ent.purchase("yearly")} disabled={!ent.enabled || ent.busy} />
          </Row>
        ) : null}
        <Row><Button label={t.restore} ghost onPress={ent.restore} disabled={!ent.enabled || ent.busy} /></Row>
      </Section>

      <Section icon="information-circle-outline" title={t.about}>
        <Row style={{ justifyContent: "space-between" }}><Muted>{t.version}</Muted><Muted>{version}</Muted></Row>
        <Row>
          <SourcesBadge />
          <Chip label={t.privacy} onPress={() => Linking.openURL(`${API_BASE_URL}/privacy`)} />
          <Chip label={t.terms} onPress={() => Linking.openURL(`${API_BASE_URL}/terms`)} />
        </Row>
      </Section>

    </Screen>
  );
}
