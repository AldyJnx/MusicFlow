// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'eq.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$EQPresetImpl _$$EQPresetImplFromJson(Map<String, dynamic> json) =>
    _$EQPresetImpl(
      id: json['id'] as String,
      userId: json['userId'] as String?,
      name: json['name'] as String,
      isGlobal: json['isGlobal'] as bool? ?? false,
      bands: (json['bands'] as List<dynamic>)
          .map((e) => (e as num).toInt())
          .toList(),
      bassBoost: (json['bassBoost'] as num?)?.toInt() ?? 0,
      virtualizer: (json['virtualizer'] as num?)?.toInt() ?? 0,
      loudness: (json['loudness'] as num?)?.toInt() ?? 0,
      reverbPreset:
          $enumDecodeNullable(_$ReverbPresetEnumMap, json['reverbPreset']) ??
          ReverbPreset.none,
      reverbAmount: (json['reverbAmount'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$$EQPresetImplToJson(_$EQPresetImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'name': instance.name,
      'isGlobal': instance.isGlobal,
      'bands': instance.bands,
      'bassBoost': instance.bassBoost,
      'virtualizer': instance.virtualizer,
      'loudness': instance.loudness,
      'reverbPreset': _$ReverbPresetEnumMap[instance.reverbPreset]!,
      'reverbAmount': instance.reverbAmount,
    };

const _$ReverbPresetEnumMap = {
  ReverbPreset.none: 'NONE',
  ReverbPreset.smallRoom: 'SMALL_ROOM',
  ReverbPreset.mediumRoom: 'MEDIUM_ROOM',
  ReverbPreset.largeRoom: 'LARGE_ROOM',
  ReverbPreset.smallHall: 'SMALL_HALL',
  ReverbPreset.largeHall: 'LARGE_HALL',
  ReverbPreset.cathedral: 'CATHEDRAL',
  ReverbPreset.plate: 'PLATE',
  ReverbPreset.spring: 'SPRING',
};

_$EQConfigImpl _$$EQConfigImplFromJson(Map<String, dynamic> json) =>
    _$EQConfigImpl(
      id: json['id'] as String,
      userId: json['userId'] as String,
      scopeType: $enumDecode(_$EQScopeTypeEnumMap, json['scopeType']),
      scopeId: json['scopeId'] as String?,
      presetId: json['presetId'] as String?,
      bands: (json['bands'] as List<dynamic>)
          .map((e) => (e as num).toInt())
          .toList(),
      bassBoost: (json['bassBoost'] as num?)?.toInt() ?? 0,
      virtualizer: (json['virtualizer'] as num?)?.toInt() ?? 0,
      loudness: (json['loudness'] as num?)?.toInt() ?? 0,
      reverbPreset:
          $enumDecodeNullable(_$ReverbPresetEnumMap, json['reverbPreset']) ??
          ReverbPreset.none,
      reverbAmount: (json['reverbAmount'] as num?)?.toInt() ?? 0,
      isActive: json['isActive'] as bool? ?? true,
    );

Map<String, dynamic> _$$EQConfigImplToJson(_$EQConfigImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'scopeType': _$EQScopeTypeEnumMap[instance.scopeType]!,
      'scopeId': instance.scopeId,
      'presetId': instance.presetId,
      'bands': instance.bands,
      'bassBoost': instance.bassBoost,
      'virtualizer': instance.virtualizer,
      'loudness': instance.loudness,
      'reverbPreset': _$ReverbPresetEnumMap[instance.reverbPreset]!,
      'reverbAmount': instance.reverbAmount,
      'isActive': instance.isActive,
    };

const _$EQScopeTypeEnumMap = {
  EQScopeType.global: 'GLOBAL',
  EQScopeType.playlist: 'PLAYLIST',
  EQScopeType.track: 'TRACK',
  EQScopeType.segment: 'SEGMENT',
};

_$EQSegmentImpl _$$EQSegmentImplFromJson(Map<String, dynamic> json) =>
    _$EQSegmentImpl(
      id: json['id'] as String,
      trackId: json['trackId'] as String,
      userId: json['userId'] as String,
      eqConfigId: json['eqConfigId'] as String,
      label: json['label'] as String?,
      startMs: (json['startMs'] as num).toInt(),
      endMs: (json['endMs'] as num).toInt(),
      transitionMs: (json['transitionMs'] as num?)?.toInt() ?? 500,
      eqConfig: EQConfig.fromJson(json['eqConfig'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$EQSegmentImplToJson(_$EQSegmentImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'trackId': instance.trackId,
      'userId': instance.userId,
      'eqConfigId': instance.eqConfigId,
      'label': instance.label,
      'startMs': instance.startMs,
      'endMs': instance.endMs,
      'transitionMs': instance.transitionMs,
      'eqConfig': instance.eqConfig,
    };
