// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'eq.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

EQPreset _$EQPresetFromJson(Map<String, dynamic> json) {
  return _EQPreset.fromJson(json);
}

/// @nodoc
mixin _$EQPreset {
  String get id => throw _privateConstructorUsedError;
  String? get userId => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  bool get isGlobal => throw _privateConstructorUsedError;
  List<int> get bands => throw _privateConstructorUsedError;
  int get bassBoost => throw _privateConstructorUsedError;
  int get virtualizer => throw _privateConstructorUsedError;
  int get loudness => throw _privateConstructorUsedError;
  ReverbPreset get reverbPreset => throw _privateConstructorUsedError;
  int get reverbAmount => throw _privateConstructorUsedError;

  /// Serializes this EQPreset to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of EQPreset
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $EQPresetCopyWith<EQPreset> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $EQPresetCopyWith<$Res> {
  factory $EQPresetCopyWith(EQPreset value, $Res Function(EQPreset) then) =
      _$EQPresetCopyWithImpl<$Res, EQPreset>;
  @useResult
  $Res call({
    String id,
    String? userId,
    String name,
    bool isGlobal,
    List<int> bands,
    int bassBoost,
    int virtualizer,
    int loudness,
    ReverbPreset reverbPreset,
    int reverbAmount,
  });
}

/// @nodoc
class _$EQPresetCopyWithImpl<$Res, $Val extends EQPreset>
    implements $EQPresetCopyWith<$Res> {
  _$EQPresetCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of EQPreset
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = freezed,
    Object? name = null,
    Object? isGlobal = null,
    Object? bands = null,
    Object? bassBoost = null,
    Object? virtualizer = null,
    Object? loudness = null,
    Object? reverbPreset = null,
    Object? reverbAmount = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            userId: freezed == userId
                ? _value.userId
                : userId // ignore: cast_nullable_to_non_nullable
                      as String?,
            name: null == name
                ? _value.name
                : name // ignore: cast_nullable_to_non_nullable
                      as String,
            isGlobal: null == isGlobal
                ? _value.isGlobal
                : isGlobal // ignore: cast_nullable_to_non_nullable
                      as bool,
            bands: null == bands
                ? _value.bands
                : bands // ignore: cast_nullable_to_non_nullable
                      as List<int>,
            bassBoost: null == bassBoost
                ? _value.bassBoost
                : bassBoost // ignore: cast_nullable_to_non_nullable
                      as int,
            virtualizer: null == virtualizer
                ? _value.virtualizer
                : virtualizer // ignore: cast_nullable_to_non_nullable
                      as int,
            loudness: null == loudness
                ? _value.loudness
                : loudness // ignore: cast_nullable_to_non_nullable
                      as int,
            reverbPreset: null == reverbPreset
                ? _value.reverbPreset
                : reverbPreset // ignore: cast_nullable_to_non_nullable
                      as ReverbPreset,
            reverbAmount: null == reverbAmount
                ? _value.reverbAmount
                : reverbAmount // ignore: cast_nullable_to_non_nullable
                      as int,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$EQPresetImplCopyWith<$Res>
    implements $EQPresetCopyWith<$Res> {
  factory _$$EQPresetImplCopyWith(
    _$EQPresetImpl value,
    $Res Function(_$EQPresetImpl) then,
  ) = __$$EQPresetImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String? userId,
    String name,
    bool isGlobal,
    List<int> bands,
    int bassBoost,
    int virtualizer,
    int loudness,
    ReverbPreset reverbPreset,
    int reverbAmount,
  });
}

