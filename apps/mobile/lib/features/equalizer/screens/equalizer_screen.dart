import 'package:flutter/material.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/widgets/app_bottom_navigation.dart';

class EqualizerScreen extends StatefulWidget {
  const EqualizerScreen({super.key});

  @override
  State<EqualizerScreen> createState() => _EqualizerScreenState();
}

class _EqualizerScreenState extends State<EqualizerScreen> {
  double _volume = 0.82;
  double _balance = 0.5;
  final List<double> _bands = [0.68, 0.52, 0.86, 0.38, 0.57, 0.63];
  String _preset = 'Rock';

  static const Color _page = Color(0xFF092433);
  static const Color _pageGlow = Color(0xFF0B3142);
  static const Color _card = Color(0xFF121C26);
  static const Color _cardSoft = Color(0xFF1A2430);
  static const Color _accent = Color(0xFF2ED8FF);
  static const Color _text = Colors.white;
  static const Color _muted = Color(0xFF9DB0C7);
  static const Color _track = Color(0xFF273440);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _page,
      bottomNavigationBar: const AppBottomNavigation(
        currentRoute: AppRoutes.equalizer,
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [_pageGlow, _page],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Equalizador',
                  style: TextStyle(
                    color: _text,
                    fontSize: 30,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Modula tu frecuencia. Siente la precisión\nsónica.',
                  style: TextStyle(
                    color: _muted,
                    fontSize: 16,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: _InfoSliderCard(
                        title: 'VOLUMEN',
                        valueLabel: '${(_volume * 100).round()}%',
                        value: _volume,
                        onChanged: (value) => setState(() => _volume = value),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _InfoSliderCard(
                        title: 'BALANCE',
                        valueLabel: _balance < 0.45
                            ? 'L'
                            : _balance > 0.55
                                ? 'R'
                                : 'L/R',
                        value: _balance,
                        onChanged: (value) => setState(() => _balance = value),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
                  decoration: BoxDecoration(
                    color: _card,
                    borderRadius: BorderRadius.circular(28),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'ECUALIZADOR',
                        style: TextStyle(
                          color: _muted,
                          fontSize: 12,
                          letterSpacing: 1.8,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 18),
                      SizedBox(
                        height: 248,
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            for (final entry in _bands.asMap().entries)
                              Expanded(
                                child: _EqualizerBand(
                                  label: _bandLabels[entry.key],
                                  value: entry.value,
                                  onChanged: (value) => setState(
                                    () => _bands[entry.key] = value,
                                  ),
                                ),
                              ),
                            for (final label in _lockedBandLabels)
                              Expanded(
                                child: _LockedBand(label: label),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
                  decoration: BoxDecoration(
                    color: _card,
                    borderRadius: BorderRadius.circular(28),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'AJUSTES PREESTABLECIDOS',
                        style: TextStyle(
                          color: _muted,
                          fontSize: 12,
                          letterSpacing: 1.8,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 16),
                      for (final preset in _presetOptions) ...[
                        _PresetTile(
                          label: preset,
                          selected: _preset == preset,
                          highlightTrailing: preset == 'Personalizado',
                          onTap: () => setState(() => _preset = preset),
                        ),
                        if (preset != _presetOptions.last) const SizedBox(height: 12),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                const _PremiumPromoCard(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

const List<String> _bandLabels = ['31Hz', '62Hz', '125Hz', '250Hz', '500Hz', '1kHz'];
const List<String> _lockedBandLabels = ['2kHz', '4kHz', '8kHz'];
const List<String> _presetOptions = ['Rock', 'Pop', 'Jazz', 'Personalizado'];

class _InfoSliderCard extends StatelessWidget {
  const _InfoSliderCard({
    required this.title,
    required this.valueLabel,
    required this.value,
    required this.onChanged,
  });

  final String title;
  final String valueLabel;
  final double value;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 12),
      decoration: BoxDecoration(
        color: _EqualizerScreenState._card,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: _EqualizerScreenState._muted,
                  fontSize: 12,
                  letterSpacing: 1.8,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              Text(
                valueLabel,
                style: const TextStyle(
                  color: _EqualizerScreenState._accent,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              trackHeight: 5,
              activeTrackColor: _EqualizerScreenState._accent,
              inactiveTrackColor: _EqualizerScreenState._track,
              thumbColor: Colors.white,
              overlayColor: _EqualizerScreenState._accent.withValues(alpha: 0.18),
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
            ),
            child: Slider(
              value: value,
              onChanged: onChanged,
            ),
          ),
        ],
      ),
    );
  }
}

class _EqualizerBand extends StatelessWidget {
  const _EqualizerBand({
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final double value;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Expanded(
          child: RotatedBox(
            quarterTurns: 3,
            child: SliderTheme(
              data: SliderTheme.of(context).copyWith(
                trackHeight: 5,
                activeTrackColor: _EqualizerScreenState._accent,
                inactiveTrackColor: _EqualizerScreenState._track,
                thumbColor: Colors.white,
                overlayColor: _EqualizerScreenState._accent.withValues(alpha: 0.18),
                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 9),
              ),
              child: Slider(
                min: 0,
                max: 1,
                value: value,
                onChanged: onChanged,
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 11,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _LockedBand extends StatelessWidget {
  const _LockedBand({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Expanded(
          child: Center(
            child: Icon(
              Icons.lock_outline_rounded,
              size: 16,
              color: Colors.white.withValues(alpha: 0.42),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.28),
            fontSize: 11,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _PresetTile extends StatelessWidget {
  const _PresetTile({
    required this.label,
    required this.selected,
    required this.highlightTrailing,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final bool highlightTrailing;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
          decoration: BoxDecoration(
            color: _EqualizerScreenState._cardSoft,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: selected || highlightTrailing
                  ? _EqualizerScreenState._accent.withValues(alpha: 0.75)
                  : Colors.transparent,
            ),
          ),
          child: Row(
            children: [
              Text(
                label,
                style: TextStyle(
                  color: selected || highlightTrailing
                      ? _EqualizerScreenState._accent
                      : Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              if (selected)
                const Icon(
                  Icons.check_circle_outline_rounded,
                  color: Colors.white,
                )
              else if (highlightTrailing)
                const Icon(
                  Icons.settings_outlined,
                  color: _EqualizerScreenState._accent,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PremiumPromoCard extends StatelessWidget {
  const _PremiumPromoCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(18, 22, 18, 18),
      decoration: BoxDecoration(
        color: const Color(0xFF13364A),
        borderRadius: BorderRadius.circular(28),
        boxShadow: const [
          BoxShadow(
            color: Color(0x2600D7FF),
            blurRadius: 24,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Experiencia de Audio\nDefinitiva',
            style: TextStyle(
              color: Colors.white,
              fontSize: 22,
              height: 1.12,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Obtén control total sobre 10 bandas\ny audio Lossless sin anuncios.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.72),
              fontSize: 15,
              height: 1.35,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: 228,
            height: 54,
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: _EqualizerScreenState._accent,
                foregroundColor: const Color(0xFF0A3544),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
              child: const Text(
                'MEJORAR A PREMIUM',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
