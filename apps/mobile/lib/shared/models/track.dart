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
    required String userId,
    required String title,
    required String artist,
    required String album,
    String? albumArtist,
    String? genre,
    int? year,
    required int durationMs,
    String? coverArt,
    String? fileUrlRemote,
    String? filePathLocal,
    @Default(TrackSource.local) TrackSource source,
    @Default(SyncStatus.pending) SyncStatus syncStatus,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Track;

  factory Track.fromJson(Map<String, dynamic> json) => _$TrackFromJson(json);
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
