// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'track.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$TrackImpl _$$TrackImplFromJson(Map<String, dynamic> json) => _$TrackImpl(
  id: json['id'] as String,
  userId: json['userId'] as String,
  title: json['title'] as String,
  artist: json['artist'] as String,
  album: json['album'] as String,
  albumArtist: json['albumArtist'] as String?,
  genre: json['genre'] as String?,
  year: (json['year'] as num?)?.toInt(),
  durationMs: (json['durationMs'] as num).toInt(),
  coverArt: json['coverArt'] as String?,
  fileUrlRemote: json['fileUrlRemote'] as String?,
  filePathLocal: json['filePathLocal'] as String?,
  source:
      $enumDecodeNullable(_$TrackSourceEnumMap, json['source']) ??
      TrackSource.local,
  syncStatus:
      $enumDecodeNullable(_$SyncStatusEnumMap, json['syncStatus']) ??
      SyncStatus.pending,
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$$TrackImplToJson(_$TrackImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'title': instance.title,
      'artist': instance.artist,
      'album': instance.album,
      'albumArtist': instance.albumArtist,
      'genre': instance.genre,
      'year': instance.year,
      'durationMs': instance.durationMs,
      'coverArt': instance.coverArt,
      'fileUrlRemote': instance.fileUrlRemote,
      'filePathLocal': instance.filePathLocal,
      'source': _$TrackSourceEnumMap[instance.source]!,
      'syncStatus': _$SyncStatusEnumMap[instance.syncStatus]!,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

const _$TrackSourceEnumMap = {
  TrackSource.local: 'LOCAL',
  TrackSource.synced: 'SYNCED',
  TrackSource.both: 'BOTH',
};

const _$SyncStatusEnumMap = {
  SyncStatus.pending: 'PENDING',
  SyncStatus.synced: 'SYNCED',
  SyncStatus.failed: 'FAILED',
};

_$TracksListResponseImpl _$$TracksListResponseImplFromJson(
  Map<String, dynamic> json,
) => _$TracksListResponseImpl(
  tracks: (json['tracks'] as List<dynamic>)
      .map((e) => Track.fromJson(e as Map<String, dynamic>))
      .toList(),
  total: (json['total'] as num).toInt(),
  skip: (json['skip'] as num).toInt(),
  take: (json['take'] as num).toInt(),
);

Map<String, dynamic> _$$TracksListResponseImplToJson(
  _$TracksListResponseImpl instance,
) => <String, dynamic>{
  'tracks': instance.tracks,
  'total': instance.total,
  'skip': instance.skip,
  'take': instance.take,
};
