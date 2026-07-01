import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/features/downloads/providers/downloads_controller.dart';
import 'package:musicflow_mobile/features/downloads/providers/downloads_providers.dart';

/// Toggles offline availability for a track: download → spinner with % →
/// green check (tap to remove). No-ops for tracks without a streamable URL.
class DownloadButton extends ConsumerWidget {
  const DownloadButton({required this.track, super.key, this.size = 22});

  final DownloadableTrack track;
  final double size;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.musicFlowColors;
    final state = ref.watch(downloadsControllerProvider);
    final controller = ref.read(downloadsControllerProvider.notifier);

    if (track.url.isEmpty) return const SizedBox.shrink();

    final downloaded = state.isDownloaded(track.id);
    final progress = state.progress[track.id];
    final downloading = progress != null;

    if (downloading) {
      return SizedBox(
        width: size,
        height: size,
        child: Stack(
          alignment: Alignment.center,
          children: [
            CircularProgressIndicator(
              value: progress == 0 ? null : progress,
              strokeWidth: 2,
              color: colors.primary,
            ),
          ],
        ),
      );
    }

    return IconButton(
      visualDensity: VisualDensity.compact,
      padding: EdgeInsets.zero,
      constraints: BoxConstraints.tightFor(width: size + 14, height: size + 14),
      iconSize: size,
      tooltip: downloaded ? 'Descargado · quitar' : 'Descargar sin conexión',
      onPressed: () => downloaded
          ? controller.remove(track.id)
          : controller.download(track),
      icon: Icon(
        downloaded
            ? Icons.check_circle_rounded
            : Icons.download_for_offline_outlined,
        color: downloaded ? colors.primary : colors.textMuted,
      ),
    );
  }
}
