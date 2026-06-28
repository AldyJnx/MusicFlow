// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'catalog.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

CatalogArtist _$CatalogArtistFromJson(Map<String, dynamic> json) {
  return _CatalogArtist.fromJson(json);
}

/// @nodoc
mixin _$CatalogArtist {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get slug => throw _privateConstructorUsedError;
  String? get imageUrl => throw _privateConstructorUsedError;
  int get albumCount => throw _privateConstructorUsedError;
  int get trackCount => throw _privateConstructorUsedError;

  /// Serializes this CatalogArtist to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CatalogArtist
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CatalogArtistCopyWith<CatalogArtist> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CatalogArtistCopyWith<$Res> {
  factory $CatalogArtistCopyWith(
    CatalogArtist value,
    $Res Function(CatalogArtist) then,
  ) = _$CatalogArtistCopyWithImpl<$Res, CatalogArtist>;
  @useResult
  $Res call({
    String id,
    String name,
    String slug,
    String? imageUrl,
    int albumCount,
    int trackCount,
  });
}

/// @nodoc
class _$CatalogArtistCopyWithImpl<$Res, $Val extends CatalogArtist>
    implements $CatalogArtistCopyWith<$Res> {
  _$CatalogArtistCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CatalogArtist
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? slug = null,
    Object? imageUrl = freezed,
    Object? albumCount = null,
    Object? trackCount = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            name: null == name
                ? _value.name
                : name // ignore: cast_nullable_to_non_nullable
                      as String,
            slug: null == slug
                ? _value.slug
                : slug // ignore: cast_nullable_to_non_nullable
                      as String,
            imageUrl: freezed == imageUrl
                ? _value.imageUrl
                : imageUrl // ignore: cast_nullable_to_non_nullable
                      as String?,
            albumCount: null == albumCount
                ? _value.albumCount
                : albumCount // ignore: cast_nullable_to_non_nullable
                      as int,
            trackCount: null == trackCount
                ? _value.trackCount
                : trackCount // ignore: cast_nullable_to_non_nullable
                      as int,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$CatalogArtistImplCopyWith<$Res>
    implements $CatalogArtistCopyWith<$Res> {
  factory _$$CatalogArtistImplCopyWith(
    _$CatalogArtistImpl value,
    $Res Function(_$CatalogArtistImpl) then,
  ) = __$$CatalogArtistImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String name,
    String slug,
    String? imageUrl,
    int albumCount,
    int trackCount,
  });
}

/// @nodoc
class __$$CatalogArtistImplCopyWithImpl<$Res>
    extends _$CatalogArtistCopyWithImpl<$Res, _$CatalogArtistImpl>
    implements _$$CatalogArtistImplCopyWith<$Res> {
  __$$CatalogArtistImplCopyWithImpl(
    _$CatalogArtistImpl _value,
    $Res Function(_$CatalogArtistImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of CatalogArtist
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? slug = null,
    Object? imageUrl = freezed,
    Object? albumCount = null,
    Object? trackCount = null,
  }) {
    return _then(
      _$CatalogArtistImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        slug: null == slug
            ? _value.slug
            : slug // ignore: cast_nullable_to_non_nullable
                  as String,
        imageUrl: freezed == imageUrl
            ? _value.imageUrl
            : imageUrl // ignore: cast_nullable_to_non_nullable
                  as String?,
        albumCount: null == albumCount
            ? _value.albumCount
            : albumCount // ignore: cast_nullable_to_non_nullable
                  as int,
        trackCount: null == trackCount
            ? _value.trackCount
            : trackCount // ignore: cast_nullable_to_non_nullable
                  as int,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$CatalogArtistImpl implements _CatalogArtist {
  const _$CatalogArtistImpl({
    required this.id,
    required this.name,
    required this.slug,
    this.imageUrl,
    this.albumCount = 0,
    this.trackCount = 0,
  });

  factory _$CatalogArtistImpl.fromJson(Map<String, dynamic> json) =>
      _$$CatalogArtistImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String slug;
  @override
  final String? imageUrl;
  @override
  @JsonKey()
  final int albumCount;
  @override
  @JsonKey()
  final int trackCount;

  @override
  String toString() {
    return 'CatalogArtist(id: $id, name: $name, slug: $slug, imageUrl: $imageUrl, albumCount: $albumCount, trackCount: $trackCount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CatalogArtistImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.imageUrl, imageUrl) ||
                other.imageUrl == imageUrl) &&
            (identical(other.albumCount, albumCount) ||
                other.albumCount == albumCount) &&
            (identical(other.trackCount, trackCount) ||
                other.trackCount == trackCount));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    name,
    slug,
    imageUrl,
    albumCount,
    trackCount,
  );

  /// Create a copy of CatalogArtist
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CatalogArtistImplCopyWith<_$CatalogArtistImpl> get copyWith =>
      __$$CatalogArtistImplCopyWithImpl<_$CatalogArtistImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CatalogArtistImplToJson(this);
  }
}

