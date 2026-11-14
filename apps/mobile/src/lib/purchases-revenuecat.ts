import type { Entitlements } from "./purchases";

/** RevenueCat adapter; implemented when the SDK and store products exist (see docs/STORE.md). */
export const getEntitlements = async (): Promise<Entitlements> => ({ offlineAudio: false, expiresAt: null });
export const purchase = async (productId: string): Promise<"ok" | "cancelled" | "unavailable" | "failed"> => { void productId; return "unavailable"; };
export const restore = async (): Promise<void> => undefined;
