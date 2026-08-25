import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/shared/models/catalog.dart';

/// The full artist list of the shared catalog.
final catalogArtistsProvider = FutureProvider.autoDispose<List<CatalogArtist>>((
  ref,
) {
  return ref.watch(catalogRepositoryProvider).listArtists();
});

final catalogArtistsPageProvider = FutureProvider.autoDispose
    .family<CatalogArtistPage, ({String query, int page})>((ref, request) {
      return ref
          .watch(catalogRepositoryProvider)
          .listArtistsPage(
            offset: request.page * 6,
            limit: 6,
            query: request.query,
          );
    });

/// A single artist's detail (albums + tracks), keyed by artist id.
final catalogArtistProvider = FutureProvider.autoDispose
    .family<CatalogArtistDetail, String>((ref, id) {
      return ref.watch(catalogRepositoryProvider).getArtist(id);
    });

/// A single album's detail (tracklist + artist), keyed by album id.
final catalogAlbumProvider = FutureProvider.autoDispose
    .family<CatalogAlbumDetail, String>((ref, id) {
      return ref.watch(catalogRepositoryProvider).getAlbum(id);
    });
