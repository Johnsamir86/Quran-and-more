# @qam/mobile

Expo app for iOS, Android, Android/Google TV and Apple TV.

```bash
npm run dev:mobile              # from the repo root
# or inside apps/mobile
npx expo start                  # scan the QR with Expo Go
npx expo run:ios                # needs Xcode
npx expo run:android            # needs Android Studio + an emulator
```

Set `EXPO_PUBLIC_API_BASE_URL` (see `.env.example`) to the backend URL. On a
physical phone use your computer's LAN IP, not localhost.

TV: Android TV and Apple TV builds use `react-native-tvos` through the
`@react-native-tvos/config-tv` plugin (added in Phase 1 once the reader is
feature complete), with `EXPO_TV=1 npx expo prebuild`.
