import 'package:musicflow_mobile/core/api/dio_client.dart';
import 'package:musicflow_mobile/shared/models/catalog.dart';

/// Reads the public, Spotify-like shared catalog (artists → albums → tracks).
class CatalogRepository {
  CatalogRepository(this._client);

  final DioClient _client;

  Future<List<CatalogArtist>> listArtists() async {
    final res = await _client.dio.get<List<dynamic>>('/catalog/artists');
    return (res.data ?? const [])
        .map((e) => CatalogArtist.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<CatalogArtistPage> listArtistsPage({
    required int offset,
    required int limit,
    String query = '',
  }) async {
    final res = await _client.dio.get<Map<String, dynamic>>(
      '/catalog/artists/page',
      queryParameters: {
        'offset': offset,
        'limit': limit,
        if (query.trim().isNotEmpty) 'q': query.trim(),
      },
    );
    return CatalogArtistPage.fromJson(res.data!);
  }

  Future<CatalogArtistDetail> getArtist(String id) async {
    final res = await _client.dio.get<Map<String, dynamic>>(
      '/catalog/artists/$id',
    );
    return CatalogArtistDetail.fromJson(res.data!);
  }

  /// Reads the server-calculated audience count without duplicating catalog data
  /// in the client. The count is refreshed after every follow action.
  Future<int> getArtistFollowerCount(String id) async {
    final res = await _client.dio.get<Map<String, dynamic>>(
      '/catalog/artists/$id',
    );
    return (res.data?['followerCount'] as num?)?.toInt() ?? 0;
  }

  Future<CatalogAlbumDetail> getAlbum(String id) async {
    final res = await _client.dio.get<Map<String, dynamic>>(
      '/catalog/albums/$id',
    );
    return CatalogAlbumDetail.fromJson(res.data!);
  }

  Future<void> followArtist(String id) async {
    await _client.dio.post('/catalog/artists/$id/follow');
  }

  Future<void> unfollowArtist(String id) async {
    await _client.dio.delete('/catalog/artists/$id/follow');
  }
}
