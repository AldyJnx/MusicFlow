import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
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
          image: track?.coverArt?.isNotEmpty == true
              ? DecorationImage(
                  image: NetworkImage(track!.coverArt!),
                  fit: BoxFit.cover,
                  opacity: 0.46,
                )
              : null,
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              colors.gradientStart.withValues(alpha: 0.42),
              colors.gradientEnd.withValues(alpha: 0.56),
              colors.background.withValues(alpha: 0.9),
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
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            track?.title ?? 'MusicFlow',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.titleSmall?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            track?.artist ?? 'Reproductor',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: Colors.white60,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          onPressed: player.queue.isEmpty
                              ? null
                              : () => showModalBottomSheet<void>(
                                  context: context,
                                  backgroundColor: colors.surface,
                                  builder: (sheetContext) => SafeArea(
                                    child: SizedBox(
                                      height: 254,
                                      child: Padding(
                                        padding: const EdgeInsets.only(
                                          top: 18,
                                          bottom: 20,
                                        ),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Padding(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    horizontal: 20,
                                                  ),
                                              child: Text(
                                                'Cola de canciones',
                                                style: Theme.of(sheetContext)
                                                    .textTheme
                                                    .titleMedium
                                                    ?.copyWith(
                                                      color: Colors.white,
                                                      fontWeight:
                                                          FontWeight.w800,
                                                    ),
                                              ),
                                            ),
                                            const SizedBox(height: 14),
                                            Expanded(
                                              child: ListView.separated(
                                                scrollDirection:
                                                    Axis.horizontal,
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      horizontal: 20,
                                                    ),
                                                itemCount: player.queue.length,
                                                separatorBuilder: (_, _) =>
                                                    const SizedBox(width: 12),
                                                itemBuilder: (_, index) {
                                                  final queued =
                                                      player.queue[index];
                                                  final isCurrent =
                                                      index ==
                                                      player.queueIndex;
                                                  return SizedBox(
                                                    width: 142,
                                                    child: Material(
                                                      color: Colors.transparent,
                                                      child: InkWell(
                                                        borderRadius:
                                                            BorderRadius.circular(
                                                              18,
                                                            ),
                                                        onTap: () async {
                                                          await controller
                                                              .setQueueIndex(
                                                                index,
                                                              );
                                                          if (sheetContext
                                                              .mounted) {
                                                            Navigator.of(
                                                              sheetContext,
                                                            ).pop();
                                                          }
                                                        },
                                                        child: Ink(
                                                          decoration: BoxDecoration(
                                                            color: isCurrent
                                                                ? colors.primary
                                                                      .withValues(
                                                                        alpha:
                                                                            0.2,
                                                                      )
                                                                : Colors.white
                                                                      .withValues(
                                                                        alpha:
                                                                            0.06,
                                                                      ),
                                                            borderRadius:
                                                                BorderRadius.circular(
                                                                  18,
                                                                ),
                                                            border: Border.all(
                                                              color: isCurrent
                                                                  ? colors
                                                                        .primary
                                                                  : Colors.white
                                                                        .withValues(
                                                                          alpha:
                                                                              0.1,
                                                                        ),
                                                            ),
                                                          ),
                                                          child: Padding(
                                                            padding:
                                                                const EdgeInsets.all(
                                                                  10,
                                                                ),
                                                            child: Column(
                                                              crossAxisAlignment:
                                                                  CrossAxisAlignment
                                                                      .start,
                                                              children: [
                                                                Expanded(
                                                                  child: ClipRRect(
                                                                    borderRadius:
                                                                        BorderRadius.circular(
                                                                          12,
                                                                        ),
                                                                    child:
                                                                        queued.coverArt?.isNotEmpty ==
                                                                            true
                                                                        ? Image.network(
                                                                            queued.coverArt!,
                                                                            width:
                                                                                double.infinity,
                                                                            fit:
                                                                                BoxFit.cover,
                                                                            errorBuilder:
                                                                                (
                                                                                  _,
                                                                                  _,
                                                                                  _,
                                                                                ) => const _QueueCoverFallback(),
                                                                          )
                                                                        : const _QueueCoverFallback(),
                                                                  ),
                                                                ),
                                                                const SizedBox(
                                                                  height: 8,
                                                                ),
                                                                Text(
                                                                  queued.title,
                                                                  maxLines: 1,
                                                                  overflow:
                                                                      TextOverflow
                                                                          .ellipsis,
                                                                  style: const TextStyle(
                                                                    color: Colors
                                                                        .white,
                                                                    fontWeight:
                                                                        FontWeight
                                                                            .w800,
                                                                  ),
                                                                ),
                                                                Text(
                                                                  queued.artist,
                                                                  maxLines: 1,
                                                                  overflow:
                                                                      TextOverflow
                                                                          .ellipsis,
                                                                  style: TextStyle(
                                                                    color:
                                                                        isCurrent
                                                                        ? colors
                                                                              .primary
                                                                        : Colors
                                                                              .white60,
                                                                    fontSize:
                                                                        12,
                                                                  ),
                                                                ),
                                                              ],
                                                            ),
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                  );
                                                },
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                          icon: const Icon(Icons.queue_music_rounded),
                          color: colors.primary,
                          disabledColor: Colors.white24,
                          tooltip: 'Cola de canciones',
                        ),
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
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      return GestureDetector(
                        behavior: HitTestBehavior.translucent,
                        onHorizontalDragEnd: (details) {
                          final velocity = details.primaryVelocity ?? 0;
                          if (velocity <= -280 && hasNext) {
                            controller.next();
                          } else if (velocity >= 280 && hasPrevious) {
                            controller.previous();
                          }
                        },
                        child: const SizedBox.expand(),
                      );
                    },
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
                InkWell(
                  onTap: track == null
                      ? null
                      : () =>
                            context.push(AppRoutes.artistDetail(track.artist)),
                  borderRadius: BorderRadius.circular(999),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    child: Text(
                      track?.artist ?? 'MusicFlow',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: colors.secondary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
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
                _OrbitalPlayerControls(
                  progress: progress,
                  positionLabel: _formatDuration(player.position),
                  playing: player.isPlaying,
                  repeatMode: player.repeatMode,
                  onSeek: track == null
                      ? null
                      : (value) => controller.seek(
                          Duration(
                            milliseconds:
                                (player.duration.inMilliseconds * value)
                                    .round(),
                          ),
                        ),
                  onPrevious: hasPrevious ? controller.previous : null,
                  onToggle: controller.togglePlay,
                  onNext: hasNext ? controller.next : null,
                  onRepeat: controller.cycleRepeatMode,
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const SizedBox.square(dimension: 48),
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

class _OrbitalPlayerControls extends StatelessWidget {
  const _OrbitalPlayerControls({
    required this.progress,
    required this.positionLabel,
    required this.playing,
    required this.repeatMode,
    required this.onSeek,
    required this.onPrevious,
    required this.onToggle,
    required this.onNext,
    required this.onRepeat,
  });

  final double progress;
  final String positionLabel;
  final bool playing;
  final PlayerRepeatMode repeatMode;
  final ValueChanged<double>? onSeek;
  final VoidCallback? onPrevious;
  final VoidCallback onToggle;
  final VoidCallback? onNext;
  final Future<void> Function() onRepeat;

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return LayoutBuilder(
      builder: (context, constraints) {
        final diameter = math.min(constraints.maxWidth, 340.0).toDouble();
        final horizontalInset = (constraints.maxWidth - diameter) / 2;

        void seekFromArc(Offset localPosition) {
          if (onSeek == null) return;
          final center = Offset(diameter / 2, diameter / 2);
          final angle = math.atan2(
            localPosition.dy - center.dy,
            localPosition.dx - center.dx,
          );
          const startAngle = math.pi;
          const sweepAngle = math.pi;
          var traveled = angle - startAngle;
          while (traveled < 0) {
            traveled += math.pi * 2;
          }
          onSeek!((traveled / sweepAngle).clamp(0.0, 1.0));
        }

        return SizedBox(
          height: diameter + 24,
          child: Stack(
            alignment: Alignment.topCenter,
            children: [
              Positioned(
                top: 4,
                left: horizontalInset,
                width: diameter,
                height: diameter,
                child: CustomPaint(
                  painter: _PlaybackOrbPainter(
                    progress: progress,
                    accent: colors.primary,
                  ),
                ),
              ),
              Positioned(
                top: 4,
                left: horizontalInset,
                width: diameter,
                height: diameter,
                child: Semantics(
                  label: 'Progreso de reproduccion',
                  slider: true,
                  value: '${(progress * 100).round()}%',
                  child: GestureDetector(
                    behavior: HitTestBehavior.translucent,
                    onTapDown: (details) => seekFromArc(details.localPosition),
                    onPanUpdate: (details) =>
                        seekFromArc(details.localPosition),
                  ),
                ),
              ),
              Positioned(
                top: 98,
                child: Text(positionLabel, style: _timeStyle),
              ),
              Positioned(
                top: 164,
                left: horizontalInset + diameter * 0.12,
                child: IconButton(
                  onPressed: onPrevious,
                  icon: const Icon(Icons.skip_previous_rounded),
                  iconSize: 42,
                  color: Colors.white,
                  disabledColor: Colors.white24,
                ),
              ),
              Positioned(
                top: 164,
                right: horizontalInset + diameter * 0.12,
                child: IconButton(
                  onPressed: onNext,
                  icon: const Icon(Icons.skip_next_rounded),
                  iconSize: 42,
                  color: Colors.white,
                  disabledColor: Colors.white24,
                ),
              ),
              Positioned(
                top: 156,
                child: Container(
                  width: 104,
                  height: 104,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                    border: Border.all(color: colors.primary, width: 9),
                    boxShadow: [
                      BoxShadow(
                        color: colors.primary.withValues(alpha: 0.72),
                        blurRadius: 30,
                        spreadRadius: 4,
                      ),
                    ],
                  ),
                  child: IconButton(
                    onPressed: onToggle,
                    icon: Icon(
                      playing ? Icons.pause_rounded : Icons.play_arrow_rounded,
                      color: colors.background,
                    ),
                    iconSize: 48,
                  ),
                ),
              ),
              Positioned(
                top: 242,
                left: horizontalInset + diameter * 0.15,
                child: const Icon(Icons.shuffle_rounded, color: Colors.white54),
              ),
              Positioned(
                top: 234,
                right: horizontalInset + diameter * 0.15,
                child: IconButton(
                  onPressed: onRepeat,
                  tooltip: switch (repeatMode) {
                    PlayerRepeatMode.off => 'Repetir desactivado',
                    PlayerRepeatMode.all => 'Repetir cola',
                    PlayerRepeatMode.one => 'Repetir una canción',
                  },
                  style: IconButton.styleFrom(
                    backgroundColor: repeatMode == PlayerRepeatMode.off
                        ? Colors.black.withValues(alpha: 0.2)
                        : colors.primary.withValues(alpha: 0.28),
                  ),
                  icon: Icon(
                    repeatMode == PlayerRepeatMode.one
                        ? Icons.repeat_one_rounded
                        : Icons.repeat_rounded,
                    color: repeatMode == PlayerRepeatMode.off
                        ? Colors.white54
                        : colors.primary,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  static const _timeStyle = TextStyle(
    color: Colors.white70,
    fontWeight: FontWeight.w700,
  );
}

class _PlaybackOrbPainter extends CustomPainter {
  const _PlaybackOrbPainter({required this.progress, required this.accent});

  final double progress;
  final Color accent;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.shortestSide / 2 - 8;
    // A fixed upper semicircle: its geometry never depends on song duration.
    // Both endpoints remain level with the playback controls, opening upward.
    const startAngle = math.pi;
    const sweepAngle = math.pi;
    final trackPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.16)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    final progressPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 3;
    final glowPaint = Paint()
      ..color = accent.withValues(alpha: 0.26)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 24);

    canvas.drawCircle(center, radius * 0.68, glowPaint);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      trackPaint,
    );
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle * progress,
      false,
      progressPaint,
    );
    final thumbAngle = startAngle + sweepAngle * progress;
    final thumbCenter = Offset(
      center.dx + radius * math.cos(thumbAngle),
      center.dy + radius * math.sin(thumbAngle),
    );
    canvas.drawCircle(thumbCenter, 5, Paint()..color = Colors.white);
  }

  @override
  bool shouldRepaint(covariant _PlaybackOrbPainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.accent != accent;
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
        backgroundColor: Colors.white.withValues(alpha: 0.08),
        disabledBackgroundColor: Colors.white.withValues(alpha: 0.04),
      ),
      icon: Icon(icon, color: color),
    );
  }
}

class _QueueCoverFallback extends StatelessWidget {
  const _QueueCoverFallback();

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return ColoredBox(
      color: colors.cardGradientStart,
      child: Center(
        child: Icon(Icons.music_note_rounded, color: colors.primary, size: 36),
      ),
    );
  }
}
