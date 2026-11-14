# Apple signing, certificates and TestFlight

You have an Apple Developer account; nothing here needs a Mac except step 5b.

1. App Store Connect → Apps → New app: platform iOS, name "Quran and More",
   bundle id `foundation.quranandmore.app` (register it first under
   Certificates, Identifiers & Profiles → Identifiers, with capabilities
   Sign in with Apple, Push Notifications, Background Modes: Audio).
2. Pricing: tier $4.99, all territories. Subscriptions: group "Offline Audio",
   products `offline_audio_monthly` ($1.99) and `offline_audio_yearly` ($14.99,
   7-day introductory free trial). Add localised display names in Arabic.
3. Sign in with Apple: create a Services ID for Supabase (return URL
   `https://<project>.supabase.co/auth/v1/callback`) and a Sign in with Apple key.
4. Push: an APNs key is only needed later for remote push; the app uses local
   notifications today.
5. Build and sign:
   - a. EAS (no Mac): `npx eas-cli login`, then
     `npx eas-cli build -p ios --profile production`. EAS asks for the Apple ID
     once, creates the distribution certificate and provisioning profile, and
     stores them encrypted. `npx eas-cli submit -p ios` uploads to TestFlight.
   - b. Xcode on the Mac: `npx expo prebuild -p ios`, open the workspace, set
     the team under Signing & Capabilities (automatic signing), Product →
     Archive → Distribute → TestFlight.
6. TestFlight: add internal testers (your family), then an external group with
   the review notes: "Paid app; the only in-app purchase is the Offline Audio
   subscription. Location is used on the device for prayer times. Microphone
   only in the memorisation check."
7. App Review notes to prepare: demo video of the azan notification, the
   content-sources sheet (review pending wording), and the privacy labels in
   docs/STORE.md.

Rotation: certificates expire after a year; EAS renews on the next build.
Never commit `.p8`, `.p12`, `.mobileprovision` files (already gitignored).
