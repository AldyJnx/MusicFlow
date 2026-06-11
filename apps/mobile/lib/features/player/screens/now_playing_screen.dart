import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/features/player/providers/player_controller.dart';
import 'package:musicflow_mobile/shared/models/track.dart';

class NowPlayingScreen extends ConsumerWidget {
  const NowPlayingScreen({super.key});

  static const Color _primaryBlue = Color(0xFF1E90FF);
  static const Color _accentCyan = Color(0xFF00CFFF);
  static const Color _lightBlue = Color(0xFF4FC3F7);
  static const Color _bgDark = Color(0xFF071A24);
  static const Color _bgMid = Color(0xFF0A2230);
  static const Color _bgTop = Color(0xFF0E3447);
  static const Color _cardDark = Color(0xFF161D25);

  static String _formatDuration(Duration d) {
    final minutes = d.inMinutes;
    final seconds = d.inSeconds % 60;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }

  void _onNavTap(BuildContext context, int index) {
    final route = switch (index) {
      0 => AppRoutes.home,
      1 => AppRoutes.playlists,
      2 => AppRoutes.equalizer,
      3 => AppRoutes.aiAgent,
      4 => AppRoutes.premium,
      _ => null,
    };
    if (route == null) return;
    if (route == AppRoutes.home || route == AppRoutes.playlists) {
      context.go(route);
    } else {
      context.push(route);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final player = ref.watch(playerControllerProvider);
    final controller = ref.read(playerControllerProvider.notifier);
    final Track? track = player.currentTrack;

    return Scaffold(
      backgroundColor: _bgDark,
      bottomNavigationBar: Container(
        margin: const EdgeInsets.fromLTRB(10, 0, 10, 12),
        decoration: BoxDecoration(
          color: const Color(0xFF111A22).withOpacity(0.96),
          borderRadius: BorderRadius.circular(28),
          boxShadow: const [
            BoxShadow(
              color: Color(0x33000000),
              blurRadius: 18,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: 0,
          onTap: (index) => _onNavTap(context, index),
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: _accentCyan,
          unselectedItemColor: Colors.white38,
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
              icon: Icon(Icons.equalizer_rounded),
              label: 'Ecualizador',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.auto_awesome_outlined),
              activeIcon: Icon(Icons.auto_awesome_rounded),
              label: 'IA',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.workspace_premium_outlined),
              activeIcon: Icon(Icons.workspace_premium_rounded),
              label: 'Premium',
            ),
          ],
        ),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [_bgTop, _bgMid, _bgDark],
            stops: [0.0, 0.2, 0.58],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Row(
                  children: [
                    GestureDetector(
                      onTap: () =>
                          context.canPop() ? context.pop() : context.go(AppRoutes.home),
                      child: Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.06),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.12),
                          ),
                        ),
                        child: const Icon(
                          Icons.chevron_left_rounded,
                          size: 24,
                          color: Colors.white70,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'MusicFlow',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        color: _accentCyan,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const Spacer(),
                    const Icon(
                      Icons.workspace_premium_rounded,
                      color: _accentCyan,
                      size: 22,
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                if (track == null)
                  _EmptyState(theme: theme)
                else ...[
                  _AlbumArt(track: track),
                  const SizedBox(height: 26),
                  Text(
                    track.title,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    track.artist,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.titleLarge?.copyWith(
                      color: _lightBlue,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _ProgressBar(
                    position: player.position,
                    duration: player.duration,
                    onSeek: controller.seek,
                  ),
                  const SizedBox(height: 20),
                  _TransportControls(
                    isPlaying: player.isPlaying,
                    onPrevious: controller.previous,
                    onTogglePlay: controller.togglePlay,
                    onNext: controller.next,
                  ),
                ],
                const SizedBox(height: 34),
                Row(
                  children: [
                    Expanded(
                      child: _QuickActionCard(
                        title: 'ECUALIZADOR',
                        icon: Icons.equalizer_rounded,
                        glow: false,
                        onTap: () => context.push(AppRoutes.equalizer),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: _QuickActionCard(
                        title: 'PREMIUM',
                        icon: Icons.lock_rounded,
                        glow: true,
                        onTap: () => context.push(AppRoutes.premium),
                      ),
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
}

class _AlbumArt extends StatelessWidget {
  const _AlbumArt({required this.track});

  final Track track;

  @override
  Widget build(BuildContext context) {
    final hasCover = track.coverArt != null && track.coverArt!.isNotEmpty;

    return Center(
      child: Container(
        width: 286,
        height: 286,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(36),
          gradient: const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF2A1418), Color(0xFF151117)],
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x2200CFFF),
              blurRadius: 18,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: hasCover
            ? ClipRRect(
                borderRadius: BorderRadius.circular(36),
                child: Image.network(
                  track.coverArt!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const _Vinyl(),
                ),
              )
            : const _Vinyl(),
      ),
    );
  }
}

class _Vinyl extends StatelessWidget {
  const _Vinyl();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 180,
        height: 180,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [
              NowPlayingScreen._accentCyan.withOpacity(0.4),
              Colors.white.withOpacity(0.16),
              Colors.transparent,
            ],
            stops: const [0.02, 0.18, 1],
          ),
        ),
        child: CustomPaint(
          painter: _VinylPainter(),
        ),
      ),
    );
  }
}

class _ProgressBar extends StatelessWidget {
  const _ProgressBar({
    required this.position,
    required this.duration,
    required this.onSeek,
  });

