import 'package:musicflow_mobile/core/api/dio_client.dart';
import 'package:musicflow_mobile/shared/models/track.dart';

class TracksRepository {
  TracksRepository(this._client);

  final DioClient _client;

  Future<TracksListResponse> listTracks({
    String? search,
    String? artist,
    String? album,
    String? genre,
    int skip = 0,
    int take = 50,
  }) async {
    final res = await _client.dio.get<Map<String, dynamic>>(
      '/library/tracks',
      queryParameters: {
        if (search != null && search.isNotEmpty) 'search': search,
        if (artist != null && artist.isNotEmpty) 'artist': artist,
        if (album != null && album.isNotEmpty) 'album': album,
        if (genre != null && genre.isNotEmpty) 'genre': genre,
        'skip': skip,
        'take': take,
      },
    );
    return TracksListResponse.fromJson(res.data!);
  }

  Future<TracksListResponse> listSavedTracks({
    String? search,
    int skip = 0,
    int take = 5,
  }) async {
    final res = await _client.dio.get<Map<String, dynamic>>(
      '/library/saves',
      queryParameters: {
        if (search != null && search.isNotEmpty) 'search': search,
        'skip': skip,
        'take': take,
      },
    );
    return TracksListResponse.fromJson(res.data!);
  }

  Future<Track> getTrack(String id) async {
    final res = await _client.dio.get<Map<String, dynamic>>(
      '/library/tracks/$id',
    );
    return Track.fromJson(res.data!);
  }

  Future<Set<String>> getSavedTrackIds(List<String> trackIds) async {
    if (trackIds.isEmpty) return {};
    final res = await _client.dio.post<Map<String, dynamic>>(
      '/library/saves/check',
      data: {'trackIds': trackIds},
    );
    final ids = res.data?['savedTrackIds'];
    return ids is List ? ids.cast<String>().toSet() : {};
  }

  Future<void> saveTrack(String trackId) async {
    await _client.dio.post('/library/saves/$trackId');
  }

  Future<void> unsaveTrack(String trackId) async {
    await _client.dio.delete('/library/saves/$trackId');
  }

  Future<List<String>> listArtists() async {
    final res = await _client.dio.get<List<dynamic>>('/library/tracks/artists');
    return res.data!.cast<String>();
  }

  Future<List<String>> listGenres() async {
    final res = await _client.dio.get<List<dynamic>>('/library/tracks/genres');
    return res.data!.cast<String>();
  }
}
