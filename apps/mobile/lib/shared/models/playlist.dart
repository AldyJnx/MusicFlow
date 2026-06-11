import 'package:musicflow_mobile/shared/models/track.dart';

/// A user playlist. Mirrors the backend `GET /library/playlists` shape, where
/// list responses include `_count.tracks` and detail responses (`/:id`) embed
/// the ordered tracks under `tracks[].track`.
class Playlist {
  const Playlist({
    required this.id,
    required this.name,
    required this.description,
    this.coverArt,
    required this.trackCount,
    this.tracks = const [],
  });

  final String id;
  final String name;
  final String description;
  final String? coverArt;
  final int trackCount;
  final List<Track> tracks;

  factory Playlist.fromJson(Map<String, dynamic> json) {
    final count = json['_count'] as Map<String, dynamic>?;
    final rawTracks = json['tracks'] as List<dynamic>?;

    final tracks = rawTracks == null
        ? const <Track>[]
        : rawTracks
            .map((e) => (e as Map<String, dynamic>)['track'])
            .whereType<Map<String, dynamic>>()
            .map(Track.fromJson)
            .toList();

    return Playlist(
      id: json['id'] as String,
      name: (json['name'] as String?) ?? '',
      description: (json['description'] as String?) ?? '',
      coverArt: json['coverArt'] as String?,
      trackCount: (count?['tracks'] as int?) ?? tracks.length,
      tracks: tracks,
    );
  }
}
