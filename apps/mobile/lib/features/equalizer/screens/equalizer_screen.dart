import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/core/widgets/app_bottom_navigation.dart';
import 'package:musicflow_mobile/features/player/providers/player_controller.dart';

class EqualizerScreen extends ConsumerStatefulWidget {
  const EqualizerScreen({super.key});

  @override
  ConsumerState<EqualizerScreen> createState() => _EqualizerScreenState();
}

class _EqualizerScreenState extends ConsumerState<EqualizerScreen> {
  static const Color _panel = Color(0xFF101820);
  static const Color _accent = Color(0xFF35D8FF);
  static const Color _accentSoft = Color(0xFF6ADCFF);

  static const double _minDb = -15;
  static const double _maxDb = 15;

  double _volume = 0.82;
  double _balance = 0.5;
  List<double> _bands = List<double>.filled(10, 0);
  Timer? _saveDebounce;
  String? _loadedTrackId;
  bool _loadingConfig = false;

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
  void dispose() {
    _saveDebounce?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = context.musicFlowColors;
    final currentTrack = ref.watch(playerControllerProvider).currentTrack;

    if (currentTrack != null && _loadedTrackId != currentTrack.id) {
      _loadedTrackId = currentTrack.id;
      _loadTrackConfig(currentTrack.id);
    }

    return Scaffold(
      backgroundColor: colors.background,
      bottomNavigationBar: const AppBottomNavigation(
        currentRoute: AppRoutes.equalizer,
      ),
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
            stops: [0.0, 0.26, 0.72],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(14, 16, 14, 26),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Ecualizador',
                        style: theme.textTheme.displaySmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          height: 0.95,
                        ),
                      ),
                    ),
                    if (_loadingConfig)
                      SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: colors.primary,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  currentTrack == null
                      ? 'Reproduce una cancion para guardar su ecualizacion.'
                      : 'Ajustando: ${currentTrack.title}',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
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
                          onChanged: (value) {
                            setState(() => _volume = value);
                            ref
                                .read(playerControllerProvider.notifier)
                                .setVolume(value);
                          },
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
                          value: _dbToSlider(_bands[index]),
                          gainLabel: _formatGain(_bands[index]),
                          onChanged: (value) {
                            final nextBands = [..._bands];
                            nextBands[index] = _sliderToDb(value);
                            _setBands(nextBands, persist: true);
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

  Future<void> _loadTrackConfig(String trackId) async {
    setState(() => _loadingConfig = true);
    try {
      final config = await ref
          .read(equalizerRepositoryProvider)
          .resolveForTrack(trackId);
      if (!mounted || _loadedTrackId != trackId) return;
      final bands = config?.bands;
      if (bands != null && bands.length == 10) {
        _setBands(
          bands.map((value) => value.toDouble()).toList(),
          persist: false,
        );
      } else {
        _setBands(List<double>.filled(10, 0), persist: false);
      }
    } catch (_) {
      if (!mounted) return;
      _setBands(List<double>.filled(10, 0), persist: false);
    } finally {
      if (mounted && _loadedTrackId == trackId) {
        setState(() => _loadingConfig = false);
      }
    }
  }

  void _setBands(List<double> bands, {required bool persist}) {
    final clampedBands = bands
        .map((value) => value.clamp(_minDb, _maxDb).toDouble())
        .toList(growable: false);
    setState(() => _bands = clampedBands);
    ref.read(playerControllerProvider.notifier).setEqualizerBands(clampedBands);

    if (persist) {
      _scheduleSave(clampedBands);
    }
  }

  void _scheduleSave(List<double> bands) {
    final track = ref.read(playerControllerProvider).currentTrack;
    if (track == null) return;

    _saveDebounce?.cancel();
    _saveDebounce = Timer(const Duration(milliseconds: 650), () async {
      try {
        await ref
            .read(equalizerRepositoryProvider)
            .upsertTrackConfig(
              trackId: track.id,
              bands: bands.map((value) => value.round()).toList(),
            );
      } catch (_) {
        if (!mounted) return;
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            const SnackBar(
              content: Text('No se pudo guardar la ecualizacion.'),
            ),
          );
      }
    });
  }

  double _sliderToDb(double value) {
    return _minDb + ((_maxDb - _minDb) * value);
  }

  double _dbToSlider(double db) {
    return ((db - _minDb) / (_maxDb - _minDb)).clamp(0.0, 1.0);
  }

  String _formatGain(double db) {
    if (db.abs() < 0.5) return '0dB';
    final sign = db > 0 ? '+' : '';
    return '$sign${db.round()}dB';
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
    required this.gainLabel,
    required this.onChanged,
  });

  final String label;
  final double value;
  final String gainLabel;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          gainLabel,
          maxLines: 1,
          overflow: TextOverflow.fade,
          softWrap: false,
          style: const TextStyle(
            color: Colors.white54,
            fontSize: 9,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: RotatedBox(
            quarterTurns: -1,
            child: SliderTheme(
              data: SliderTheme.of(context).copyWith(
                trackHeight: 6,
                activeTrackColor: _EqualizerScreenState._accent,
                inactiveTrackColor: Colors.white.withOpacity(0.05),
                thumbColor: Colors.white,
                overlayColor: _EqualizerScreenState._accent.withOpacity(0.14),
                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 9),
              ),
              child: Slider(value: value, onChanged: onChanged),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.fade,
          softWrap: false,
          style: const TextStyle(
            color: _EqualizerScreenState._accentSoft,
            fontSize: 9,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}
