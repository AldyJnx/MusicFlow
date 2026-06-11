import 'package:musicflow_mobile/core/api/dio_client.dart';
import 'package:musicflow_mobile/shared/models/playlist.dart';

class PlaylistsRepository {
  PlaylistsRepository(this._client);

  final DioClient _client;

  /// Lists the current user's playlists (each carries a track count, no tracks).
  Future<List<Playlist>> listPlaylists() async {
    final res =
        await _client.dio.get<List<dynamic>>('/library/playlists');
    return res.data!
        .map((e) => Playlist.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Fetches a single playlist with its ordered tracks.
  Future<Playlist> getPlaylist(String id) async {
    final res =
        await _client.dio.get<Map<String, dynamic>>('/library/playlists/$id');
    return Playlist.fromJson(res.data!);
  }
}
