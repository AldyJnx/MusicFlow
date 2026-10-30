import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/core/providers/app_settings_provider.dart';
import 'package:musicflow_mobile/features/player/providers/lyrics_provider.dart';
import 'package:musicflow_mobile/features/player/providers/player_controller.dart';
import 'package:musicflow_mobile/shared/models/lyrics.dart';

class LyricsScreen extends ConsumerStatefulWidget {
  const LyricsScreen({super.key});

  @override
  ConsumerState<LyricsScreen> createState() => _LyricsScreenState();
}

class _LyricsScreenState extends ConsumerState<LyricsScreen> {
  static const double _lineExtent = 72;

  final _scrollController = ScrollController();
  int _lastCenteredIndex = -1;
  bool _userIsScrolling = false;
  bool _glowLyrics = true;
  Timer? _resumeAutoScrollTimer;

  @override
  void dispose() {
    _resumeAutoScrollTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = context.musicFlowColors;
    final player = ref.watch(playerControllerProvider);
    final lyricsScale = ref.watch(
      appSettingsProvider.select((settings) => settings.lyricsScale),
    );
    final track = player.currentTrack;

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
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
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
                      'Letras',
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: colors.primary,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () =>
                          setState(() => _glowLyrics = !_glowLyrics),
                      icon: Icon(
                        _glowLyrics
                            ? Icons.auto_awesome_rounded
                            : Icons.text_fields_rounded,
                      ),
                      color: colors.primary,
                      tooltip: _glowLyrics ? 'Modo clásico' : 'Modo brillo',
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                if (track == null)
                  const Expanded(
                    child: _EmptyLyrics(message: 'Reproduce una cancion.'),
                  )
                else ...[
                  _TrackHeader(
                    title: track.title,
                    artist: track.artist,
                    coverArt: track.coverArt,
                  ),
                  const SizedBox(height: 20),
                  Expanded(
                    child: ref
                        .watch(lyricsProvider(track.id))
                        .when(
                          loading: () => const _LyricsLoading(),
                          error: (_, _) => const _EmptyLyrics(
                            message: 'No se pudo cargar la letra.',
                          ),
                          data: (lyrics) => _LyricsBody(
                            lyrics: lyrics,
                            position: player.position,
                            scrollController: _scrollController,
                            lineExtent: _lineExtent,
                            onActiveIndexChanged: _centerActiveLine,
                            onUserScroll: _handleUserScroll,
                            glow: _glowLyrics,
                            onSeek: (time) => ref
                                .read(playerControllerProvider.notifier)
                                .seek(time),
                            textScale: lyricsScale,
                          ),
                        ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _centerActiveLine(int index) {
    if (index < 0 || index == _lastCenteredIndex || _userIsScrolling) {
      return;
    }
    _lastCenteredIndex = index;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      final viewport = _scrollController.position.viewportDimension;
      final target = (index * _lineExtent) - (viewport / 2) + (_lineExtent / 2);
      _scrollController.animateTo(
        target.clamp(0.0, _scrollController.position.maxScrollExtent),
        duration: const Duration(milliseconds: 520),
        curve: Curves.easeOutCubic,
      );
    });
  }

  void _handleUserScroll(bool isScrolling) {
    _resumeAutoScrollTimer?.cancel();
    if (isScrolling) {
      _userIsScrolling = true;
      return;
    }

    _resumeAutoScrollTimer = Timer(const Duration(milliseconds: 900), () {
      if (!mounted) return;
      _userIsScrolling = false;
      _lastCenteredIndex = -1;
    });
  }
}

class _TrackHeader extends StatelessWidget {
  const _TrackHeader({
    required this.title,
    required this.artist,
    required this.coverArt,
  });

  final String title;
  final String artist;
  final String? coverArt;

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    final theme = Theme.of(context);

    return Row(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: SizedBox(
            width: 64,
            height: 64,
            child: coverArt != null && coverArt!.isNotEmpty
                ? Image.network(
                    coverArt!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => const _CoverFallback(),
                  )
                : const _CoverFallback(),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.titleMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  height: 1.08,
                ),
              ),
              const SizedBox(height: 5),
              Text(
                artist,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: colors.secondary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _LyricsBody extends StatelessWidget {
  const _LyricsBody({
    required this.lyrics,
    required this.position,
    required this.scrollController,
    required this.lineExtent,
    required this.onActiveIndexChanged,
    required this.onUserScroll,
    required this.glow,
    required this.onSeek,
    required this.textScale,
  });

  final LyricsResponse lyrics;
  final Duration position;
  final ScrollController scrollController;
  final double lineExtent;
  final ValueChanged<int> onActiveIndexChanged;
  final ValueChanged<bool> onUserScroll;
  final bool glow;
  final ValueChanged<Duration> onSeek;
  final double textScale;

  @override
  Widget build(BuildContext context) {
    final lines = lyrics.lines;
    if (lines.isEmpty) {
      return const _EmptyLyrics(message: 'Esta cancion aun no tiene letra.');
    }

    final activeIndex = _activeIndex(lines, position);
    onActiveIndexChanged(activeIndex);

    return NotificationListener<UserScrollNotification>(
      onNotification: (notification) {
        onUserScroll(notification.direction != ScrollDirection.idle);
        return false;
      },
      child: ShaderMask(
        shaderCallback: (rect) {
          return const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.transparent,
              Colors.white,
              Colors.white,
              Colors.transparent,
            ],
            stops: [0.0, 0.08, 0.9, 1.0],
          ).createShader(rect);
        },
        blendMode: BlendMode.dstIn,
        child: ListView.builder(
          controller: scrollController,
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(vertical: 140),
          itemExtent: lineExtent,
          cacheExtent: lineExtent * 8,
          itemCount: lines.length,
          itemBuilder: (context, index) {
            final isActive = index == activeIndex;
            final distance = activeIndex == -1
                ? 0
                : (index - activeIndex).abs().clamp(0, 4);
            return _LyricRow(
              line: lines[index].text,
              wordProgress: _lineProgress(lines, index, position),
              onTap: lines[index].time == null
                  ? null
                  : () => onSeek(lines[index].time!),
              glow: glow,
              isActive: isActive,
              opacity: activeIndex == -1
                  ? 0.9
                  : isActive
                  ? 1
                  : 0.78 - (distance * 0.12),
              textScale: textScale,
            );
          },
        ),
      ),
    );
  }

  int _activeIndex(List<LyricLine> lines, Duration position) {
    if (lines.every((line) => line.time == null)) return -1;

    var active = -1;
    for (var i = 0; i < lines.length; i++) {
      final time = lines[i].time;
      if (time == null) continue;
      if (time <= position) {
        active = i;
      } else {
        break;
      }
    }
    return active;
  }

  double _lineProgress(List<LyricLine> lines, int index, Duration position) {
    final start = lines[index].time;
    if (start == null) return 0;
    final next = lines
        .skip(index + 1)
        .map((line) => line.time)
        .firstWhere(
          (time) => time != null,
          orElse: () => start + const Duration(seconds: 4),
        );
    final elapsed = position - start;
    final duration = next! - start;
    if (duration.inMilliseconds <= 0) return 1;
    return (elapsed.inMilliseconds / duration.inMilliseconds)
        .clamp(0.0, 1.0)
        .toDouble();
  }
}

class _LyricRow extends StatelessWidget {
  const _LyricRow({
    required this.line,
    required this.isActive,
    required this.opacity,
    required this.glow,
    required this.wordProgress,
    required this.textScale,
    this.onTap,
  });

  final String line;
  final bool isActive;
  final double opacity;
  final bool glow;
  final double wordProgress;
  final double textScale;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 260),
        opacity: opacity.clamp(0.25, 1),
        child: AnimatedScale(
          duration: const Duration(milliseconds: 260),
          curve: Curves.easeOutCubic,
          alignment: Alignment.centerLeft,
          scale: isActive ? 1 : 0.98,
          child: AnimatedDefaultTextStyle(
            duration: const Duration(milliseconds: 260),
            curve: Curves.easeOutCubic,
            style: TextStyle(
              color: Colors.white,
              fontSize: (isActive ? 24 : 19) * textScale,
              height: 1.16,
              fontWeight: isActive ? FontWeight.w900 : FontWeight.w700,
            ),
            child: Padding(
              padding: const EdgeInsets.only(left: 6, right: 10),
              child: Align(
                alignment: Alignment.centerLeft,
                child: glow && isActive
                    ? _ProgressiveLyricText(
                        text: line,
                        progress: wordProgress,
                        style: const TextStyle(color: Colors.white),
                      )
                    : Text(line, maxLines: 2, overflow: TextOverflow.ellipsis),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The web player fills each word as the media clock crosses its proportional
/// slice of the active LRC line. Keep the same behavior here, but use white
/// opacity only so lyrics remain readable in every selected application theme.
class _ProgressiveLyricText extends StatelessWidget {
  const _ProgressiveLyricText({
    required this.text,
    required this.progress,
    required this.style,
  });

  final String text;
  final double progress;
  final TextStyle style;

  @override
  Widget build(BuildContext context) {
    final words = text
        .trim()
        .split(RegExp(r'\s+'))
        .where((word) => word.isNotEmpty)
        .toList();
    if (words.isEmpty) return const Text('♪');

    final cursor = progress.clamp(0.0, 1.0).toDouble() * words.length;
    return Wrap(
      spacing: 7,
      runSpacing: 2,
      children: List.generate(words.length, (index) {
        final fill = (cursor - index).clamp(0.0, 1.0).toDouble();
        return _LyricWord(word: words[index], fill: fill, style: style);
      }),
    );
  }
}

class _LyricWord extends StatelessWidget {
  const _LyricWord({
    required this.word,
    required this.fill,
    required this.style,
  });

  final String word;
  final double fill;
  final TextStyle style;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(end: fill),
      // Position updates arrive about every 60 ms. Let each word interpolate
      // across several samples, just like the requestAnimationFrame-based web
      // player, instead of visibly stepping between audio clock updates.
      duration: const Duration(milliseconds: 220),
      curve: Curves.linear,
      child: Text(word, style: style),
      builder: (context, animatedFill, child) {
        return ShaderMask(
          blendMode: BlendMode.srcIn,
          shaderCallback: (bounds) => LinearGradient(
            colors: [
              Colors.white,
              Colors.white,
              Colors.white.withValues(alpha: 0.32),
              Colors.white.withValues(alpha: 0.32),
            ],
            stops: [0, animatedFill, animatedFill, 1],
          ).createShader(bounds),
          child: child,
        );
      },
    );
  }
}

class _LyricsLoading extends StatelessWidget {
  const _LyricsLoading();

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return Center(
      child: CircularProgressIndicator(color: colors.primary, strokeWidth: 3),
    );
  }
}

class _EmptyLyrics extends StatelessWidget {
  const _EmptyLyrics({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        message,
        textAlign: TextAlign.center,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
          color: Colors.white60,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _CoverFallback extends StatelessWidget {
  const _CoverFallback();

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return ColoredBox(
      color: colors.surface,
      child: Icon(Icons.music_note_rounded, color: colors.primary),
    );
  }
}
