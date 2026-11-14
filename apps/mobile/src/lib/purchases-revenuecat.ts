import Purchases, { LOG_LEVEL, PURCHASES_ERROR_CODE } from "react-native-purchases";
import { Platform } from "react-native";

import { OFFLINE_AUDIO_ENTITLEMENT, type Entitlements } from "./purchases";

/** RevenueCat adapter. Configure once with the platform key; offerings are set up in the RevenueCat dashboard (see docs/STORE.md). */
let configured = false;
const ensure = async () => {
  if (configured) return;
  const apiKey = Platform.OS === "ios" ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  if (!apiKey) throw new Error("RevenueCat key missing");
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey });
  configured = true;
};

const toEnt = (info: Awaited<ReturnType<typeof Purchases.getCustomerInfo>>): Entitlements => {
  const e = info.entitlements.active[OFFLINE_AUDIO_ENTITLEMENT];
  return { offlineAudio: Boolean(e), expiresAt: e?.expirationDate ?? null };
};

export const getEntitlements = async (): Promise<Entitlements> => { await ensure(); return toEnt(await Purchases.getCustomerInfo()); };

export const purchase = async (productId: string): Promise<"ok" | "cancelled" | "unavailable" | "failed"> => {
  await ensure();
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find((p) => p.product.identifier === productId || p.product.identifier.startsWith(productId));
    if (!pkg) return "unavailable";
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return toEnt(customerInfo).offlineAudio ? "ok" : "failed";
  } catch (e) {
    const code = (e as { code?: string }).code;
    return code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ? "cancelled" : "failed";
  }
};

export const restore = async (): Promise<void> => { await ensure(); await Purchases.restorePurchases(); };