abstract class _CatalogArtist implements CatalogArtist {
  const factory _CatalogArtist({
    required final String id,
    required final String name,
    required final String slug,
    final String? imageUrl,
    final int albumCount,
    final int trackCount,
  }) = _$CatalogArtistImpl;

  factory _CatalogArtist.fromJson(Map<String, dynamic> json) =
      _$CatalogArtistImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String get slug;
  @override
  String? get imageUrl;
  @override
  int get albumCount;
  @override
  int get trackCount;

  /// Create a copy of CatalogArtist
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CatalogArtistImplCopyWith<_$CatalogArtistImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CatalogTrackCard _$CatalogTrackCardFromJson(Map<String, dynamic> json) {
  return _CatalogTrackCard.fromJson(json);
}

/// @nodoc
mixin _$CatalogTrackCard {
  String get id => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String get artist => throw _privateConstructorUsedError;
  String get album => throw _privateConstructorUsedError;
  int get durationMs => throw _privateConstructorUsedError;
  String? get coverArt => throw _privateConstructorUsedError;
  String? get artistImage => throw _privateConstructorUsedError;
  String? get fileUrlRemote => throw _privateConstructorUsedError;
  int? get trackNumber => throw _privateConstructorUsedError;
  String? get albumId => throw _privateConstructorUsedError;
  int? get albumOrder => throw _privateConstructorUsedError;

  /// Serializes this CatalogTrackCard to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CatalogTrackCard
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CatalogTrackCardCopyWith<CatalogTrackCard> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CatalogTrackCardCopyWith<$Res> {
  factory $CatalogTrackCardCopyWith(
    CatalogTrackCard value,
    $Res Function(CatalogTrackCard) then,
  ) = _$CatalogTrackCardCopyWithImpl<$Res, CatalogTrackCard>;
  @useResult
  $Res call({
    String id,
    String title,
    String artist,
    String album,
    int durationMs,
    String? coverArt,
    String? artistImage,
    String? fileUrlRemote,
    int? trackNumber,
    String? albumId,
    int? albumOrder,
  });
}

/// @nodoc
class _$CatalogTrackCardCopyWithImpl<$Res, $Val extends CatalogTrackCard>
    implements $CatalogTrackCardCopyWith<$Res> {
  _$CatalogTrackCardCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CatalogTrackCard
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? artist = null,
    Object? album = null,
    Object? durationMs = null,
    Object? coverArt = freezed,
    Object? artistImage = freezed,
    Object? fileUrlRemote = freezed,
    Object? trackNumber = freezed,
    Object? albumId = freezed,
    Object? albumOrder = freezed,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
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
            durationMs: null == durationMs
                ? _value.durationMs
                : durationMs // ignore: cast_nullable_to_non_nullable
                      as int,
            coverArt: freezed == coverArt
                ? _value.coverArt
                : coverArt // ignore: cast_nullable_to_non_nullable
                      as String?,
            artistImage: freezed == artistImage
                ? _value.artistImage
                : artistImage // ignore: cast_nullable_to_non_nullable
                      as String?,
            fileUrlRemote: freezed == fileUrlRemote
                ? _value.fileUrlRemote
                : fileUrlRemote // ignore: cast_nullable_to_non_nullable
                      as String?,
            trackNumber: freezed == trackNumber
                ? _value.trackNumber
                : trackNumber // ignore: cast_nullable_to_non_nullable
                      as int?,
            albumId: freezed == albumId
                ? _value.albumId
                : albumId // ignore: cast_nullable_to_non_nullable
                      as String?,
            albumOrder: freezed == albumOrder
                ? _value.albumOrder
                : albumOrder // ignore: cast_nullable_to_non_nullable
                      as int?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$CatalogTrackCardImplCopyWith<$Res>
    implements $CatalogTrackCardCopyWith<$Res> {
  factory _$$CatalogTrackCardImplCopyWith(
    _$CatalogTrackCardImpl value,
    $Res Function(_$CatalogTrackCardImpl) then,
  ) = __$$CatalogTrackCardImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String title,
    String artist,
    String album,
    int durationMs,
    String? coverArt,
    String? artistImage,
    String? fileUrlRemote,
    int? trackNumber,
    String? albumId,
    int? albumOrder,
  });
}

/// @nodoc
class __$$CatalogTrackCardImplCopyWithImpl<$Res>
    extends _$CatalogTrackCardCopyWithImpl<$Res, _$CatalogTrackCardImpl>
    implements _$$CatalogTrackCardImplCopyWith<$Res> {
  __$$CatalogTrackCardImplCopyWithImpl(
    _$CatalogTrackCardImpl _value,
    $Res Function(_$CatalogTrackCardImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of CatalogTrackCard
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? artist = null,
    Object? album = null,
    Object? durationMs = null,
    Object? coverArt = freezed,
    Object? artistImage = freezed,
    Object? fileUrlRemote = freezed,
    Object? trackNumber = freezed,
    Object? albumId = freezed,
    Object? albumOrder = freezed,
  }) {
    return _then(
      _$CatalogTrackCardImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
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
        durationMs: null == durationMs
            ? _value.durationMs
            : durationMs // ignore: cast_nullable_to_non_nullable
                  as int,
        coverArt: freezed == coverArt
            ? _value.coverArt
            : coverArt // ignore: cast_nullable_to_non_nullable
                  as String?,
        artistImage: freezed == artistImage
            ? _value.artistImage
            : artistImage // ignore: cast_nullable_to_non_nullable
                  as String?,
        fileUrlRemote: freezed == fileUrlRemote
            ? _value.fileUrlRemote
            : fileUrlRemote // ignore: cast_nullable_to_non_nullable
                  as String?,
        trackNumber: freezed == trackNumber
            ? _value.trackNumber
            : trackNumber // ignore: cast_nullable_to_non_nullable
                  as int?,
        albumId: freezed == albumId
            ? _value.albumId
            : albumId // ignore: cast_nullable_to_non_nullable
                  as String?,
        albumOrder: freezed == albumOrder
            ? _value.albumOrder
            : albumOrder // ignore: cast_nullable_to_non_nullable
                  as int?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$CatalogTrackCardImpl implements _CatalogTrackCard {
  const _$CatalogTrackCardImpl({
    required this.id,
    required this.title,
    required this.artist,
    this.album = '',
    this.durationMs = 0,
    this.coverArt,
    this.artistImage,
    this.fileUrlRemote,
    this.trackNumber,
    this.albumId,
    this.albumOrder,
  });

  factory _$CatalogTrackCardImpl.fromJson(Map<String, dynamic> json) =>
      _$$CatalogTrackCardImplFromJson(json);

  @override
  final String id;
  @override
  final String title;
  @override
  final String artist;
  @override
  @JsonKey()
  final String album;
  @override
  @JsonKey()
  final int durationMs;
  @override
  final String? coverArt;
  @override
  final String? artistImage;
  @override
  final String? fileUrlRemote;
  @override
  final int? trackNumber;
  @override
  final String? albumId;
  @override
  final int? albumOrder;

  @override
  String toString() {
    return 'CatalogTrackCard(id: $id, title: $title, artist: $artist, album: $album, durationMs: $durationMs, coverArt: $coverArt, artistImage: $artistImage, fileUrlRemote: $fileUrlRemote, trackNumber: $trackNumber, albumId: $albumId, albumOrder: $albumOrder)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CatalogTrackCardImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.artist, artist) || other.artist == artist) &&
            (identical(other.album, album) || other.album == album) &&
            (identical(other.durationMs, durationMs) ||
                other.durationMs == durationMs) &&
            (identical(other.coverArt, coverArt) ||
                other.coverArt == coverArt) &&
            (identical(other.artistImage, artistImage) ||
                other.artistImage == artistImage) &&
            (identical(other.fileUrlRemote, fileUrlRemote) ||
                other.fileUrlRemote == fileUrlRemote) &&
            (identical(other.trackNumber, trackNumber) ||
                other.trackNumber == trackNumber) &&
            (identical(other.albumId, albumId) || other.albumId == albumId) &&
            (identical(other.albumOrder, albumOrder) ||
                other.albumOrder == albumOrder));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    title,
    artist,
    album,
    durationMs,
    coverArt,
    artistImage,
    fileUrlRemote,
    trackNumber,
    albumId,
    albumOrder,
  );

  /// Create a copy of CatalogTrackCard
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CatalogTrackCardImplCopyWith<_$CatalogTrackCardImpl> get copyWith =>
      __$$CatalogTrackCardImplCopyWithImpl<_$CatalogTrackCardImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$CatalogTrackCardImplToJson(this);
  }
}

abstract class _CatalogTrackCard implements CatalogTrackCard {
  const factory _CatalogTrackCard({
    required final String id,
    required final String title,
    required final String artist,
    final String album,
    final int durationMs,
    final String? coverArt,
    final String? artistImage,
    final String? fileUrlRemote,
    final int? trackNumber,
    final String? albumId,
    final int? albumOrder,
  }) = _$CatalogTrackCardImpl;

  factory _CatalogTrackCard.fromJson(Map<String, dynamic> json) =
      _$CatalogTrackCardImpl.fromJson;

  @override
  String get id;
  @override
  String get title;
  @override
  String get artist;
  @override
  String get album;
  @override
  int get durationMs;
  @override
  String? get coverArt;
  @override
  String? get artistImage;
  @override
  String? get fileUrlRemote;
  @override
  int? get trackNumber;
  @override
  String? get albumId;
  @override
  int? get albumOrder;

  /// Create a copy of CatalogTrackCard
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CatalogTrackCardImplCopyWith<_$CatalogTrackCardImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CatalogAlbumSummary _$CatalogAlbumSummaryFromJson(Map<String, dynamic> json) {
  return _CatalogAlbumSummary.fromJson(json);
}

/// @nodoc
mixin _$CatalogAlbumSummary {
  String get id => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String? get coverArt => throw _privateConstructorUsedError;
  int? get year => throw _privateConstructorUsedError;
  int get trackCount => throw _privateConstructorUsedError;

  /// Serializes this CatalogAlbumSummary to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CatalogAlbumSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CatalogAlbumSummaryCopyWith<CatalogAlbumSummary> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CatalogAlbumSummaryCopyWith<$Res> {
  factory $CatalogAlbumSummaryCopyWith(
    CatalogAlbumSummary value,
    $Res Function(CatalogAlbumSummary) then,
  ) = _$CatalogAlbumSummaryCopyWithImpl<$Res, CatalogAlbumSummary>;
  @useResult
  $Res call({
    String id,
    String title,
    String? coverArt,
    int? year,
    int trackCount,
  });
}

/// @nodoc
class _$CatalogAlbumSummaryCopyWithImpl<$Res, $Val extends CatalogAlbumSummary>
    implements $CatalogAlbumSummaryCopyWith<$Res> {
  _$CatalogAlbumSummaryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CatalogAlbumSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? coverArt = freezed,
    Object? year = freezed,
    Object? trackCount = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            title: null == title
                ? _value.title
                : title // ignore: cast_nullable_to_non_nullable
                      as String,
            coverArt: freezed == coverArt
                ? _value.coverArt
                : coverArt // ignore: cast_nullable_to_non_nullable
                      as String?,
            year: freezed == year
                ? _value.year
                : year // ignore: cast_nullable_to_non_nullable
                      as int?,
            trackCount: null == trackCount
                ? _value.trackCount
                : trackCount // ignore: cast_nullable_to_non_nullable
                      as int,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$CatalogAlbumSummaryImplCopyWith<$Res>
    implements $CatalogAlbumSummaryCopyWith<$Res> {
  factory _$$CatalogAlbumSummaryImplCopyWith(
    _$CatalogAlbumSummaryImpl value,
    $Res Function(_$CatalogAlbumSummaryImpl) then,
  ) = __$$CatalogAlbumSummaryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String title,
    String? coverArt,
    int? year,
    int trackCount,
  });
}

/// @nodoc
class __$$CatalogAlbumSummaryImplCopyWithImpl<$Res>
    extends _$CatalogAlbumSummaryCopyWithImpl<$Res, _$CatalogAlbumSummaryImpl>
    implements _$$CatalogAlbumSummaryImplCopyWith<$Res> {
  __$$CatalogAlbumSummaryImplCopyWithImpl(
    _$CatalogAlbumSummaryImpl _value,
    $Res Function(_$CatalogAlbumSummaryImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of CatalogAlbumSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? coverArt = freezed,
    Object? year = freezed,
    Object? trackCount = null,
  }) {
    return _then(
      _$CatalogAlbumSummaryImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        title: null == title
            ? _value.title
            : title // ignore: cast_nullable_to_non_nullable
                  as String,
        coverArt: freezed == coverArt
            ? _value.coverArt
            : coverArt // ignore: cast_nullable_to_non_nullable
                  as String?,
        year: freezed == year
            ? _value.year
            : year // ignore: cast_nullable_to_non_nullable
                  as int?,
        trackCount: null == trackCount
            ? _value.trackCount
            : trackCount // ignore: cast_nullable_to_non_nullable
                  as int,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$CatalogAlbumSummaryImpl implements _CatalogAlbumSummary {
  const _$CatalogAlbumSummaryImpl({
    required this.id,
    required this.title,
    this.coverArt,
    this.year,
    this.trackCount = 0,
  });

  factory _$CatalogAlbumSummaryImpl.fromJson(Map<String, dynamic> json) =>
      _$$CatalogAlbumSummaryImplFromJson(json);

  @override
  final String id;
  @override
  final String title;
  @override
  final String? coverArt;
  @override
  final int? year;
  @override
  @JsonKey()
  final int trackCount;

  @override
  String toString() {
    return 'CatalogAlbumSummary(id: $id, title: $title, coverArt: $coverArt, year: $year, trackCount: $trackCount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CatalogAlbumSummaryImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.coverArt, coverArt) ||
                other.coverArt == coverArt) &&
            (identical(other.year, year) || other.year == year) &&
            (identical(other.trackCount, trackCount) ||
                other.trackCount == trackCount));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, id, title, coverArt, year, trackCount);

  /// Create a copy of CatalogAlbumSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CatalogAlbumSummaryImplCopyWith<_$CatalogAlbumSummaryImpl> get copyWith =>
      __$$CatalogAlbumSummaryImplCopyWithImpl<_$CatalogAlbumSummaryImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$CatalogAlbumSummaryImplToJson(this);
  }
}

abstract class _CatalogAlbumSummary implements CatalogAlbumSummary {
  const factory _CatalogAlbumSummary({
    required final String id,
    required final String title,
    final String? coverArt,
    final int? year,
    final int trackCount,
  }) = _$CatalogAlbumSummaryImpl;

  factory _CatalogAlbumSummary.fromJson(Map<String, dynamic> json) =
      _$CatalogAlbumSummaryImpl.fromJson;

  @override
  String get id;
  @override
  String get title;
  @override
  String? get coverArt;
  @override
  int? get year;
  @override
  int get trackCount;

  /// Create a copy of CatalogAlbumSummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CatalogAlbumSummaryImplCopyWith<_$CatalogAlbumSummaryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CatalogArtistDetail _$CatalogArtistDetailFromJson(Map<String, dynamic> json) {
  return _CatalogArtistDetail.fromJson(json);
}

/// @nodoc
mixin _$CatalogArtistDetail {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get slug => throw _privateConstructorUsedError;
  String? get imageUrl => throw _privateConstructorUsedError;
  String? get bio => throw _privateConstructorUsedError;
  List<CatalogAlbumSummary> get albums => throw _privateConstructorUsedError;
  List<CatalogTrackCard> get tracks => throw _privateConstructorUsedError;

  /// Serializes this CatalogArtistDetail to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CatalogArtistDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CatalogArtistDetailCopyWith<CatalogArtistDetail> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CatalogArtistDetailCopyWith<$Res> {
  factory $CatalogArtistDetailCopyWith(
    CatalogArtistDetail value,
    $Res Function(CatalogArtistDetail) then,
  ) = _$CatalogArtistDetailCopyWithImpl<$Res, CatalogArtistDetail>;
  @useResult
  $Res call({
    String id,
    String name,
    String slug,
    String? imageUrl,
    String? bio,
    List<CatalogAlbumSummary> albums,
    List<CatalogTrackCard> tracks,
  });
}

/// @nodoc
class _$CatalogArtistDetailCopyWithImpl<$Res, $Val extends CatalogArtistDetail>
    implements $CatalogArtistDetailCopyWith<$Res> {
  _$CatalogArtistDetailCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CatalogArtistDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? slug = null,
    Object? imageUrl = freezed,
    Object? bio = freezed,
    Object? albums = null,
    Object? tracks = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            name: null == name
                ? _value.name
                : name // ignore: cast_nullable_to_non_nullable
                      as String,
            slug: null == slug
                ? _value.slug
                : slug // ignore: cast_nullable_to_non_nullable
                      as String,
            imageUrl: freezed == imageUrl
                ? _value.imageUrl
                : imageUrl // ignore: cast_nullable_to_non_nullable
                      as String?,
            bio: freezed == bio
                ? _value.bio
                : bio // ignore: cast_nullable_to_non_nullable
                      as String?,
            albums: null == albums
                ? _value.albums
                : albums // ignore: cast_nullable_to_non_nullable
                      as List<CatalogAlbumSummary>,
            tracks: null == tracks
                ? _value.tracks
                : tracks // ignore: cast_nullable_to_non_nullable
                      as List<CatalogTrackCard>,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$CatalogArtistDetailImplCopyWith<$Res>
    implements $CatalogArtistDetailCopyWith<$Res> {
  factory _$$CatalogArtistDetailImplCopyWith(
    _$CatalogArtistDetailImpl value,
    $Res Function(_$CatalogArtistDetailImpl) then,
  ) = __$$CatalogArtistDetailImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String name,
    String slug,
    String? imageUrl,
    String? bio,
    List<CatalogAlbumSummary> albums,
    List<CatalogTrackCard> tracks,
  });
}

/// @nodoc
class __$$CatalogArtistDetailImplCopyWithImpl<$Res>
    extends _$CatalogArtistDetailCopyWithImpl<$Res, _$CatalogArtistDetailImpl>
    implements _$$CatalogArtistDetailImplCopyWith<$Res> {
  __$$CatalogArtistDetailImplCopyWithImpl(
    _$CatalogArtistDetailImpl _value,
    $Res Function(_$CatalogArtistDetailImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of CatalogArtistDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? slug = null,
    Object? imageUrl = freezed,
    Object? bio = freezed,
    Object? albums = null,
    Object? tracks = null,
  }) {
    return _then(
      _$CatalogArtistDetailImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        slug: null == slug
            ? _value.slug
            : slug // ignore: cast_nullable_to_non_nullable
                  as String,
        imageUrl: freezed == imageUrl
            ? _value.imageUrl
            : imageUrl // ignore: cast_nullable_to_non_nullable
                  as String?,
        bio: freezed == bio
            ? _value.bio
            : bio // ignore: cast_nullable_to_non_nullable
                  as String?,
        albums: null == albums
            ? _value._albums
            : albums // ignore: cast_nullable_to_non_nullable
                  as List<CatalogAlbumSummary>,
        tracks: null == tracks
            ? _value._tracks
            : tracks // ignore: cast_nullable_to_non_nullable
                  as List<CatalogTrackCard>,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$CatalogArtistDetailImpl implements _CatalogArtistDetail {
  const _$CatalogArtistDetailImpl({
    required this.id,
    required this.name,
    required this.slug,
    this.imageUrl,
    this.bio,
    final List<CatalogAlbumSummary> albums = const <CatalogAlbumSummary>[],
    final List<CatalogTrackCard> tracks = const <CatalogTrackCard>[],
  }) : _albums = albums,
       _tracks = tracks;

  factory _$CatalogArtistDetailImpl.fromJson(Map<String, dynamic> json) =>
      _$$CatalogArtistDetailImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String slug;
  @override
  final String? imageUrl;
  @override
  final String? bio;
  final List<CatalogAlbumSummary> _albums;
  @override
  @JsonKey()
  List<CatalogAlbumSummary> get albums {
    if (_albums is EqualUnmodifiableListView) return _albums;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_albums);
  }

  final List<CatalogTrackCard> _tracks;
  @override
  @JsonKey()
  List<CatalogTrackCard> get tracks {
    if (_tracks is EqualUnmodifiableListView) return _tracks;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_tracks);
  }

  @override
  String toString() {
    return 'CatalogArtistDetail(id: $id, name: $name, slug: $slug, imageUrl: $imageUrl, bio: $bio, albums: $albums, tracks: $tracks)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CatalogArtistDetailImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.imageUrl, imageUrl) ||
                other.imageUrl == imageUrl) &&
            (identical(other.bio, bio) || other.bio == bio) &&
            const DeepCollectionEquality().equals(other._albums, _albums) &&
            const DeepCollectionEquality().equals(other._tracks, _tracks));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    name,
    slug,
    imageUrl,
    bio,
    const DeepCollectionEquality().hash(_albums),
    const DeepCollectionEquality().hash(_tracks),
  );

