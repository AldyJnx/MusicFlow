import 'package:musicflow_mobile/core/api/dio_client.dart';
import 'package:musicflow_mobile/shared/models/playlist.dart';

class PlaylistsRepository {
  PlaylistsRepository(this._client);

  final DioClient _client;

  /// Lists the current user's playlists (each carries a track count, no tracks).
  Future<List<Playlist>> listPlaylists() async {
    final res = await _client.dio.get<List<dynamic>>('/library/playlists');
    return res.data!
        .cast<Map<String, dynamic>>()
        .map(Playlist.fromJson)
        .toList();
  }

  /// Fetches a single playlist with its ordered tracks.
  Future<Playlist> getPlaylist(String id) async {
    final res = await _client.dio.get<Map<String, dynamic>>(
      '/library/playlists/$id',
    );
    return Playlist.fromJson(res.data!);
  }

  Future<Playlist> createPlaylist({
    required String name,
    String? description,
  }) async {
    final res = await _client.dio.post<Map<String, dynamic>>(
      '/library/playlists',
      data: {
        'name': name,
        if (description != null && description.isNotEmpty)
          'description': description,
      },
    );
    return Playlist.fromJson(res.data!);
  }

  Future<Playlist> updatePlaylist({
    required String id,
    String? name,
    String? description,
  }) async {
    final res = await _client.dio.patch<Map<String, dynamic>>(
      '/library/playlists/$id',
      data: {
        if (name != null && name.isNotEmpty) 'name': name,
        if (description != null) 'description': description,
      },
    );
    return Playlist.fromJson(res.data!);
  }

  Future<void> addTrack({
    required String playlistId,
    required String trackId,
  }) async {
    await _client.dio.post(
      '/library/playlists/$playlistId/tracks',
      data: {'trackId': trackId},
    );
  }
}
