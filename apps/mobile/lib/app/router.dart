import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/config/app_config.dart';
import 'package:musicflow_mobile/features/ai_agent/screens/ai_chat_screen.dart';
import 'package:musicflow_mobile/features/auth/auth_bootstrap_screen.dart';
import 'package:musicflow_mobile/features/auth/headphones_tip_screen.dart';
import 'package:musicflow_mobile/features/auth/artist_onboarding_screen.dart';
import 'package:musicflow_mobile/features/auth/login_screen.dart';
import 'package:musicflow_mobile/features/auth/providers/auth_controller.dart';
import 'package:musicflow_mobile/features/auth/register_screen.dart';
import 'package:musicflow_mobile/features/catalog/screens/catalog_album_screen.dart';
import 'package:musicflow_mobile/features/catalog/screens/catalog_artist_screen.dart';
import 'package:musicflow_mobile/features/catalog/screens/catalog_screen.dart';
import 'package:musicflow_mobile/features/downloads/screens/downloads_screen.dart';
import 'package:musicflow_mobile/features/equalizer/screens/equalizer_screen.dart';
import 'package:musicflow_mobile/features/equalizer/screens/playlist_equalizer_screen.dart';
import 'package:musicflow_mobile/features/equalizer/screens/temporal_segments_screen.dart';
import 'package:musicflow_mobile/features/library/screens/artist_detail_screen.dart';
import 'package:musicflow_mobile/features/library/screens/home_screen.dart';
import 'package:musicflow_mobile/features/player/screens/lyrics_screen.dart';
import 'package:musicflow_mobile/features/player/screens/now_playing_screen.dart';
import 'package:musicflow_mobile/features/playlists/screens/playlist_detail_screen.dart';
import 'package:musicflow_mobile/features/playlists/screens/playlist_screens.dart';
import 'package:musicflow_mobile/features/premium/screens/premium_screen.dart';
import 'package:musicflow_mobile/features/profile/screens/edit_profile.dart';
import 'package:musicflow_mobile/features/profile/screens/payment_methods_screen.dart';
import 'package:musicflow_mobile/features/profile/screens/profile_screen.dart';
import 'package:musicflow_mobile/features/settings/settings_screen.dart';
import 'package:musicflow_mobile/features/settings/theme_screen.dart';
import 'package:musicflow_mobile/features/settings/artist_preferences_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = _AuthNotifier(ref);

  return GoRouter(
    initialLocation: AppRoutes.bootstrap,
    refreshListenable: notifier,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);

      final bootstrapping = state.matchedLocation == AppRoutes.bootstrap;
      if (auth.isInitializing) {
        return bootstrapping ? null : AppRoutes.bootstrap;
      }

      final loggingIn =
          state.matchedLocation == AppRoutes.login ||
          state.matchedLocation == AppRoutes.register;
      final headphonesTip = state.matchedLocation == AppRoutes.headphonesTip;
      final artistOnboarding =
          state.matchedLocation == AppRoutes.artistOnboarding;

      if (!auth.isAuthenticated && !loggingIn) {
        return AppRoutes.login;
      }
      if (auth.isAuthenticated &&
          auth.user?.onboardingCompletedAt == null &&
          !artistOnboarding) {
        return AppRoutes.artistOnboarding;
      }
      if (auth.isAuthenticated &&
          auth.user?.onboardingCompletedAt != null &&
          artistOnboarding) {
        return AppRoutes.headphonesTip;
      }
      if (auth.isAuthenticated && headphonesTip) return null;
      if (auth.isAuthenticated && loggingIn) {
        return AppRoutes.headphonesTip;
      }
      if (auth.isAuthenticated && bootstrapping) return AppRoutes.home;
      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.bootstrap,
        builder: (_, _) => const AuthBootstrapScreen(),
      ),
      GoRoute(path: AppRoutes.login, builder: (_, _) => const LoginScreen()),
      GoRoute(
        path: AppRoutes.register,
        builder: (_, _) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppRoutes.headphonesTip,
        builder: (_, _) => const HeadphonesTipScreen(),
      ),
      GoRoute(
        path: AppRoutes.artistOnboarding,
        builder: (_, _) => const ArtistOnboardingScreen(),
      ),
      GoRoute(
        path: AppRoutes.home,
        pageBuilder: (_, state) => _instantPage(state, const HomeScreen()),
      ),
      GoRoute(
        path: AppRoutes.catalog,
        builder: (_, _) => const CatalogScreen(),
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
        path: AppRoutes.downloads,
        builder: (_, _) => const DownloadsScreen(),
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
          return ArtistDetailScreen(artist: rawName);
        },
      ),
      GoRoute(
        path: AppRoutes.playlists,
        pageBuilder: (_, state) => _instantPage(state, const PlaylistScreen()),
      ),
      GoRoute(
        path: AppRoutes.profile,
        pageBuilder: (_, state) => _instantPage(state, const ProfileScreen()),
      ),
      GoRoute(
        path: AppRoutes.editProfile,
        builder: (_, _) => const EditProfileScreen(),
      ),
      GoRoute(
        path: AppRoutes.paymentMethods,
        redirect: (_, _) => AppConfig.billingEnabled ? null : AppRoutes.profile,
        builder: (_, _) => const PaymentMethodsScreen(),
      ),
      GoRoute(
        path: AppRoutes.settings,
        pageBuilder: (_, state) => _instantPage(state, const SettingsScreen()),
      ),
      GoRoute(path: AppRoutes.themes, builder: (_, _) => const ThemeScreen()),
      GoRoute(
        path: AppRoutes.artistPreferences,
        builder: (_, _) => const ArtistPreferencesScreen(),
      ),
      GoRoute(
        path: AppRoutes.premium,
        builder: (_, _) => const PremiumScreen(),
      ),
      GoRoute(
        path: AppRoutes.nowPlaying,
        builder: (_, _) => const NowPlayingScreen(),
      ),
      GoRoute(path: AppRoutes.lyrics, builder: (_, _) => const LyricsScreen()),
      GoRoute(
        path: AppRoutes.equalizer,
        pageBuilder: (_, state) => _instantPage(state, const EqualizerScreen()),
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
        builder: (_, _) => const TemporalSegmentsScreen(),
      ),
      GoRoute(path: AppRoutes.aiAgent, builder: (_, _) => const AiChatScreen()),
    ],
  );
});

NoTransitionPage<void> _instantPage(GoRouterState state, Widget child) {
  return NoTransitionPage<void>(key: state.pageKey, child: child);
}

/// Bridges Riverpod auth state to GoRouter via Listenable.
class _AuthNotifier extends ChangeNotifier {
  _AuthNotifier(Ref ref) {
    ref.listen(authControllerProvider, (_, _) => notifyListeners());
  }
}
