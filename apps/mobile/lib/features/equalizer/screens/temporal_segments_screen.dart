import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/features/player/providers/player_controller.dart';
import 'package:musicflow_mobile/shared/models/eq.dart';

class TemporalSegmentsScreen extends ConsumerStatefulWidget {
  const TemporalSegmentsScreen({super.key});

  @override
  ConsumerState<TemporalSegmentsScreen> createState() =>
      _TemporalSegmentsScreenState();
}

class _TemporalSegmentsScreenState
    extends ConsumerState<TemporalSegmentsScreen> {
  static const Color _bgDark = Color(0xFF071A24);
  static const Color _panel = Color(0xFF142A36);
  static const Color _accent = Color(0xFF00CFFF);

  Future<List<EQSegment>>? _future;
  String? _loadedTrackId;
  bool _savingSegment = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = context.musicFlowColors;
    final player = ref.watch(playerControllerProvider);
    final track = player.currentTrack;

    if (track != null && _loadedTrackId != track.id) {
      _loadedTrackId = track.id;
      _future = ref.read(equalizerRepositoryProvider).listSegments(track.id);
    }

    return Scaffold(
      backgroundColor: colors.background,
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
            stops: [0.0, 0.28, 0.78],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 12, 18, 24),
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
                    const Spacer(),
                    Text(
                      'Segmentacion temporal',
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: colors.primary,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: track == null ? null : () => _reload(track.id),
                      icon: const Icon(Icons.refresh_rounded),
                      color: colors.primary,
                      disabledColor: Colors.white24,
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Text(
                  track?.title ?? 'Sin cancion activa',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    height: 1.05,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  track == null
                      ? 'Reproduce una cancion para crear tramos de EQ.'
                      : 'Crea zonas de tiempo donde la EQ cambia automaticamente.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.white70,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton.icon(
                    onPressed: track == null || _savingSegment
                        ? null
                        : () => _showCreateDialog(context),
                    icon: _savingSegment
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: _bgDark,
                            ),
                          )
                        : const Icon(Icons.add_rounded),
                    label: Text(
                      _savingSegment ? 'Guardando tramo' : 'Crear tramo actual',
                    ),
                    style: FilledButton.styleFrom(
                      backgroundColor: _accent,
                      foregroundColor: _bgDark,
                      disabledBackgroundColor: Colors.white12,
                      disabledForegroundColor: Colors.white38,
                      textStyle: const TextStyle(fontWeight: FontWeight.w900),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Expanded(
                  child: track == null
                      ? const _EmptyState(
                          icon: Icons.timeline_rounded,
                          title: 'Aun no hay una cancion',
                          message:
                              'Abre una cancion y vuelve aqui para marcar sus tramos.',
                        )
                      : FutureBuilder<List<EQSegment>>(
                          future: _future,
                          builder: (context, snapshot) {
                            if (snapshot.connectionState ==
                                ConnectionState.waiting) {
                              return const Center(
                                child: CircularProgressIndicator(
                                  color: _accent,
                                ),
                              );
                            }
                            if (snapshot.hasError) {
                              return const _EmptyState(
                                icon: Icons.cloud_off_rounded,
                                title: 'No se pudieron cargar los tramos',
                                message:
                                    'Verifica tu conexion y vuelve a intentarlo.',
                              );
                            }
                            final segments =
                                snapshot.data ?? const <EQSegment>[];
                            if (segments.isEmpty) {
                              return const _EmptyState(
                                icon: Icons.timeline_rounded,
                                title: 'Sin tramos guardados',
                                message:
                                    'Crea un tramo para realzar partes concretas de la cancion.',
                              );
                            }
                            return ListView.separated(
                              itemCount: segments.length,
                              separatorBuilder: (_, _) =>
                                  const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final segment = segments[index];
                                return _SegmentCard(segment: segment);
                              },
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _reload(String trackId) {
    setState(() {
      _future = ref.read(equalizerRepositoryProvider).listSegments(trackId);
    });
  }

  Future<void> _showCreateDialog(BuildContext screenContext) async {
    final player = ref.read(playerControllerProvider);
    final track = player.currentTrack;
    if (track == null || _savingSegment) return;

    final startSeconds = player.position.inSeconds;
    var maxSeconds = player.duration.inSeconds > 0
        ? player.duration.inSeconds
        : startSeconds + 30;
    if (maxSeconds <= startSeconds) {
      maxSeconds = startSeconds + 30;
    }
    final preferredEnd = startSeconds + 30;
    final endSeconds = preferredEnd > maxSeconds ? maxSeconds : preferredEnd;
    final labelController = TextEditingController(text: 'Tramo destacado');
    final startController = TextEditingController(
      text: startSeconds.toString(),
    );
    final endController = TextEditingController(text: endSeconds.toString());
    var preset = _SegmentPreset.voice;

    final draft = await showDialog<_SegmentDraft>(
      context: screenContext,
      builder: (dialogContext) {
        String? validationError;
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: _panel,
              titleTextStyle: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w900,
              ),
              contentTextStyle: const TextStyle(color: Colors.white70),
              title: const Text('Crear tramo'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _DialogField(
                      controller: labelController,
                      label: 'Nombre',
                      keyboardType: TextInputType.text,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _DialogField(
                            controller: startController,
                            label: 'Inicio (s)',
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _DialogField(
                            controller: endController,
                            label: 'Fin (s)',
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    DropdownButtonFormField<_SegmentPreset>(
                      initialValue: preset,
                      dropdownColor: _panel,
                      decoration: const InputDecoration(
                        labelText: 'Curva de EQ',
                        labelStyle: TextStyle(color: Colors.white60),
                        enabledBorder: UnderlineInputBorder(
                          borderSide: BorderSide(color: Colors.white38),
                        ),
                      ),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                      items: _SegmentPreset.values
                          .map(
                            (item) => DropdownMenuItem(
                              value: item,
                              child: Text(item.label),
                            ),
                          )
                          .toList(),
                      onChanged: (value) {
                        if (value != null) {
                          setDialogState(() => preset = value);
                        }
                      },
                    ),
                    if (validationError != null) ...[
                      const SizedBox(height: 12),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          validationError!,
                          style: const TextStyle(
                            color: Color(0xFFFF8A8A),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: const Text('Cancelar'),
                ),
                FilledButton(
                  onPressed: () {
                    final start = int.tryParse(startController.text.trim());
                    final end = int.tryParse(endController.text.trim());
                    if (start == null || end == null || end <= start) {
                      setDialogState(() {
                        validationError =
                            'El fin debe ser mayor que el inicio.';
                      });
                      return;
                    }
                    if (start < 0 || end < 0) {
                      setDialogState(() {
                        validationError =
                            'Los tiempos no pueden ser negativos.';
                      });
                      return;
                    }
                    if (end > maxSeconds) {
                      setDialogState(() {
                        validationError =
                            'El fin no puede superar ${_formatSeconds(maxSeconds)}.';
                      });
                      return;
                    }

                    Navigator.of(dialogContext).pop(
                      _SegmentDraft(
                        label: labelController.text.trim().isEmpty
                            ? 'Tramo destacado'
                            : labelController.text.trim(),
                        startMs: start * 1000,
                        endMs: end * 1000,
                        bands: preset.bands,
                      ),
                    );
                  },
                  child: const Text('Crear'),
                ),
              ],
            );
          },
        );
      },
    );

    labelController.dispose();
    startController.dispose();
    endController.dispose();

    if (draft == null || !mounted) return;

    setState(() => _savingSegment = true);
    try {
      await ref
          .read(equalizerRepositoryProvider)
          .createSegment(
            trackId: track.id,
            label: draft.label,
            startMs: draft.startMs,
            endMs: draft.endMs,
            bands: draft.bands,
          );
      await ref
          .read(playerControllerProvider.notifier)
          .refreshCurrentEqualizer();
      if (!mounted || !screenContext.mounted) return;
      _showSnack(screenContext, 'Tramo creado.');
      _reload(track.id);
    } catch (_) {
      if (!mounted || !screenContext.mounted) return;
      _showSnack(
        screenContext,
        'No se pudo crear el tramo. Verifica tu plan o conexion.',
      );
    } finally {
      if (mounted) {
        setState(() => _savingSegment = false);
      }
    }
  }

  void _showSnack(BuildContext context, String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  String _formatSeconds(int seconds) {
    final duration = Duration(seconds: seconds);
    final minutes = duration.inMinutes;
    final rest = duration.inSeconds.remainder(60);
    return '$minutes:${rest.toString().padLeft(2, '0')}';
  }
}

class _SegmentDraft {
  const _SegmentDraft({
    required this.label,
    required this.startMs,
    required this.endMs,
    required this.bands,
  });

  final String label;
  final int startMs;
  final int endMs;
  final List<int> bands;
}

class _SegmentCard extends StatelessWidget {
  const _SegmentCard({required this.segment});

  final EQSegment segment;

  @override
  Widget build(BuildContext context) {
    final bands = segment.eqConfig.bands;
    final peak = bands.isEmpty
        ? 0
        : bands.reduce((a, b) => a.abs() >= b.abs() ? a : b);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _TemporalSegmentsScreenState._panel,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: _TemporalSegmentsScreenState._accent.withValues(
                alpha: 0.14,
              ),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.graphic_eq_rounded,
              color: _TemporalSegmentsScreenState._accent,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  segment.label ?? 'Tramo destacado',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '${_formatMs(segment.startMs)} - ${_formatMs(segment.endMs)}',
                  style: const TextStyle(
                    color: Colors.white60,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          Text(
            peak == 0 ? 'Plano' : '${peak > 0 ? '+' : ''}$peak dB',
            style: const TextStyle(
              color: _TemporalSegmentsScreenState._accent,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }

  String _formatMs(int milliseconds) {
    final duration = Duration(milliseconds: milliseconds);
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds.remainder(60);
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }
}

class _DialogField extends StatelessWidget {
  const _DialogField({
    required this.controller,
    required this.label,
    required this.keyboardType,
  });

  final TextEditingController controller;
  final String label;
  final TextInputType keyboardType;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white60),
        enabledBorder: const UnderlineInputBorder(
          borderSide: BorderSide(color: Colors.white38),
        ),
        focusedBorder: const UnderlineInputBorder(
          borderSide: BorderSide(color: _TemporalSegmentsScreenState._accent),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: _TemporalSegmentsScreenState._accent, size: 48),
            const SizedBox(height: 14),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white60, height: 1.35),
            ),
          ],
        ),
      ),
    );
  }
}

enum _SegmentPreset {
  flat('Plano', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  bass('Realzar bajos', [5, 4, 3, 1, 0, 0, -1, -1, 0, 0]),
  voice('Realzar voz', [-2, -1, 0, 2, 4, 4, 3, 1, 0, -1]),
  highs('Realzar altos', [-2, -2, -1, 0, 1, 2, 4, 5, 5, 4]);

  const _SegmentPreset(this.label, this.bands);

  final String label;
  final List<int> bands;
}
