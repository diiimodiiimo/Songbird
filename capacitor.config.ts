import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.songbird.app',
  appName: 'SongBird',
  webDir: 'out',
  server: {
    // For development, uncomment and set your local IP:
    // url: 'http://YOUR_LOCAL_IP:3000',
    // cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'SongBird'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#1a1a1a'
    }
  }
};

export default config;