  /// Create a copy of CatalogArtistDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CatalogArtistDetailImplCopyWith<_$CatalogArtistDetailImpl> get copyWith =>
      __$$CatalogArtistDetailImplCopyWithImpl<_$CatalogArtistDetailImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$CatalogArtistDetailImplToJson(this);
  }
}

abstract class _CatalogArtistDetail implements CatalogArtistDetail {
  const factory _CatalogArtistDetail({
    required final String id,
    required final String name,
    required final String slug,
    final String? imageUrl,
    final String? bio,
    final List<CatalogAlbumSummary> albums,
    final List<CatalogTrackCard> tracks,
  }) = _$CatalogArtistDetailImpl;

  factory _CatalogArtistDetail.fromJson(Map<String, dynamic> json) =
      _$CatalogArtistDetailImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String get slug;
  @override
  String? get imageUrl;
  @override
  String? get bio;
  @override
  List<CatalogAlbumSummary> get albums;
  @override
  List<CatalogTrackCard> get tracks;

  /// Create a copy of CatalogArtistDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CatalogArtistDetailImplCopyWith<_$CatalogArtistDetailImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CatalogAlbumArtist _$CatalogAlbumArtistFromJson(Map<String, dynamic> json) {
  return _CatalogAlbumArtist.fromJson(json);
}

