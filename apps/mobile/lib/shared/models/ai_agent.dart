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

class AIAssistantResponse {
  const AIAssistantResponse({
    required this.requestId,
    required this.intent,
    required this.message,
    this.eq,
    this.tracks = const [],
    this.genres = const [],
  });

  final String requestId;
  final String intent;
  final String message;
  final EQSuggestion? eq;
  final List<AIRecommendedTrack> tracks;
  final List<String> genres;

  factory AIAssistantResponse.fromJson(Map<String, dynamic> json) {
    final tracks = json['tracks'];
    final genres = json['genres'];
    return AIAssistantResponse(
      requestId: json['requestId'] as String? ?? '',
      intent: json['intent'] as String? ?? 'reply',
      message: json['message'] as String? ?? 'Listo.',
      eq: json['eq'] is Map<String, dynamic>
          ? EQSuggestion.fromJson(json['eq'] as Map<String, dynamic>)
          : null,
      tracks: tracks is List
          ? tracks
                .whereType<Map<String, dynamic>>()
                .map(AIRecommendedTrack.fromJson)
                .toList(growable: false)
          : const [],
      genres: genres is List ? genres.whereType<String>().toList() : const [],
    );
  }
}

class AIRecommendedTrack {
  const AIRecommendedTrack({
    required this.id,
    required this.title,
    required this.artist,
    required this.album,
    this.genre,
    this.coverArt,
    this.durationMs = 0,
    this.fileUrlRemote,
  });

  final String id;
  final String title;
  final String artist;
  final String album;
  final String? genre;
  final String? coverArt;
  final int durationMs;
  final String? fileUrlRemote;

  factory AIRecommendedTrack.fromJson(Map<String, dynamic> json) {
    return AIRecommendedTrack(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? 'Cancion',
      artist: json['artist'] as String? ?? '',
      album: json['album'] as String? ?? '',
      genre: json['genre'] as String?,
      coverArt: json['coverArt'] as String?,
      durationMs: json['durationMs'] as int? ?? 0,
      fileUrlRemote: json['fileUrlRemote'] as String?,
    );
  }
}
