import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  static const Color _primaryBlue = Color(0xFF1E90FF);
  static const Color _accentCyan = Color(0xFF00CFFF);
  static const Color _lightBlue = Color(0xFF4FC3F7);
  static const Color _bgDark = Color(0xFF071A24);
  static const Color _bgMid = Color(0xFF0A2230);
  static const Color _bgTop = Color(0xFF0E3447);
  static const Color _cardDark = Color(0xFF121A21);
  static const Color _cardSoft = Color(0xFF161F28);
  static const Color _danger = Color(0xFFFF5A5F);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: _bgDark,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF0B1F2A),
          border: Border(
            top: BorderSide(color: Color(0x223CCEFF)),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: 3,
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: _accentCyan,
          unselectedItemColor: Colors.white54,
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.explore_outlined),
              activeIcon: Icon(Icons.explore_rounded),
              label: 'Explorar',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.radio_outlined),
              activeIcon: Icon(Icons.radio_rounded),
              label: 'Radio',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.library_music_outlined),
              activeIcon: Icon(Icons.library_music_rounded),
              label: 'Libreria',
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
            stops: [0.0, 0.18, 0.55],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [_primaryBlue, _accentCyan],
                        ),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.18),
                        ),
                      ),
                      child: const Icon(
                        Icons.person_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'Mi Perfil',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _accentCyan.withOpacity(0.55),
                        ),
                        color: Colors.white.withOpacity(0.03),
                      ),
                      child: const Icon(
                        Icons.settings_rounded,
                        color: _accentCyan,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 26),
                Center(
                  child: Column(
                    children: [
                      SizedBox(
                        width: 150,
                        height: 162,
                        child: Stack(
                          alignment: Alignment.topCenter,
                          clipBehavior: Clip.none,
                          children: [
                            Container(
                              width: 128,
                              height: 128,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(34),
                                gradient: const LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [Color(0xFF241F1E), Color(0xFF13181F)],
                                ),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Color(0x3300CFFF),
                                    blurRadius: 22,
                                    offset: Offset(0, 10),
                                  ),
                                ],
                              ),
                              child: Stack(
                                children: [
                                  Positioned(
                                    top: 18,
                                    left: 0,
                                    right: 0,
                                    child: Icon(
                                      Icons.account_circle_rounded,
                                      size: 92,
                                      color: Colors.white.withOpacity(0.9),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Positioned(
                              bottom: 12,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 18,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: _lightBlue,
                                  borderRadius: BorderRadius.circular(999),
                                  boxShadow: const [
                                    BoxShadow(
                                      color: Color(0x5500CFFF),
                                      blurRadius: 16,
                                      offset: Offset(0, 6),
                                    ),
                                  ],
                                ),
                                child: Text(
                                  'PLAN\nPREMIUM',
                                  textAlign: TextAlign.center,
                                  style: theme.textTheme.labelMedium?.copyWith(
                                    color: _bgDark,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 0.6,
                                    height: 1.15,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Fernando Mas',
                        style: theme.textTheme.displaySmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          height: 0.95,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'fernando.mas@musicflow.com',
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: Colors.white70,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 26),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
                  decoration: BoxDecoration(
                    color: _cardDark.withOpacity(0.95),
                    borderRadius: BorderRadius.circular(26),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'MINUTOS ESCUCHADOS',
                              style: theme.textTheme.labelLarge?.copyWith(
                                color: Colors.white38,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              '12,482',
                              style: theme.textTheme.displaySmall?.copyWith(
                                color: _lightBlue,
                                fontWeight: FontWeight.w900,
                                height: 0.95,
                              ),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(
                        width: 72,
                        height: 72,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            ...[
                              const Offset(0, 0),
                              const Offset(12, -8),
                              const Offset(20, 6),
                            ].map(
                              (offset) => Positioned(
                                left: 8 + offset.dx,
                                top: 10 + offset.dy,
                                child: Container(
                                  width: 28,
                                  height: 40,
                                  color: Colors.white.withOpacity(0.08),
                                ),
                              ),
                            ),
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: _accentCyan.withOpacity(0.18),
                              ),
                              child: const Icon(
                                Icons.timer_rounded,
                                color: _accentCyan,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  children: const [
                    Expanded(
                      child: _ProfileMetricCard(
                        icon: Icons.favorite_border_rounded,
                        iconColor: _primaryBlue,
                        title: 'ARTISTAS FAVORITOS',
                        value: '148',
                      ),
                    ),
                    SizedBox(width: 14),
                    Expanded(
                      child: _ProfileMetricCard(
                        icon: Icons.headphones_rounded,
                        iconColor: Color(0xFF4FFFBF),
                        title: 'GENERO TOP',
                        value: 'Rock',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 28),
                Text(
                  'CONFIGURACION DE CUENTA',
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: const Color(0xFFC5D4E0),
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: _cardDark.withOpacity(0.98),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: Column(
                    children: const [
                      _ProfileOptionTile(
                        icon: Icons.edit_outlined,
                        title: 'Editar Perfil',
                      ),
                      _ProfileOptionTile(
                        icon: Icons.payment_rounded,
                        title: 'Metodos de Pago',
                      ),
                      _ProfileOptionTile(
                        icon: Icons.verified_user_outlined,
                        title: 'Privacidad',
                      ),
                      Divider(
                        height: 1,
                        color: Color(0x223CCEFF),
                      ),
                      _ProfileOptionTile(
                        icon: Icons.logout_rounded,
                        title: 'Cerrar Sesion',
                        color: _danger,
                        arrowColor: _danger,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ProfileMetricCard extends StatelessWidget {
  const _ProfileMetricCard({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.value,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 18),
      decoration: BoxDecoration(
        color: ProfileScreen._cardSoft.withOpacity(0.92),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: iconColor.withOpacity(0.12),
            ),
            child: Icon(icon, color: iconColor),
          ),
          const SizedBox(height: 18),
          Text(
            title,
            style: theme.textTheme.labelMedium?.copyWith(
              color: Colors.white38,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: theme.textTheme.headlineSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileOptionTile extends StatelessWidget {
  const _ProfileOptionTile({
    required this.icon,
    required this.title,
    this.color = Colors.white,
    this.arrowColor = Colors.white38,
  });

  final IconData icon;
  final String title;
  final Color color;
  final Color arrowColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Icon(icon, color: color),
      title: Text(
        title,
        style: theme.textTheme.titleMedium?.copyWith(
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
      trailing: Icon(
        Icons.chevron_right_rounded,
        color: arrowColor,
      ),
      onTap: () {},
    );
  }
}
