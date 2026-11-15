import * as Location from "expo-location";
import { Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";

import { compassPoint, distanceToKaabaKm, qiblaBearing, qiblaOffset } from "@qam/core";

import { detectLocation, loadAzanSettings, saveAzanSettings } from "@/lib/azan";
import { useI18n } from "@/lib/i18n";
import { Button, Card, Kicker, Muted, Pill, Row, Screen, usePalette } from "@/lib/ui";

const SIZE = 300;

/** Qibla compass: bearing to the Kaaba from the saved or current location, dial driven by the device heading. */
export default function QiblaScreen() {
  const c = usePalette();
  const { m, num } = useI18n();
  const t = m.worship.qibla;
  const [pos, setPos] = useState<{ latitude: number; longitude: number; city?: string } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [compassState, setCompassState] = useState<"idle" | "on" | "none">("idle");
  const dial = useRef(new Animated.Value(0)).current;
  const smooth = useRef<number | null>(null);
  const unwound = useRef(0); // continuous angle so the dial never spins the long way round

  useEffect(() => { loadAzanSettings().then((s) => { if (s.latitude && s.longitude) setPos({ latitude: s.latitude, longitude: s.longitude, city: s.city }); }).catch(() => undefined); }, []);

  const locate = useCallback(async () => {
    setStatus(t.locating);
    const loc = await detectLocation().catch(() => null);
    if (!loc) { setStatus(t.needLocation); return; }
    setPos({ latitude: loc.latitude, longitude: loc.longitude, city: loc.city });
    const s = await loadAzanSettings(); await saveAzanSettings({ ...s, ...loc });
    setStatus(null);
  }, [t.locating, t.needLocation]);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null; let alive = true;
    (async () => {
      const perm = await Location.getForegroundPermissionsAsync().catch(() => null);
      if (!perm?.granted) { const r = await Location.requestForegroundPermissionsAsync().catch(() => null); if (!r?.granted) { if (alive) setCompassState("none"); return; } }
      try {
        sub = await Location.watchHeadingAsync((h) => {
          const raw = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          if (raw < 0 || !alive) return;
          const prev = smooth.current;
          if (prev == null) smooth.current = raw; else { const d = ((raw - prev + 540) % 360) - 180; smooth.current = (prev + d * 0.3 + 360) % 360; }
          setHeading(smooth.current); setAccuracy(h.accuracy); setCompassState("on");
        });
      } catch { if (alive) setCompassState("none"); }
    })();
    return () => { alive = false; sub?.remove(); };
  }, []);

  const bearing = useMemo(() => (pos ? qiblaBearing(pos.latitude, pos.longitude) : null), [pos]);
  const km = useMemo(() => (pos ? distanceToKaabaKm(pos.latitude, pos.longitude) : null), [pos]);
  const offset = bearing != null && heading != null ? qiblaOffset(heading, bearing) : null;
  const aligned = offset != null && Math.abs(offset) <= 3;

  useEffect(() => {
    const target = heading != null ? -heading : 0;
    const cur = ((unwound.current % 360) + 360) % 360;
    const d = ((target - cur + 540) % 360) - 180;
    unwound.current += d;
    Animated.timing(dial, { toValue: unwound.current, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [heading, dial]);
  const rotate = dial.interpolate({ inputRange: [-360, 360], outputRange: ["-360deg", "360deg"] });

  return (
    <Screen>
      <Stack.Screen options={{ title: t.title }} />
      {!pos ? (
        <Card><Muted>{t.needLocation}</Muted><Row><Button label={`📍 ${t.useLocation}`} onPress={locate} /></Row>{status ? <Muted>{status}</Muted> : null}</Card>
      ) : (
        <Card>
          <View style={{ alignItems: "center", gap: 12 }}>
            <Animated.View style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 2, borderColor: aligned ? c.accent : c.line, backgroundColor: c.card, transform: [{ rotate }], alignItems: "center", justifyContent: "center" }}>
              {Array.from({ length: 36 }, (_, i) => (
                <View key={i} pointerEvents="none" style={{ position: "absolute", width: SIZE - 4, height: SIZE - 4, alignItems: "center", transform: [{ rotate: `${i * 10}deg` }] }}>
                  <View style={{ marginTop: 6, width: 2, height: i % 9 === 0 ? 18 : 10, backgroundColor: c.muted, opacity: i % 3 === 0 ? 1 : 0.5 }} />
                </View>
              ))}
              {(["N", "E", "S", "W"] as const).map((k, i) => (
                <View key={k} pointerEvents="none" style={{ position: "absolute", width: SIZE - 4, height: SIZE - 4, alignItems: "center", transform: [{ rotate: `${i * 90}deg` }] }}>
                  <Text style={{ marginTop: 26, color: k === "N" ? c.bad : c.muted, fontWeight: "700" }}>{k}</Text>
                </View>
              ))}
              <View style={{ position: "absolute", alignItems: "center", transform: [{ rotate: `${bearing ?? 0}deg` }] }}>
                <Text style={{ fontSize: 26, lineHeight: 30 }}>🕋</Text>
                <View style={{ width: 8, height: SIZE / 2 - 60, borderRadius: 4, backgroundColor: c.accent }} />
                <View style={{ height: SIZE / 2 - 30 }} />
              </View>
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: c.ink }} />
            </Animated.View>
            <Text style={{ fontSize: 40, fontWeight: "800", color: c.ink }}>{num(Math.round(bearing!))}°</Text>
            <Muted>{t.bearing} · {compassPoint(bearing!)} · {t.fromNorth}{pos.city ? ` · ${pos.city}` : ""}</Muted>
            {heading != null ? <Pill>{aligned ? `✓ ${t.aligned}` : `${offset! > 0 ? t.turnRight : t.turnLeft} ${num(Math.abs(Math.round(offset!)))}°`}</Pill> : null}
          </View>
          <Row style={{ justifyContent: "space-between" }}>
            <Text style={{ color: c.ink }}>{t.distance}: <Text style={{ fontWeight: "700" }}>{num(Math.round(km!))} {t.km}</Text></Text>
            <Muted>{t.heading}: {heading != null ? `${num(Math.round(heading))}°` : "—"}{accuracy != null && accuracy > 0 ? ` · ${t.accuracy}: ${accuracy <= 1 ? t.low : t.good}` : ""}</Muted>
          </Row>
          <Row><Button ghost label={`📍 ${t.useLocation}`} onPress={locate} /></Row>
          {compassState === "none" ? <Muted>{t.noCompass}</Muted> : compassState === "on" ? <Muted>{t.calibrate}</Muted> : null}
          {status ? <Muted>{status}</Muted> : null}
        </Card>
      )}
      <Card><Kicker>{m.worship.note}</Kicker><Muted>{t.note}</Muted></Card>
    </Screen>
  );
}
