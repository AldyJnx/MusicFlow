import 'package:audio_service/audio_service.dart';
import 'package:just_audio/just_audio.dart';
import 'package:rxdart/rxdart.dart';

/// MusicFlow's concrete [BaseAudioHandler] that drives the [AudioPlayer].
///
/// Responsibilities
/// ----------------
/// - Maintains a [ConcatenatingAudioSource] that mirrors the MediaItem queue.
/// - Forwards just_audio state (playing, processingState, position) to the
///   audio_service [playbackState] stream so the system notification/lock-screen
///   stays in sync.
/// - Forwards the current index to [mediaItem] so consumers always know which
///   track is active.
class MusicFlowAudioHandler extends BaseAudioHandler with SeekHandler {
  final AudioPlayer _player = AudioPlayer();
  ConcatenatingAudioSource _audioSource = ConcatenatingAudioSource(children: []);

  MusicFlowAudioHandler() {
    _init();
  }

  // ── Initialisation ─────────────────────────────────────────────────────────

  void _init() {
    // Forward playing state + processingState + controls.
    _player.playerStateStream.listen(_onPlayerStateChanged);

    // Forward current index → mediaItem.
    _player.currentIndexStream.listen(_onCurrentIndexChanged);

    // Forward position with a slight throttle to avoid flooding.
    _player.positionStream
        .throttleTime(const Duration(milliseconds: 200))
        .listen(_onPositionChanged);
  }

  // ── Queue management ────────────────────────────────────────────────────────

  @override
  Future<void> updateQueue(List<MediaItem> newQueue) async {
    queue.add(newQueue);
  }

  /// Replace the entire queue and rebuild the underlying [ConcatenatingAudioSource].
  Future<void> setQueue(List<MediaItem> items) async {
    queue.add(items);

    _audioSource = ConcatenatingAudioSource(
      children: items
          .map((item) {
            final url = item.extras?['url'] as String?;
            if (url == null || url.isEmpty) return null;
            return AudioSource.uri(Uri.parse(url), tag: item);
          })
          .whereType<AudioSource>()
          .toList(),
    );

    await _player.setAudioSource(_audioSource);
  }

  // ── Transport controls ──────────────────────────────────────────────────────

  @override
  Future<void> play() => _player.play();

  @override
  Future<void> pause() => _player.pause();

  @override
  Future<void> stop() async {
    await _player.stop();
    await super.stop();
  }

  @override
  Future<void> seek(Duration position) => _player.seek(position);

  @override
  Future<void> skipToNext() => _player.seekToNext();

  @override
  Future<void> skipToPrevious() => _player.seekToPrevious();

  @override
  Future<void> skipToQueueItem(int index) async {
    await _player.seek(Duration.zero, index: index);
    await _player.play();
  }

  // ── Stream forwarding ───────────────────────────────────────────────────────

  void _onPlayerStateChanged(PlayerState state) {
    final playing = state.playing;
    final proc = _mapProcessingState(state.processingState);

    playbackState.add(
      playbackState.value.copyWith(
        controls: [
          MediaControl.skipToPrevious,
          if (playing) MediaControl.pause else MediaControl.play,
          MediaControl.skipToNext,
        ],
        systemActions: const {
          MediaAction.seek,
          MediaAction.skipToNext,
          MediaAction.skipToPrevious,
        },
        androidCompactActionIndices: const [0, 1, 2],
        playing: playing,
        processingState: proc,
        updatePosition: _player.position,
      ),
    );
  }

  void _onCurrentIndexChanged(int? index) {
    if (index == null) return;
    final currentQueue = queue.value;
    if (index < currentQueue.length) {
      mediaItem.add(currentQueue[index]);
    }
  }

  void _onPositionChanged(Duration position) {
    playbackState.add(
      playbackState.value.copyWith(updatePosition: position),
    );
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  AudioProcessingState _mapProcessingState(ProcessingState state) {
    switch (state) {
      case ProcessingState.idle:
        return AudioProcessingState.idle;
      case ProcessingState.loading:
        return AudioProcessingState.loading;
      case ProcessingState.buffering:
        return AudioProcessingState.buffering;
      case ProcessingState.ready:
        return AudioProcessingState.ready;
      case ProcessingState.completed:
        return AudioProcessingState.completed;
    }
  }

  // ── Disposal ─────────────────────────────────────────────────────────────────

  /// Not an `@override` on `BaseAudioHandler`. Call manually when the handler
  /// should be torn down (e.g., on app shutdown).
  Future<void> dispose() async {
    await _player.dispose();
    await super.stop();
  }
}
