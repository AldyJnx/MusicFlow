import 'package:musicflow_mobile/features/downloads/providers/downloads_controller.dart';
import 'package:musicflow_mobile/shared/models/catalog.dart';
import 'package:musicflow_mobile/shared/models/track.dart';

/// Bridges a catalog track card into the player's [Track] model. Catalog tracks
/// are always remote/streamed, so the synthetic owner/timestamps the player
/// never reads are filled with neutral defaults.
extension CatalogTrackCardX on CatalogTrackCard {
  Track toTrack() {
    final epoch = DateTime.fromMillisecondsSinceEpoch(0);
    return Track(
      id: id,
      userId: '',
      title: title,
      artist: artist,
      album: album,
      durationMs: durationMs,
      coverArt: coverArt,
      fileUrlRemote: fileUrlRemote,
      source: TrackSource.synced,
      syncStatus: SyncStatus.synced,
      createdAt: epoch,
      updatedAt: epoch,
    );
  }
}

/// Map an ordered list of catalog cards to player tracks.
List<Track> catalogCardsToTracks(List<CatalogTrackCard> cards) =>
    cards.map((c) => c.toTrack()).toList();

/// Bridges a catalog card into the downloads model (null when not streamable).
extension CatalogTrackDownloadX on CatalogTrackCard {
  DownloadableTrack? toDownloadable() {
    final url = fileUrlRemote;
    if (url == null || url.isEmpty) return null;
    return DownloadableTrack(
      id: id,
      title: title,
      artist: artist,
      album: album,
      durationMs: durationMs,
      url: url,
      coverArt: coverArt,
    );
  }
}
