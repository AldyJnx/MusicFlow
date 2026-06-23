import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/core/widgets/app_bottom_navigation.dart';
import 'package:musicflow_mobile/features/library/providers/playlists_providers.dart';
import 'package:musicflow_mobile/features/player/providers/player_controller.dart';
import 'package:musicflow_mobile/shared/models/eq.dart';

class PlaylistEqualizerScreen extends ConsumerStatefulWidget {
  const PlaylistEqualizerScreen({required this.playlistId, super.key});

  final String playlistId;

  @override
  ConsumerState<PlaylistEqualizerScreen> createState() =>
      _PlaylistEqualizerScreenState();
}

class _PlaylistEqualizerScreenState
    extends ConsumerState<PlaylistEqualizerScreen> {
  static const Color _bgDark = Color(0xFF071A24);
  static const Color _bgMid = Color(0xFF0A2230);
  static const Color _bgTop = Color(0xFF0E3447);
  static const Color _panel = Color(0xFF101820);
  static const Color _accent = Color(0xFF35D8FF);
  static const Color _accentSoft = Color(0xFF6ADCFF);

  static const double _minDb = -15;
  static const double _maxDb = 15;
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

  List<double> _bands = List<double>.filled(10, 0);
  Timer? _saveDebounce;
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(_loadConfig);
  }

  @override
  void dispose() {
    _saveDebounce?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final playlistAsync = ref.watch(playlistDetailProvider(widget.playlistId));
    final playlistName = playlistAsync.valueOrNull?.name ?? 'Biblioteca';

    return Scaffold(
      backgroundColor: _bgDark,
      bottomNavigationBar: const AppBottomNavigation(
        currentRoute: AppRoutes.playlists,
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
                Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.of(context).maybePop(),
                      icon: const Icon(Icons.arrow_back_ios_new_rounded),
                      color: Colors.white,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'EQ de biblioteca',
                        style: theme.textTheme.headlineSmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    if (_loading || _saving)
                      const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: _accent,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  playlistName,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: _accent,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Esta curva se aplicara automaticamente cuando reproduzcas canciones desde esta biblioteca.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.white70,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 24),
                Container(
                  height: 340,
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(16, 22, 16, 12),
                  decoration: BoxDecoration(
                    color: _panel.withValues(alpha: 0.94),
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.04),
                    ),
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
                          onChanged: _loading
                              ? null
                              : (value) {
                                  final nextBands = [..._bands];
                                  nextBands[index] = _sliderToDb(value);
                                  _setBands(nextBands, persist: true);
                                },
                        ),
                      );
                    }),
                  ),
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _loading
                        ? null
                        : () => _setBands(
                            List<double>.filled(10, 0),
                            persist: true,
                          ),
                    icon: const Icon(Icons.restart_alt_rounded),
                    label: const Text('Restablecer EQ de biblioteca'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: _accent,
                      side: const BorderSide(color: _accent),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _loadConfig() async {
    setState(() => _loading = true);
    try {
      final config = await ref
          .read(equalizerRepositoryProvider)
          .getConfigByScope(
            scopeType: EQScopeType.playlist,
            scopeId: widget.playlistId,
          );
      final bands = config?.bands;
      if (!mounted) return;
      setState(() {
        _bands = bands != null && bands.length == 10
            ? bands.map((value) => value.toDouble()).toList()
            : List<double>.filled(10, 0);
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _bands = List<double>.filled(10, 0);
        _loading = false;
      });
      _showSnack('No se pudo cargar la ecualizacion de esta biblioteca.');
    }
  }

  void _setBands(List<double> bands, {required bool persist}) {
    final clampedBands = bands
        .map((value) => value.clamp(_minDb, _maxDb).toDouble())
        .toList(growable: false);
    setState(() => _bands = clampedBands);

    final player = ref.read(playerControllerProvider);
    if (player.currentPlaylistId == widget.playlistId) {
      ref
          .read(playerControllerProvider.notifier)
          .setEqualizerBands(clampedBands);
    }

    if (persist) {
      _scheduleSave(clampedBands);
    }
  }

  void _scheduleSave(List<double> bands) {
    _saveDebounce?.cancel();
    _saveDebounce = Timer(const Duration(milliseconds: 650), () async {
      if (mounted) setState(() => _saving = true);
      try {
        await ref
            .read(equalizerRepositoryProvider)
            .upsertPlaylistConfig(
              playlistId: widget.playlistId,
              bands: bands.map((value) => value.round()).toList(),
            );
        final player = ref.read(playerControllerProvider);
        if (player.currentPlaylistId == widget.playlistId) {
          await ref
              .read(playerControllerProvider.notifier)
              .refreshCurrentEqualizer();
        }
      } catch (_) {
        if (!mounted) return;
        _showSnack('No se pudo guardar la ecualizacion de la biblioteca.');
      } finally {
        if (mounted) setState(() => _saving = false);
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

  void _showSnack(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
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
  final ValueChanged<double>? onChanged;

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
                activeTrackColor: _PlaylistEqualizerScreenState._accent,
                inactiveTrackColor: Colors.white.withValues(alpha: 0.05),
                thumbColor: Colors.white,
                overlayColor: _PlaylistEqualizerScreenState._accent.withValues(
                  alpha: 0.14,
                ),
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
            color: _PlaylistEqualizerScreenState._accentSoft,
            fontSize: 9,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}
