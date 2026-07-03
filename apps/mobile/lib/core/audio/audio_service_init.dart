import 'package:audio_service/audio_service.dart';
import 'package:musicflow_mobile/core/audio/musicflow_audio_handler.dart';

/// Top-level handle so Riverpod providers can reach the handler directly.
MusicFlowAudioHandler? _audioHandler;
Future<MusicFlowAudioHandler>? _audioHandlerInit;

MusicFlowAudioHandler get audioHandler {
  final handler = _audioHandler;
  if (handler == null) {
    throw StateError('Audio service has not finished initializing.');
  }
  return handler;
}

/// Called in [main] before [runApp]. Initialises audio_service and stores
/// the resulting handler in [audioHandler].
Future<MusicFlowAudioHandler> initAudioService() {
  final handler = _audioHandler;
  if (handler != null) return Future.value(handler);

  final inFlight = _audioHandlerInit;
  if (inFlight != null) return inFlight;

  return _audioHandlerInit =
      AudioService.init(
        builder: () => MusicFlowAudioHandler(),
        config: const AudioServiceConfig(
          androidNotificationChannelId: 'com.musicflow.audio',
          androidNotificationChannelName: 'MusicFlow Audio',
          androidNotificationIcon: 'drawable/ic_stat_music_note',
          androidNotificationOngoing: true,
        ),
      ).then((handler) {
        _audioHandler = handler;
        return handler;
      });
}
