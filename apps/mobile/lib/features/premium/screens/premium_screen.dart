import 'package:flutter/material.dart';

class PremiumScreen extends StatelessWidget {
  const PremiumScreen({super.key});

  static const Color _primaryBlue = Color(0xFF1E90FF);
  static const Color _accentCyan = Color(0xFF00CFFF);
  static const Color _lightBlue = Color(0xFF4FC3F7);
  static const Color _bgDark = Color(0xFF071A24);
  static const Color _bgMid = Color(0xFF0A2230);
  static const Color _bgTop = Color(0xFF0E3447);
  static const Color _cardDark = Color(0xFF121A21);
  static const Color _cardSoft = Color(0xFF18232D);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    const benefits = [
      (
        icon: Icons.block_rounded,
        title: 'Sin Anuncios',
        description:
            'Musica ininterrumpida. Sin pausas, sin distracciones, solo tu y el sonido.',
        color: _primaryBlue,
      ),
      (
        icon: Icons.equalizer_rounded,
        title: 'EQ por Segmentos',
        description:
            'Control total sobre las frecuencias para cada genero musical de forma automatica.',
        color: Color(0xFF4FFFBF),
      ),
    ];

    const comparisonRows = [
      ('Calidad de Sonido', '128kbps'),
      ('Anuncios entre canciones', 'Si'),
      ('Escucha sin conexion', 'No'),
      ('Asistente IA Personalizado', 'No'),
      ('Ecualizacion Avanzada', 'Limitado'),
    ];

    return Scaffold(
      backgroundColor: _bgDark,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [_bgTop, _bgMid, _bgDark],
            stops: [0.0, 0.18, 0.62],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(14, 22, 14, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                Center(
                  child: Text.rich(
                    TextSpan(
                      text: 'Eleva tu ',
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                      children: [
                        TextSpan(
                          text: 'Experiencia Auditiva',
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: _accentCyan,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 310),
                    child: Text(
                      'Descubre el sonido puro y la inteligencia artificial disenada para tu flujo musical unico.',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        color: Colors.white70,
                        fontWeight: FontWeight.w400,
                        height: 1.35,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 28),
                Center(
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(999),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x5500CFFF),
                          blurRadius: 24,
                          offset: Offset(0, 8),
                        ),
                      ],
                    ),
                    child: ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _lightBlue,
                        foregroundColor: _bgDark,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 34,
                          vertical: 18,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(999),
                        ),
                      ),
                      child: Text(
                        'Actualizar a Premium',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: _bgDark,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 36),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(24, 26, 24, 24),
                  decoration: BoxDecoration(
                    color: _cardDark,
                    borderRadius: BorderRadius.circular(28),
                  ),
                  child: Stack(
                    children: [
                      Positioned(
                        right: 6,
                        top: 18,
                        child: Icon(
                          Icons.auto_awesome,
                          color: _accentCyan.withOpacity(0.12),
                          size: 96,
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'EXCLUSIVO PREMIUM',
                            style: theme.textTheme.labelLarge?.copyWith(
                              color: _accentCyan,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.6,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Asistente IA Sonic',
                            style: theme.textTheme.headlineMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 14),
                          ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 245),
                            child: Text(
                              'Una inteligencia que aprende de tus ritmos diarios para crear transiciones perfectas y descubrir joyas ocultas basadas en tu estado de animo.',
                              style: theme.textTheme.titleMedium?.copyWith(
                                color: Colors.white70,
                                height: 1.45,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                ...benefits.map(
                  (benefit) => Padding(
                    padding: const EdgeInsets.only(bottom: 18),
                    child: _BenefitCard(
                      icon: benefit.icon,
                      title: benefit.title,
                      description: benefit.description,
                      color: benefit.color,
                    ),
                  ),
                ),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF020406), Color(0xFF0C1016)],
                    ),
                    borderRadius: BorderRadius.circular(28),
                  ),
                  child: Stack(
                    children: [
                      Positioned.fill(
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(28),
                            gradient: LinearGradient(
                              begin: Alignment.centerLeft,
                              end: Alignment.centerRight,
                              colors: [
                                Colors.black.withOpacity(0.82),
                                Colors.black.withOpacity(0.26),
                              ],
                            ),
                          ),
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Audio Hi-Fi\nLossless',
                            style: theme.textTheme.headlineMedium?.copyWith(
                              color: _accentCyan,
                              fontWeight: FontWeight.w900,
                              height: 1.05,
                            ),
                          ),
                          const SizedBox(height: 16),
                          ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 250),
                            child: Text(
                              'Escucha cada detalle como si estuvieras en el estudio. Calidad de 24-bit/192kHz para los oidos mas exigentes.',
                              style: theme.textTheme.titleMedium?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                height: 1.45,
                              ),
                            ),
                          ),
                          const SizedBox(height: 18),
                          Row(
                            children: List.generate(
                              3,
                              (index) => Container(
                                margin: EdgeInsets.only(right: index == 2 ? 0 : 8),
                                width: 26,
                                height: 26,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: Colors.white.withOpacity(0.38),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: _cardDark,
                    borderRadius: BorderRadius.circular(28),
                  ),
                  child: Column(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          color: _cardSoft.withOpacity(0.55),
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(28),
                          ),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              flex: 3,
                              child: Padding(
                                padding: const EdgeInsets.fromLTRB(18, 20, 18, 20),
                                child: Text(
                                  'Caracteristicas',
                                  style: theme.textTheme.titleLarge?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ),
                            Container(
                              width: 1,
                              height: 64,
                              color: Colors.white.withOpacity(0.05),
                            ),
                            Expanded(
                              flex: 2,
                              child: Padding(
                                padding: const EdgeInsets.symmetric(vertical: 20),
                                child: Center(
                                  child: Text(
                                    'Gratis',
                                    style: theme.textTheme.titleLarge?.copyWith(
                                      color: Colors.white70,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(18, 14, 18, 18),
                        child: Column(
                          children: comparisonRows
                              .map(
                                (row) => Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 18),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        flex: 3,
                                        child: Text(
                                          row.$1,
                                          style: theme.textTheme.titleMedium?.copyWith(
                                            color: Colors.white,
                                            fontWeight: FontWeight.w600,
                                            height: 1.35,
                                          ),
                                        ),
                                      ),
                                      Expanded(
                                        flex: 2,
                                        child: Text(
                                          row.$2,
                                          textAlign: TextAlign.center,
                                          style: theme.textTheme.titleMedium?.copyWith(
                                            color: const Color(0xFFB4C7D8),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              )
                              .toList(),
                        ),
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

class _BenefitCard extends StatelessWidget {
  const _BenefitCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
  });

  final IconData icon;
  final String title;
  final String description;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 22, 24, 22),
      decoration: BoxDecoration(
        color: PremiumScreen._cardSoft,
        borderRadius: BorderRadius.circular(28),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 34),
          const SizedBox(height: 20),
          Text(
            title,
            style: theme.textTheme.headlineSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            description,
            style: theme.textTheme.titleMedium?.copyWith(
              color: const Color(0xFFC5D1DA),
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }
}
