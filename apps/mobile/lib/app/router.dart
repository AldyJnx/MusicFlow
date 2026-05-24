import 'package:flutter/material.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/features/equalizer/screens/equalizer_screen.dart';
import 'package:musicflow_mobile/features/library/screens/home_screen.dart';
import 'package:musicflow_mobile/features/playlists/screens/playlist_screens.dart';
import 'package:musicflow_mobile/features/premium/screens/premium_screen.dart';
import 'package:musicflow_mobile/features/profile/screens/edit_profile.dart';
import 'package:musicflow_mobile/features/profile/screens/payment_methods_screen.dart';
import 'package:musicflow_mobile/features/profile/screens/profile_screen.dart';
import 'package:musicflow_mobile/features/settings/settings_screen.dart';

abstract final class AppRouter {
  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.home:
        return MaterialPageRoute(
          builder: (_) => const HomeScreen(),
          settings: settings,
        );
      case AppRoutes.playlists:
        return MaterialPageRoute(
          builder: (_) => const PlaylistScreen(),
          settings: settings,
        );
      case AppRoutes.equalizer:
        return MaterialPageRoute(
          builder: (_) => const EqualizerScreen(),
          settings: settings,
        );
      case AppRoutes.profile:
        return MaterialPageRoute(
          builder: (_) => const ProfileScreen(),
          settings: settings,
        );
      case AppRoutes.editProfile:
        return MaterialPageRoute(
          builder: (_) => const EditProfileScreen(),
          settings: settings,
        );
      case AppRoutes.paymentMethods:
        return MaterialPageRoute(
          builder: (_) => const PaymentMethodsScreen(),
          settings: settings,
        );
      case AppRoutes.settings:
        return MaterialPageRoute(
          builder: (_) => const SettingsScreen(),
          settings: settings,
        );
      case AppRoutes.premium:
        return MaterialPageRoute(
          builder: (_) => const PremiumScreen(),
          settings: settings,
        );
      default:
        return MaterialPageRoute(
          builder: (_) => const HomeScreen(),
          settings: settings,
        );
    }
  }
}
