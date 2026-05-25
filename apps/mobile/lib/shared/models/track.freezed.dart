// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'track.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

Track _$TrackFromJson(Map<String, dynamic> json) {
  return _Track.fromJson(json);
}

/// @nodoc
mixin _$Track {
  String get id => throw _privateConstructorUsedError;
  String get userId => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String get artist => throw _privateConstructorUsedError;
  String get album => throw _privateConstructorUsedError;
  String? get albumArtist => throw _privateConstructorUsedError;
  String? get genre => throw _privateConstructorUsedError;
  int? get year => throw _privateConstructorUsedError;
  int get durationMs => throw _privateConstructorUsedError;
  String? get coverArt => throw _privateConstructorUsedError;
  String? get fileUrlRemote => throw _privateConstructorUsedError;
  String? get filePathLocal => throw _privateConstructorUsedError;
  TrackSource get source => throw _privateConstructorUsedError;
  SyncStatus get syncStatus => throw _privateConstructorUsedError;
  DateTime get createdAt => throw _privateConstructorUsedError;
  DateTime get updatedAt => throw _privateConstructorUsedError;

  /// Serializes this Track to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Track
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TrackCopyWith<Track> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TrackCopyWith<$Res> {
  factory $TrackCopyWith(Track value, $Res Function(Track) then) =
      _$TrackCopyWithImpl<$Res, Track>;
  @useResult
  $Res call({
    String id,
    String userId,
    String title,
    String artist,
    String album,
    String? albumArtist,
    String? genre,
    int? year,
    int durationMs,
    String? coverArt,
    String? fileUrlRemote,
    String? filePathLocal,
    TrackSource source,
    SyncStatus syncStatus,
    DateTime createdAt,
    DateTime updatedAt,
  });
}

/// @nodoc
class _$TrackCopyWithImpl<$Res, $Val extends Track>
    implements $TrackCopyWith<$Res> {
  _$TrackCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Track
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? title = null,
    Object? artist = null,
    Object? album = null,
    Object? albumArtist = freezed,
    Object? genre = freezed,
    Object? year = freezed,
    Object? durationMs = null,
    Object? coverArt = freezed,
    Object? fileUrlRemote = freezed,
    Object? filePathLocal = freezed,
    Object? source = null,
    Object? syncStatus = null,
    Object? createdAt = null,
    Object? updatedAt = null,
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
            title: null == title
                ? _value.title
                : title // ignore: cast_nullable_to_non_nullable
                      as String,
            artist: null == artist
                ? _value.artist
                : artist // ignore: cast_nullable_to_non_nullable
                      as String,
            album: null == album
                ? _value.album
                : album // ignore: cast_nullable_to_non_nullable
                      as String,
            albumArtist: freezed == albumArtist
                ? _value.albumArtist
                : albumArtist // ignore: cast_nullable_to_non_nullable
                      as String?,
            genre: freezed == genre
                ? _value.genre
                : genre // ignore: cast_nullable_to_non_nullable
                      as String?,
            year: freezed == year
                ? _value.year
                : year // ignore: cast_nullable_to_non_nullable
                      as int?,
            durationMs: null == durationMs
                ? _value.durationMs
                : durationMs // ignore: cast_nullable_to_non_nullable
                      as int,
            coverArt: freezed == coverArt
                ? _value.coverArt
                : coverArt // ignore: cast_nullable_to_non_nullable
                      as String?,
            fileUrlRemote: freezed == fileUrlRemote
                ? _value.fileUrlRemote
                : fileUrlRemote // ignore: cast_nullable_to_non_nullable
                      as String?,
            filePathLocal: freezed == filePathLocal
                ? _value.filePathLocal
                : filePathLocal // ignore: cast_nullable_to_non_nullable
                      as String?,
            source: null == source
                ? _value.source
                : source // ignore: cast_nullable_to_non_nullable
                      as TrackSource,
            syncStatus: null == syncStatus
                ? _value.syncStatus
                : syncStatus // ignore: cast_nullable_to_non_nullable
                      as SyncStatus,
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as DateTime,
            updatedAt: null == updatedAt
                ? _value.updatedAt
                : updatedAt // ignore: cast_nullable_to_non_nullable
                      as DateTime,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$TrackImplCopyWith<$Res> implements $TrackCopyWith<$Res> {
  factory _$$TrackImplCopyWith(
    _$TrackImpl value,
    $Res Function(_$TrackImpl) then,
  ) = __$$TrackImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String userId,
    String title,
    String artist,
    String album,
    String? albumArtist,
    String? genre,
    int? year,
    int durationMs,
    String? coverArt,
    String? fileUrlRemote,
    String? filePathLocal,
    TrackSource source,
    SyncStatus syncStatus,
    DateTime createdAt,
    DateTime updatedAt,
  });
}

