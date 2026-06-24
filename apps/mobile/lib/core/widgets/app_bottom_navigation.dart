import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';

class AppBottomNavigation extends StatelessWidget {
  const AppBottomNavigation({super.key, required this.currentRoute});

  final String currentRoute;

  static const List<_BottomNavItem> _items = [
    _BottomNavItem(
      route: AppRoutes.home,
      label: 'Inicio',
      icon: Icons.home_outlined,
      activeIcon: Icons.home_rounded,
    ),
    _BottomNavItem(
      route: AppRoutes.playlists,
      label: 'Biblioteca',
      icon: Icons.library_music_outlined,
      activeIcon: Icons.library_music_rounded,
    ),
    _BottomNavItem(
      route: AppRoutes.equalizer,
      label: 'EQ',
      icon: Icons.equalizer_outlined,
      activeIcon: Icons.equalizer_rounded,
    ),
    _BottomNavItem(
      route: AppRoutes.profile,
      label: 'Perfil',
      icon: Icons.person_outline_rounded,
      activeIcon: Icons.person_rounded,
    ),
  ];

  void _handleNavigation(BuildContext context, int index) {
    final route = _items[index].route;
    if (route == currentRoute) {
      return;
    }

    context.go(route);
  }

  int get _currentIndex {
    final index = _items.indexWhere((item) => item.route == currentRoute);
    return index == -1 ? 0 : index;
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return Container(
      decoration: BoxDecoration(
        color: colors.surface,
        border: Border(top: BorderSide(color: colors.border)),
      ),
      child: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => _handleNavigation(context, index),
        backgroundColor: Colors.transparent,
        elevation: 0,
        selectedItemColor: colors.primary,
        unselectedItemColor: colors.textMuted,
        type: BottomNavigationBarType.fixed,
        items: _items
            .map(
              (item) => BottomNavigationBarItem(
                icon: Icon(item.icon),
                activeIcon: Icon(item.activeIcon),
                label: item.label,
              ),
            )
            .toList(),
      ),
    );
  }
}

class _BottomNavItem {
  const _BottomNavItem({
    required this.route,
    required this.label,
    required this.icon,
    required this.activeIcon,
  });

  final String route;
  final String label;
  final IconData icon;
  final IconData activeIcon;
}