/// @nodoc
class __$$EQPresetImplCopyWithImpl<$Res>
    extends _$EQPresetCopyWithImpl<$Res, _$EQPresetImpl>
    implements _$$EQPresetImplCopyWith<$Res> {
  __$$EQPresetImplCopyWithImpl(
    _$EQPresetImpl _value,
    $Res Function(_$EQPresetImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EQPreset
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = freezed,
    Object? name = null,
    Object? isGlobal = null,
    Object? bands = null,
    Object? bassBoost = null,
    Object? virtualizer = null,
    Object? loudness = null,
    Object? reverbPreset = null,
    Object? reverbAmount = null,
  }) {
    return _then(
      _$EQPresetImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        userId: freezed == userId
            ? _value.userId
            : userId // ignore: cast_nullable_to_non_nullable
                  as String?,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        isGlobal: null == isGlobal
            ? _value.isGlobal
            : isGlobal // ignore: cast_nullable_to_non_nullable
                  as bool,
        bands: null == bands
            ? _value._bands
            : bands // ignore: cast_nullable_to_non_nullable
                  as List<int>,
        bassBoost: null == bassBoost
            ? _value.bassBoost
            : bassBoost // ignore: cast_nullable_to_non_nullable
                  as int,
        virtualizer: null == virtualizer
            ? _value.virtualizer
            : virtualizer // ignore: cast_nullable_to_non_nullable
                  as int,
        loudness: null == loudness
            ? _value.loudness
            : loudness // ignore: cast_nullable_to_non_nullable
                  as int,
        reverbPreset: null == reverbPreset
            ? _value.reverbPreset
            : reverbPreset // ignore: cast_nullable_to_non_nullable
                  as ReverbPreset,
        reverbAmount: null == reverbAmount
            ? _value.reverbAmount
            : reverbAmount // ignore: cast_nullable_to_non_nullable
                  as int,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$EQPresetImpl implements _EQPreset {
  const _$EQPresetImpl({
    required this.id,
    this.userId,
    required this.name,
    this.isGlobal = false,
    required final List<int> bands,
    this.bassBoost = 0,
    this.virtualizer = 0,
    this.loudness = 0,
    this.reverbPreset = ReverbPreset.none,
    this.reverbAmount = 0,
  }) : _bands = bands;

  factory _$EQPresetImpl.fromJson(Map<String, dynamic> json) =>
      _$$EQPresetImplFromJson(json);

  @override
  final String id;
  @override
  final String? userId;
  @override
  final String name;
  @override
  @JsonKey()
  final bool isGlobal;
  final List<int> _bands;
  @override
  List<int> get bands {
    if (_bands is EqualUnmodifiableListView) return _bands;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_bands);
  }

  @override
  @JsonKey()
  final int bassBoost;
  @override
  @JsonKey()
  final int virtualizer;
  @override
  @JsonKey()
  final int loudness;
  @override
  @JsonKey()
  final ReverbPreset reverbPreset;
  @override
  @JsonKey()
  final int reverbAmount;

  @override
  String toString() {
    return 'EQPreset(id: $id, userId: $userId, name: $name, isGlobal: $isGlobal, bands: $bands, bassBoost: $bassBoost, virtualizer: $virtualizer, loudness: $loudness, reverbPreset: $reverbPreset, reverbAmount: $reverbAmount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$EQPresetImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.isGlobal, isGlobal) ||
                other.isGlobal == isGlobal) &&
            const DeepCollectionEquality().equals(other._bands, _bands) &&
            (identical(other.bassBoost, bassBoost) ||
                other.bassBoost == bassBoost) &&
            (identical(other.virtualizer, virtualizer) ||
                other.virtualizer == virtualizer) &&
            (identical(other.loudness, loudness) ||
                other.loudness == loudness) &&
            (identical(other.reverbPreset, reverbPreset) ||
                other.reverbPreset == reverbPreset) &&
            (identical(other.reverbAmount, reverbAmount) ||
                other.reverbAmount == reverbAmount));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    userId,
    name,
    isGlobal,
    const DeepCollectionEquality().hash(_bands),
    bassBoost,
    virtualizer,
    loudness,
    reverbPreset,
    reverbAmount,
  );

  /// Create a copy of EQPreset
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$EQPresetImplCopyWith<_$EQPresetImpl> get copyWith =>
      __$$EQPresetImplCopyWithImpl<_$EQPresetImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$EQPresetImplToJson(this);
  }
}