/// @nodoc
mixin _$CatalogAlbumArtist {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String? get imageUrl => throw _privateConstructorUsedError;

  /// Serializes this CatalogAlbumArtist to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CatalogAlbumArtist
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CatalogAlbumArtistCopyWith<CatalogAlbumArtist> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CatalogAlbumArtistCopyWith<$Res> {
  factory $CatalogAlbumArtistCopyWith(
    CatalogAlbumArtist value,
    $Res Function(CatalogAlbumArtist) then,
  ) = _$CatalogAlbumArtistCopyWithImpl<$Res, CatalogAlbumArtist>;
  @useResult
  $Res call({String id, String name, String? imageUrl});
}

/// @nodoc
class _$CatalogAlbumArtistCopyWithImpl<$Res, $Val extends CatalogAlbumArtist>
    implements $CatalogAlbumArtistCopyWith<$Res> {
  _$CatalogAlbumArtistCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CatalogAlbumArtist
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? imageUrl = freezed,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            name: null == name
                ? _value.name
                : name // ignore: cast_nullable_to_non_nullable
                      as String,
            imageUrl: freezed == imageUrl
                ? _value.imageUrl
                : imageUrl // ignore: cast_nullable_to_non_nullable
                      as String?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$CatalogAlbumArtistImplCopyWith<$Res>
    implements $CatalogAlbumArtistCopyWith<$Res> {
  factory _$$CatalogAlbumArtistImplCopyWith(
    _$CatalogAlbumArtistImpl value,
    $Res Function(_$CatalogAlbumArtistImpl) then,
  ) = __$$CatalogAlbumArtistImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String id, String name, String? imageUrl});
}

