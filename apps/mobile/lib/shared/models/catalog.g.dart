// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'catalog.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CatalogArtistImpl _$$CatalogArtistImplFromJson(Map<String, dynamic> json) =>
    _$CatalogArtistImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
      imageUrl: json['imageUrl'] as String?,
      albumCount: (json['albumCount'] as num?)?.toInt() ?? 0,
      trackCount: (json['trackCount'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$$CatalogArtistImplToJson(_$CatalogArtistImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'slug': instance.slug,
      'imageUrl': instance.imageUrl,
      'albumCount': instance.albumCount,
      'trackCount': instance.trackCount,
    };

_$CatalogTrackCardImpl _$$CatalogTrackCardImplFromJson(
  Map<String, dynamic> json,
) => _$CatalogTrackCardImpl(
  id: json['id'] as String,
  title: json['title'] as String,
  artist: json['artist'] as String,
  album: json['album'] as String? ?? '',
  durationMs: (json['durationMs'] as num?)?.toInt() ?? 0,
  coverArt: json['coverArt'] as String?,
  artistImage: json['artistImage'] as String?,
  fileUrlRemote: json['fileUrlRemote'] as String?,
  trackNumber: (json['trackNumber'] as num?)?.toInt(),
  albumId: json['albumId'] as String?,
  albumOrder: (json['albumOrder'] as num?)?.toInt(),
);

Map<String, dynamic> _$$CatalogTrackCardImplToJson(
  _$CatalogTrackCardImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'title': instance.title,
  'artist': instance.artist,
  'album': instance.album,
  'durationMs': instance.durationMs,
  'coverArt': instance.coverArt,
  'artistImage': instance.artistImage,
  'fileUrlRemote': instance.fileUrlRemote,
  'trackNumber': instance.trackNumber,
  'albumId': instance.albumId,
  'albumOrder': instance.albumOrder,
};

_$CatalogAlbumSummaryImpl _$$CatalogAlbumSummaryImplFromJson(
  Map<String, dynamic> json,
) => _$CatalogAlbumSummaryImpl(
  id: json['id'] as String,
  title: json['title'] as String,
  coverArt: json['coverArt'] as String?,
  year: (json['year'] as num?)?.toInt(),
  trackCount: (json['trackCount'] as num?)?.toInt() ?? 0,
);

Map<String, dynamic> _$$CatalogAlbumSummaryImplToJson(
  _$CatalogAlbumSummaryImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'title': instance.title,
  'coverArt': instance.coverArt,
  'year': instance.year,
  'trackCount': instance.trackCount,
};

_$CatalogArtistDetailImpl _$$CatalogArtistDetailImplFromJson(
  Map<String, dynamic> json,
) => _$CatalogArtistDetailImpl(
  id: json['id'] as String,
  name: json['name'] as String,
  slug: json['slug'] as String,
  imageUrl: json['imageUrl'] as String?,
  bio: json['bio'] as String?,
  albums:
      (json['albums'] as List<dynamic>?)
          ?.map((e) => CatalogAlbumSummary.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const <CatalogAlbumSummary>[],
  tracks:
      (json['tracks'] as List<dynamic>?)
          ?.map((e) => CatalogTrackCard.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const <CatalogTrackCard>[],
);

Map<String, dynamic> _$$CatalogArtistDetailImplToJson(
  _$CatalogArtistDetailImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'slug': instance.slug,
  'imageUrl': instance.imageUrl,
  'bio': instance.bio,
  'albums': instance.albums,
  'tracks': instance.tracks,
};

_$CatalogAlbumArtistImpl _$$CatalogAlbumArtistImplFromJson(
  Map<String, dynamic> json,
) => _$CatalogAlbumArtistImpl(
  id: json['id'] as String,
  name: json['name'] as String,
  imageUrl: json['imageUrl'] as String?,
);

Map<String, dynamic> _$$CatalogAlbumArtistImplToJson(
  _$CatalogAlbumArtistImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'imageUrl': instance.imageUrl,
};

_$CatalogAlbumDetailImpl _$$CatalogAlbumDetailImplFromJson(
  Map<String, dynamic> json,
) => _$CatalogAlbumDetailImpl(
  id: json['id'] as String,
  title: json['title'] as String,
  coverArt: json['coverArt'] as String?,
  year: (json['year'] as num?)?.toInt(),
  artist: CatalogAlbumArtist.fromJson(json['artist'] as Map<String, dynamic>),
  tracks:
      (json['tracks'] as List<dynamic>?)
          ?.map((e) => CatalogTrackCard.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const <CatalogTrackCard>[],
);

Map<String, dynamic> _$$CatalogAlbumDetailImplToJson(
  _$CatalogAlbumDetailImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'title': instance.title,
  'coverArt': instance.coverArt,
  'year': instance.year,
  'artist': instance.artist,
  'tracks': instance.tracks,
};
