import 'package:musicflow_mobile/core/api/dio_client.dart';
import 'package:musicflow_mobile/shared/models/ai_agent.dart';

class AiAgentRepository {
  AiAgentRepository(this._client);

  final DioClient _client;

  Future<AISuggestResponse> suggest({
    required String prompt,
    String? trackId,
    String? playlistId,
    Map<String, dynamic>? context,
  }) async {
    final res = await _client.dio.post<Map<String, dynamic>>(
      '/ai-agent/suggest',
      data: {
        'prompt': prompt,
        if (trackId != null) 'trackId': trackId,
        if (playlistId != null) 'playlistId': playlistId,
        if (context != null) 'context': context,
      },
    );
    return AISuggestResponse.fromJson(res.data!);
  }

  Future<void> accept(String requestId, String appliedTo, {String? appliedId}) async {
    await _client.dio.post(
      '/ai-agent/$requestId/accept',
      data: {
        'appliedTo': appliedTo,
        if (appliedId != null) 'appliedId': appliedId,
      },
    );
  }

  Future<void> provideFeedback(String requestId, String feedback, {String? comment}) async {
    await _client.dio.post(
      '/ai-agent/$requestId/feedback',
      data: {
        'feedback': feedback,
        if (comment != null && comment.isNotEmpty) 'comment': comment,
      },
    );
  }
}
