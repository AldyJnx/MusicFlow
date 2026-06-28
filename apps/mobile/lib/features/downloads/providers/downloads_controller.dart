import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:musicflow_mobile/features/downloads/downloads_repository.dart';
import 'package:musicflow_mobile/features/downloads/models/downloaded_track.dart';

const _prefsKey = 'offline_downloads_index';

/// A track the player can stream from the network and, when downloaded, play
/// from disk instead.
class DownloadableTrack {
  const DownloadableTrack({
    required this.id,
    required this.title,
    required this.artist,
    required this.album,
    required this.durationMs,
    required this.url,
    this.coverArt,
  });

  final String id;
  final String title;
  final String artist;
  final String album;
  final int durationMs;
  final String url;
  final String? coverArt;
}

class DownloadsState {
  const DownloadsState({
    this.items = const {},
    this.progress = const {},
    this.dirPath,
  });

  final Map<String, DownloadedTrack> items;

  /// trackId → 0..1 while a download is in flight.
  final Map<String, double> progress;

  /// Absolute downloads directory, resolved once at init.
  final String? dirPath;

  bool isDownloaded(String id) => items.containsKey(id);

  /// A `file://` URI for offline playback, or null when not available.
  String? localUriFor(String id) {
    final meta = items[id];
    final dir = dirPath;
    if (meta == null || dir == null) return null;
    return Uri.file('$dir/${meta.fileName}').toString();
  }

  DownloadsState copyWith({
    Map<String, DownloadedTrack>? items,
    Map<String, double>? progress,
    String? dirPath,
  }) {
    return DownloadsState(
      items: items ?? this.items,
      progress: progress ?? this.progress,
      dirPath: dirPath ?? this.dirPath,
    );
  }
}

class DownloadsController extends StateNotifier<DownloadsState> {
  DownloadsController(this._repo) : super(const DownloadsState()) {
    _init();
  }

  final DownloadsRepository _repo;

  Future<void> _init() async {
    final dir = await _repo.directoryPath();
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_prefsKey);
    final items = <String, DownloadedTrack>{};
    if (raw != null) {
      final decoded = jsonDecode(raw);
      if (decoded is List) {
        for (final e in decoded) {
          final t = DownloadedTrack.fromJson(e as Map<String, dynamic>);
          items[t.id] = t;
        }
      }
    }
    state = state.copyWith(items: items, dirPath: dir);
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    final list = state.items.values.map((t) => t.toJson()).toList();
    await prefs.setString(_prefsKey, jsonEncode(list));
  }

  Future<void> download(DownloadableTrack track) async {
    if (state.isDownloaded(track.id) || state.progress.containsKey(track.id)) {
      return;
    }
    _setProgress(track.id, 0);
    try {
      final fileName = await _repo.download(
        track.id,
        track.url,
        onProgress: (p) => _setProgress(track.id, p),
      );
      final meta = DownloadedTrack(
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        durationMs: track.durationMs,
        fileName: fileName,
        coverArt: track.coverArt,
        downloadedAt: DateTime.now().millisecondsSinceEpoch,
      );
      final items = {...state.items, track.id: meta};
      state = state.copyWith(items: items);
      await _persist();
    } finally {
      _clearProgress(track.id);
    }
  }

  Future<void> remove(String id) async {
    final meta = state.items[id];
    if (meta == null) return;
    await _repo.deleteFile(meta.fileName);
    final items = {...state.items}..remove(id);
    state = state.copyWith(items: items);
    await _persist();
  }

  void _setProgress(String id, double value) {
    state = state.copyWith(progress: {...state.progress, id: value});
  }

  void _clearProgress(String id) {
    final progress = {...state.progress}..remove(id);
    state = state.copyWith(progress: progress);
  }
}
