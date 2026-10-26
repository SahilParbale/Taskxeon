export interface CapacitorConfig {
  appId?: string;
  appName?: string;
  webDir?: string;
  bundledWebRuntime?: boolean;
  server?: Record<string, any>;
  plugins?: Record<string, any>;
}

const config: CapacitorConfig = {
  appId: 'com.taskflow.enterprise',
  appName: 'TaskFlow',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: '#059669',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#059669'
    }
  }
};

export default config;
