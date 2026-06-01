import 'package:freezed_annotation/freezed_annotation.dart';

part 'ai_agent.freezed.dart';
part 'ai_agent.g.dart';

@freezed
class SuggestedSegment with _$SuggestedSegment {
  const factory SuggestedSegment({
    required String label,
    required int startMs,
    required int endMs,
    required List<int> bands,
    @Default('') String explanation,
  }) = _SuggestedSegment;

  factory SuggestedSegment.fromJson(Map<String, dynamic> json) =>
      _$SuggestedSegmentFromJson(json);
}

@freezed
class EQSuggestion with _$EQSuggestion {
  const factory EQSuggestion({
    required List<int> bands,
    @Default(0) int bassBoost,
    @Default(0) int virtualizer,
    @Default(0) int loudness,
    @Default('NONE') String reverbPreset,
    @Default(0) int reverbAmount,
    @Default('') String explanation,
    List<SuggestedSegment>? segments,
  }) = _EQSuggestion;

  factory EQSuggestion.fromJson(Map<String, dynamic> json) =>
      _$EQSuggestionFromJson(json);
}

@freezed
class AISuggestResponse with _$AISuggestResponse {
  const factory AISuggestResponse({
    required EQSuggestion suggestion,
    required String requestId,
  }) = _AISuggestResponse;

  factory AISuggestResponse.fromJson(Map<String, dynamic> json) =>
      _$AISuggestResponseFromJson(json);
}
