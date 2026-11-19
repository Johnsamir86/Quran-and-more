# Quran and More in the car: CarPlay and Android Auto

Status, 16 November 2026.

## What works today

**Ayah text with the voice.** The player publishes Now Playing metadata on every ayah change:
the ayah text as the title, "Surah · Ayah n" as the artist line and the reciter as the album.
It is on by default and can be switched off in the player settings ("Show the ayah text on the
lock screen and in the car"). Play, pause and ±10 s work from the car's controls and from the
steering wheel. The same metadata drives the iPhone lock screen, Android's media notification,
and the web Media Session (lock screen on Android Chrome, media keys on desktop).

**Apple CarPlay.** CarPlay's built-in Now Playing app shows whatever audio the iPhone is playing,
including apps without their own CarPlay app, so recitation started in Quran and More appears on
the car screen with the ayah text and the transport controls. There is no "Quran and More" icon
on the CarPlay home screen yet (see below).

**Android Auto.** The Android app is declared as an Android Auto media app
(`apps/mobile/plugins/with-android-auto.js`): the expo-audio media3 session service is exported
with the `android.media.browse.MediaBrowserService` intent filter and the app carries the
`automotive_app_desc` descriptor with `media`. Android Auto lists the app in its launcher and
shows the active session under Now Playing. The browse screen inside the car is empty for now
(there is no surah tree yet), so start playback on the phone, or by voice ("play Surah Al-Kahf").
This path has not yet been exercised on a head unit or the Desktop Head Unit; treat it as beta.

## What is still needed for a full car app

### CarPlay app icon with a surah list (iOS)
1. Apple grants CarPlay only on request. Apply at https://developer.apple.com/contact/carplay/
   for the **CarPlay Audio** category with the App Store Connect app record; approval usually takes
   a few weeks and needs the paid Apple Developer Program (the same blocker as TestFlight).
2. When granted, add the `com.apple.developer.carplay-audio` entitlement to the provisioning
   profile and to `ios.entitlements` in `apps/mobile/app.json`, and add
   `react-native-carplay` (CPListTemplate of surahs and reciters, CPNowPlayingTemplate).
   The personal-team builds used for the iPhone tonight cannot carry that entitlement, so the
   plugin must stay gated behind the environment variable `EXPO_CARPLAY=1` until the profile
   exists.
3. Apple's review checks that the templates contain only audio browsing and playback: no text
   reading, no video. The ayah text is allowed in the Now Playing title.

### Android Auto browse tree
Replace the empty root with a MediaLibraryService tree: Surahs (114 items, Arabic and Latin
names), Reciters, Continue, Juz. media3 `MediaLibraryService` or a thin Kotlin
`MediaBrowserServiceCompat` in a local Expo module, talking to the JS player through events.
Google's media app quality checklist (https://developer.android.com/docs/quality-guidelines/car-app-quality)
applies; publishing on the Play Store for cars requires the "Android Auto" declaration in the
Play Console.

## Checklist before shipping the car features
- [ ] Desktop Head Unit run on an Android emulator: launcher icon, Now Playing with the ayah text,
      play/pause/seek from the DHU.
- [ ] CarPlay Simulator (Xcode, I/O → External Displays → CarPlay) once the entitlement exists.
- [ ] Voice: "Hey Siri, play Surah Al-Kahf in Quran and More" needs a SiriKit media intent
      (INPlayMediaIntent) and is part of the CarPlay work.
