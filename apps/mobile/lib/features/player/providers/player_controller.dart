import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/audio/audio_service_init.dart';
import 'package:musicflow_mobile/core/audio/musicflow_audio_handler.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/features/downloads/providers/downloads_providers.dart';
import 'package:musicflow_mobile/features/library/providers/tracks_providers.dart';
import 'package:musicflow_mobile/shared/models/eq.dart';
import 'package:musicflow_mobile/shared/models/track.dart';

// ── PlayerState ──────────────────────────────────────────────────────────────

class PlayerState {
  const PlayerState({
    this.currentTrack,
    this.queue = const [],
    this.queueIndex = 0,
    this.isPlaying = false,
    this.position = Duration.zero,
    this.duration = Duration.zero,
    this.currentPlaylistId,
  });

  final Track? currentTrack;
  final List<Track> queue;
  final int queueIndex;
  final bool isPlaying;
  final Duration position;
  final Duration duration;
  final String? currentPlaylistId;

  PlayerState copyWith({
    Track? currentTrack,
    bool clearCurrentTrack = false,
    List<Track>? queue,
    int? queueIndex,
    bool? isPlaying,
    Duration? position,
    Duration? duration,
    String? currentPlaylistId,
    bool clearCurrentPlaylist = false,
  }) {
    return PlayerState(
      currentTrack: clearCurrentTrack
          ? null
          : (currentTrack ?? this.currentTrack),
      queue: queue ?? this.queue,
      queueIndex: queueIndex ?? this.queueIndex,
      isPlaying: isPlaying ?? this.isPlaying,
      position: position ?? this.position,
      duration: duration ?? this.duration,
      currentPlaylistId: clearCurrentPlaylist
          ? null
          : (currentPlaylistId ?? this.currentPlaylistId),
    );
  }
}

// ── PlayerController ─────────────────────────────────────────────────────────

class PlayerController extends StateNotifier<PlayerState> {
  PlayerController(this._ref) : super(const PlayerState()) {
    unawaited(_listenToHandler());
  }

  final Ref _ref;
  final List<StreamSubscription<dynamic>> _subs = [];
  String? _lastRecordedTrackId;
  String? _expectedMediaItemId;
  String? _lastAppliedEqKey;
  String? _activeSegmentId;
  final Map<String, List<double>> _baseEqBandsByTrack = {};
  final Map<String, List<EQSegment>> _segmentsByTrack = {};

  // ── Private helpers ─────────────────────────────────────────────────────────

  /// Converts a [Track] to an audio_service [MediaItem]. When the track has
  /// been downloaded, the local file URI replaces the remote URL so playback
  /// works offline ("auto-switch back to local when available").
  MediaItem _toMediaItem(Track track) {
    final localUri = _ref
        .read(downloadsControllerProvider)
        .localUriFor(track.id);
    return MediaItem(
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: Duration(milliseconds: track.durationMs),
      artUri: track.coverArt != null ? Uri.tryParse(track.coverArt!) : null,
      extras: {'url': localUri ?? track.fileUrlRemote ?? ''},
    );
  }

  /// Wires handler streams → local [PlayerState].
  Future<MusicFlowAudioHandler> _handler() => initAudioService();

