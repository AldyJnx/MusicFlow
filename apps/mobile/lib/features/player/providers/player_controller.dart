import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/audio/audio_service_init.dart';
import 'package:musicflow_mobile/core/audio/musicflow_audio_handler.dart';
import 'package:musicflow_mobile/core/cast/cast_service.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/features/downloads/providers/downloads_providers.dart';
import 'package:musicflow_mobile/features/library/providers/tracks_providers.dart';
import 'package:musicflow_mobile/shared/models/eq.dart';
import 'package:musicflow_mobile/shared/models/track.dart';

enum PlayerRepeatMode { off, all, one }

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
    this.repeatMode = PlayerRepeatMode.off,
  });

  final Track? currentTrack;
  final List<Track> queue;
  final int queueIndex;
  final bool isPlaying;
  final Duration position;
  final Duration duration;
  final String? currentPlaylistId;
  final PlayerRepeatMode repeatMode;

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
    PlayerRepeatMode? repeatMode,
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
      repeatMode: repeatMode ?? this.repeatMode,
    );
  }
}

// ── PlayerController ─────────────────────────────────────────────────────────

class PlayerController extends StateNotifier<PlayerState> {
  PlayerController(this._ref) : super(const PlayerState()) {
    unawaited(_listenToHandler());
    _subs.add(
      CastService.instance.connectionChanges.listen((connected) {
        final track = state.currentTrack;
        if (connected && track != null) {
          unawaited(_syncCast(track));
        }
      }),
    );
  }

  final Ref _ref;
  final List<StreamSubscription<dynamic>> _subs = [];
  String? _lastRecordedTrackId;
  String? _expectedMediaItemId;
  int _queueCommandVersion = 0;
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
    final commandVersion = ++_queueCommandVersion;
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
    if (commandVersion != _queueCommandVersion) {
      return;
    }
    final items = validTracks.map(_toMediaItem).toList();
    await handler.setQueue(items);
    if (commandVersion != _queueCommandVersion) {
      return;
    }
    await handler.skipToQueueItem(clampedIndex);
    if (commandVersion != _queueCommandVersion) {
      return;
    }
    await handler.play();
    unawaited(_syncCast(selectedTrack));
  }

  Future<void> togglePlay() async {
    final remotePlaying = await CastService.instance.togglePlayback();
    if (remotePlaying != null) {
      state = state.copyWith(isPlaying: remotePlaying);
      return;
    }
    if (state.isPlaying) {
      state = state.copyWith(isPlaying: false);
      unawaited(_recordCurrentPlay(skipped: false));
      try {
        await (await _handler()).pause();
      } catch (_) {
        state = state.copyWith(isPlaying: true);
      }
    } else {
      state = state.copyWith(isPlaying: true);
      try {
        await (await _handler()).play();
      } catch (_) {
        state = state.copyWith(isPlaying: false);
      }
    }
  }

  Future<void> pause() async {
    state = state.copyWith(isPlaying: false);
    unawaited(_recordCurrentPlay(skipped: false));
    await (await _handler()).pause();
  }

  Future<void> next() async {
    if (state.queue.isEmpty || state.queueIndex >= state.queue.length - 1) {
      return;
    }
    await _recordCurrentPlay(skipped: true);
    final nextIndex = state.queueIndex + 1;
    final nextTrack = state.queue[nextIndex];
    final commandVersion = ++_queueCommandVersion;
    _expectedMediaItemId = nextTrack.id;

    // Under repeat-one, seekToNext can retain the old looping source. Select
    // the exact target and wait for the handler's media item to update the UI.
    final handler = await _handler();
    if (commandVersion != _queueCommandVersion) return;
    await handler.skipToQueueItem(nextIndex);
    if (commandVersion != _queueCommandVersion) return;
    await handler.play();
    unawaited(_syncCast(nextTrack));
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
    final previousTrack = state.queue[previousIndex];
    final commandVersion = ++_queueCommandVersion;
    _expectedMediaItemId = previousTrack.id;
    final handler = await _handler();
    if (commandVersion != _queueCommandVersion) return;
    await handler.skipToQueueItem(previousIndex);
    if (commandVersion != _queueCommandVersion) return;
    await handler.play();
    unawaited(_syncCast(previousTrack));
  }

  Future<void> seek(Duration position) async {
    await (await _handler()).seek(position);
  }

  Future<void> setVolume(double volume) async {
    await (await _handler()).setPlayerVolume(volume);
  }

  Future<void> cycleRepeatMode() async {
    final repeatMode = switch (state.repeatMode) {
      PlayerRepeatMode.off => PlayerRepeatMode.all,
      PlayerRepeatMode.all => PlayerRepeatMode.one,
      PlayerRepeatMode.one => PlayerRepeatMode.off,
    };
    state = state.copyWith(repeatMode: repeatMode);
    await (await _handler()).setLoop(
      repeatAll: repeatMode == PlayerRepeatMode.all,
      repeatOne: repeatMode == PlayerRepeatMode.one,
    );
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
    if (index < 0 || index >= state.queue.length) return;
    await _recordCurrentPlay(skipped: true);
    final commandVersion = ++_queueCommandVersion;
    final selectedTrack = state.queue[index];
    _expectedMediaItemId = selectedTrack.id;
    final handler = await _handler();
    if (commandVersion != _queueCommandVersion) return;
    await handler.skipToQueueItem(index);
    if (commandVersion != _queueCommandVersion) return;
    await handler.play();
    unawaited(_syncCast(selectedTrack));
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

  Future<void> _syncCast(Track track) async {
    try {
      if (await CastService.instance.syncTrack(track)) {
        await _pauseForCast();
      }
    } catch (_) {
      // Local playback stays available when no Cast receiver can load media.
    }
  }

  Future<void> _pauseForCast() async {
    if (!state.isPlaying) return;
    state = state.copyWith(isPlaying: false);
    try {
      await (await _handler()).pause();
    } catch (_) {
      // The remote receiver keeps playing even if the local pause races it.
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
      return PlayerController(ref);
    });
