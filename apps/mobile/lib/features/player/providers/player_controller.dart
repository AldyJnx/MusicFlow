import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/audio/audio_service_init.dart';
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
  });

  final Track? currentTrack;
  final List<Track> queue;
  final int queueIndex;
  final bool isPlaying;
  final Duration position;
  final Duration duration;

  PlayerState copyWith({
    Track? currentTrack,
    bool clearCurrentTrack = false,
    List<Track>? queue,
    int? queueIndex,
    bool? isPlaying,
    Duration? position,
    Duration? duration,
  }) {
    return PlayerState(
      currentTrack: clearCurrentTrack ? null : (currentTrack ?? this.currentTrack),
      queue: queue ?? this.queue,
      queueIndex: queueIndex ?? this.queueIndex,
      isPlaying: isPlaying ?? this.isPlaying,
      position: position ?? this.position,
      duration: duration ?? this.duration,
    );
  }
}

// ── PlayerController ─────────────────────────────────────────────────────────

class PlayerController extends StateNotifier<PlayerState> {
  PlayerController() : super(const PlayerState()) {
    _listenToHandler();
  }

  final List<StreamSubscription<dynamic>> _subs = [];

  // ── Private helpers ─────────────────────────────────────────────────────────

  /// Converts a [Track] to an audio_service [MediaItem].
  MediaItem _toMediaItem(Track track) {
    return MediaItem(
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: Duration(milliseconds: track.durationMs),
      artUri: track.coverArt != null ? Uri.tryParse(track.coverArt!) : null,
      extras: {'url': track.fileUrlRemote ?? ''},
    );
  }

  /// Wires handler streams → local [PlayerState].
  void _listenToHandler() {
    // Playback state (playing flag + position).
    _subs.add(
      audioHandler.playbackState.listen((ps) {
        state = state.copyWith(
          isPlaying: ps.playing,
          position: ps.updatePosition,
        );
      }),
    );

    // Current media item (track metadata + duration).
    _subs.add(
      audioHandler.mediaItem.listen((item) {
        if (item == null) return;
        // Match by id to find the Track object in the queue.
        final idx = state.queue.indexWhere((t) => t.id == item.id);
        if (idx != -1) {
          state = state.copyWith(
            currentTrack: state.queue[idx],
            queueIndex: idx,
            duration: item.duration ?? Duration.zero,
          );
        }
      }),
    );
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /// Play a single track (replaces the queue).
  Future<void> playTrack(Track track) async {
    await playTrackList([track], startIndex: 0);
  }

  /// Set a list as the new queue and start at [startIndex].
  Future<void> playTrackList(List<Track> tracks, {int startIndex = 0}) async {
    final validTracks = tracks.where((t) => t.fileUrlRemote != null && t.fileUrlRemote!.isNotEmpty).toList();
    if (validTracks.isEmpty) return;

    final clampedIndex = startIndex.clamp(0, validTracks.length - 1);
    final items = validTracks.map(_toMediaItem).toList();

    state = state.copyWith(
      queue: validTracks,
      queueIndex: clampedIndex,
      currentTrack: validTracks[clampedIndex],
      isPlaying: false,
      position: Duration.zero,
    );

    await audioHandler.setQueue(items);
    await audioHandler.skipToQueueItem(clampedIndex);
  }

  Future<void> togglePlay() async {
    if (state.isPlaying) {
      await audioHandler.pause();
    } else {
      await audioHandler.play();
    }
  }

  Future<void> pause() => audioHandler.pause();

  Future<void> next() => audioHandler.skipToNext();

  Future<void> previous() => audioHandler.skipToPrevious();

  Future<void> seek(Duration position) => audioHandler.seek(position);

  Future<void> setQueueIndex(int index) => audioHandler.skipToQueueItem(index);

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
    StateNotifierProvider<PlayerController, PlayerState>(
  (ref) {
    final controller = PlayerController();
    ref.onDispose(controller.dispose);
    return controller;
  },
);
