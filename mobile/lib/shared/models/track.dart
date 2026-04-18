class Track {
  final String id;
  final String title;
  final String artist;
  final String album;
  final int durationMs;
  final String? filePath;
  final String? fileUrl;
  final String fileHash;
  final String? coverArt;
  final String? genre;
  final int? year;

  Track({
    required this.id,
    required this.title,
    required this.artist,
    required this.album,
    required this.durationMs,
    this.filePath,
    this.fileUrl,
    required this.fileHash,
    this.coverArt,
    this.genre,
    this.year,
  });

  factory Track.fromJson(Map<String, dynamic> json) {
    return Track(
      id: json['id'] as String,
      title: json['title'] as String,
      artist: json['artist'] as String,
      album: json['album'] as String,
      durationMs: json['duration_ms'] as int,
      filePath: json['file_path_local'] as String?,
      fileUrl: json['file_url_remote'] as String?,
      fileHash: json['file_hash'] as String,
      coverArt: json['cover_art'] as String?,
      genre: json['genre'] as String?,
      year: json['year'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'artist': artist,
      'album': album,
      'duration_ms': durationMs,
      'file_path_local': filePath,
      'file_url_remote': fileUrl,
      'file_hash': fileHash,
      'cover_art': coverArt,
      'genre': genre,
      'year': year,
    };
  }

  String get durationFormatted {
    final minutes = durationMs ~/ 60000;
    final seconds = (durationMs % 60000) ~/ 1000;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }
}
