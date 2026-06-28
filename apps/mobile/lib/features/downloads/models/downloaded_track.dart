/// Metadata for a track stored on-device for offline playback. Persisted as a
/// JSON index in shared_preferences; the audio bytes live at [fileName] inside
/// the app's downloads directory.
class DownloadedTrack {
  const DownloadedTrack({
    required this.id,
    required this.title,
    required this.artist,
    required this.album,
    required this.durationMs,
    required this.fileName,
    this.coverArt,
    required this.downloadedAt,
  });

  final String id;
  final String title;
  final String artist;
  final String album;
  final int durationMs;

  /// File name (not full path) under the downloads directory. The absolute
  /// path is rebuilt at read time so it survives the app's sandbox moving.
  final String fileName;
  final String? coverArt;
  final int downloadedAt;

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'artist': artist,
    'album': album,
    'durationMs': durationMs,
    'fileName': fileName,
    'coverArt': coverArt,
    'downloadedAt': downloadedAt,
  };

  factory DownloadedTrack.fromJson(Map<String, dynamic> json) {
    return DownloadedTrack(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      artist: json['artist'] as String? ?? '',
      album: json['album'] as String? ?? '',
      durationMs: (json['durationMs'] as num?)?.toInt() ?? 0,
      fileName: json['fileName'] as String,
      coverArt: json['coverArt'] as String?,
      downloadedAt: (json['downloadedAt'] as num?)?.toInt() ?? 0,
    );
  }
}
