/**
 * Android Auto: declare the app as a media app so the car shows it in the launcher and the
 * active media session (play, pause, seek, ayah text) under Now Playing.
 *
 * expo-audio already runs a media3 MediaSessionService for the lock-screen controls; media3's
 * service also answers legacy MediaBrowser clients, which is how Android Auto connects. We add
 * the browse intent filter, export the service, and the automotive app descriptor.
 */
const { withAndroidManifest, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const SERVICE = "expo.modules.audio.service.AudioControlsService";
const BROWSE_ACTION = "android.media.browse.MediaBrowserService";
const CAR_META = "com.google.android.gms.car.application";

const withManifest = (config) =>
  withAndroidManifest(config, (c) => {
    const app = c.modResults.manifest.application?.[0];
    if (!app) return c;
    app.service = app.service || [];
    let svc = app.service.find((s) => s.$?.["android:name"] === SERVICE);
    if (!svc) {
      svc = { $: { "android:name": SERVICE, "android:foregroundServiceType": "mediaPlayback" }, "intent-filter": [{ action: [{ $: { "android:name": "androidx.media3.session.MediaSessionService" } }] }] };
      app.service.push(svc);
    }
    svc.$["android:exported"] = "true";
    svc["intent-filter"] = svc["intent-filter"] || [];
    const has = svc["intent-filter"].some((f) => (f.action || []).some((a) => a.$?.["android:name"] === BROWSE_ACTION));
    if (!has) svc["intent-filter"].push({ action: [{ $: { "android:name": BROWSE_ACTION } }] });
    app["meta-data"] = app["meta-data"] || [];
    if (!app["meta-data"].some((m) => m.$?.["android:name"] === CAR_META)) app["meta-data"].push({ $: { "android:name": CAR_META, "android:resource": "@xml/automotive_app_desc" } });
    return c;
  });

const withDescriptor = (config) =>
  withDangerousMod(config, ["android", (c) => {
    const dir = path.join(c.modRequest.platformProjectRoot, "app", "src", "main", "res", "xml");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "automotive_app_desc.xml"), '<?xml version="1.0" encoding="utf-8"?>\n<automotiveApp>\n  <uses name="media" />\n</automotiveApp>\n');
    return c;
  }]);

module.exports = (config) => withDescriptor(withManifest(config));
