import { Stack, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Switch, Text, View } from "react-native";

import { PLUS_PRICE, type PlusFeature } from "@qam/core";

import { useI18n } from "@/lib/i18n";
import { useEntitlements } from "@/lib/purchases";
import { useStored } from "@/lib/stored";
import { Body, Button, Card, H1, Kicker, Muted, Pill, Row, Screen, usePalette } from "@/lib/ui";

/**
 * Plus is the one paid bundle. With a store connection the RevenueCat entitlement decides; test
 * builds have none, so they are unlocked by default with a preview switch to see the free tier.
 */
export const usePlus = () => {
  const ent = useEntitlements();
  const [preview, setPreview] = useStored<"plus" | "free">("qam.plus.preview", () => "plus");
  const plus = ent.enabled ? ent.entitlements.offlineAudio : preview !== "free";
  return { plus, enabled: ent.enabled, busy: ent.busy, purchase: ent.purchase, restore: ent.restore, preview, setPreview };
};

export function Paywall({ feature, inline }: { feature?: PlusFeature; inline?: boolean }) {
  const c = usePalette();
  const { m } = useI18n();
  const t = m.plus;
  const router = useRouter();
  const { enabled, busy, purchase, restore, preview, setPreview } = usePlus();
  const body = (
    <>
      <Card style={{ borderColor: c.accent }}>
        <Kicker>{t.badge}</Kicker>
        <H1>{t.title}</H1>
        {feature ? <Pill>🔒 {t.features[feature]} · {t.locked}</Pill> : null}
        <Body>{t.freeIncludes}</Body>
        <Body>{t.plusIncludes}</Body>
      </Card>
      <Card>
        <Row>
          <Button label={`${t.monthly} · $${PLUS_PRICE.monthlyUsd} ${t.perMonth}`} onPress={() => purchase("monthly")} disabled={!enabled || busy} />
          <Button label={`${t.yearly} · $${PLUS_PRICE.yearlyUsd} ${t.perYear}`} onPress={() => purchase("yearly")} disabled={!enabled || busy} />
          <Button label={`${t.lifetime} · $${PLUS_PRICE.lifetimeUsd} ${t.once}`} onPress={() => purchase("lifetime")} disabled={!enabled || busy} />
        </Row>
        <Muted>{t.trial}</Muted>
        <Row><Button ghost label={t.restore} onPress={restore} disabled={!enabled || busy} />{!inline ? <Button ghost label={t.notNow} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} /> : null}</Row>
        {!enabled ? (
          <View style={{ gap: 6 }}>
            <Row style={{ justifyContent: "space-between" }}><Text style={{ color: c.ink, flex: 1 }}>{t.previewPlus}</Text><Switch value={preview !== "free"} onValueChange={(v) => setPreview(v ? "plus" : "free")} /></Row>
            <Muted>{t.previewHelp}</Muted>
          </View>
        ) : null}
      </Card>
    </>
  );
  if (inline) return <View style={{ gap: 12 }}>{body}</View>;
  return (
    <Screen>
      <Stack.Screen options={{ title: t.title }} />
      {body}
    </Screen>
  );
}

/** Renders the children for Plus users and the paywall for everyone else. */
export function PlusGate({ feature, children }: { feature: PlusFeature; children: ReactNode }) {
  const { plus } = usePlus();
  if (plus) return <>{children}</>;
  return <Paywall feature={feature} />;
}