  Future<void> _listenToHandler() async {
    final handler = await _handler();
    // Playback state (playing flag + position).
    _subs.add(
      handler.playbackState.listen((ps) {
        state = state.copyWith(
          isPlaying: ps.playing,
          position: ps.updatePosition,
        );
        _applySegmentForPosition(ps.updatePosition);
      }),
    );

    // Current media item (track metadata + duration).
    _subs.add(
      handler.mediaItem.listen((item) {
        if (item == null) return;
        if (_expectedMediaItemId != null && item.id != _expectedMediaItemId) {
          return;
        }
        if (item.id == _expectedMediaItemId) {
          _expectedMediaItemId = null;
        }
        // Match by id to find the Track object in the queue.
        final idx = state.queue.indexWhere((t) => t.id == item.id);
        if (idx != -1) {
          final track = state.queue[idx];
          state = state.copyWith(
            currentTrack: track,
            queueIndex: idx,
            duration: item.duration ?? Duration.zero,
          );
          _applyStoredEqualizer(track.id, playlistId: state.currentPlaylistId);
        }
      }),
    );
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /// Play a single track (replaces the queue).
  Future<void> playTrack(Track track) async {
    await playTrackList([track], startIndex: 0, clearPlaylistContext: true);
  }

  /// Set a list as the new queue and start at [startIndex].
  Future<void> playTrackList(
    List<Track> tracks, {
    int startIndex = 0,
    String? playlistId,
    bool clearPlaylistContext = false,
  }) async {
    final selectedTrackId = tracks.isEmpty
        ? null
        : tracks[startIndex.clamp(0, tracks.length - 1)].id;
    final validTracks = tracks
        .where((t) => t.fileUrlRemote != null && t.fileUrlRemote!.isNotEmpty)
        .toList();
    if (validTracks.isEmpty) return;

    final selectedValidIndex = selectedTrackId == null
        ? -1
        : validTracks.indexWhere((track) => track.id == selectedTrackId);
    final clampedIndex = selectedValidIndex == -1
        ? startIndex.clamp(0, validTracks.length - 1)
        : selectedValidIndex;
    unawaited(_recordCurrentPlay(skipped: true));
    _expectedMediaItemId = validTracks[clampedIndex].id;

    final selectedTrack = validTracks[clampedIndex];
    state = state.copyWith(
      queue: validTracks,
      queueIndex: clampedIndex,
      currentTrack: selectedTrack,
      isPlaying: true,
      position: Duration.zero,
      currentPlaylistId: clearPlaylistContext ? null : playlistId,
      clearCurrentPlaylist: clearPlaylistContext || playlistId == null,
    );
    unawaited(
      _applyStoredEqualizer(
        selectedTrack.id,
        playlistId: clearPlaylistContext ? null : playlistId,
      ),
    );

    final handler = await _handler();
    if (state.currentTrack?.id != selectedTrack.id) {
      return;
    }
    final items = validTracks.map(_toMediaItem).toList();
    await handler.setQueue(items);
    await handler.skipToQueueItem(clampedIndex);
    if (state.currentTrack?.id != selectedTrack.id) {
      return;
    }
    await handler.play();
  }

  Future<void> togglePlay() async {
    if (state.isPlaying) {
      await _recordCurrentPlay(skipped: false);
      await (await _handler()).pause();
    } else {
      await (await _handler()).play();
    }
  }

  Future<void> pause() async {
    await _recordCurrentPlay(skipped: false);
    await (await _handler()).pause();
  }

  Future<void> next() async {
    if (state.queue.isEmpty || state.queueIndex >= state.queue.length - 1) {
      return;
    }
    await _recordCurrentPlay(skipped: true);
    final nextIndex = state.queueIndex + 1;
    state = state.copyWith(
      queueIndex: nextIndex,
      currentTrack: state.queue[nextIndex],
      position: Duration.zero,
      isPlaying: true,
    );
    await (await _handler()).skipToNext();
  }

  Future<void> previous() async {
    if (state.queue.isEmpty) return;
    if (state.position > const Duration(seconds: 3)) {
      await seek(Duration.zero);
      return;
    }
    if (state.queueIndex <= 0) return;
    await _recordCurrentPlay(skipped: true);
    final previousIndex = state.queueIndex - 1;
    state = state.copyWith(
      queueIndex: previousIndex,
      currentTrack: state.queue[previousIndex],
      position: Duration.zero,
      isPlaying: true,
    );
    await (await _handler()).skipToPrevious();
  }

  Future<void> seek(Duration position) async {
    await (await _handler()).seek(position);
  }

  Future<void> setVolume(double volume) async {
    await (await _handler()).setPlayerVolume(volume);
  }

  Future<void> setEqualizerBands(List<double> bands) async {
    _lastAppliedEqKey = state.currentTrack == null
        ? null
        : _eqKey(state.currentTrack!.id, state.currentPlaylistId);
    if (state.currentTrack case final track?) {
      _baseEqBandsByTrack[_eqKey(track.id, state.currentPlaylistId)] = bands;
    }
    _activeSegmentId = null;
    await (await _handler()).setEqualizerBands(bands);
  }

  Future<void> setQueueIndex(int index) async {
    await _recordCurrentPlay(skipped: true);
    await (await _handler()).skipToQueueItem(index);
  }

  Future<void> refreshCurrentEqualizer() async {
    final track = state.currentTrack;
    if (track == null) return;
    _lastAppliedEqKey = null;
    await _applyStoredEqualizer(track.id, playlistId: state.currentPlaylistId);
  }

  Future<void> _applyStoredEqualizer(
    String trackId, {
    String? playlistId,
  }) async {
    final key = _eqKey(trackId, playlistId);
    if (_lastAppliedEqKey == key) return;
    _lastAppliedEqKey = key;
    _activeSegmentId = null;

    try {
      final repo = _ref.read(equalizerRepositoryProvider);
      final results = await Future.wait<Object?>([
        repo.resolveForTrack(trackId, playlistId: playlistId),
        repo.listSegments(trackId),
      ]);
      if (state.currentTrack?.id != trackId) return;

      final config = results[0] as EQConfig?;
      final segments = (results[1] as List<EQSegment>)
        ..sort((a, b) => a.startMs.compareTo(b.startMs));
      final bands = config?.bands;
      if (bands != null && bands.length == 10) {
        _baseEqBandsByTrack[key] = bands
            .map((value) => value.toDouble())
            .toList();
      } else {
        _baseEqBandsByTrack.remove(key);
      }
      _segmentsByTrack[trackId] = segments;
      await _applySegmentForPosition(state.position, force: true);
    } catch (_) {
      // Playback must stay smooth even if EQ config cannot be fetched.
    }
  }

  Future<void> _applySegmentForPosition(
    Duration position, {
    bool force = false,
  }) async {
    final track = state.currentTrack;
    if (track == null) return;
    final key = _eqKey(track.id, state.currentPlaylistId);
    if (_lastAppliedEqKey != key) return;

    final positionMs = position.inMilliseconds;
    final segments = _segmentsByTrack[track.id] ?? const <EQSegment>[];
    EQSegment? activeSegment;
    for (final segment in segments) {
      if (positionMs >= segment.startMs && positionMs <= segment.endMs) {
        activeSegment = segment;
        break;
      }
    }

    final segmentId = activeSegment?.id;
    if (!force && segmentId == _activeSegmentId) return;
    _activeSegmentId = segmentId;

    final segmentBands = activeSegment?.eqConfig.bands;
    if (segmentBands != null && segmentBands.length == 10) {
      await (await _handler()).setEqualizerBands(
        segmentBands.map((value) => value.toDouble()).toList(),
      );
      return;
    }

    final baseBands = _baseEqBandsByTrack[key];
    if (baseBands != null && baseBands.length == 10) {
      await (await _handler()).setEqualizerBands(baseBands);
    } else {
      await (await _handler()).resetEqualizer();
    }
  }

  String _eqKey(String trackId, String? playlistId) {
    return '$trackId:${playlistId ?? ''}';
  }

  Future<void> _recordCurrentPlay({required bool skipped}) async {
    final track = state.currentTrack;
    if (track == null) return;

    final listenedMs = state.position.inMilliseconds;
    if (listenedMs < 5000) return;

    final completed =
        state.duration.inMilliseconds > 0 &&
        listenedMs >= state.duration.inMilliseconds - 3000;
    final recordKey = '${track.id}:$listenedMs:$completed:$skipped';
    if (_lastRecordedTrackId == recordKey) return;
    _lastRecordedTrackId = recordKey;

    try {
      await _ref
          .read(analyticsRepositoryProvider)
          .recordPlay(
            trackId: track.id,
            durationListenedMs: listenedMs,
            completed: completed,
            skipped: skipped && !completed,
          );
      _ref.invalidate(recentlyPlayedTracksProvider(5));
    } catch (_) {
      // Playback must stay smooth even if analytics is unavailable.
    }
  }

  // ── Disposal ─────────────────────────────────────────────────────────────────

  @override
  void dispose() {
    for (final sub in _subs) {
      sub.cancel();
    }
    super.dispose();
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────

final playerControllerProvider =
    StateNotifierProvider<PlayerController, PlayerState>((ref) {
      final controller = PlayerController(ref);
      ref.onDispose(controller.dispose);
      return controller;
    });
