import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/core/widgets/app_bottom_navigation.dart';
import 'package:musicflow_mobile/features/player/providers/player_controller.dart';
import 'package:musicflow_mobile/shared/models/playlist.dart';
import 'package:musicflow_mobile/shared/models/track.dart';

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

final _libraryTracksProvider =
    FutureProvider.autoDispose<List<Track>>((ref) async {
  final res = await ref.watch(tracksRepositoryProvider).listTracks();
  return res.tracks;
});

final _playlistsProvider =
    FutureProvider.autoDispose<List<Playlist>>((ref) {
  return ref.watch(playlistsRepositoryProvider).listPlaylists();
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class PlaylistScreen extends ConsumerWidget {
  const PlaylistScreen({super.key});

  static const Color _primaryBlue = Color(0xFF1E90FF);
  static const Color _accentCyan = Color(0xFF00CFFF);
  static const Color _lightBlue = Color(0xFF4FC3F7);
  static const Color _bgDark = Color(0xFF08131C);
  static const Color _bgMid = Color(0xFF0B1F2A);
  static const Color _bgTop = Color(0xFF103244);

  void _playLibrary(BuildContext context, WidgetRef ref, List<Track> tracks,
      {int index = 0}) {
    if (tracks.isEmpty) return;
    ref
        .read(playerControllerProvider.notifier)
        .playTrackList(tracks, startIndex: index);
    context.push(AppRoutes.nowPlaying);
  }

  Future<void> _playPlaylist(
      BuildContext context, WidgetRef ref, Playlist playlist) async {
    try {
      final detail = playlist.tracks.isNotEmpty
          ? playlist
          : await ref
              .read(playlistsRepositoryProvider)
              .getPlaylist(playlist.id);
      if (!context.mounted) return;
      if (detail.tracks.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Esta playlist no tiene canciones.')),
        );
        return;
      }
      ref
          .read(playerControllerProvider.notifier)
          .playTrackList(detail.tracks, startIndex: 0);
      context.push(AppRoutes.nowPlaying);
    } catch (_) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo abrir la playlist.')),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final tracksAsync = ref.watch(_libraryTracksProvider);
    final playlistsAsync = ref.watch(_playlistsProvider);
    final tracks = tracksAsync.asData?.value ?? const <Track>[];
    final playlists = playlistsAsync.asData?.value ?? const <Playlist>[];
    final heroPlaylist = playlists.isNotEmpty ? playlists.first : null;

    return Scaffold(
      backgroundColor: _bgDark,
      extendBody: true,
      bottomNavigationBar: const AppBottomNavigation(
        currentRoute: AppRoutes.playlists,
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [_bgTop, _bgMid, _bgDark],
            stops: [0.0, 0.24, 0.62],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              RefreshIndicator(
                color: _accentCyan,
                backgroundColor: _bgMid,
                onRefresh: () async {
                  ref.invalidate(_libraryTracksProvider);
                  ref.invalidate(_playlistsProvider);
                  await Future.wait([
                    ref.read(_libraryTracksProvider.future),
                    ref.read(_playlistsProvider.future),
                  ]);
                },
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 200),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _Header(theme: theme),
                      const SizedBox(height: 22),
                      Text(
                        'Biblioteca',
                        style: theme.textTheme.displaySmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          height: 0.95,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Tu universo sonoro personal, curado por IA.',
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: Colors.white70,
                          height: 1.35,
                        ),
                      ),
                      const SizedBox(height: 22),
                      const SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _FilterChip(label: 'Canciones', selected: true),
                            SizedBox(width: 12),
                            _FilterChip(label: 'Playlists'),
                            SizedBox(width: 12),
                            _FilterChip(label: 'Artistas'),
                          ],
                        ),
                      ),
                      const SizedBox(height: 22),
                      _HeroCard(
                        theme: theme,
                        heroPlaylist: heroPlaylist,
                        trackCount:
                            heroPlaylist?.trackCount ?? tracks.length,
                        onPlay: () => heroPlaylist != null
                            ? _playPlaylist(context, ref, heroPlaylist)
                            : _playLibrary(context, ref, tracks),
                      ),
                      const SizedBox(height: 20),
                      if (tracksAsync.isLoading)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 40),
                          child: Center(
                            child: CircularProgressIndicator(
                              color: _accentCyan,
                            ),
                          ),
                        )
                      else if (tracksAsync.hasError)
                        _ErrorBlock(
                          theme: theme,
                          onRetry: () => ref.invalidate(_libraryTracksProvider),
                        )
                      else if (tracks.isEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 40),
                          child: Center(
                            child: Text(
                              'Tu biblioteca está vacía.',
                              style: theme.textTheme.bodyLarge?.copyWith(
                                color: Colors.white54,
                              ),
                            ),
                          ),
                        )
                      else
                        for (var i = 0; i < tracks.length; i++)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: _TrackTile(
                              index: (i + 1).toString().padLeft(2, '0'),
                              track: tracks[i],
                              onTap: () =>
                                  _playLibrary(context, ref, tracks, index: i),
                            ),
                          ),
                    ],
                  ),
                ),
              ),
              const Positioned(
                left: 12,
                right: 12,
                bottom: 16,
                child: _MiniPlayer(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

class _Header extends StatelessWidget {
  const _Header({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              colors: [Color(0xFF1E3E54), Color(0xFF0A161F)],
            ),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.08),
            ),
          ),
          child: const Icon(
            Icons.person_rounded,
            color: Colors.white70,
            size: 22,
          ),
        ),
        Expanded(
          child: Center(
            child: Text(
              'MusicFlow',
              style: theme.textTheme.titleLarge?.copyWith(
                color: PlaylistScreen._lightBlue,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ),
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.06),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.search_rounded,
            color: Colors.white70,
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Hero card
// ---------------------------------------------------------------------------

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.theme,
    required this.heroPlaylist,
    required this.trackCount,
    required this.onPlay,
  });

  final ThemeData theme;
  final Playlist? heroPlaylist;
  final int trackCount;
  final VoidCallback onPlay;

  @override
  Widget build(BuildContext context) {
    final title = heroPlaylist?.name ?? 'Tu biblioteca';
    final subtitle = heroPlaylist?.description.isNotEmpty == true
        ? heroPlaylist!.description
        : 'Todas tus canciones en un solo lugar';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(30),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF17384C), Color(0xFF09121A)],
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x3300CFFF),
            blurRadius: 24,
            offset: Offset(0, 14),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const RadialGradient(
                  colors: [
                    Color(0xFFE3D4A5),
                    Color(0xFFC9964B),
                    Color(0xFF7A4120),
                  ],
                  stops: [0.15, 0.58, 1.0],
                ),
                image: heroPlaylist?.coverArt != null &&
                        heroPlaylist!.coverArt!.isNotEmpty
                    ? DecorationImage(
                        image: NetworkImage(heroPlaylist!.coverArt!),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
              child: heroPlaylist?.coverArt == null
                  ? const Icon(
                      Icons.library_music_rounded,
                      color: Color(0x55000000),
                      size: 64,
                    )
                  : null,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'TU MIX',
            style: theme.textTheme.labelLarge?.copyWith(
              color: PlaylistScreen._accentCyan,
              letterSpacing: 2.2,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.headlineMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              height: 1.05,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              GestureDetector(
                onTap: onPlay,
                child: Container(
                  width: 52,
                  height: 52,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: PlaylistScreen._lightBlue,
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x6600CFFF),
                        blurRadius: 18,
                        offset: Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.play_arrow_rounded,
                    color: PlaylistScreen._bgDark,
                    size: 30,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  '$trackCount canciones',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.bodySmall?.copyWith(
              color: Colors.white38,
              letterSpacing: 0.9,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Mini player (bound to PlayerController)
// ---------------------------------------------------------------------------

class _MiniPlayer extends ConsumerWidget {
  const _MiniPlayer();

  static const Color _accentCyan = Color(0xFF00CFFF);
  static const Color _lightBlue = Color(0xFF4FC3F7);
  static const Color _bgDark = Color(0xFF08131C);
  static const Color _cardSoft = Color(0xFF17242E);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final player = ref.watch(playerControllerProvider);
    final controller = ref.read(playerControllerProvider.notifier);
    final track = player.currentTrack;

    if (track == null) return const SizedBox.shrink();

    final totalMs = player.duration.inMilliseconds;
    final progress = totalMs == 0
        ? 0.0
        : (player.position.inMilliseconds / totalMs).clamp(0.0, 1.0);

    return GestureDetector(
      onTap: () => context.push(AppRoutes.nowPlaying),
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
        decoration: BoxDecoration(
          color: _cardSoft.withValues(alpha: 0.96),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.05),
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x66000000),
              blurRadius: 24,
              offset: Offset(0, 14),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: SizedBox(
                    width: 48,
                    height: 48,
                    child: track.coverArt != null &&
                            track.coverArt!.isNotEmpty
                        ? Image.network(
                            track.coverArt!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => const _CoverFallback(),
                          )
                        : const _CoverFallback(),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        track.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.titleSmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        track.artist,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: _accentCyan,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: controller.previous,
                  icon: const Icon(
                    Icons.skip_previous_rounded,
                    color: Colors.white70,
                  ),
                ),
                GestureDetector(
                  onTap: controller.togglePlay,
                  child: Container(
                    width: 54,
                    height: 54,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: _lightBlue,
                      boxShadow: [
                        BoxShadow(
                          color: Color(0x5500CFFF),
                          blurRadius: 16,
                          offset: Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Icon(
                      player.isPlaying
                          ? Icons.pause_rounded
                          : Icons.play_arrow_rounded,
                      color: _bgDark,
                      size: 30,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: controller.next,
                  icon: const Icon(
                    Icons.skip_next_rounded,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 3,
                backgroundColor: Colors.white12,
                valueColor: const AlwaysStoppedAnimation<Color>(_accentCyan),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CoverFallback extends StatelessWidget {
  const _CoverFallback();

  @override
  Widget build(BuildContext context) {
    return const DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [PlaylistScreen._primaryBlue, PlaylistScreen._accentCyan],
        ),
      ),
      child: Icon(Icons.graphic_eq_rounded, color: Colors.white),
    );
  }
}

// ---------------------------------------------------------------------------
// Track tile
// ---------------------------------------------------------------------------

class _TrackTile extends StatelessWidget {
  const _TrackTile({
    required this.index,
    required this.track,
    required this.onTap,
  });

  final String index;
  final Track track;
  final VoidCallback onTap;

  static String _formatDuration(int ms) {
    final total = ms ~/ 1000;
    final minutes = total ~/ 60;
    final seconds = total % 60;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Row(
        children: [
          SizedBox(
            width: 28,
            child: Text(
              index,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: const Color(0xFFC5D4E0),
              ),
            ),
          ),
          const SizedBox(width: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: SizedBox(
              width: 48,
              height: 48,
              child: track.coverArt != null && track.coverArt!.isNotEmpty
                  ? Image.network(
                      track.coverArt!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => const _CoverFallback(),
                    )
                  : const _CoverFallback(),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  track.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  track.artist,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.white60,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Text(
            _formatDuration(track.durationMs),
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.white70,
            ),
          ),
          IconButton(
            onPressed: onTap,
            icon: const Icon(
              Icons.play_circle_outline_rounded,
              color: PlaylistScreen._lightBlue,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

class _ErrorBlock extends StatelessWidget {
  const _ErrorBlock({required this.theme, required this.onRetry});

  final ThemeData theme;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32),
      child: Column(
        children: [
          Text(
            'No se pudieron cargar las canciones.',
            style: theme.textTheme.bodyLarge?.copyWith(color: Colors.white54),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: onRetry,
            child: const Text(
              'Reintentar',
              style: TextStyle(color: PlaylistScreen._lightBlue),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    this.selected = false,
  });

  final String label;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        gradient: selected
            ? const LinearGradient(
                colors: [PlaylistScreen._primaryBlue, PlaylistScreen._accentCyan],
              )
            : null,
        color: selected ? null : Colors.white.withValues(alpha: 0.04),
        boxShadow: selected
            ? const [
                BoxShadow(
                  color: Color(0x5500CFFF),
                  blurRadius: 18,
                  offset: Offset(0, 6),
                ),
              ]
            : null,
      ),
      child: Text(
        label,
        style: TextStyle(
          color: selected ? PlaylistScreen._bgDark : Colors.white70,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
