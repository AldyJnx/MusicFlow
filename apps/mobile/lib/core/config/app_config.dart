/// Configuration constants and environment-resolved values for the mobile app.
class AppConfig {
  AppConfig._();

  // Use the host machine's LAN IP by default so a physical Android phone can
  // reach the local backend. For Android emulator, override with:
  // --dart-define=API_BASE_URL=http://10.0.2.2:8000/api 192.168.18.32
  //192.168.18.32
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000/api',
  );

  static const String r2AudioPublicBase = String.fromEnvironment(
    'R2_AUDIO_PUBLIC_BASE',
    defaultValue: 'https://pub-f44a489bc1e94270836132b3136f0a8c.r2.dev',
  );

  static const String r2ImagesPublicBase = String.fromEnvironment(
    'R2_IMAGES_PUBLIC_BASE',
    defaultValue: 'https://pub-7f3d08bcabf44d68b2a57424acfc9d48.r2.dev',
  );
}
