import 'package:flutter/material.dart';

class BibliotecaScreen extends StatelessWidget {
  const BibliotecaScreen({super.key});

  static const Color _primaryBlue = Color(0xFF1E90FF);
  static const Color _accentCyan = Color(0xFF00CFFF);
  static const Color _lightBlue = Color(0xFF4FC3F7);
  static const Color _bgDark = Color(0xFF08131C);
  static const Color _bgMid = Color(0xFF0B1F2A);
  static const Color _bgTop = Color(0xFF103244);
  static const Color _cardSoft = Color(0xFF17242E);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final tracks = [
      {
        'index': '01',
        'title': 'Cybernetic Pulse',
        'artist': 'Lumina Synthesis',
        'duration': '3:45',
        'favorite': false,
        'colors': [const Color(0xFF274A62), const Color(0xFF0F202E)],
        'icon': Icons.person_rounded,
      },
      {
        'index': '02',
        'title': 'Electric Drift',
        'artist': 'Vector Flow',
        'duration': '4:12',
        'favorite': true,
        'colors': [const Color(0xFFFC8B2A), const Color(0xFF4A2D11)],
        'icon': Icons.album_rounded,
      },
      {
        'index': '03',
        'title': 'Orbit Bloom',
        'artist': 'Nebula Drive',
        'duration': '2:58',
        'favorite': false,
        'colors': [const Color(0xFF19405B), const Color(0xFF0C1B28)],
        'icon': Icons.person_rounded,
      },
      {
        'index': '04',
        'title': 'Static Horizon',
        'artist': 'Pulse Theory',
        'duration': '3:30',
        'favorite': false,
        'colors': [const Color(0xFF8D6B31), const Color(0xFF2B1D0B)],
        'icon': Icons.person_rounded,
      },
    ];

    return Scaffold(
      backgroundColor: _bgDark,
      extendBody: true,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF0B1F2A),
          border: Border(top: BorderSide(color: Color(0x223CCEFF))),
        ),
        child: BottomNavigationBar(
          currentIndex: 1,
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
              icon: Icon(Icons.favorite_rounded),
              label: 'Favoritos',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline_rounded),
              activeIcon: Icon(Icons.person_rounded),
              label: 'Perfil',
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
            stops: [0.0, 0.24, 0.62],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 230),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
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
                              color: Colors.white.withOpacity(0.08),
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
                                color: _lightBlue,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.06),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.search_rounded,
                            color: Colors.white70,
                          ),
                        ),
                      ],
                    ),
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
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: const [
                          _FilterChip(label: 'Canciones', selected: true),
                          SizedBox(width: 12),
                          _FilterChip(label: 'Albumes'),
                          SizedBox(width: 12),
                          _FilterChip(label: 'Artistas'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 22),
                    Container(
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
                              width: 220,
                              height: 220,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: RadialGradient(
                                  colors: [
                                    Color(0xFFE3D4A5),
                                    Color(0xFFC9964B),
                                    Color(0xFF7A4120),
                                  ],
                                  stops: [0.15, 0.58, 1.0],
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Color(0x221A90FF),
                                    blurRadius: 18,
                                    offset: Offset(0, 10),
                                  ),
                                ],
                              ),
                              child: Stack(
                                children: [
                                  Positioned(
                                    top: 42,
                                    left: 28,
                                    child: Container(
                                      width: 160,
                                      height: 160,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: Colors.white.withOpacity(0.06),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'MIX SEMANAL',
                            style: theme.textTheme.labelLarge?.copyWith(
                              color: _accentCyan,
                              letterSpacing: 2.2,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Nebulosa\nSonica Vol. 4',
                            style: theme.textTheme.headlineMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              height: 1.05,
                            ),
                          ),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              Container(
                                width: 52,
                                height: 52,
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: _lightBlue,
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
                                  color: _bgDark,
                                  size: 30,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                '42 canciones • 2h 15m',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Gone Mother • Come Work',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.white38,
                              letterSpacing: 0.9,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    ...tracks.map(
                      (track) => Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _TrackTile(
                          index: track['index'] as String,
                          title: track['title'] as String,
                          artist: track['artist'] as String,
                          duration: track['duration'] as String,
                          favorite: track['favorite'] as bool,
                          icon: track['icon'] as IconData,
                          colors: track['colors'] as List<Color>,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Positioned(
                left: 12,
                right: 12,
                bottom: 16,
                child: Container(
                  padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
                  decoration: BoxDecoration(
                    color: _cardSoft.withOpacity(0.96),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.05),
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
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(14),
                              gradient: const LinearGradient(
                                colors: [_primaryBlue, _accentCyan],
                              ),
                            ),
                            child: const Icon(
                              Icons.graphic_eq_rounded,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Cybernetic',
                                  style: theme.textTheme.titleSmall?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Lumina Synthesis',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: _accentCyan,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () {},
                            icon: const Icon(
                              Icons.skip_previous_rounded,
                              color: Colors.white70,
                            ),
                          ),
                          Container(
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
                            child: const Icon(
                              Icons.pause_rounded,
                              color: _bgDark,
                              size: 30,
                            ),
                          ),
                          IconButton(
                            onPressed: () {},
                            icon: const Icon(
                              Icons.skip_next_rounded,
                              color: Colors.white70,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Column(
                        children: [
                          Container(
                            height: 3,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: Colors.white12,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Align(
                              alignment: Alignment.centerLeft,
                              child: Container(
                                width: 120,
                                decoration: BoxDecoration(
                                  color: _accentCyan,
                                  borderRadius: BorderRadius.circular(999),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '1:42',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: Colors.white54,
                                ),
                              ),
                              Text(
                                '3:45',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: Colors.white54,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
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
                colors: [BibliotecaScreen._primaryBlue, BibliotecaScreen._accentCyan],
              )
            : null,
        color: selected ? null : Colors.white.withOpacity(0.04),
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
          color: selected ? BibliotecaScreen._bgDark : Colors.white70,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _TrackTile extends StatelessWidget {
  const _TrackTile({
    required this.index,
    required this.title,
    required this.artist,
    required this.duration,
    required this.favorite,
    required this.icon,
    required this.colors,
  });

  final String index;
  final String title;
  final String artist;
  final String duration;
  final bool favorite;
  final IconData icon;
  final List<Color> colors;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
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
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            gradient: LinearGradient(
              colors: colors,
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Icon(
            icon,
            color: Colors.white70,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.titleMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                artist,
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
          duration,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: Colors.white70,
          ),
        ),
        IconButton(
          onPressed: () {},
          icon: Icon(
            favorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
            color: favorite ? BibliotecaScreen._lightBlue : Colors.white70,
          ),
        ),
        IconButton(
          onPressed: () {},
          icon: const Icon(
            Icons.more_vert_rounded,
            color: Colors.white70,
          ),
        ),
      ],
    );
  }
}
