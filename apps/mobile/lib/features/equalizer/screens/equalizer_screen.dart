import 'package:flutter/material.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/widgets/app_bottom_navigation.dart';

class EqualizerScreen extends StatefulWidget {
  const EqualizerScreen({super.key});

  @override
  State<EqualizerScreen> createState() => _EqualizerScreenState();
}

class _EqualizerScreenState extends State<EqualizerScreen> {
  static const Color _bgDark = Color(0xFF071A24);
  static const Color _bgMid = Color(0xFF0A2230);
  static const Color _bgTop = Color(0xFF0E3447);
  static const Color _panel = Color(0xFF101820);
  static const Color _accent = Color(0xFF35D8FF);
  static const Color _accentSoft = Color(0xFF6ADCFF);

  double _volume = 0.82;
  double _balance = 0.5;
  final List<double> _bands = [
    0.58,
    0.42,
    0.78,
    0.28,
    0.48,
    0.54,
    0.36,
    0.32,
    0.30,
    0.28,
  ];

  static const List<String> _labels = [
    '31Hz',
    '62Hz',
    '125Hz',
    '250Hz',
    '500Hz',
    '1kHz',
    '2kHz',
    '4kHz',
    '8kHz',
    '16kHz',
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: _bgDark,
      bottomNavigationBar: const AppBottomNavigation(
        currentRoute: AppRoutes.equalizer,
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [_bgTop, _bgMid, _bgDark],
            stops: [0.0, 0.26, 0.72],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(14, 16, 14, 26),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Ecualizador',
                  style: theme.textTheme.displaySmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    height: 0.95,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Modula tu frecuencia. Siente la precision sonica.',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: Colors.white70,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: _ControlPill(
                        label: 'VOLUMEN',
                        valueLabel: '${(_volume * 100).round()}%',
                        child: Slider(
                          value: _volume,
                          onChanged: (value) => setState(() => _volume = value),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _ControlPill(
                        label: 'BALANCE',
                        valueLabel: _balanceLabel,
                        child: Slider(
                          value: _balance,
                          onChanged: (value) =>
                              setState(() => _balance = value),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 30),
                Container(
                  height: 330,
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(16, 22, 16, 12),
                  decoration: BoxDecoration(
                    color: _panel.withOpacity(0.94),
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(color: Colors.white.withOpacity(0.04)),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x3300CFFF),
                        blurRadius: 22,
                        offset: Offset(0, 14),
                      ),
                    ],
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: List.generate(_bands.length, (index) {
                      return Expanded(
                        child: _BandSlider(
                          label: _labels[index],
                          value: _bands[index],
                          enabled: index < 6,
                          onChanged: (value) {
                            setState(() {
                              _bands[index] = value;
                            });
                          },
                        ),
                      );
                    }),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String get _balanceLabel {
    if (_balance < 0.42) return 'L';
    if (_balance > 0.58) return 'R';
    return 'L/R';
  }
}

class _ControlPill extends StatelessWidget {
  const _ControlPill({
    required this.label,
    required this.valueLabel,
    required this.child,
  });

  final String label;
  final String valueLabel;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return SliderTheme(
      data: SliderTheme.of(context).copyWith(
        trackHeight: 4,
        activeTrackColor: _EqualizerScreenState._accent,
        inactiveTrackColor: Colors.white.withOpacity(0.09),
        thumbColor: Colors.white,
        overlayColor: _EqualizerScreenState._accent.withOpacity(0.12),
      ),
      child: Container(
        padding: const EdgeInsets.fromLTRB(18, 16, 14, 12),
        decoration: BoxDecoration(
          color: _EqualizerScreenState._panel.withOpacity(0.92),
          borderRadius: BorderRadius.circular(28),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: Color(0xFFB8C7D6),
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.3,
                  ),
                ),
                const Spacer(),
                Text(
                  valueLabel,
                  style: const TextStyle(
                    color: _EqualizerScreenState._accent,
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.8,
                  ),
                ),
              ],
            ),
            child,
          ],
        ),
      ),
    );
  }
}

class _BandSlider extends StatelessWidget {
  const _BandSlider({
    required this.label,
    required this.value,
    required this.enabled,
    required this.onChanged,
  });

  final String label;
  final double value;
  final bool enabled;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    final activeColor = enabled
        ? _EqualizerScreenState._accent
        : Colors.white.withOpacity(0.08);

    return Column(
      children: [
        Expanded(
          child: RotatedBox(
            quarterTurns: -1,
            child: SliderTheme(
              data: SliderTheme.of(context).copyWith(
                trackHeight: 6,
                activeTrackColor: activeColor,
                inactiveTrackColor: Colors.white.withOpacity(0.05),
                thumbColor: enabled ? Colors.white : Colors.transparent,
                disabledThumbColor: Colors.transparent,
                overlayColor: _EqualizerScreenState._accent.withOpacity(0.14),
                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 9),
              ),
              child: Slider(
                value: value,
                onChanged: enabled ? onChanged : null,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.fade,
          softWrap: false,
          style: TextStyle(
            color: enabled
                ? _EqualizerScreenState._accentSoft
                : Colors.white.withOpacity(0.16),
            fontSize: 9,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}
