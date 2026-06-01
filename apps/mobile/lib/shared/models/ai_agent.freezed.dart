// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'ai_agent.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

SuggestedSegment _$SuggestedSegmentFromJson(Map<String, dynamic> json) {
  return _SuggestedSegment.fromJson(json);
}

/// @nodoc
mixin _$SuggestedSegment {
  String get label => throw _privateConstructorUsedError;
  int get startMs => throw _privateConstructorUsedError;
  int get endMs => throw _privateConstructorUsedError;
  List<int> get bands => throw _privateConstructorUsedError;
  String get explanation => throw _privateConstructorUsedError;

  /// Serializes this SuggestedSegment to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of SuggestedSegment
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $SuggestedSegmentCopyWith<SuggestedSegment> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SuggestedSegmentCopyWith<$Res> {
  factory $SuggestedSegmentCopyWith(
    SuggestedSegment value,
    $Res Function(SuggestedSegment) then,
  ) = _$SuggestedSegmentCopyWithImpl<$Res, SuggestedSegment>;
  @useResult
  $Res call({
    String label,
    int startMs,
    int endMs,
    List<int> bands,
    String explanation,
  });
}

/// @nodoc
class _$SuggestedSegmentCopyWithImpl<$Res, $Val extends SuggestedSegment>
    implements $SuggestedSegmentCopyWith<$Res> {
  _$SuggestedSegmentCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of SuggestedSegment
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? label = null,
    Object? startMs = null,
    Object? endMs = null,
    Object? bands = null,
    Object? explanation = null,
  }) {
    return _then(
      _value.copyWith(
            label: null == label
                ? _value.label
                : label // ignore: cast_nullable_to_non_nullable
                      as String,
            startMs: null == startMs
                ? _value.startMs
                : startMs // ignore: cast_nullable_to_non_nullable
                      as int,
            endMs: null == endMs
                ? _value.endMs
                : endMs // ignore: cast_nullable_to_non_nullable
                      as int,
            bands: null == bands
                ? _value.bands
                : bands // ignore: cast_nullable_to_non_nullable
                      as List<int>,
            explanation: null == explanation
                ? _value.explanation
                : explanation // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$SuggestedSegmentImplCopyWith<$Res>
    implements $SuggestedSegmentCopyWith<$Res> {
  factory _$$SuggestedSegmentImplCopyWith(
    _$SuggestedSegmentImpl value,
    $Res Function(_$SuggestedSegmentImpl) then,
  ) = __$$SuggestedSegmentImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String label,
    int startMs,
    int endMs,
    List<int> bands,
    String explanation,
  });
}

/// @nodoc
class __$$SuggestedSegmentImplCopyWithImpl<$Res>
    extends _$SuggestedSegmentCopyWithImpl<$Res, _$SuggestedSegmentImpl>
    implements _$$SuggestedSegmentImplCopyWith<$Res> {
  __$$SuggestedSegmentImplCopyWithImpl(
    _$SuggestedSegmentImpl _value,
    $Res Function(_$SuggestedSegmentImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of SuggestedSegment
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? label = null,
    Object? startMs = null,
    Object? endMs = null,
    Object? bands = null,
    Object? explanation = null,
  }) {
    return _then(
      _$SuggestedSegmentImpl(
        label: null == label
            ? _value.label
            : label // ignore: cast_nullable_to_non_nullable
                  as String,
        startMs: null == startMs
            ? _value.startMs
            : startMs // ignore: cast_nullable_to_non_nullable
                  as int,
        endMs: null == endMs
            ? _value.endMs
            : endMs // ignore: cast_nullable_to_non_nullable
                  as int,
        bands: null == bands
            ? _value._bands
            : bands // ignore: cast_nullable_to_non_nullable
                  as List<int>,
        explanation: null == explanation
            ? _value.explanation
            : explanation // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$SuggestedSegmentImpl implements _SuggestedSegment {
  const _$SuggestedSegmentImpl({
    required this.label,
    required this.startMs,
    required this.endMs,
    required final List<int> bands,
    this.explanation = '',
  }) : _bands = bands;

  factory _$SuggestedSegmentImpl.fromJson(Map<String, dynamic> json) =>
      _$$SuggestedSegmentImplFromJson(json);

  @override
  final String label;
  @override
  final int startMs;
  @override
  final int endMs;
  final List<int> _bands;
  @override
  List<int> get bands {
    if (_bands is EqualUnmodifiableListView) return _bands;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_bands);
  }

  @override
  @JsonKey()
  final String explanation;

  @override
  String toString() {
    return 'SuggestedSegment(label: $label, startMs: $startMs, endMs: $endMs, bands: $bands, explanation: $explanation)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SuggestedSegmentImpl &&
            (identical(other.label, label) || other.label == label) &&
            (identical(other.startMs, startMs) || other.startMs == startMs) &&
            (identical(other.endMs, endMs) || other.endMs == endMs) &&
            const DeepCollectionEquality().equals(other._bands, _bands) &&
            (identical(other.explanation, explanation) ||
                other.explanation == explanation));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    label,
    startMs,
    endMs,
    const DeepCollectionEquality().hash(_bands),
    explanation,
  );

  /// Create a copy of SuggestedSegment
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$SuggestedSegmentImplCopyWith<_$SuggestedSegmentImpl> get copyWith =>
      __$$SuggestedSegmentImplCopyWithImpl<_$SuggestedSegmentImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$SuggestedSegmentImplToJson(this);
  }
}

abstract class _SuggestedSegment implements SuggestedSegment {
  const factory _SuggestedSegment({
    required final String label,
    required final int startMs,
    required final int endMs,
    required final List<int> bands,
    final String explanation,
  }) = _$SuggestedSegmentImpl;

  factory _SuggestedSegment.fromJson(Map<String, dynamic> json) =
      _$SuggestedSegmentImpl.fromJson;

  @override
  String get label;
  @override
  int get startMs;
  @override
  int get endMs;
  @override
  List<int> get bands;
  @override
  String get explanation;

  /// Create a copy of SuggestedSegment
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SuggestedSegmentImplCopyWith<_$SuggestedSegmentImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

EQSuggestion _$EQSuggestionFromJson(Map<String, dynamic> json) {
  return _EQSuggestion.fromJson(json);
}

/// @nodoc
mixin _$EQSuggestion {
  List<int> get bands => throw _privateConstructorUsedError;
  int get bassBoost => throw _privateConstructorUsedError;
  int get virtualizer => throw _privateConstructorUsedError;
  int get loudness => throw _privateConstructorUsedError;
  String get reverbPreset => throw _privateConstructorUsedError;
  int get reverbAmount => throw _privateConstructorUsedError;
  String get explanation => throw _privateConstructorUsedError;
  List<SuggestedSegment>? get segments => throw _privateConstructorUsedError;

  /// Serializes this EQSuggestion to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of EQSuggestion
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $EQSuggestionCopyWith<EQSuggestion> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $EQSuggestionCopyWith<$Res> {
  factory $EQSuggestionCopyWith(
    EQSuggestion value,
    $Res Function(EQSuggestion) then,
  ) = _$EQSuggestionCopyWithImpl<$Res, EQSuggestion>;
  @useResult
  $Res call({
    List<int> bands,
    int bassBoost,
    int virtualizer,
    int loudness,
    String reverbPreset,
    int reverbAmount,
    String explanation,
    List<SuggestedSegment>? segments,
  });
}

/// @nodoc
class _$EQSuggestionCopyWithImpl<$Res, $Val extends EQSuggestion>
    implements $EQSuggestionCopyWith<$Res> {
  _$EQSuggestionCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of EQSuggestion
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? bands = null,
    Object? bassBoost = null,
    Object? virtualizer = null,
    Object? loudness = null,
    Object? reverbPreset = null,
    Object? reverbAmount = null,
    Object? explanation = null,
    Object? segments = freezed,
  }) {
    return _then(
      _value.copyWith(
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
                      as String,
            reverbAmount: null == reverbAmount
                ? _value.reverbAmount
                : reverbAmount // ignore: cast_nullable_to_non_nullable
                      as int,
            explanation: null == explanation
                ? _value.explanation
                : explanation // ignore: cast_nullable_to_non_nullable
                      as String,
            segments: freezed == segments
                ? _value.segments
                : segments // ignore: cast_nullable_to_non_nullable
                      as List<SuggestedSegment>?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$EQSuggestionImplCopyWith<$Res>
    implements $EQSuggestionCopyWith<$Res> {
  factory _$$EQSuggestionImplCopyWith(
    _$EQSuggestionImpl value,
    $Res Function(_$EQSuggestionImpl) then,
  ) = __$$EQSuggestionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    List<int> bands,
    int bassBoost,
    int virtualizer,
    int loudness,
    String reverbPreset,
    int reverbAmount,
    String explanation,
    List<SuggestedSegment>? segments,
  });
}

/// @nodoc
class __$$EQSuggestionImplCopyWithImpl<$Res>
    extends _$EQSuggestionCopyWithImpl<$Res, _$EQSuggestionImpl>
    implements _$$EQSuggestionImplCopyWith<$Res> {
  __$$EQSuggestionImplCopyWithImpl(
    _$EQSuggestionImpl _value,
    $Res Function(_$EQSuggestionImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EQSuggestion
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? bands = null,
    Object? bassBoost = null,
    Object? virtualizer = null,
    Object? loudness = null,
    Object? reverbPreset = null,
    Object? reverbAmount = null,
    Object? explanation = null,
    Object? segments = freezed,
  }) {
    return _then(
      _$EQSuggestionImpl(
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
                  as String,
        reverbAmount: null == reverbAmount
            ? _value.reverbAmount
            : reverbAmount // ignore: cast_nullable_to_non_nullable
                  as int,
        explanation: null == explanation
            ? _value.explanation
            : explanation // ignore: cast_nullable_to_non_nullable
                  as String,
        segments: freezed == segments
            ? _value._segments
            : segments // ignore: cast_nullable_to_non_nullable
                  as List<SuggestedSegment>?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$EQSuggestionImpl implements _EQSuggestion {
  const _$EQSuggestionImpl({
    required final List<int> bands,
    this.bassBoost = 0,
    this.virtualizer = 0,
    this.loudness = 0,
    this.reverbPreset = 'NONE',
    this.reverbAmount = 0,
    this.explanation = '',
    final List<SuggestedSegment>? segments,
  }) : _bands = bands,
       _segments = segments;

  factory _$EQSuggestionImpl.fromJson(Map<String, dynamic> json) =>
      _$$EQSuggestionImplFromJson(json);

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
  final String reverbPreset;
  @override
  @JsonKey()
  final int reverbAmount;
  @override
  @JsonKey()
  final String explanation;
  final List<SuggestedSegment>? _segments;
  @override
  List<SuggestedSegment>? get segments {
    final value = _segments;
    if (value == null) return null;
    if (_segments is EqualUnmodifiableListView) return _segments;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  @override
  String toString() {
    return 'EQSuggestion(bands: $bands, bassBoost: $bassBoost, virtualizer: $virtualizer, loudness: $loudness, reverbPreset: $reverbPreset, reverbAmount: $reverbAmount, explanation: $explanation, segments: $segments)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$EQSuggestionImpl &&
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
            (identical(other.explanation, explanation) ||
                other.explanation == explanation) &&
            const DeepCollectionEquality().equals(other._segments, _segments));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    const DeepCollectionEquality().hash(_bands),
    bassBoost,
    virtualizer,
    loudness,
    reverbPreset,
    reverbAmount,
    explanation,
    const DeepCollectionEquality().hash(_segments),
  );

  /// Create a copy of EQSuggestion
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$EQSuggestionImplCopyWith<_$EQSuggestionImpl> get copyWith =>
      __$$EQSuggestionImplCopyWithImpl<_$EQSuggestionImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$EQSuggestionImplToJson(this);
  }
}

abstract class _EQSuggestion implements EQSuggestion {
  const factory _EQSuggestion({
    required final List<int> bands,
    final int bassBoost,
    final int virtualizer,
    final int loudness,
    final String reverbPreset,
    final int reverbAmount,
    final String explanation,
    final List<SuggestedSegment>? segments,
  }) = _$EQSuggestionImpl;

  factory _EQSuggestion.fromJson(Map<String, dynamic> json) =
      _$EQSuggestionImpl.fromJson;

  @override
  List<int> get bands;
  @override
  int get bassBoost;
  @override
  int get virtualizer;
  @override
  int get loudness;
  @override
  String get reverbPreset;
  @override
  int get reverbAmount;
  @override
  String get explanation;
  @override
  List<SuggestedSegment>? get segments;

  /// Create a copy of EQSuggestion
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$EQSuggestionImplCopyWith<_$EQSuggestionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

AISuggestResponse _$AISuggestResponseFromJson(Map<String, dynamic> json) {
  return _AISuggestResponse.fromJson(json);
}

/// @nodoc
mixin _$AISuggestResponse {
  EQSuggestion get suggestion => throw _privateConstructorUsedError;
  String get requestId => throw _privateConstructorUsedError;

  /// Serializes this AISuggestResponse to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of AISuggestResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AISuggestResponseCopyWith<AISuggestResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AISuggestResponseCopyWith<$Res> {
  factory $AISuggestResponseCopyWith(
    AISuggestResponse value,
    $Res Function(AISuggestResponse) then,
  ) = _$AISuggestResponseCopyWithImpl<$Res, AISuggestResponse>;
  @useResult
  $Res call({EQSuggestion suggestion, String requestId});

  $EQSuggestionCopyWith<$Res> get suggestion;
}

/// @nodoc
class _$AISuggestResponseCopyWithImpl<$Res, $Val extends AISuggestResponse>
    implements $AISuggestResponseCopyWith<$Res> {
  _$AISuggestResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AISuggestResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? suggestion = null, Object? requestId = null}) {
    return _then(
      _value.copyWith(
            suggestion: null == suggestion
                ? _value.suggestion
                : suggestion // ignore: cast_nullable_to_non_nullable
                      as EQSuggestion,
            requestId: null == requestId
                ? _value.requestId
                : requestId // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }

  /// Create a copy of AISuggestResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $EQSuggestionCopyWith<$Res> get suggestion {
    return $EQSuggestionCopyWith<$Res>(_value.suggestion, (value) {
      return _then(_value.copyWith(suggestion: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$AISuggestResponseImplCopyWith<$Res>
    implements $AISuggestResponseCopyWith<$Res> {
  factory _$$AISuggestResponseImplCopyWith(
    _$AISuggestResponseImpl value,
    $Res Function(_$AISuggestResponseImpl) then,
  ) = __$$AISuggestResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({EQSuggestion suggestion, String requestId});

  @override
  $EQSuggestionCopyWith<$Res> get suggestion;
}

/// @nodoc
class __$$AISuggestResponseImplCopyWithImpl<$Res>
    extends _$AISuggestResponseCopyWithImpl<$Res, _$AISuggestResponseImpl>
    implements _$$AISuggestResponseImplCopyWith<$Res> {
  __$$AISuggestResponseImplCopyWithImpl(
    _$AISuggestResponseImpl _value,
    $Res Function(_$AISuggestResponseImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of AISuggestResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? suggestion = null, Object? requestId = null}) {
    return _then(
      _$AISuggestResponseImpl(
        suggestion: null == suggestion
            ? _value.suggestion
            : suggestion // ignore: cast_nullable_to_non_nullable
                  as EQSuggestion,
        requestId: null == requestId
            ? _value.requestId
            : requestId // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$AISuggestResponseImpl implements _AISuggestResponse {
  const _$AISuggestResponseImpl({
    required this.suggestion,
    required this.requestId,
  });

  factory _$AISuggestResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$AISuggestResponseImplFromJson(json);

  @override
  final EQSuggestion suggestion;
  @override
  final String requestId;

  @override
  String toString() {
    return 'AISuggestResponse(suggestion: $suggestion, requestId: $requestId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AISuggestResponseImpl &&
            (identical(other.suggestion, suggestion) ||
                other.suggestion == suggestion) &&
            (identical(other.requestId, requestId) ||
                other.requestId == requestId));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, suggestion, requestId);

  /// Create a copy of AISuggestResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AISuggestResponseImplCopyWith<_$AISuggestResponseImpl> get copyWith =>
      __$$AISuggestResponseImplCopyWithImpl<_$AISuggestResponseImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$AISuggestResponseImplToJson(this);
  }
}

abstract class _AISuggestResponse implements AISuggestResponse {
  const factory _AISuggestResponse({
    required final EQSuggestion suggestion,
    required final String requestId,
  }) = _$AISuggestResponseImpl;

  factory _AISuggestResponse.fromJson(Map<String, dynamic> json) =
      _$AISuggestResponseImpl.fromJson;

  @override
  EQSuggestion get suggestion;
  @override
  String get requestId;

  /// Create a copy of AISuggestResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AISuggestResponseImplCopyWith<_$AISuggestResponseImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
