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

  Future<CatalogArtistDetail> getArtist(String id) async {
    final res = await _client.dio.get<Map<String, dynamic>>(
      '/catalog/artists/$id',
    );
    return CatalogArtistDetail.fromJson(res.data!);
  }

  Future<CatalogAlbumDetail> getAlbum(String id) async {
    final res = await _client.dio.get<Map<String, dynamic>>(
      '/catalog/albums/$id',
    );
    return CatalogAlbumDetail.fromJson(res.data!);
  }
}