abstract class _EQPreset implements EQPreset {
  const factory _EQPreset({
    required final String id,
    final String? userId,
    required final String name,
    final bool isGlobal,
    required final List<int> bands,
    final int bassBoost,
    final int virtualizer,
    final int loudness,
    final ReverbPreset reverbPreset,
    final int reverbAmount,
  }) = _$EQPresetImpl;

  factory _EQPreset.fromJson(Map<String, dynamic> json) =
      _$EQPresetImpl.fromJson;

  @override
  String get id;
  @override
  String? get userId;
  @override
  String get name;
  @override
  bool get isGlobal;
  @override
  List<int> get bands;
  @override
  int get bassBoost;
  @override
  int get virtualizer;
  @override
  int get loudness;
  @override
  ReverbPreset get reverbPreset;
  @override
  int get reverbAmount;

  /// Create a copy of EQPreset
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$EQPresetImplCopyWith<_$EQPresetImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

EQConfig _$EQConfigFromJson(Map<String, dynamic> json) {
  return _EQConfig.fromJson(json);
}

/// @nodoc
mixin _$EQConfig {
  String get id => throw _privateConstructorUsedError;
  String get userId => throw _privateConstructorUsedError;
  EQScopeType get scopeType => throw _privateConstructorUsedError;
  String? get scopeId => throw _privateConstructorUsedError;
  String? get presetId => throw _privateConstructorUsedError;
  List<int> get bands => throw _privateConstructorUsedError;
  int get bassBoost => throw _privateConstructorUsedError;
  int get virtualizer => throw _privateConstructorUsedError;
  int get loudness => throw _privateConstructorUsedError;
  ReverbPreset get reverbPreset => throw _privateConstructorUsedError;
  int get reverbAmount => throw _privateConstructorUsedError;
  bool get isActive => throw _privateConstructorUsedError;

  /// Serializes this EQConfig to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of EQConfig
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $EQConfigCopyWith<EQConfig> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $EQConfigCopyWith<$Res> {
  factory $EQConfigCopyWith(EQConfig value, $Res Function(EQConfig) then) =
      _$EQConfigCopyWithImpl<$Res, EQConfig>;
  @useResult
  $Res call({
    String id,
    String userId,
    EQScopeType scopeType,
    String? scopeId,
    String? presetId,
    List<int> bands,
    int bassBoost,
    int virtualizer,
    int loudness,
    ReverbPreset reverbPreset,
    int reverbAmount,
    bool isActive,
  });
}

/// @nodoc
class _$EQConfigCopyWithImpl<$Res, $Val extends EQConfig>
    implements $EQConfigCopyWith<$Res> {
  _$EQConfigCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of EQConfig
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? scopeType = null,
    Object? scopeId = freezed,
    Object? presetId = freezed,
    Object? bands = null,
    Object? bassBoost = null,
    Object? virtualizer = null,
    Object? loudness = null,
    Object? reverbPreset = null,
    Object? reverbAmount = null,
    Object? isActive = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            userId: null == userId
                ? _value.userId
                : userId // ignore: cast_nullable_to_non_nullable
                      as String,
            scopeType: null == scopeType
                ? _value.scopeType
                : scopeType // ignore: cast_nullable_to_non_nullable
                      as EQScopeType,
            scopeId: freezed == scopeId
                ? _value.scopeId
                : scopeId // ignore: cast_nullable_to_non_nullable
                      as String?,
            presetId: freezed == presetId
                ? _value.presetId
                : presetId // ignore: cast_nullable_to_non_nullable
                      as String?,
            bands: null == bands
                ? _value.bands
                : bands // ignore: cast_nullable_to_non_nullable
                      as List<int>,
            bassBoost: null == bassBoost
                ? _value.bassBoost
                : bassBoost // ignore: cast_nullable_to_non_nullable
                      as int,
            virtualizer: null == virtualizer
                ? _value.virtualizer
                : virtualizer // ignore: cast_nullable_to_non_nullable
                      as int,
            loudness: null == loudness
                ? _value.loudness
                : loudness // ignore: cast_nullable_to_non_nullable
                      as int,
            reverbPreset: null == reverbPreset
                ? _value.reverbPreset
                : reverbPreset // ignore: cast_nullable_to_non_nullable
                      as ReverbPreset,
            reverbAmount: null == reverbAmount
                ? _value.reverbAmount
                : reverbAmount // ignore: cast_nullable_to_non_nullable
                      as int,
            isActive: null == isActive
                ? _value.isActive
                : isActive // ignore: cast_nullable_to_non_nullable
                      as bool,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$EQConfigImplCopyWith<$Res>
    implements $EQConfigCopyWith<$Res> {
  factory _$$EQConfigImplCopyWith(
    _$EQConfigImpl value,
    $Res Function(_$EQConfigImpl) then,
  ) = __$$EQConfigImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String userId,
    EQScopeType scopeType,
    String? scopeId,
    String? presetId,
    List<int> bands,
    int bassBoost,
    int virtualizer,
    int loudness,
    ReverbPreset reverbPreset,
    int reverbAmount,
    bool isActive,
  });
}

/// @nodoc
class __$$EQConfigImplCopyWithImpl<$Res>
    extends _$EQConfigCopyWithImpl<$Res, _$EQConfigImpl>
    implements _$$EQConfigImplCopyWith<$Res> {
  __$$EQConfigImplCopyWithImpl(
    _$EQConfigImpl _value,
    $Res Function(_$EQConfigImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EQConfig
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? scopeType = null,
    Object? scopeId = freezed,
    Object? presetId = freezed,
    Object? bands = null,
    Object? bassBoost = null,
    Object? virtualizer = null,
    Object? loudness = null,
    Object? reverbPreset = null,
    Object? reverbAmount = null,
    Object? isActive = null,
  }) {
    return _then(
      _$EQConfigImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        userId: null == userId
            ? _value.userId
            : userId // ignore: cast_nullable_to_non_nullable
                  as String,
        scopeType: null == scopeType
            ? _value.scopeType
            : scopeType // ignore: cast_nullable_to_non_nullable
                  as EQScopeType,
        scopeId: freezed == scopeId
            ? _value.scopeId
            : scopeId // ignore: cast_nullable_to_non_nullable
                  as String?,
        presetId: freezed == presetId
            ? _value.presetId
            : presetId // ignore: cast_nullable_to_non_nullable
                  as String?,
        bands: null == bands
            ? _value._bands
            : bands // ignore: cast_nullable_to_non_nullable
                  as List<int>,
        bassBoost: null == bassBoost
            ? _value.bassBoost
            : bassBoost // ignore: cast_nullable_to_non_nullable
                  as int,
        virtualizer: null == virtualizer
            ? _value.virtualizer
            : virtualizer // ignore: cast_nullable_to_non_nullable
                  as int,
        loudness: null == loudness
            ? _value.loudness
            : loudness // ignore: cast_nullable_to_non_nullable
                  as int,
        reverbPreset: null == reverbPreset
            ? _value.reverbPreset
            : reverbPreset // ignore: cast_nullable_to_non_nullable
                  as ReverbPreset,
        reverbAmount: null == reverbAmount
            ? _value.reverbAmount
            : reverbAmount // ignore: cast_nullable_to_non_nullable
                  as int,
        isActive: null == isActive
            ? _value.isActive
            : isActive // ignore: cast_nullable_to_non_nullable
                  as bool,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$EQConfigImpl implements _EQConfig {
  const _$EQConfigImpl({
    required this.id,
    required this.userId,
    required this.scopeType,
    this.scopeId,
    this.presetId,
    required final List<int> bands,
    this.bassBoost = 0,
    this.virtualizer = 0,
    this.loudness = 0,
    this.reverbPreset = ReverbPreset.none,
    this.reverbAmount = 0,
    this.isActive = true,
  }) : _bands = bands;

  factory _$EQConfigImpl.fromJson(Map<String, dynamic> json) =>
      _$$EQConfigImplFromJson(json);

  @override
  final String id;
  @override
  final String userId;
  @override
  final EQScopeType scopeType;
  @override
  final String? scopeId;
  @override
  final String? presetId;
  final List<int> _bands;
  @override
  List<int> get bands {
    if (_bands is EqualUnmodifiableListView) return _bands;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_bands);
  }

  @override
  @JsonKey()
  final int bassBoost;
  @override
  @JsonKey()
  final int virtualizer;
  @override
  @JsonKey()
  final int loudness;
  @override
  @JsonKey()
  final ReverbPreset reverbPreset;
  @override
  @JsonKey()
  final int reverbAmount;
  @override
  @JsonKey()
  final bool isActive;

  @override
  String toString() {
    return 'EQConfig(id: $id, userId: $userId, scopeType: $scopeType, scopeId: $scopeId, presetId: $presetId, bands: $bands, bassBoost: $bassBoost, virtualizer: $virtualizer, loudness: $loudness, reverbPreset: $reverbPreset, reverbAmount: $reverbAmount, isActive: $isActive)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$EQConfigImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.scopeType, scopeType) ||
                other.scopeType == scopeType) &&
            (identical(other.scopeId, scopeId) || other.scopeId == scopeId) &&
            (identical(other.presetId, presetId) ||
                other.presetId == presetId) &&
            const DeepCollectionEquality().equals(other._bands, _bands) &&
            (identical(other.bassBoost, bassBoost) ||
                other.bassBoost == bassBoost) &&
            (identical(other.virtualizer, virtualizer) ||
                other.virtualizer == virtualizer) &&
            (identical(other.loudness, loudness) ||
                other.loudness == loudness) &&
            (identical(other.reverbPreset, reverbPreset) ||
                other.reverbPreset == reverbPreset) &&
            (identical(other.reverbAmount, reverbAmount) ||
                other.reverbAmount == reverbAmount) &&
            (identical(other.isActive, isActive) ||
                other.isActive == isActive));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    userId,
    scopeType,
    scopeId,
    presetId,
    const DeepCollectionEquality().hash(_bands),
    bassBoost,
    virtualizer,
    loudness,
    reverbPreset,
    reverbAmount,
    isActive,
  );

  /// Create a copy of EQConfig
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$EQConfigImplCopyWith<_$EQConfigImpl> get copyWith =>
      __$$EQConfigImplCopyWithImpl<_$EQConfigImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$EQConfigImplToJson(this);
  }
}

