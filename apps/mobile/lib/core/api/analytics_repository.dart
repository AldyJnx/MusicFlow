import 'package:musicflow_mobile/core/api/dio_client.dart';
import 'package:musicflow_mobile/shared/models/track.dart';

class AnalyticsRepository {
  AnalyticsRepository(this._client);

  final DioClient _client;

  Future<ListeningStats> getStats({String period = 'ALL_TIME'}) async {
    final res = await _client.dio.get<Map<String, dynamic>>(
      '/analytics/stats',
      queryParameters: {'period': period},
    );
    return ListeningStats.fromJson(res.data!);
  }

  Future<void> recordPlay({
    required String trackId,
    required int durationListenedMs,
    required bool completed,
    required bool skipped,
  }) async {
    await _client.dio.post(
      '/analytics/play',
      data: {
        'trackId': trackId,
        'durationListenedMs': durationListenedMs,
        'completed': completed,
        'skipped': skipped,
        'device': 'MOBILE',
      },
    );
  }

  Future<List<Track>> getRecentlyPlayed({int limit = 5}) async {
    final res = await _client.dio.get<List<dynamic>>(
      '/analytics/recently-played',
      queryParameters: {'limit': limit},
    );
    return res.data!
        .whereType<Map<String, dynamic>>()
        .map(Track.fromJson)
        .toList();
  }
}

class ListeningStats {
  const ListeningStats({required this.totalTimeMs, required this.topArtists});

  final int totalTimeMs;
  final List<StatsArtist> topArtists;

  factory ListeningStats.fromJson(Map<String, dynamic> json) {
    final artists = json['topArtists'];
    return ListeningStats(
      totalTimeMs: (json['totalTimeMs'] as num?)?.toInt() ?? 0,
      topArtists: artists is List
          ? artists
                .whereType<Map<String, dynamic>>()
                .map(StatsArtist.fromJson)
                .toList()
          : const [],
    );
  }
}

class StatsArtist {
  const StatsArtist({required this.name, required this.count});

  final String name;
  final int count;

  factory StatsArtist.fromJson(Map<String, dynamic> json) {
    return StatsArtist(
      name: json['name'] as String? ?? '',
      count: (json['count'] as num?)?.toInt() ?? 0,
    );
  }
}
