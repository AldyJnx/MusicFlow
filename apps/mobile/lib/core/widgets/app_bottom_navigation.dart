import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';

class AppBottomNavigation extends StatelessWidget {
  const AppBottomNavigation({
    super.key,
    required this.currentRoute,
  });

  final String currentRoute;

  static const Color _accentCyan = Color(0xFF00CFFF);
  static const Color _background = Color(0xFF0B1F2A);
  static const Color _borderColor = Color(0x223CCEFF);

  void _handleNavigation(BuildContext context, int index) {
    final route = switch (index) {
      0 => AppRoutes.home,
      1 => AppRoutes.playlists,
      2 => AppRoutes.equalizer,
      3 => AppRoutes.profile,
      _ => null,
    };

    if (route == null || route == currentRoute) {
      return;
    }

    context.go(route);
  }

  int get _currentIndex {
    switch (currentRoute) {
      case AppRoutes.playlists:
        return 1;
      case AppRoutes.equalizer:
        return 2;
      case AppRoutes.profile:
        return 3;
      case AppRoutes.home:
      default:
        return 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: _background,
        border: Border(
          top: BorderSide(color: _borderColor),
        ),
      ),
      child: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => _handleNavigation(context, index),
        backgroundColor: Colors.transparent,
        elevation: 0,
        selectedItemColor: _accentCyan,
        unselectedItemColor: Colors.white54,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home_rounded),
            label: 'Inicio',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.library_music_outlined),
            activeIcon: Icon(Icons.library_music_rounded),
            label: 'Biblioteca',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.equalizer_outlined),
            activeIcon: Icon(Icons.equalizer_rounded),
            label: 'EQ',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline_rounded),
            activeIcon: Icon(Icons.person_rounded),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }
}
