import 'package:freezed_annotation/freezed_annotation.dart';

part 'catalog.freezed.dart';
part 'catalog.g.dart';

/// A row in the public catalog's artist list (`GET /catalog/artists`).
@freezed
class CatalogArtist with _$CatalogArtist {
  const factory CatalogArtist({
    required String id,
    required String name,
    required String slug,
    String? imageUrl,
    @Default(0) int albumCount,
    @Default(0) int trackCount,
  }) = _CatalogArtist;

  factory CatalogArtist.fromJson(Map<String, dynamic> json) =>
      _$CatalogArtistFromJson(json);
}

/// A lightweight track shape returned inside catalog reads (lyrics stripped).
@freezed
class CatalogTrackCard with _$CatalogTrackCard {
  const factory CatalogTrackCard({
    required String id,
    required String title,
    required String artist,
    @Default('') String album,
    @Default(0) int durationMs,
    String? coverArt,
    String? artistImage,
    String? fileUrlRemote,
    int? trackNumber,
    String? albumId,
    int? albumOrder,
  }) = _CatalogTrackCard;

  factory CatalogTrackCard.fromJson(Map<String, dynamic> json) =>
      _$CatalogTrackCardFromJson(json);
}

/// An album summary inside an artist detail.
@freezed
class CatalogAlbumSummary with _$CatalogAlbumSummary {
  const factory CatalogAlbumSummary({
    required String id,
    required String title,
    String? coverArt,
    int? year,
    @Default(0) int trackCount,
  }) = _CatalogAlbumSummary;

  factory CatalogAlbumSummary.fromJson(Map<String, dynamic> json) =>
      _$CatalogAlbumSummaryFromJson(json);
}

/// Full artist detail (`GET /catalog/artists/:id`).
@freezed
class CatalogArtistDetail with _$CatalogArtistDetail {
  const factory CatalogArtistDetail({
    required String id,
    required String name,
    required String slug,
    String? imageUrl,
    String? bio,
    @Default(<CatalogAlbumSummary>[]) List<CatalogAlbumSummary> albums,
    @Default(<CatalogTrackCard>[]) List<CatalogTrackCard> tracks,
  }) = _CatalogArtistDetail;

  factory CatalogArtistDetail.fromJson(Map<String, dynamic> json) =>
      _$CatalogArtistDetailFromJson(json);
}

/// The artist reference embedded in an album detail.
@freezed
class CatalogAlbumArtist with _$CatalogAlbumArtist {
  const factory CatalogAlbumArtist({
    required String id,
    required String name,
    String? imageUrl,
  }) = _CatalogAlbumArtist;

  factory CatalogAlbumArtist.fromJson(Map<String, dynamic> json) =>
      _$CatalogAlbumArtistFromJson(json);
}

/// Full album detail (`GET /catalog/albums/:id`).
@freezed
class CatalogAlbumDetail with _$CatalogAlbumDetail {
  const factory CatalogAlbumDetail({
    required String id,
    required String title,
    String? coverArt,
    int? year,
    required CatalogAlbumArtist artist,
    @Default(<CatalogTrackCard>[]) List<CatalogTrackCard> tracks,
  }) = _CatalogAlbumDetail;

  factory CatalogAlbumDetail.fromJson(Map<String, dynamic> json) =>
      _$CatalogAlbumDetailFromJson(json);
}
