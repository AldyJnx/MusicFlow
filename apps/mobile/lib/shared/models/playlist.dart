import 'package:musicflow_mobile/shared/models/track.dart';

/// A user playlist. Mirrors the backend `GET /library/playlists` shape, where
/// list responses include `_count.tracks` and detail responses (`/:id`) embed
/// the ordered tracks under `tracks[].track`.
class Playlist {
  const Playlist({
    required this.id,
    this.userId = '',
    required this.name,
    required this.description,
    this.coverArt,
    this.isPublic = false,
    this.shareToken,
    required this.trackCount,
    this.tracks = const [],
  });

  final String id;
  final String userId;
  final String name;
  final String description;
  final String? coverArt;
  final bool isPublic;
  final String? shareToken;
  final int trackCount;
  final List<Track> tracks;

  factory Playlist.fromJson(Map<String, dynamic> json) {
    final count = json['_count'];
    final rawTracks = json['tracks'];

    final parsedTracks = rawTracks is List
        ? rawTracks
              .map((item) {
                if (item is! Map<String, dynamic>) return null;
                final track = item['track'];
                return track is Map<String, dynamic>
                    ? Track.fromJson(track)
                    : null;
              })
              .whereType<Track>()
              .toList()
        : const <Track>[];

    return Playlist(
      id: json['id'] as String,
      userId: json['userId'] as String? ?? '',
      name: json['name'] as String? ?? 'Mi biblioteca',
      description: json['description'] as String? ?? '',
      coverArt: json['coverArt'] as String?,
      isPublic: json['isPublic'] as bool? ?? false,
      shareToken: json['shareToken'] as String?,
      trackCount: count is Map
          ? (count['tracks'] as num?)?.toInt() ?? parsedTracks.length
          : parsedTracks.length,
      tracks: parsedTracks,
    );
  }
}
