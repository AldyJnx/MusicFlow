// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';

part 'track.freezed.dart';
part 'track.g.dart';

enum TrackSource {
  @JsonValue('LOCAL')
  local,
  @JsonValue('SYNCED')
  synced,
  @JsonValue('BOTH')
  both,
}

enum SyncStatus {
  @JsonValue('PENDING')
  pending,
  @JsonValue('SYNCED')
  synced,
  @JsonValue('FAILED')
  failed,
}

@freezed
class Track with _$Track {
  const factory Track({
    required String id,
    @JsonKey(fromJson: _stringFromJson) required String userId,
    @JsonKey(fromJson: _stringFromJson) required String title,
    @JsonKey(fromJson: _artistNameFromJson) required String artist,
    @JsonKey(fromJson: _albumTitleFromJson) required String album,
    @JsonKey(fromJson: _nullableStringFromJson) String? albumArtist,
    @JsonKey(fromJson: _nullableStringFromJson) String? genre,
    int? year,
    required int durationMs,
    @JsonKey(fromJson: _nullableUrlFromJson) String? coverArt,
    @JsonKey(fromJson: _nullableUrlFromJson) String? artistImage,
    @JsonKey(fromJson: _nullableUrlFromJson) String? fileUrlRemote,
    @JsonKey(fromJson: _nullableStringFromJson) String? filePathLocal,
    @Default(TrackSource.local) TrackSource source,
    @Default(SyncStatus.pending) SyncStatus syncStatus,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Track;

  factory Track.fromJson(Map<String, dynamic> json) => _$TrackFromJson(json);
}

String _stringFromJson(Object? value) => _nullableStringFromJson(value) ?? '';

String? _nullableStringFromJson(Object? value) {
  if (value == null) return null;
  if (value is String) return value;
  if (value is num || value is bool) return value.toString();
  if (value is Map<String, dynamic>) {
    return _firstStringValue(value, const [
      'name',
      'title',
      'value',
      'id',
      'email',
      'username',
    ]);
  }
  return value.toString();
}

String _artistNameFromJson(Object? value) {
  if (value is Map<String, dynamic>) {
    return _firstStringValue(value, const [
          'name',
          'artist',
          'title',
          'displayName',
        ]) ??
        'Unknown Artist';
  }
  final artist = _stringFromJson(value);
  return artist.isEmpty ? 'Unknown Artist' : artist;
}

String _albumTitleFromJson(Object? value) {
  if (value is Map<String, dynamic>) {
    return _firstStringValue(value, const ['title', 'name', 'album']) ?? '';
  }
  return _stringFromJson(value);
}

String? _nullableUrlFromJson(Object? value) {
  if (value is Map<String, dynamic>) {
    return _firstStringValue(value, const [
      'url',
      'href',
      'coverArt',
      'artistImage',
      'imageUrl',
      'fileUrlRemote',
      'filePathLocal',
    ]);
  }
  return _nullableStringFromJson(value);
}

String? _firstStringValue(Map<String, dynamic> json, List<String> keys) {
  for (final key in keys) {
    final value = json[key];
    if (value is String && value.trim().isNotEmpty) return value;
    if (value is num || value is bool) return value.toString();
  }
  return null;
}

@freezed
class TracksListResponse with _$TracksListResponse {
  const factory TracksListResponse({
    required List<Track> tracks,
    required int total,
    required int skip,
    required int take,
  }) = _TracksListResponse;

  factory TracksListResponse.fromJson(Map<String, dynamic> json) =>
      _$TracksListResponseFromJson(json);
}
