import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/features/library/providers/playlists_providers.dart';
import 'package:musicflow_mobile/features/library/providers/tracks_providers.dart';
import 'package:musicflow_mobile/features/player/providers/player_controller.dart';
import 'package:musicflow_mobile/features/profile/providers/profile_stats_provider.dart';

class AppBottomNavigation extends ConsumerStatefulWidget {
  const AppBottomNavigation({super.key, required this.currentRoute});

  final String currentRoute;

  @override
  ConsumerState<AppBottomNavigation> createState() =>
      _AppBottomNavigationState();
}

class _AppBottomNavigationState extends ConsumerState<AppBottomNavigation> {
  DateTime? _lastNavigationAt;
  bool _warmedUp = false;

  static const List<_BottomNavItem> _items = [
    _BottomNavItem(AppRoutes.home),
    _BottomNavItem(AppRoutes.playlists),
    _BottomNavItem(AppRoutes.equalizer),
    _BottomNavItem(AppRoutes.profile),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _warmUpTabs();
    });
  }

  void _handleNavigation(BuildContext context, int index) {
    final route = _items[index].route;
    final now = DateTime.now();
    final lastNavigationAt = _lastNavigationAt;
    if (route == widget.currentRoute ||
        (lastNavigationAt != null &&
            now.difference(lastNavigationAt) <
                const Duration(milliseconds: 120))) {
      return;
    }

    _lastNavigationAt = now;
    _warmUpRoute(route);
    context.go(route);
  }

  void _warmUpTabs() {
    if (_warmedUp) return;
    _warmedUp = true;
    for (final item in _items) {
      _warmUpRoute(item.route);
    }
  }

  void _warmUpRoute(String route) {
    switch (route) {
      case AppRoutes.home:
        ref.read(tracksListProvider(const TracksQuery(take: 5)).future);
      case AppRoutes.playlists:
        ref.read(playlistsProvider.future);
        ref.read(savedTracksListProvider(const TracksQuery(take: 5)).future);
      case AppRoutes.equalizer:
        ref.read(
          playerControllerProvider.select((state) => state.currentTrack),
        );
      case AppRoutes.profile:
        ref.read(profileStatsProvider.future);
    }
  }

  int get _currentIndex {
    final index = _items.indexWhere(
      (item) => item.route == widget.currentRoute,
    );
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

class _BottomNavItem {
  const _BottomNavItem(this.route);

  final String route;
}
