// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ai_agent.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$SuggestedSegmentImpl _$$SuggestedSegmentImplFromJson(
  Map<String, dynamic> json,
) => _$SuggestedSegmentImpl(
  label: json['label'] as String,
  startMs: (json['startMs'] as num).toInt(),
  endMs: (json['endMs'] as num).toInt(),
  bands: (json['bands'] as List<dynamic>)
      .map((e) => (e as num).toInt())
      .toList(),
  explanation: json['explanation'] as String? ?? '',
);

Map<String, dynamic> _$$SuggestedSegmentImplToJson(
  _$SuggestedSegmentImpl instance,
) => <String, dynamic>{
  'label': instance.label,
  'startMs': instance.startMs,
  'endMs': instance.endMs,
  'bands': instance.bands,
  'explanation': instance.explanation,
};

_$EQSuggestionImpl _$$EQSuggestionImplFromJson(Map<String, dynamic> json) =>
    _$EQSuggestionImpl(
      bands: (json['bands'] as List<dynamic>)
          .map((e) => (e as num).toInt())
          .toList(),
      bassBoost: (json['bassBoost'] as num?)?.toInt() ?? 0,
      virtualizer: (json['virtualizer'] as num?)?.toInt() ?? 0,
      loudness: (json['loudness'] as num?)?.toInt() ?? 0,
      reverbPreset: json['reverbPreset'] as String? ?? 'NONE',
      reverbAmount: (json['reverbAmount'] as num?)?.toInt() ?? 0,
      explanation: json['explanation'] as String? ?? '',
      segments: (json['segments'] as List<dynamic>?)
          ?.map((e) => SuggestedSegment.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$$EQSuggestionImplToJson(_$EQSuggestionImpl instance) =>
    <String, dynamic>{
      'bands': instance.bands,
      'bassBoost': instance.bassBoost,
      'virtualizer': instance.virtualizer,
      'loudness': instance.loudness,
      'reverbPreset': instance.reverbPreset,
      'reverbAmount': instance.reverbAmount,
      'explanation': instance.explanation,
      'segments': instance.segments,
    };

_$AISuggestResponseImpl _$$AISuggestResponseImplFromJson(
  Map<String, dynamic> json,
) => _$AISuggestResponseImpl(
  suggestion: EQSuggestion.fromJson(json['suggestion'] as Map<String, dynamic>),
  requestId: json['requestId'] as String,
);

Map<String, dynamic> _$$AISuggestResponseImplToJson(
  _$AISuggestResponseImpl instance,
) => <String, dynamic>{
  'suggestion': instance.suggestion,
  'requestId': instance.requestId,
};
