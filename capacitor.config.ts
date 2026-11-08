import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.assetbridge.saas",
  appName: "AssetBridge SaaS",
  webDir: "frontend/out",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    cleartext: true,
    // In production mobile build, configure remote server URL or use local offline bundle:
    url: process.env.CAPACITOR_SERVER_URL || undefined,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#030712",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#38bdf8",
    },
  },
};

export default config;