/// @nodoc
class __$$CatalogAlbumArtistImplCopyWithImpl<$Res>
    extends _$CatalogAlbumArtistCopyWithImpl<$Res, _$CatalogAlbumArtistImpl>
    implements _$$CatalogAlbumArtistImplCopyWith<$Res> {
  __$$CatalogAlbumArtistImplCopyWithImpl(
    _$CatalogAlbumArtistImpl _value,
    $Res Function(_$CatalogAlbumArtistImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of CatalogAlbumArtist
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? imageUrl = freezed,
  }) {
    return _then(
      _$CatalogAlbumArtistImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        imageUrl: freezed == imageUrl
            ? _value.imageUrl
            : imageUrl // ignore: cast_nullable_to_non_nullable
                  as String?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$CatalogAlbumArtistImpl implements _CatalogAlbumArtist {
  const _$CatalogAlbumArtistImpl({
    required this.id,
    required this.name,
    this.imageUrl,
  });

  factory _$CatalogAlbumArtistImpl.fromJson(Map<String, dynamic> json) =>
      _$$CatalogAlbumArtistImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String? imageUrl;

  @override
  String toString() {
    return 'CatalogAlbumArtist(id: $id, name: $name, imageUrl: $imageUrl)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CatalogAlbumArtistImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.imageUrl, imageUrl) ||
                other.imageUrl == imageUrl));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, imageUrl);

  /// Create a copy of CatalogAlbumArtist
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CatalogAlbumArtistImplCopyWith<_$CatalogAlbumArtistImpl> get copyWith =>
      __$$CatalogAlbumArtistImplCopyWithImpl<_$CatalogAlbumArtistImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$CatalogAlbumArtistImplToJson(this);
  }
}

