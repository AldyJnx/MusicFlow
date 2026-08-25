import 'package:musicflow_mobile/core/api/dio_client.dart';
import 'package:musicflow_mobile/shared/models/track.dart';

class RecommendationsRepository {
  RecommendationsRepository(this._client);

  final DioClient _client;

  Future<TracksListResponse> home({int limit = 6}) async {
    final response = await _client.dio.get<Map<String, dynamic>>(
      '/recommendations/home',
      queryParameters: {'limit': limit},
    );
    final rawTracks = response.data?['tracks'];
    final tracks = rawTracks is List
        ? rawTracks
              .whereType<Map<String, dynamic>>()
              .map(Track.fromJson)
              .toList(growable: false)
        : const <Track>[];
    return TracksListResponse(
      tracks: tracks,
      total: tracks.length,
      skip: 0,
      take: limit,
    );
  }
}
