import type { CapacitorConfig } from '@capacitor/cli';

// TODO(product decision needed): this is still Lovable's auto-generated app ID.
// Replace with a real, owned reverse-DNS bundle identifier (e.g. com.yourcompany.taxease)
// before registering the app in App Store Connect / Play Console.
const appId = 'app.lovable.cfccb7e81e944850aec55d58ce74fa8e';

// Only point the native shell at a remote dev server (with cleartext HTTP allowed)
// when explicitly opted into local development. Any build without this env var set
// — including a default `npx cap sync` — loads the bundled `webDir` over HTTPS, so a
// forgotten env var fails safe instead of shipping a sandbox/staging URL to production.
const devServerUrl = process.env.CAPACITOR_DEV_SERVER_URL;

const config: CapacitorConfig = {
  appId,
  appName: 'FileSmart',
  webDir: 'dist',
  ...(devServerUrl
    ? { server: { url: devServerUrl, cleartext: true } }
    : {}),
};

export default config;
