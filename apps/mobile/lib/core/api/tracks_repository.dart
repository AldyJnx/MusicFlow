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
      '/tracks',
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

  Future<Track> getTrack(String id) async {
    final res = await _client.dio.get<Map<String, dynamic>>('/tracks/$id');
    return Track.fromJson(res.data!);
  }

  Future<List<String>> listArtists() async {
    final res = await _client.dio.get<List<dynamic>>('/tracks/artists');
    return res.data!.cast<String>();
  }

  Future<List<String>> listGenres() async {
    final res = await _client.dio.get<List<dynamic>>('/tracks/genres');
    return res.data!.cast<String>();
  }
}