abstract class _EQConfig implements EQConfig {
  const factory _EQConfig({
    required final String id,
    required final String userId,
    required final EQScopeType scopeType,
    final String? scopeId,
    final String? presetId,
    required final List<int> bands,
    final int bassBoost,
    final int virtualizer,
    final int loudness,
    final ReverbPreset reverbPreset,
    final int reverbAmount,
    final bool isActive,
  }) = _$EQConfigImpl;

  factory _EQConfig.fromJson(Map<String, dynamic> json) =
      _$EQConfigImpl.fromJson;

  @override
  String get id;
  @override
  String get userId;
  @override
  EQScopeType get scopeType;
  @override
  String? get scopeId;
  @override
  String? get presetId;
  @override
  List<int> get bands;
  @override
  int get bassBoost;
  @override
  int get virtualizer;
  @override
  int get loudness;
  @override
  ReverbPreset get reverbPreset;
  @override
  int get reverbAmount;
  @override
  bool get isActive;

  /// Create a copy of EQConfig
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$EQConfigImplCopyWith<_$EQConfigImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

EQSegment _$EQSegmentFromJson(Map<String, dynamic> json) {
  return _EQSegment.fromJson(json);
}

/// @nodoc
mixin _$EQSegment {
  String get id => throw _privateConstructorUsedError;
  String get trackId => throw _privateConstructorUsedError;
  String get userId => throw _privateConstructorUsedError;
  String get eqConfigId => throw _privateConstructorUsedError;
  String? get label => throw _privateConstructorUsedError;
  int get startMs => throw _privateConstructorUsedError;
  int get endMs => throw _privateConstructorUsedError;
  int get transitionMs => throw _privateConstructorUsedError;
  EQConfig get eqConfig => throw _privateConstructorUsedError;

  /// Serializes this EQSegment to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of EQSegment
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $EQSegmentCopyWith<EQSegment> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $EQSegmentCopyWith<$Res> {
  factory $EQSegmentCopyWith(EQSegment value, $Res Function(EQSegment) then) =
      _$EQSegmentCopyWithImpl<$Res, EQSegment>;
  @useResult
  $Res call({
    String id,
    String trackId,
    String userId,
    String eqConfigId,
    String? label,
    int startMs,
    int endMs,
    int transitionMs,
    EQConfig eqConfig,
  });

  $EQConfigCopyWith<$Res> get eqConfig;
}

/// @nodoc
class _$EQSegmentCopyWithImpl<$Res, $Val extends EQSegment>
    implements $EQSegmentCopyWith<$Res> {
  _$EQSegmentCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of EQSegment
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? trackId = null,
    Object? userId = null,
    Object? eqConfigId = null,
    Object? label = freezed,
    Object? startMs = null,
    Object? endMs = null,
    Object? transitionMs = null,
    Object? eqConfig = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            trackId: null == trackId
                ? _value.trackId
                : trackId // ignore: cast_nullable_to_non_nullable
                      as String,
            userId: null == userId
                ? _value.userId
                : userId // ignore: cast_nullable_to_non_nullable
                      as String,
            eqConfigId: null == eqConfigId
                ? _value.eqConfigId
                : eqConfigId // ignore: cast_nullable_to_non_nullable
                      as String,
            label: freezed == label
                ? _value.label
                : label // ignore: cast_nullable_to_non_nullable
                      as String?,
            startMs: null == startMs
                ? _value.startMs
                : startMs // ignore: cast_nullable_to_non_nullable
                      as int,
            endMs: null == endMs
                ? _value.endMs
                : endMs // ignore: cast_nullable_to_non_nullable
                      as int,
            transitionMs: null == transitionMs
                ? _value.transitionMs
                : transitionMs // ignore: cast_nullable_to_non_nullable
                      as int,
            eqConfig: null == eqConfig
                ? _value.eqConfig
                : eqConfig // ignore: cast_nullable_to_non_nullable
                      as EQConfig,
          )
          as $Val,
    );
  }

  /// Create a copy of EQSegment
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $EQConfigCopyWith<$Res> get eqConfig {
    return $EQConfigCopyWith<$Res>(_value.eqConfig, (value) {
      return _then(_value.copyWith(eqConfig: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$EQSegmentImplCopyWith<$Res>
    implements $EQSegmentCopyWith<$Res> {
  factory _$$EQSegmentImplCopyWith(
    _$EQSegmentImpl value,
    $Res Function(_$EQSegmentImpl) then,
  ) = __$$EQSegmentImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String trackId,
    String userId,
    String eqConfigId,
    String? label,
    int startMs,
    int endMs,
    int transitionMs,
    EQConfig eqConfig,
  });

  @override
  $EQConfigCopyWith<$Res> get eqConfig;
}

/// @nodoc
class __$$EQSegmentImplCopyWithImpl<$Res>
    extends _$EQSegmentCopyWithImpl<$Res, _$EQSegmentImpl>
    implements _$$EQSegmentImplCopyWith<$Res> {
  __$$EQSegmentImplCopyWithImpl(
    _$EQSegmentImpl _value,
    $Res Function(_$EQSegmentImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EQSegment
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? trackId = null,
    Object? userId = null,
    Object? eqConfigId = null,
    Object? label = freezed,
    Object? startMs = null,
    Object? endMs = null,
    Object? transitionMs = null,
    Object? eqConfig = null,
  }) {
    return _then(
      _$EQSegmentImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        trackId: null == trackId
            ? _value.trackId
            : trackId // ignore: cast_nullable_to_non_nullable
                  as String,
        userId: null == userId
            ? _value.userId
            : userId // ignore: cast_nullable_to_non_nullable
                  as String,
        eqConfigId: null == eqConfigId
            ? _value.eqConfigId
            : eqConfigId // ignore: cast_nullable_to_non_nullable
                  as String,
        label: freezed == label
            ? _value.label
            : label // ignore: cast_nullable_to_non_nullable
                  as String?,
        startMs: null == startMs
            ? _value.startMs
            : startMs // ignore: cast_nullable_to_non_nullable
                  as int,
        endMs: null == endMs
            ? _value.endMs
            : endMs // ignore: cast_nullable_to_non_nullable
                  as int,
        transitionMs: null == transitionMs
            ? _value.transitionMs
            : transitionMs // ignore: cast_nullable_to_non_nullable
                  as int,
        eqConfig: null == eqConfig
            ? _value.eqConfig
            : eqConfig // ignore: cast_nullable_to_non_nullable
                  as EQConfig,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$EQSegmentImpl implements _EQSegment {
  const _$EQSegmentImpl({
    required this.id,
    required this.trackId,
    required this.userId,
    required this.eqConfigId,
    this.label,
    required this.startMs,
    required this.endMs,
    this.transitionMs = 500,
    required this.eqConfig,
  });

  factory _$EQSegmentImpl.fromJson(Map<String, dynamic> json) =>
      _$$EQSegmentImplFromJson(json);

  @override
  final String id;
  @override
  final String trackId;
  @override
  final String userId;
  @override
  final String eqConfigId;
  @override
  final String? label;
  @override
  final int startMs;
  @override
  final int endMs;
  @override
  @JsonKey()
  final int transitionMs;
  @override
  final EQConfig eqConfig;

  @override
  String toString() {
    return 'EQSegment(id: $id, trackId: $trackId, userId: $userId, eqConfigId: $eqConfigId, label: $label, startMs: $startMs, endMs: $endMs, transitionMs: $transitionMs, eqConfig: $eqConfig)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$EQSegmentImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.trackId, trackId) || other.trackId == trackId) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.eqConfigId, eqConfigId) ||
                other.eqConfigId == eqConfigId) &&
            (identical(other.label, label) || other.label == label) &&
            (identical(other.startMs, startMs) || other.startMs == startMs) &&
            (identical(other.endMs, endMs) || other.endMs == endMs) &&
            (identical(other.transitionMs, transitionMs) ||
                other.transitionMs == transitionMs) &&
            (identical(other.eqConfig, eqConfig) ||
                other.eqConfig == eqConfig));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    trackId,
    userId,
    eqConfigId,
    label,
    startMs,
    endMs,
    transitionMs,
    eqConfig,
  );

  /// Create a copy of EQSegment
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$EQSegmentImplCopyWith<_$EQSegmentImpl> get copyWith =>
      __$$EQSegmentImplCopyWithImpl<_$EQSegmentImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$EQSegmentImplToJson(this);
  }
}

abstract class _EQSegment implements EQSegment {
  const factory _EQSegment({
    required final String id,
    required final String trackId,
    required final String userId,
    required final String eqConfigId,
    final String? label,
    required final int startMs,
    required final int endMs,
    final int transitionMs,
    required final EQConfig eqConfig,
  }) = _$EQSegmentImpl;

  factory _EQSegment.fromJson(Map<String, dynamic> json) =
      _$EQSegmentImpl.fromJson;

  @override
  String get id;
  @override
  String get trackId;
  @override
  String get userId;
  @override
  String get eqConfigId;
  @override
  String? get label;
  @override
  int get startMs;
  @override
  int get endMs;
  @override
  int get transitionMs;
  @override
  EQConfig get eqConfig;

  /// Create a copy of EQSegment
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$EQSegmentImplCopyWith<_$EQSegmentImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