  final Duration position;
  final Duration duration;
  final ValueChanged<Duration> onSeek;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final totalMs = duration.inMilliseconds;
    final posMs = position.inMilliseconds.clamp(0, totalMs == 0 ? 1 : totalMs);

    return Column(
      children: [
        SliderTheme(
          data: SliderThemeData(
            trackHeight: 4,
            activeTrackColor: NowPlayingScreen._accentCyan,
            inactiveTrackColor: Colors.white.withOpacity(0.14),
            thumbColor: NowPlayingScreen._lightBlue,
            overlayColor: NowPlayingScreen._accentCyan.withOpacity(0.18),
            thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
          ),
          child: Slider(
            value: posMs.toDouble(),
            max: totalMs == 0 ? 1 : totalMs.toDouble(),
            onChanged: totalMs == 0
                ? null
                : (v) => onSeek(Duration(milliseconds: v.round())),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                NowPlayingScreen._formatDuration(position),
                style: theme.textTheme.titleSmall?.copyWith(
                  color: Colors.white70,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                NowPlayingScreen._formatDuration(duration),
                style: theme.textTheme.titleSmall?.copyWith(
                  color: Colors.white70,
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

class _TransportControls extends StatelessWidget {
  const _TransportControls({
    required this.isPlaying,
    required this.onPrevious,
    required this.onTogglePlay,
    required this.onNext,
  });

  final bool isPlaying;
  final VoidCallback onPrevious;
  final VoidCallback onTogglePlay;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(
          Icons.shuffle_rounded,
          color: Colors.white38,
          size: 22,
        ),
        const SizedBox(width: 24),
        GestureDetector(
          onTap: onPrevious,
          child: const Icon(
            Icons.skip_previous_rounded,
            color: Colors.white,
            size: 34,
          ),
        ),
        const SizedBox(width: 22),
        GestureDetector(
          onTap: onTogglePlay,
          child: Container(
            width: 92,
            height: 92,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: NowPlayingScreen._lightBlue,
              boxShadow: [
                BoxShadow(
                  color: Color(0x6600CFFF),
                  blurRadius: 28,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: Icon(
              isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
              color: NowPlayingScreen._bgDark,
              size: 44,
            ),
          ),
        ),
        const SizedBox(width: 22),
        GestureDetector(
          onTap: onNext,
          child: const Icon(
            Icons.skip_next_rounded,
            color: Colors.white,
            size: 34,
          ),
        ),
        const SizedBox(width: 24),
        const Icon(
          Icons.repeat_rounded,
          color: Colors.white38,
          size: 22,
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: NowPlayingScreen._accentCyan.withOpacity(0.1),
            ),
            child: const Icon(
              Icons.music_off_rounded,
              color: NowPlayingScreen._accentCyan,
              size: 52,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'No hay nada reproduciéndose',
            textAlign: TextAlign.center,
            style: theme.textTheme.titleLarge?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Elige una canción desde tu biblioteca para empezar.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyLarge?.copyWith(
              color: Colors.white60,
            ),
          ),
          const SizedBox(height: 22),
          ElevatedButton.icon(
            onPressed: () => context.go(AppRoutes.home),
            style: ElevatedButton.styleFrom(
              backgroundColor: NowPlayingScreen._primaryBlue,
              foregroundColor: Colors.white,
              elevation: 0,
              padding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            icon: const Icon(Icons.library_music_rounded),
            label: const Text('Ir a la biblioteca'),
          ),
        ],
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  const _QuickActionCard({
    required this.title,
    required this.icon,
    required this.glow,
    required this.onTap,
  });

  final String title;
  final IconData icon;
  final bool glow;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 124,
        decoration: BoxDecoration(
          color: glow ? Colors.black : NowPlayingScreen._cardDark,
          borderRadius: BorderRadius.circular(24),
          boxShadow: glow
              ? const [
                  BoxShadow(
                    color: Color(0x3300CFFF),
                    blurRadius: 20,
                    offset: Offset(0, 8),
                  ),
                ]
              : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: glow
                    ? NowPlayingScreen._accentCyan.withOpacity(0.14)
                    : NowPlayingScreen._primaryBlue.withOpacity(0.14),
                boxShadow: glow
                    ? const [
                        BoxShadow(
                          color: Color(0x4400CFFF),
                          blurRadius: 14,
                          offset: Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              child: Icon(
                icon,
                color: glow
                    ? NowPlayingScreen._accentCyan
                    : NowPlayingScreen._primaryBlue,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: theme.textTheme.titleMedium?.copyWith(
                color: glow ? NowPlayingScreen._accentCyan : Colors.white70,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _VinylPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final maxRadius = size.width / 2;
    final ringPaint = Paint()
      ..style = PaintingStyle.stroke
      ..color = const Color(0x66B8FFFF)
      ..strokeWidth = 1;

    for (double radius = 10; radius < maxRadius; radius += 4) {
      canvas.drawCircle(center, radius, ringPaint);
    }

    final glowPaint = Paint()
      ..shader = const RadialGradient(
        colors: [
          Color(0xFF00CFFF),
          Color(0x6626C6FF),
          Colors.transparent,
        ],
        stops: [0.02, 0.2, 1],
      ).createShader(Rect.fromCircle(center: center, radius: 26));

    canvas.drawCircle(center, 24, glowPaint);

    final centerPaint = Paint()..color = const Color(0xFF08131C);
    canvas.drawCircle(center, 8, centerPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
