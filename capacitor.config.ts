import type { CapacitorConfig } from '@capacitor/cli';

/**
 * @file capacitor.config.ts
 * @description Configuração oficial do Capacitor para o aplicativo Jejuar.
 * Permite empacotamento nativo em Android (.apk) mantendo suporte total ao PWA web.
 */
const config: CapacitorConfig = {
  appId: 'com.jejuar.app',
  appName: 'Jejuar',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#00C975',
      sound: 'beep.wav'
    }
  },
  server: {
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;

