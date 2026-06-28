import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/shared/models/catalog.dart';

/// The full artist list of the shared catalog.
final catalogArtistsProvider =
    FutureProvider.autoDispose<List<CatalogArtist>>((ref) {
      return ref.watch(catalogRepositoryProvider).listArtists();
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