abstract class _CatalogAlbumArtist implements CatalogAlbumArtist {
  const factory _CatalogAlbumArtist({
    required final String id,
    required final String name,
    final String? imageUrl,
  }) = _$CatalogAlbumArtistImpl;

  factory _CatalogAlbumArtist.fromJson(Map<String, dynamic> json) =
      _$CatalogAlbumArtistImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String? get imageUrl;

  /// Create a copy of CatalogAlbumArtist
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CatalogAlbumArtistImplCopyWith<_$CatalogAlbumArtistImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CatalogAlbumDetail _$CatalogAlbumDetailFromJson(Map<String, dynamic> json) {
  return _CatalogAlbumDetail.fromJson(json);
}

/// @nodoc
mixin _$CatalogAlbumDetail {
  String get id => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String? get coverArt => throw _privateConstructorUsedError;
  int? get year => throw _privateConstructorUsedError;
  CatalogAlbumArtist get artist => throw _privateConstructorUsedError;
  List<CatalogTrackCard> get tracks => throw _privateConstructorUsedError;

  /// Serializes this CatalogAlbumDetail to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CatalogAlbumDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CatalogAlbumDetailCopyWith<CatalogAlbumDetail> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CatalogAlbumDetailCopyWith<$Res> {
  factory $CatalogAlbumDetailCopyWith(
    CatalogAlbumDetail value,
    $Res Function(CatalogAlbumDetail) then,
  ) = _$CatalogAlbumDetailCopyWithImpl<$Res, CatalogAlbumDetail>;
  @useResult
  $Res call({
    String id,
    String title,
    String? coverArt,
    int? year,
    CatalogAlbumArtist artist,
    List<CatalogTrackCard> tracks,
  });

  $CatalogAlbumArtistCopyWith<$Res> get artist;
}

/// @nodoc
class _$CatalogAlbumDetailCopyWithImpl<$Res, $Val extends CatalogAlbumDetail>
    implements $CatalogAlbumDetailCopyWith<$Res> {
  _$CatalogAlbumDetailCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CatalogAlbumDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? coverArt = freezed,
    Object? year = freezed,
    Object? artist = null,
    Object? tracks = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            title: null == title
                ? _value.title
                : title // ignore: cast_nullable_to_non_nullable
                      as String,
            coverArt: freezed == coverArt
                ? _value.coverArt
                : coverArt // ignore: cast_nullable_to_non_nullable
                      as String?,
            year: freezed == year
                ? _value.year
                : year // ignore: cast_nullable_to_non_nullable
                      as int?,
            artist: null == artist
                ? _value.artist
                : artist // ignore: cast_nullable_to_non_nullable
                      as CatalogAlbumArtist,
            tracks: null == tracks
                ? _value.tracks
                : tracks // ignore: cast_nullable_to_non_nullable
                      as List<CatalogTrackCard>,
          )
          as $Val,
    );
  }

  /// Create a copy of CatalogAlbumDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $CatalogAlbumArtistCopyWith<$Res> get artist {
    return $CatalogAlbumArtistCopyWith<$Res>(_value.artist, (value) {
      return _then(_value.copyWith(artist: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$CatalogAlbumDetailImplCopyWith<$Res>
    implements $CatalogAlbumDetailCopyWith<$Res> {
  factory _$$CatalogAlbumDetailImplCopyWith(
    _$CatalogAlbumDetailImpl value,
    $Res Function(_$CatalogAlbumDetailImpl) then,
  ) = __$$CatalogAlbumDetailImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String title,
    String? coverArt,
    int? year,
    CatalogAlbumArtist artist,
    List<CatalogTrackCard> tracks,
  });

  @override
  $CatalogAlbumArtistCopyWith<$Res> get artist;
}

/// @nodoc
class __$$CatalogAlbumDetailImplCopyWithImpl<$Res>
    extends _$CatalogAlbumDetailCopyWithImpl<$Res, _$CatalogAlbumDetailImpl>
    implements _$$CatalogAlbumDetailImplCopyWith<$Res> {
  __$$CatalogAlbumDetailImplCopyWithImpl(
    _$CatalogAlbumDetailImpl _value,
    $Res Function(_$CatalogAlbumDetailImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of CatalogAlbumDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? coverArt = freezed,
    Object? year = freezed,
    Object? artist = null,
    Object? tracks = null,
  }) {
    return _then(
      _$CatalogAlbumDetailImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        title: null == title
            ? _value.title
            : title // ignore: cast_nullable_to_non_nullable
                  as String,
        coverArt: freezed == coverArt
            ? _value.coverArt
            : coverArt // ignore: cast_nullable_to_non_nullable
                  as String?,
        year: freezed == year
            ? _value.year
            : year // ignore: cast_nullable_to_non_nullable
                  as int?,
        artist: null == artist
            ? _value.artist
            : artist // ignore: cast_nullable_to_non_nullable
                  as CatalogAlbumArtist,
        tracks: null == tracks
            ? _value._tracks
            : tracks // ignore: cast_nullable_to_non_nullable
                  as List<CatalogTrackCard>,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$CatalogAlbumDetailImpl implements _CatalogAlbumDetail {
  const _$CatalogAlbumDetailImpl({
    required this.id,
    required this.title,
    this.coverArt,
    this.year,
    required this.artist,
    final List<CatalogTrackCard> tracks = const <CatalogTrackCard>[],
  }) : _tracks = tracks;

  factory _$CatalogAlbumDetailImpl.fromJson(Map<String, dynamic> json) =>
      _$$CatalogAlbumDetailImplFromJson(json);

  @override
  final String id;
  @override
  final String title;
  @override
  final String? coverArt;
  @override
  final int? year;
  @override
  final CatalogAlbumArtist artist;
  final List<CatalogTrackCard> _tracks;
  @override
  @JsonKey()
  List<CatalogTrackCard> get tracks {
    if (_tracks is EqualUnmodifiableListView) return _tracks;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_tracks);
  }

  @override
  String toString() {
    return 'CatalogAlbumDetail(id: $id, title: $title, coverArt: $coverArt, year: $year, artist: $artist, tracks: $tracks)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CatalogAlbumDetailImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.coverArt, coverArt) ||
                other.coverArt == coverArt) &&
            (identical(other.year, year) || other.year == year) &&
            (identical(other.artist, artist) || other.artist == artist) &&
            const DeepCollectionEquality().equals(other._tracks, _tracks));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    title,
    coverArt,
    year,
    artist,
    const DeepCollectionEquality().hash(_tracks),
  );

  /// Create a copy of CatalogAlbumDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CatalogAlbumDetailImplCopyWith<_$CatalogAlbumDetailImpl> get copyWith =>
      __$$CatalogAlbumDetailImplCopyWithImpl<_$CatalogAlbumDetailImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$CatalogAlbumDetailImplToJson(this);
  }
}

abstract class _CatalogAlbumDetail implements CatalogAlbumDetail {
  const factory _CatalogAlbumDetail({
    required final String id,
    required final String title,
    final String? coverArt,
    final int? year,
    required final CatalogAlbumArtist artist,
    final List<CatalogTrackCard> tracks,
  }) = _$CatalogAlbumDetailImpl;

  factory _CatalogAlbumDetail.fromJson(Map<String, dynamic> json) =
      _$CatalogAlbumDetailImpl.fromJson;

  @override
  String get id;
  @override
  String get title;
  @override
  String? get coverArt;
  @override
  int? get year;
  @override
  CatalogAlbumArtist get artist;
  @override
  List<CatalogTrackCard> get tracks;

  /// Create a copy of CatalogAlbumDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CatalogAlbumDetailImplCopyWith<_$CatalogAlbumDetailImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
