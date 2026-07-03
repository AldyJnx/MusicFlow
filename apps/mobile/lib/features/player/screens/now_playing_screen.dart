import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/cast/cast_service.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/features/library/providers/playlists_providers.dart';
import 'package:musicflow_mobile/features/library/providers/tracks_providers.dart';
import 'package:musicflow_mobile/features/player/providers/player_controller.dart';

class NowPlayingScreen extends ConsumerWidget {
  const NowPlayingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colors = context.musicFlowColors;
    final player = ref.watch(playerControllerProvider);
    final controller = ref.read(playerControllerProvider.notifier);
    final track = player.currentTrack;
    final savedIds = track == null
        ? const <String>{}
        : ref
              .watch(savedTrackIdsProvider(track.id))
              .maybeWhen(data: (ids) => ids, orElse: () => const <String>{});
    final isSaved = track != null && savedIds.contains(track.id);
    final hasPrevious =
        track != null &&
        (player.queueIndex > 0 || player.position > const Duration(seconds: 3));
    final hasNext =
        track != null && player.queueIndex < player.queue.length - 1;
    final progress = player.duration.inMilliseconds <= 0
        ? 0.0
        : (player.position.inMilliseconds / player.duration.inMilliseconds)
              .clamp(0.0, 1.0);

    return Scaffold(
      backgroundColor: colors.background,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              colors.gradientStart,
              colors.gradientEnd,
              colors.background,
            ],
            stops: [0.0, 0.28, 0.78],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
            child: Column(
              children: [
                Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.of(context).maybePop(),
                      icon: const Icon(Icons.keyboard_arrow_down_rounded),
                      color: Colors.white,
                      iconSize: 34,
                    ),
                    const Spacer(),
                    Text(
                      'MusicFlow',
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: colors.primary,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const Spacer(),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          onPressed: track == null
                              ? null
                              : () => context.push(AppRoutes.temporalSegments),
                          icon: const Icon(Icons.timeline_rounded),
                          color: colors.primary,
                          disabledColor: Colors.white24,
                          iconSize: 27,
                          tooltip: 'Segmentacion temporal',
                        ),
                        IconButton(
                          onPressed: track == null
                              ? null
                              : () => context.push(AppRoutes.equalizer),
                          icon: const Icon(Icons.equalizer_rounded),
                          color: colors.primary,
                          disabledColor: Colors.white24,
                          iconSize: 28,
                          tooltip: 'Ecualizador',
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Expanded(
                  child: Center(
                    child: AspectRatio(
                      aspectRatio: 1,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(34),
                        child:
                            track?.coverArt != null &&
                                track!.coverArt!.isNotEmpty
                            ? Image.network(
                                track.coverArt!,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) =>
                                    const _ExpandedCoverFallback(),
                              )
                            : const _ExpandedCoverFallback(),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 28),
                Text(
                  track?.title ?? 'Selecciona una canción',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    height: 1.08,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  track?.artist ?? 'MusicFlow',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: colors.secondary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 22),
                Row(
                  children: [
                    _CircleActionButton(
                      icon: isSaved
                          ? Icons.favorite_rounded
                          : Icons.favorite_border_rounded,
                      color: isSaved ? const Color(0xFFFF4F7A) : Colors.white70,
                      onPressed: track == null
                          ? null
                          : () => _toggleFavorite(ref, track.id, isSaved),
                    ),
                    const Spacer(),
                    _CircleActionButton(
                      icon: Icons.library_add_rounded,
                      color: colors.primary,
                      onPressed: track == null
                          ? null
                          : () => _showLibraryPicker(context, ref, track.id),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    trackHeight: 5,
                    activeTrackColor: colors.primary,
                    inactiveTrackColor: Colors.white.withOpacity(0.12),
                    thumbColor: Colors.white,
                    overlayColor: colors.primary.withValues(alpha: 0.15),
                  ),
                  child: Slider(
                    value: progress,
                    onChanged: track == null
                        ? null
                        : (value) => controller.seek(
                            Duration(
                              milliseconds:
                                  (player.duration.inMilliseconds * value)
                                      .round(),
                            ),
                          ),
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _formatDuration(player.position),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.white70,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      _formatDuration(player.duration),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.white70,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 26),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    IconButton(
                      onPressed: hasPrevious ? controller.previous : null,
                      icon: const Icon(Icons.skip_previous_rounded),
                      color: Colors.white,
                      disabledColor: Colors.white24,
                      iconSize: 38,
                    ),
                    const SizedBox(width: 18),
                    Container(
                      width: 86,
                      height: 86,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: colors.secondary,
                        boxShadow: [
                          BoxShadow(
                            color: colors.shadow.withValues(alpha: 0.36),
                            blurRadius: 26,
                            offset: Offset(0, 10),
                          ),
                        ],
                      ),
                      child: IconButton(
                        onPressed: controller.togglePlay,
                        icon: Icon(
                          player.isPlaying
                              ? Icons.pause_rounded
                              : Icons.play_arrow_rounded,
                          color: colors.background,
                        ),
                        iconSize: 44,
                      ),
                    ),
                    const SizedBox(width: 18),
                    IconButton(
                      onPressed: hasNext ? controller.next : null,
                      icon: const Icon(Icons.skip_next_rounded),
                      color: Colors.white,
                      disabledColor: Colors.white24,
                      iconSize: 38,
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _CircleActionButton(
                      icon: Icons.cast_rounded,
                      color: colors.primary,
                      onPressed: track == null
                          ? null
                          : () => _openCastPicker(context),
                    ),
                    _CircleActionButton(
                      icon: Icons.mic_external_on_rounded,
                      color: colors.primary,
                      onPressed: track == null
                          ? null
                          : () => context.push(AppRoutes.lyrics),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds.remainder(60);
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }

  Future<void> _openCastPicker(BuildContext context) async {
    final result = await const CastService().openCastPicker();
    if (!context.mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(result.message)));
  }

  Future<void> _toggleFavorite(
    WidgetRef ref,
    String trackId,
    bool isSaved,
  ) async {
    final repo = ref.read(tracksRepositoryProvider);
    try {
      if (isSaved) {
        await repo.unsaveTrack(trackId);
      } else {
        await repo.saveTrack(trackId);
      }
      ref.invalidate(savedTrackIdsProvider(trackId));
      ref.invalidate(savedTracksListProvider(const TracksQuery(take: 5)));
    } catch (_) {
      // Keep playback uninterrupted if the network request fails.
    }
  }

  Future<void> _showLibraryPicker(
    BuildContext context,
    WidgetRef ref,
    String trackId,
  ) async {
    final playlists = await ref.read(playlistsProvider.future);
    if (!context.mounted) return;

    if (playlists.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Primero crea una biblioteca en Biblioteca.'),
        ),
      );
      return;
    }

    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: context.musicFlowColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      builder: (context) {
        final colors = context.musicFlowColors;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'Guardar en biblioteca',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.close_rounded),
                      color: Colors.white70,
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ...playlists.map(
                  (playlist) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      backgroundColor: colors.primary,
                      child: Icon(
                        Icons.library_music_rounded,
                        color: colors.background,
                      ),
                    ),
                    title: Text(
                      playlist.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    subtitle: Text(
                      '${playlist.trackCount} canciones',
                      style: const TextStyle(color: Colors.white60),
                    ),
                    onTap: () async {
                      try {
                        await ref
                            .read(playlistsRepositoryProvider)
                            .addTrack(
                              playlistId: playlist.id,
                              trackId: trackId,
                            );
                        ref.invalidate(playlistsProvider);
                        if (context.mounted) Navigator.of(context).pop();
                      } catch (_) {
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'No se pudo guardar en esa biblioteca.',
                            ),
                          ),
                        );
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _CircleActionButton extends StatelessWidget {
  const _CircleActionButton({
    required this.icon,
    required this.color,
    required this.onPressed,
  });

  final IconData icon;
  final Color color;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton.filled(
      onPressed: onPressed,
      style: IconButton.styleFrom(
        fixedSize: const Size(52, 52),
        backgroundColor: Colors.white.withOpacity(0.08),
        disabledBackgroundColor: Colors.white.withOpacity(0.04),
      ),
      icon: Icon(icon, color: color),
    );
  }
}

class _ExpandedCoverFallback extends StatelessWidget {
  const _ExpandedCoverFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1E90FF), Color(0xFF00CFFF)],
        ),
      ),
      child: const Icon(
        Icons.music_note_rounded,
        color: Colors.white,
        size: 92,
      ),
    );
  }
}
