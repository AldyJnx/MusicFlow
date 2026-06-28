import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/core/widgets/mini_player_bar.dart';
import 'package:musicflow_mobile/features/catalog/catalog_mappers.dart';
import 'package:musicflow_mobile/features/catalog/providers/catalog_providers.dart';
import 'package:musicflow_mobile/features/catalog/widgets/catalog_widgets.dart';
import 'package:musicflow_mobile/features/player/providers/player_controller.dart';
import 'package:musicflow_mobile/shared/models/catalog.dart';

/// A catalog album: cover hero + tracklist, every song streamable.
class CatalogAlbumScreen extends ConsumerWidget {
  const CatalogAlbumScreen({required this.albumId, super.key});

  final String albumId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.musicFlowColors;
    final albumAsync = ref.watch(catalogAlbumProvider(albumId));

    return Scaffold(
      backgroundColor: colors.background,
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
          child: albumAsync.when(
            loading: () =>
                Center(child: CircularProgressIndicator(color: colors.primary)),
            error: (_, __) => CatalogMessage(
              message: 'No se pudo cargar el álbum.',
              onRetry: () => ref.invalidate(catalogAlbumProvider(albumId)),
            ),
            data: (album) => _AlbumBody(album: album),
          ),
        ),
      ),
    );
  }
}

class _AlbumBody extends ConsumerWidget {
  const _AlbumBody({required this.album});

  final CatalogAlbumDetail album;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.musicFlowColors;
    final tracks = album.tracks;
    final subtitle = [
      album.artist.name,
      if (album.year != null) '${album.year}',
      '${tracks.length} canciones',
    ].join(' · ');

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 126),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: IconButton(
              onPressed: () => Navigator.of(context).maybePop(),
              icon: const Icon(Icons.arrow_back_ios_new_rounded),
              color: Colors.white,
            ),
          ),
          Center(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: SizedBox(
                width: 200,
                height: 200,
                child: CatalogCoverImage(
                  url: album.coverArt,
                  fallbackIcon: Icons.album_rounded,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            album.title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 4),
          Text(subtitle, style: TextStyle(color: colors.textMuted, fontSize: 12)),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: tracks.isEmpty
                ? null
                : () => ref
                      .read(playerControllerProvider.notifier)
                      .playTrackList(catalogCardsToTracks(tracks), startIndex: 0),
            icon: const Icon(Icons.play_arrow_rounded),
            label: const Text('Reproducir'),
            style: FilledButton.styleFrom(
              backgroundColor: colors.primary,
              foregroundColor: Colors.black,
            ),
          ),
          const SizedBox(height: 16),
          ...tracks.asMap().entries.map(
            (e) => ListTile(
              contentPadding: EdgeInsets.zero,
              onTap: () => ref
                  .read(playerControllerProvider.notifier)
                  .playTrackList(catalogCardsToTracks(tracks), startIndex: e.key),
              leading: SizedBox(
                width: 28,
                child: Center(
                  child: Text(
                    '${e.value.albumOrder ?? e.key + 1}',
                    style: TextStyle(color: colors.textMuted, fontSize: 13),
                  ),
                ),
              ),
              title: Text(
                e.value.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
              trailing: Icon(Icons.play_arrow_rounded, color: colors.textMuted),
            ),
          ),
        ],
      ),
    );
  }
}
