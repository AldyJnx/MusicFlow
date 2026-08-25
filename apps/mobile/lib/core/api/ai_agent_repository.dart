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
      '/ai/suggest',
      data: {
        'prompt': prompt,
        'trackId': ?trackId,
        'playlistId': ?playlistId,
        'context': ?context,
      },
    );
    return AISuggestResponse.fromJson(res.data!);
  }

  Future<AIAssistantResponse> assist({
    required String prompt,
    String? trackId,
  }) async {
    final res = await _client.dio.post<Map<String, dynamic>>(
      '/ai/assistant',
      data: {'prompt': prompt, 'trackId': ?trackId},
    );
    return AIAssistantResponse.fromJson(res.data!);
  }

  Future<void> accept(
    String requestId,
    String appliedTo, {
    String? appliedId,
  }) async {
    await _client.dio.post(
      '/ai/$requestId/accept',
      data: {'appliedTo': appliedTo, 'appliedId': ?appliedId},
    );
  }

  Future<void> provideFeedback(
    String requestId,
    String feedback, {
    String? comment,
  }) async {
    await _client.dio.post(
      '/ai/$requestId/feedback',
      data: {
        'feedback': feedback,
        if (comment != null && comment.isNotEmpty) 'comment': comment,
      },
    );
  }
}
