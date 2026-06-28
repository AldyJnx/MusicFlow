import 'package:audio_service/audio_service.dart';
import 'package:musicflow_mobile/core/audio/musicflow_audio_handler.dart';

/// Top-level handle so Riverpod providers can reach the handler directly.
late MusicFlowAudioHandler audioHandler;

/// Called in [main] before [runApp]. Initialises audio_service and stores
/// the resulting handler in [audioHandler].
Future<void> initAudioService() async {
  audioHandler = await AudioService.init(
    builder: () => MusicFlowAudioHandler(),
    config: const AudioServiceConfig(
      androidNotificationChannelId: 'com.musicflow.audio',
      androidNotificationChannelName: 'MusicFlow Audio',
      androidNotificationIcon: 'drawable/ic_stat_music_note',
      androidNotificationOngoing: true,
    ),
  );
}
