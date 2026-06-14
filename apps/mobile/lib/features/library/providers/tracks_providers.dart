import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/shared/models/track.dart';

class TracksQuery {
  const TracksQuery({
    this.search,
    this.artist,
    this.album,
    this.genre,
    this.skip = 0,
    this.take = 50,
  });

  final String? search;
  final String? artist;
  final String? album;
  final String? genre;
  final int skip;
  final int take;

  @override
  bool operator ==(Object other) {
    return other is TracksQuery &&
        other.search == search &&
        other.artist == artist &&
        other.album == album &&
        other.genre == genre &&
        other.skip == skip &&
        other.take == take;
  }

  @override
  int get hashCode => Object.hash(search, artist, album, genre, skip, take);
}

final tracksListProvider = FutureProvider.autoDispose
    .family<TracksListResponse, TracksQuery>((ref, query) {
      return ref
          .watch(tracksRepositoryProvider)
          .listTracks(
            search: query.search,
            artist: query.artist,
            album: query.album,
            genre: query.genre,
            skip: query.skip,
            take: query.take,
          );
    });

final savedTracksListProvider = FutureProvider.autoDispose
    .family<TracksListResponse, TracksQuery>((ref, query) {
      return ref
          .watch(tracksRepositoryProvider)
          .listSavedTracks(
            search: query.search,
            skip: query.skip,
            take: query.take,
          );
    });

final recentlyPlayedTracksProvider = FutureProvider.autoDispose
    .family<List<Track>, int>((ref, limit) {
      return ref
          .watch(analyticsRepositoryProvider)
          .getRecentlyPlayed(limit: limit);
    });

final artistsProvider = FutureProvider.autoDispose<List<String>>((ref) {
  return ref.watch(tracksRepositoryProvider).listArtists();
});

final savedTrackIdsProvider = FutureProvider.autoDispose
    .family<Set<String>, String>((ref, trackIdsKey) {
      final ids = trackIdsKey
          .split('|')
          .map((id) => id.trim())
          .where((id) => id.isNotEmpty)
          .toList(growable: false);
      return ref.watch(tracksRepositoryProvider).getSavedTrackIds(ids);
    });
