import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/core/widgets/mini_player_bar.dart';
import 'package:musicflow_mobile/features/downloads/models/downloaded_track.dart';
import 'package:musicflow_mobile/features/downloads/providers/downloads_providers.dart';
import 'package:musicflow_mobile/features/player/providers/player_controller.dart';
import 'package:musicflow_mobile/shared/models/track.dart';

/// The offline library: every downloaded track, playable with no network.
class DownloadsScreen extends ConsumerWidget {
  const DownloadsScreen({super.key});

  Track _toTrack(DownloadedTrack d, String localUri) {
    final epoch = DateTime.fromMillisecondsSinceEpoch(0);
    return Track(
      id: d.id,
      userId: '',
      title: d.title,
      artist: d.artist,
      album: d.album,
      durationMs: d.durationMs,
      coverArt: d.coverArt,
      // The local URI doubles as the playable source so it works fully offline.
      fileUrlRemote: localUri,
      source: TrackSource.synced,
      syncStatus: SyncStatus.synced,
      createdAt: epoch,
      updatedAt: epoch,
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.musicFlowColors;
    final state = ref.watch(downloadsControllerProvider);
    final controller = ref.read(downloadsControllerProvider.notifier);

    final downloads = state.items.values.toList()
      ..sort((a, b) => b.downloadedAt.compareTo(a.downloadedAt));

    final playable = <Track>[];
    for (final d in downloads) {
      final uri = state.localUriFor(d.id);
      if (uri != null) playable.add(_toTrack(d, uri));
    }

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Descargas'),
        foregroundColor: Colors.white,
      ),
      bottomSheet: const MiniPlayerBar(),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [colors.gradientStart, colors.gradientEnd, colors.background],
            stops: const [0.0, 0.28, 0.78],
          ),
        ),
        child: SafeArea(
          child: downloads.isEmpty
              ? _EmptyState(colors: colors)
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 126),
                  itemCount: downloads.length,
                  itemBuilder: (context, i) {
                    final d = downloads[i];
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: SizedBox(
                          width: 48,
                          height: 48,
                          child: d.coverArt != null && d.coverArt!.isNotEmpty
                              ? Image.network(
                                  d.coverArt!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) =>
                                      _coverFallback(colors),
                                )
                              : _coverFallback(colors),
                        ),
                      ),
                      title: Text(
                        d.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      subtitle: Text(
                        d.artist,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(color: colors.textMuted, fontSize: 12),
                      ),
                      onTap: () {
                        final index = playable.indexWhere((t) => t.id == d.id);
                        if (index >= 0) {
                          ref
                              .read(playerControllerProvider.notifier)
                              .playTrackList(playable, startIndex: index);
                        }
                      },
                      trailing: IconButton(
                        icon: Icon(
                          Icons.delete_outline_rounded,
                          color: colors.textMuted,
                        ),
                        tooltip: 'Quitar descarga',
                        onPressed: () => controller.remove(d.id),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }

  Widget _coverFallback(MusicFlowThemeColors colors) {
    return Container(
      color: colors.surfaceAlt,
      child: const Icon(Icons.music_note_rounded, color: Colors.white24),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.colors});

  final MusicFlowThemeColors colors;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 36),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.download_for_offline_outlined,
              size: 48,
              color: colors.textMuted,
            ),
            const SizedBox(height: 12),
            Text(
              'Aún no descargas nada. Toca el ícono de descarga en una canción '
              'del catálogo para escucharla sin conexión.',
              textAlign: TextAlign.center,
              style: TextStyle(color: colors.textMuted),
            ),
          ],
        ),
      ),
    );
  }
}
