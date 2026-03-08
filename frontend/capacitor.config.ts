import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vibecoding.decaymapmgm',
  appName: 'DecayMap MGM',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#faf7f2',
      showSpinner: true,
      spinnerColor: '#92400e',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#faf7f2',
    },
  },
};

export default config;
