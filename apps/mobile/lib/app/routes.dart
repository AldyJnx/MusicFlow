abstract final class AppRoutes {
  // Auth
  static const String login = '/login';
  static const String register = '/register';

  // Client
  static const String home = '/';
  static const String library = '/library';
  static const String playlists = library;
  static const String playlist = '/playlist';
  static const String equalizer = '/equalizer';
  static const String playlistEqualizer = '/equalizer/playlist';
  static const String temporalSegments = '/equalizer/segments';
  static const String artist = '/artist';
  static const String profile = '/profile';
  static const String editProfile = '/profile/edit';
  static const String paymentMethods = '/profile/payment-methods';
  static const String settings = '/settings';
  static const String premium = '/premium';
  static const String nowPlaying = '/now-playing';
  static const String aiAgent = '/ai-agent';
}
