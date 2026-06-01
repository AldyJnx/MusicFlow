import 'package:freezed_annotation/freezed_annotation.dart';

part 'eq.freezed.dart';
part 'eq.g.dart';

enum ReverbPreset {
  @JsonValue('NONE') none,
  @JsonValue('SMALL_ROOM') smallRoom,
  @JsonValue('MEDIUM_ROOM') mediumRoom,
  @JsonValue('LARGE_ROOM') largeRoom,
  @JsonValue('SMALL_HALL') smallHall,
  @JsonValue('LARGE_HALL') largeHall,
  @JsonValue('CATHEDRAL') cathedral,
  @JsonValue('PLATE') plate,
  @JsonValue('SPRING') spring,
}

enum EQScopeType {
  @JsonValue('GLOBAL') global,
  @JsonValue('PLAYLIST') playlist,
  @JsonValue('TRACK') track,
  @JsonValue('SEGMENT') segment,
}

@freezed
class EQPreset with _$EQPreset {
  const factory EQPreset({
    required String id,
    String? userId,
    required String name,
    @Default(false) bool isGlobal,
    required List<int> bands,
    @Default(0) int bassBoost,
    @Default(0) int virtualizer,
    @Default(0) int loudness,
    @Default(ReverbPreset.none) ReverbPreset reverbPreset,
    @Default(0) int reverbAmount,
  }) = _EQPreset;

  factory EQPreset.fromJson(Map<String, dynamic> json) =>
      _$EQPresetFromJson(json);
}

@freezed
class EQConfig with _$EQConfig {
  const factory EQConfig({
    required String id,
    required String userId,
    required EQScopeType scopeType,
    String? scopeId,
    String? presetId,
    required List<int> bands,
    @Default(0) int bassBoost,
    @Default(0) int virtualizer,
    @Default(0) int loudness,
    @Default(ReverbPreset.none) ReverbPreset reverbPreset,
    @Default(0) int reverbAmount,
    @Default(true) bool isActive,
  }) = _EQConfig;

  factory EQConfig.fromJson(Map<String, dynamic> json) =>
      _$EQConfigFromJson(json);
}

@freezed
class EQSegment with _$EQSegment {
  const factory EQSegment({
    required String id,
    required String trackId,
    required String userId,
    required String eqConfigId,
    String? label,
    required int startMs,
    required int endMs,
    @Default(500) int transitionMs,
    required EQConfig eqConfig,
  }) = _EQSegment;

  factory EQSegment.fromJson(Map<String, dynamic> json) =>
      _$EQSegmentFromJson(json);
}
