import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final featuredPlaylists = [
      {
        'title': 'Flow Latino',
        'subtitle': 'Tu energia del dia',
        'color': const Color(0xFFE85D75),
      },
      {
        'title': 'Deep Focus',
        'subtitle': 'Concentracion total',
        'color': const Color(0xFF5B8DEF),
      },
      {
        'title': 'Night Vibes',
        'subtitle': 'Sonidos para la noche',
        'color': const Color(0xFF7D5CFF),
      },
    ];


    final recentTracks = [
      {
        'title': 'Falling Lights',
        'artist': 'Neon Waves',
        'duration': '3:45',
      },
      {
        'title': 'Golden Sky',
        'artist': 'Mila Stone',
        'duration': '4:02',
      },
      {
        'title': 'Ocean Echo',
        'artist': 'Luna Drift',
        'duration': '2:58',
      },
      {
        'title': 'Midnight Run',
        'artist': 'Nova Pulse',
        'duration': '3:27',
      },
    ];



    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FC),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        selectedItemColor: const Color(0xFF111827),
        unselectedItemColor: Colors.grey.shade500,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_rounded),
            label: 'Inicio',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.library_music_rounded),
            label: 'Biblioteca',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.favorite_rounded),
            label: 'Favoritos',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_rounded),
            label: 'Perfil',
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const CircleAvatar(
                    radius: 24,
                    backgroundColor: Color(0xFF111827),
                    child: Icon(
                      Icons.music_off_rounded,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Hola Fernando',
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF111827),
                          )),
                        Text(
                          'Descubre tu musica de hoy',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () {},
                    icon: const Icon(Icons.notifications_none_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const TextField(
                  decoration: InputDecoration(
                    icon: Icon(Icons.search_rounded),
                    hintText: 'Busca canciones, artistas o albums',
                    border: InputBorder.none,
                  ),
                ),
              ),
              const SizedBox(height: 24),


              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [
                      Color(0xFF111827),
                      Color(0xFF374151),                 
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Playlists del dia',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'MusicFlow Mix',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Una mezcla perfecta para empezar con ritmo.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton.icon(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFF111827),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      icon: const Icon(Icons.play_arrow_rounded),
                      label: const Text('Reproducir'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              _SectionHeader(
                title: 'Playlists destacadas',
                onSeeAll: () {},
              ),

              const SizedBox(height: 16),


              SizedBox(
                height: 170,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: featuredPlaylists.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 14),
                  itemBuilder: (context, index) {
                    final item = featuredPlaylists[index];

                    return Container(
                      width: 145,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: item['color'] as Color,
                        borderRadius: BorderRadius.circular(22),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Spacer(),
                          const Icon(
                            Icons.graphic_eq_rounded,
                            color: Colors.white,
                            size: 34,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            item['title'] as String,
                            style: theme.textTheme.titleMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,                            
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            item['subtitle'] as String,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.white70,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 28),
              _SectionHeader(
                title: 'Escuchado recientemente',
                onSeeAll: () {},
              ),
              const SizedBox(height: 12),

              ...recentTracks.map(
                (track) => Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 54,
                        height: 54,
                        decoration: BoxDecoration(
                          color: const Color(0xFF111827),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(
                          Icons.music_note_rounded,
                          color: Colors.white,                        
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              track['title'] as String,
                              style: theme.textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF111827),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              track['artist'] as String,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        track['duration'] as String,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,                      
                        ),
                      ),
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(Icons.play_circle_fill_rounded),
                        color: const Color(0xFF111827),
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



class _SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback onSeeAll;


  const _SectionHeader({
    required this.title,
    required this.onSeeAll
  });



  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
              color: const Color(0xFF111827),
            ),
          ),
        ),
        TextButton(
          onPressed: onSeeAll,
          child: const Text('Ver todo'),
        ),
      ],
    );
  }
}