/// @nodoc
class __$$TrackImplCopyWithImpl<$Res>
    extends _$TrackCopyWithImpl<$Res, _$TrackImpl>
    implements _$$TrackImplCopyWith<$Res> {
  __$$TrackImplCopyWithImpl(
    _$TrackImpl _value,
    $Res Function(_$TrackImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of Track
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? title = null,
    Object? artist = null,
    Object? album = null,
    Object? albumArtist = freezed,
    Object? genre = freezed,
    Object? year = freezed,
    Object? durationMs = null,
    Object? coverArt = freezed,
    Object? fileUrlRemote = freezed,
    Object? filePathLocal = freezed,
    Object? source = null,
    Object? syncStatus = null,
    Object? createdAt = null,
    Object? updatedAt = null,
  }) {
    return _then(
      _$TrackImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        userId: null == userId
            ? _value.userId
            : userId // ignore: cast_nullable_to_non_nullable
                  as String,
        title: null == title
            ? _value.title
            : title // ignore: cast_nullable_to_non_nullable
                  as String,
        artist: null == artist
            ? _value.artist
            : artist // ignore: cast_nullable_to_non_nullable
                  as String,
        album: null == album
            ? _value.album
            : album // ignore: cast_nullable_to_non_nullable
                  as String,
        albumArtist: freezed == albumArtist
            ? _value.albumArtist
            : albumArtist // ignore: cast_nullable_to_non_nullable
                  as String?,
        genre: freezed == genre
            ? _value.genre
            : genre // ignore: cast_nullable_to_non_nullable
                  as String?,
        year: freezed == year
            ? _value.year
            : year // ignore: cast_nullable_to_non_nullable
                  as int?,
        durationMs: null == durationMs
            ? _value.durationMs
            : durationMs // ignore: cast_nullable_to_non_nullable
                  as int,
        coverArt: freezed == coverArt
            ? _value.coverArt
            : coverArt // ignore: cast_nullable_to_non_nullable
                  as String?,
        fileUrlRemote: freezed == fileUrlRemote
            ? _value.fileUrlRemote
            : fileUrlRemote // ignore: cast_nullable_to_non_nullable
                  as String?,
        filePathLocal: freezed == filePathLocal
            ? _value.filePathLocal
            : filePathLocal // ignore: cast_nullable_to_non_nullable
                  as String?,
        source: null == source
            ? _value.source
            : source // ignore: cast_nullable_to_non_nullable
                  as TrackSource,
        syncStatus: null == syncStatus
            ? _value.syncStatus
            : syncStatus // ignore: cast_nullable_to_non_nullable
                  as SyncStatus,
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as DateTime,
        updatedAt: null == updatedAt
            ? _value.updatedAt
            : updatedAt // ignore: cast_nullable_to_non_nullable
                  as DateTime,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$TrackImpl implements _Track {
  const _$TrackImpl({
    required this.id,
    required this.userId,
    required this.title,
    required this.artist,
    required this.album,
    this.albumArtist,
    this.genre,
    this.year,
    required this.durationMs,
    this.coverArt,
    this.fileUrlRemote,
    this.filePathLocal,
    this.source = TrackSource.local,
    this.syncStatus = SyncStatus.pending,
    required this.createdAt,
    required this.updatedAt,
  });

  factory _$TrackImpl.fromJson(Map<String, dynamic> json) =>
      _$$TrackImplFromJson(json);

  @override
  final String id;
  @override
  final String userId;
  @override
  final String title;
  @override
  final String artist;
  @override
  final String album;
  @override
  final String? albumArtist;
  @override
  final String? genre;
  @override
  final int? year;
  @override
  final int durationMs;
  @override
  final String? coverArt;
  @override
  final String? fileUrlRemote;
  @override
  final String? filePathLocal;
  @override
  @JsonKey()
  final TrackSource source;
  @override
  @JsonKey()
  final SyncStatus syncStatus;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  @override
  String toString() {
    return 'Track(id: $id, userId: $userId, title: $title, artist: $artist, album: $album, albumArtist: $albumArtist, genre: $genre, year: $year, durationMs: $durationMs, coverArt: $coverArt, fileUrlRemote: $fileUrlRemote, filePathLocal: $filePathLocal, source: $source, syncStatus: $syncStatus, createdAt: $createdAt, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TrackImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.artist, artist) || other.artist == artist) &&
            (identical(other.album, album) || other.album == album) &&
            (identical(other.albumArtist, albumArtist) ||
                other.albumArtist == albumArtist) &&
            (identical(other.genre, genre) || other.genre == genre) &&
            (identical(other.year, year) || other.year == year) &&
            (identical(other.durationMs, durationMs) ||
                other.durationMs == durationMs) &&
            (identical(other.coverArt, coverArt) ||
                other.coverArt == coverArt) &&
            (identical(other.fileUrlRemote, fileUrlRemote) ||
                other.fileUrlRemote == fileUrlRemote) &&
            (identical(other.filePathLocal, filePathLocal) ||
                other.filePathLocal == filePathLocal) &&
            (identical(other.source, source) || other.source == source) &&
            (identical(other.syncStatus, syncStatus) ||
                other.syncStatus == syncStatus) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    userId,
    title,
    artist,
    album,
    albumArtist,
    genre,
    year,
    durationMs,
    coverArt,
    fileUrlRemote,
    filePathLocal,
    source,
    syncStatus,
    createdAt,
    updatedAt,
  );

  /// Create a copy of Track
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TrackImplCopyWith<_$TrackImpl> get copyWith =>
      __$$TrackImplCopyWithImpl<_$TrackImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$TrackImplToJson(this);
  }
}

abstract class _Track implements Track {
  const factory _Track({
    required final String id,
    required final String userId,
    required final String title,
    required final String artist,
    required final String album,
    final String? albumArtist,
    final String? genre,
    final int? year,
    required final int durationMs,
    final String? coverArt,
    final String? fileUrlRemote,
    final String? filePathLocal,
    final TrackSource source,
    final SyncStatus syncStatus,
    required final DateTime createdAt,
    required final DateTime updatedAt,
  }) = _$TrackImpl;

  factory _Track.fromJson(Map<String, dynamic> json) = _$TrackImpl.fromJson;

  @override
  String get id;
  @override
  String get userId;
  @override
  String get title;
  @override
  String get artist;
  @override
  String get album;
  @override
  String? get albumArtist;
  @override
  String? get genre;
  @override
  int? get year;
  @override
  int get durationMs;
  @override
  String? get coverArt;
  @override
  String? get fileUrlRemote;
  @override
  String? get filePathLocal;
  @override
  TrackSource get source;
  @override
  SyncStatus get syncStatus;
  @override
  DateTime get createdAt;
  @override
  DateTime get updatedAt;

  /// Create a copy of Track
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TrackImplCopyWith<_$TrackImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

TracksListResponse _$TracksListResponseFromJson(Map<String, dynamic> json) {
  return _TracksListResponse.fromJson(json);
}

/// @nodoc
mixin _$TracksListResponse {
  List<Track> get tracks => throw _privateConstructorUsedError;
  int get total => throw _privateConstructorUsedError;
  int get skip => throw _privateConstructorUsedError;
  int get take => throw _privateConstructorUsedError;

  /// Serializes this TracksListResponse to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of TracksListResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TracksListResponseCopyWith<TracksListResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TracksListResponseCopyWith<$Res> {
  factory $TracksListResponseCopyWith(
    TracksListResponse value,
    $Res Function(TracksListResponse) then,
  ) = _$TracksListResponseCopyWithImpl<$Res, TracksListResponse>;
  @useResult
  $Res call({List<Track> tracks, int total, int skip, int take});
}

/// @nodoc
class _$TracksListResponseCopyWithImpl<$Res, $Val extends TracksListResponse>
    implements $TracksListResponseCopyWith<$Res> {
  _$TracksListResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of TracksListResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? tracks = null,
    Object? total = null,
    Object? skip = null,
    Object? take = null,
  }) {
    return _then(
      _value.copyWith(
            tracks: null == tracks
                ? _value.tracks
                : tracks // ignore: cast_nullable_to_non_nullable
                      as List<Track>,
            total: null == total
                ? _value.total
                : total // ignore: cast_nullable_to_non_nullable
                      as int,
            skip: null == skip
                ? _value.skip
                : skip // ignore: cast_nullable_to_non_nullable
                      as int,
            take: null == take
                ? _value.take
                : take // ignore: cast_nullable_to_non_nullable
                      as int,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$TracksListResponseImplCopyWith<$Res>
    implements $TracksListResponseCopyWith<$Res> {
  factory _$$TracksListResponseImplCopyWith(
    _$TracksListResponseImpl value,
    $Res Function(_$TracksListResponseImpl) then,
  ) = __$$TracksListResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({List<Track> tracks, int total, int skip, int take});
}

/// @nodoc
class __$$TracksListResponseImplCopyWithImpl<$Res>
    extends _$TracksListResponseCopyWithImpl<$Res, _$TracksListResponseImpl>
    implements _$$TracksListResponseImplCopyWith<$Res> {
  __$$TracksListResponseImplCopyWithImpl(
    _$TracksListResponseImpl _value,
    $Res Function(_$TracksListResponseImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of TracksListResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? tracks = null,
    Object? total = null,
    Object? skip = null,
    Object? take = null,
  }) {
    return _then(
      _$TracksListResponseImpl(
        tracks: null == tracks
            ? _value._tracks
            : tracks // ignore: cast_nullable_to_non_nullable
                  as List<Track>,
        total: null == total
            ? _value.total
            : total // ignore: cast_nullable_to_non_nullable
                  as int,
        skip: null == skip
            ? _value.skip
            : skip // ignore: cast_nullable_to_non_nullable
                  as int,
        take: null == take
            ? _value.take
            : take // ignore: cast_nullable_to_non_nullable
                  as int,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$TracksListResponseImpl implements _TracksListResponse {
  const _$TracksListResponseImpl({
    required final List<Track> tracks,
    required this.total,
    required this.skip,
    required this.take,
  }) : _tracks = tracks;

  factory _$TracksListResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$TracksListResponseImplFromJson(json);

  final List<Track> _tracks;
  @override
  List<Track> get tracks {
    if (_tracks is EqualUnmodifiableListView) return _tracks;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_tracks);
  }

  @override
  final int total;
  @override
  final int skip;
  @override
  final int take;

  @override
  String toString() {
    return 'TracksListResponse(tracks: $tracks, total: $total, skip: $skip, take: $take)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TracksListResponseImpl &&
            const DeepCollectionEquality().equals(other._tracks, _tracks) &&
            (identical(other.total, total) || other.total == total) &&
            (identical(other.skip, skip) || other.skip == skip) &&
            (identical(other.take, take) || other.take == take));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    const DeepCollectionEquality().hash(_tracks),
    total,
    skip,
    take,
  );

  /// Create a copy of TracksListResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TracksListResponseImplCopyWith<_$TracksListResponseImpl> get copyWith =>
      __$$TracksListResponseImplCopyWithImpl<_$TracksListResponseImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$TracksListResponseImplToJson(this);
  }
}

abstract class _TracksListResponse implements TracksListResponse {
  const factory _TracksListResponse({
    required final List<Track> tracks,
    required final int total,
    required final int skip,
    required final int take,
  }) = _$TracksListResponseImpl;

  factory _TracksListResponse.fromJson(Map<String, dynamic> json) =
      _$TracksListResponseImpl.fromJson;

  @override
  List<Track> get tracks;
  @override
  int get total;
  @override
  int get skip;
  @override
  int get take;

  /// Create a copy of TracksListResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TracksListResponseImplCopyWith<_$TracksListResponseImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
