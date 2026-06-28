import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/features/ai_agent/screens/ai_chat_screen.dart';
import 'package:musicflow_mobile/features/auth/login_screen.dart';
import 'package:musicflow_mobile/features/auth/providers/auth_controller.dart';
import 'package:musicflow_mobile/features/auth/register_screen.dart';
import 'package:musicflow_mobile/features/catalog/screens/catalog_album_screen.dart';
import 'package:musicflow_mobile/features/catalog/screens/catalog_artist_screen.dart';
import 'package:musicflow_mobile/features/catalog/screens/catalog_screen.dart';
import 'package:musicflow_mobile/features/equalizer/screens/equalizer_screen.dart';
import 'package:musicflow_mobile/features/equalizer/screens/playlist_equalizer_screen.dart';
import 'package:musicflow_mobile/features/equalizer/screens/temporal_segments_screen.dart';
import 'package:musicflow_mobile/features/library/screens/artist_detail_screen.dart';
import 'package:musicflow_mobile/features/library/screens/home_screen.dart';
import 'package:musicflow_mobile/features/player/screens/now_playing_screen.dart';
import 'package:musicflow_mobile/features/playlists/screens/playlist_detail_screen.dart';
import 'package:musicflow_mobile/features/playlists/screens/playlist_screens.dart';
import 'package:musicflow_mobile/features/premium/screens/premium_screen.dart';
import 'package:musicflow_mobile/features/profile/screens/edit_profile.dart';
import 'package:musicflow_mobile/features/profile/screens/payment_methods_screen.dart';
import 'package:musicflow_mobile/features/profile/screens/profile_screen.dart';
import 'package:musicflow_mobile/features/settings/settings_screen.dart';
import 'package:musicflow_mobile/features/settings/theme_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = _AuthNotifier(ref);

  return GoRouter(
    initialLocation: AppRoutes.home,
    refreshListenable: notifier,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);

      // While bootstrapping (reading tokens + /auth/me), don't redirect.
      if (auth.isInitializing) return null;

      final loggingIn =
          state.matchedLocation == AppRoutes.login ||
          state.matchedLocation == AppRoutes.register;

      if (!auth.isAuthenticated && !loggingIn) {
        return AppRoutes.login;
      }
      if (auth.isAuthenticated && loggingIn) {
        return AppRoutes.home;
      }
      return null;
    },
    routes: [
      GoRoute(path: AppRoutes.login, builder: (_, __) => const LoginScreen()),
      GoRoute(
        path: AppRoutes.register,
        builder: (_, __) => const RegisterScreen(),
      ),
      GoRoute(path: AppRoutes.home, builder: (_, __) => const HomeScreen()),
      GoRoute(
        path: AppRoutes.catalog,
        builder: (_, __) => const CatalogScreen(),
      ),
      GoRoute(
        path: '${AppRoutes.catalogArtist}/:id',
        builder: (_, state) {
          return CatalogArtistScreen(
            artistId: state.pathParameters['id'] ?? '',
          );
        },
      ),
      GoRoute(
        path: '${AppRoutes.catalogAlbum}/:id',
        builder: (_, state) {
          return CatalogAlbumScreen(albumId: state.pathParameters['id'] ?? '');
        },
      ),
      GoRoute(
        path: '${AppRoutes.playlist}/:id',
        builder: (_, state) {
          return PlaylistDetailScreen(
            playlistId: state.pathParameters['id'] ?? '',
          );
        },
      ),
      GoRoute(
        path: '${AppRoutes.artist}/:name',
        builder: (_, state) {
          final rawName = state.pathParameters['name'] ?? '';
          return ArtistDetailScreen(artist: Uri.decodeComponent(rawName));
        },
      ),
      GoRoute(
        path: AppRoutes.playlists,
        builder: (_, __) => const PlaylistScreen(),
      ),
      GoRoute(
        path: AppRoutes.profile,
        builder: (_, __) => const ProfileScreen(),
      ),
      GoRoute(
        path: AppRoutes.editProfile,
        builder: (_, __) => const EditProfileScreen(),
      ),
      GoRoute(
        path: AppRoutes.paymentMethods,
        builder: (_, __) => const PaymentMethodsScreen(),
      ),
      GoRoute(
        path: AppRoutes.settings,
        builder: (_, __) => const SettingsScreen(),
      ),
      GoRoute(path: AppRoutes.themes, builder: (_, __) => const ThemeScreen()),
      GoRoute(
        path: AppRoutes.premium,
        builder: (_, __) => const PremiumScreen(),
      ),
      GoRoute(
        path: AppRoutes.nowPlaying,
        builder: (_, __) => const NowPlayingScreen(),
      ),
      GoRoute(
        path: AppRoutes.equalizer,
        builder: (_, __) => const EqualizerScreen(),
      ),
      GoRoute(
        path: '${AppRoutes.playlistEqualizer}/:id',
        builder: (_, state) {
          return PlaylistEqualizerScreen(
            playlistId: state.pathParameters['id'] ?? '',
          );
        },
      ),
      GoRoute(
        path: AppRoutes.temporalSegments,
        builder: (_, __) => const TemporalSegmentsScreen(),
      ),
      GoRoute(
        path: AppRoutes.aiAgent,
        builder: (_, __) => const AiChatScreen(),
      ),
    ],
  );
});

/// Bridges Riverpod auth state to GoRouter via Listenable.
class _AuthNotifier extends ChangeNotifier {
  _AuthNotifier(Ref ref) {
    ref.listen(authControllerProvider, (_, __) => notifyListeners());
  }
}
