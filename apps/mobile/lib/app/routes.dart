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

  // Catalog (Spotify-like shared browse)
  static const String catalog = '/catalog';
  static const String catalogArtist = '/catalog/artist';
  static const String catalogAlbum = '/catalog/album';

  // Offline
  static const String downloads = '/downloads';

  static const String profile = '/profile';
  static const String editProfile = '/profile/edit';
  static const String paymentMethods = '/profile/payment-methods';
  static const String settings = '/settings';
  static const String themes = '/settings/themes';
  static const String premium = '/premium';
  static const String nowPlaying = '/now-playing';
  static const String aiAgent = '/ai-agent';
}
