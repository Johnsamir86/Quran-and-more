import { Stack, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { View } from "react-native";

import { PLAN_LIMITS, PLUS_PRICE, bumpUsage, usageAllowed, type PlanId, type PlusFeature, type UsageRecord } from "@qam/core";

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
  const [preview, setPreview] = useStored<PlanId>("qam.plus.preview", () => "unlimited");
  const plan: PlanId = ent.enabled ? ent.entitlements.plan : preview;
  return { plan, plus: plan !== "free", unlimited: plan === "unlimited", limits: PLAN_LIMITS[plan], enabled: ent.enabled, busy: ent.busy, purchase: ent.purchase, restore: ent.restore, preview, setPreview };
};

/** Device-side counters for the Plus limits (Ask per day, videos per month). */
export const useUsage = () => {
  const { plan } = usePlus();
  const [usage, setUsage] = useStored<UsageRecord | null>("qam.usage.v1", () => null);
  const allowed = (kind: "ask" | "video") => usageAllowed(plan, usage, kind, new Date());
  const bump = (kind: "ask" | "video") => setUsage((u) => bumpUsage(u, kind, new Date()));
  return { usage, allowed, bump, plan };
};

export function Paywall({ feature, inline }: { feature?: PlusFeature; inline?: boolean }) {
  const c = usePalette();
  const { m } = useI18n();
  const t = m.plus;
  const router = useRouter();
  const { enabled, busy, purchase, restore, preview, setPreview, plan } = usePlus();
  const body = (
    <>
      <Card style={{ borderColor: c.accent }}>
        <Kicker>{t.badge}</Kicker>
        <H1>{t.title}</H1>
        {feature ? <Pill>🔒 {t.features[feature]} · {t.locked}</Pill> : null}
        <Body>{t.freeIncludes}</Body>
        <Body>{t.plusIncludes}</Body>
        <Body>• {t.plusPlans}</Body>
        <Body>• {t.unlimitedPlan}</Body>
        <Muted>{t.downloadsNeedActive}</Muted>
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
            <Row>{(["free", "plus", "unlimited"] as PlanId[]).map((p) => <Button key={p} ghost={plan !== p} label={p === "free" ? t.inactive : p === "plus" ? t.badge : t.unlimited} onPress={() => setPreview(p)} />)}</Row>
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
