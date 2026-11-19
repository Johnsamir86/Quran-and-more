import { useLocalSearchParams } from "expo-router";

import type { PlusFeature } from "@qam/core";

import { Paywall } from "@/lib/plus";

export default function PlusScreen() {
  const { feature } = useLocalSearchParams<{ feature?: string }>();
  return <Paywall feature={(feature as PlusFeature) || undefined} />;
}
