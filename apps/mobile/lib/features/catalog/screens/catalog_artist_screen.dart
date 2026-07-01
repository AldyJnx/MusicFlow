import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/core/widgets/mini_player_bar.dart';
import 'package:musicflow_mobile/features/catalog/catalog_mappers.dart';
import 'package:musicflow_mobile/features/catalog/providers/catalog_providers.dart';
import 'package:musicflow_mobile/features/catalog/widgets/catalog_widgets.dart';
import 'package:musicflow_mobile/features/downloads/widgets/download_button.dart';
import 'package:musicflow_mobile/features/player/providers/player_controller.dart';
import 'package:musicflow_mobile/shared/models/catalog.dart';

/// A catalog artist: header, their albums (horizontal), and every song.
class CatalogArtistScreen extends ConsumerWidget {
  const CatalogArtistScreen({required this.artistId, super.key});

  final String artistId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.musicFlowColors;
    final artistAsync = ref.watch(catalogArtistProvider(artistId));

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
          child: artistAsync.when(
            loading: () =>
                Center(child: CircularProgressIndicator(color: colors.primary)),
            error: (_, __) => CatalogMessage(
              message: 'No se pudo cargar el artista.',
              onRetry: () => ref.invalidate(catalogArtistProvider(artistId)),
            ),
            data: (artist) => _ArtistBody(artist: artist),
          ),
        ),
      ),
    );
  }
}

class _ArtistBody extends ConsumerWidget {
  const _ArtistBody({required this.artist});

  final CatalogArtistDetail artist;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.musicFlowColors;
    final tracks = artist.tracks;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 126),
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
            ],
          ),
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(40),
                child: SizedBox(
                  width: 88,
                  height: 88,
                  child: CatalogCoverImage(
                    url: artist.imageUrl,
                    fallbackIcon: Icons.person_rounded,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      artist.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${artist.albums.length} álbumes · ${tracks.length} canciones',
                      style: TextStyle(color: colors.textMuted, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (artist.bio != null && artist.bio!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              artist.bio!,
              style: TextStyle(color: colors.textMuted, fontSize: 13, height: 1.4),
            ),
          ],
          const SizedBox(height: 20),
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
          if (artist.albums.isNotEmpty) ...[
            const SizedBox(height: 24),
            _SectionTitle('Álbumes'),
            const SizedBox(height: 12),
            SizedBox(
              height: 180,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: artist.albums.length,
                separatorBuilder: (_, __) => const SizedBox(width: 14),
                itemBuilder: (context, i) {
                  final album = artist.albums[i];
                  return _AlbumCard(
                    album: album,
                    onTap: () => context.push(
                      '${AppRoutes.catalogAlbum}/${album.id}',
                    ),
                  );
                },
              ),
            ),
          ],
          const SizedBox(height: 24),
          _SectionTitle('Canciones'),
          const SizedBox(height: 8),
          ...tracks.asMap().entries.map(
            (e) => _TrackRow(
              index: e.key,
              track: e.value,
              onTap: () => ref
                  .read(playerControllerProvider.notifier)
                  .playTrackList(catalogCardsToTracks(tracks), startIndex: e.key),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        color: Colors.white,
        fontSize: 18,
        fontWeight: FontWeight.w800,
      ),
    );
  }
}

class _AlbumCard extends StatelessWidget {
  const _AlbumCard({required this.album, required this.onTap});

  final CatalogAlbumSummary album;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 130,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: SizedBox(
                width: 130,
                height: 130,
                child: CatalogCoverImage(
                  url: album.coverArt,
                  fallbackIcon: Icons.album_rounded,
                ),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              album.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
            if (album.year != null)
              Text(
                '${album.year}',
                style: TextStyle(color: colors.textMuted, fontSize: 11),
              ),
          ],
        ),
      ),
    );
  }
}

class _TrackRow extends StatelessWidget {
  const _TrackRow({
    required this.index,
    required this.track,
    required this.onTap,
  });

  final int index;
  final CatalogTrackCard track;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      onTap: onTap,
      leading: SizedBox(
        width: 28,
        child: Center(
          child: Text(
            '${index + 1}',
            style: TextStyle(color: colors.textMuted, fontSize: 13),
          ),
        ),
      ),
      title: Text(
        track.title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
      ),
      subtitle: track.album.isEmpty
          ? null
          : Text(
              track.album,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: colors.textMuted, fontSize: 12),
            ),
      trailing: _trailing(),
    );
  }

  Widget? _trailing() {
    final downloadable = track.toDownloadable();
    if (downloadable == null) return null;
    return DownloadButton(track: downloadable);
  }
}
