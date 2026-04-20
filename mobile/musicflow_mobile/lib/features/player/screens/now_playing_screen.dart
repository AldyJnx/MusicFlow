import 'package:flutter/material.dart';

class NowPlayingScreen extends StatelessWidget {
  const NowPlayingScreen({super.key});

  static const Color _primaryBlue = Color(0xFF1E90FF);
  static const Color _accentCyan = Color(0xFF00CFFF);
  static const Color _lightBlue = Color(0xFF4FC3F7);
  static const Color _bgDark = Color(0xFF071A24);
  static const Color _bgMid = Color(0xFF0A2230);
  static const Color _bgTop = Color(0xFF0E3447);
  static const Color _cardDark = Color(0xFF161D25);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

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
          currentIndex: 2,
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
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [Color(0xFF41312C), Color(0xFF1E1C1B)],
                        ),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.12),
                        ),
                      ),
                      child: const Icon(
                        Icons.person_rounded,
                        size: 20,
                        color: Colors.white70,
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
                Center(
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
                    child: Center(
                      child: Container(
                        width: 180,
                        height: 180,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(
                            colors: [
                              _accentCyan.withOpacity(0.4),
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
                    ),
                  ),
                ),
                const SizedBox(height: 26),
                Text(
                  'Paint in Black',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Rolling Stones',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: _lightBlue,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 24),
                Column(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: 0.67,
                        minHeight: 6,
                        backgroundColor: Colors.white.withOpacity(0.14),
                        valueColor: const AlwaysStoppedAnimation<Color>(_accentCyan),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '02:45',
                          style: theme.textTheme.titleSmall?.copyWith(
                            color: Colors.white70,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          '04:12',
                          style: theme.textTheme.titleSmall?.copyWith(
                            color: Colors.white70,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 28),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.open_in_full_rounded,
                      color: Colors.white70,
                      size: 22,
                    ),
                    const SizedBox(width: 24),
                    const Icon(
                      Icons.skip_previous_rounded,
                      color: Colors.white,
                      size: 30,
                    ),
                    const SizedBox(width: 22),
                    Container(
                      width: 92,
                      height: 92,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: _lightBlue,
                        boxShadow: [
                          BoxShadow(
                            color: Color(0x6600CFFF),
                            blurRadius: 28,
                            offset: Offset(0, 10),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.pause_rounded,
                        color: _bgDark,
                        size: 44,
                      ),
                    ),
                    const SizedBox(width: 22),
                    const Icon(
                      Icons.skip_next_rounded,
                      color: Colors.white,
                      size: 30,
                    ),
                    const SizedBox(width: 24),
                    const Icon(
                      Icons.repeat_rounded,
                      color: Colors.white70,
                      size: 22,
                    ),
                  ],
                ),
                const SizedBox(height: 34),
                Row(
                  children: const [
                    Expanded(
                      child: _QuickActionCard(
                        title: 'ECUALIZADOR',
                        icon: Icons.equalizer_rounded,
                        glow: false,
                      ),
                    ),
                    SizedBox(width: 14),
                    Expanded(
                      child: _QuickActionCard(
                        title: 'PREMIUM',
                        icon: Icons.lock_rounded,
                        glow: true,
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

class _QuickActionCard extends StatelessWidget {
  const _QuickActionCard({
    required this.title,
    required this.icon,
    required this.glow,
  });

  final String title;
  final IconData icon;
  final bool glow;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
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
