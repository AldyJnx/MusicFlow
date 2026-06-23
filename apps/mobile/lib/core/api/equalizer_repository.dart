import 'package:musicflow_mobile/core/api/dio_client.dart';
import 'package:musicflow_mobile/shared/models/eq.dart';

class EqualizerRepository {
  EqualizerRepository(this._client);

  final DioClient _client;

  Future<EQConfig?> resolveForTrack(
    String trackId, {
    String? playlistId,
  }) async {
    final res = await _client.dio.get<Map<String, dynamic>?>(
      '/equalizer/configs/resolve/$trackId',
      queryParameters: {
        if (playlistId != null && playlistId.isNotEmpty)
          'playlistId': playlistId,
      },
    );
    final data = res.data;
    return data == null ? null : EQConfig.fromJson(data);
  }

  Future<EQConfig?> getConfigByScope({
    required EQScopeType scopeType,
    String? scopeId,
  }) async {
    final res = await _client.dio.get<Map<String, dynamic>?>(
      '/equalizer/configs',
      queryParameters: {
        'scopeType': _scopeValue(scopeType),
        if (scopeId != null && scopeId.isNotEmpty) 'scopeId': scopeId,
      },
    );
    final data = res.data;
    return data == null ? null : EQConfig.fromJson(data);
  }

  Future<EQConfig> upsertTrackConfig({
    required String trackId,
    required List<int> bands,
  }) async {
    final res = await _client.dio.post<Map<String, dynamic>>(
      '/equalizer/configs',
      data: {
        'scopeType': 'TRACK',
        'scopeId': trackId,
        'bands': bands,
        'isActive': true,
      },
    );
    return EQConfig.fromJson(res.data!);
  }

  Future<EQConfig> upsertPlaylistConfig({
    required String playlistId,
    required List<int> bands,
  }) async {
    final res = await _client.dio.post<Map<String, dynamic>>(
      '/equalizer/configs',
      data: {
        'scopeType': 'PLAYLIST',
        'scopeId': playlistId,
        'bands': bands,
        'isActive': true,
      },
    );
    return EQConfig.fromJson(res.data!);
  }

  Future<List<EQSegment>> listSegments(String trackId) async {
    final res = await _client.dio.get<List<dynamic>>(
      '/equalizer/segments/$trackId',
    );
    return res.data!
        .whereType<Map<String, dynamic>>()
        .map(EQSegment.fromJson)
        .toList();
  }

  Future<EQSegment> createSegment({
    required String trackId,
    required String label,
    required int startMs,
    required int endMs,
    required List<int> bands,
  }) async {
    final res = await _client.dio.post<Map<String, dynamic>>(
      '/equalizer/segments',
      data: {
        'trackId': trackId,
        'label': label,
        'startMs': startMs,
        'endMs': endMs,
        'transitionMs': 500,
        'createdBy': 'MANUAL',
        'eqConfig': {'bands': bands},
      },
    );
    return EQSegment.fromJson(res.data!);
  }

  String _scopeValue(EQScopeType scopeType) {
    return switch (scopeType) {
      EQScopeType.global => 'GLOBAL',
      EQScopeType.playlist => 'PLAYLIST',
      EQScopeType.track => 'TRACK',
      EQScopeType.segment => 'SEGMENT',
    };
  }
}
