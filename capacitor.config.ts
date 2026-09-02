import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sonora.music',
  appName: 'Sonora',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    StatusBar: {
      backgroundColor: '#0B0D11',
      style: 'DARK',
    },
  },
};

export default config;
