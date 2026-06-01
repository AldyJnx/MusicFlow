// TODO: Add the android notification icon drawable to Android resources.
//   Without it, audio_service will throw at runtime when showing the
//   media notification. Add a drawable named 'ic_stat_music_note' (or any
//   name you choose) to android/app/src/main/res/drawable/ and reference
//   it via AudioServiceConfig(androidNotificationIcon: 'drawable/ic_stat_music_note').
//
// TODO (platform setup – manual steps required):
//   Android – AndroidManifest.xml must declare:
//     <service android:name="com.ryanheise.audioservice.AudioService"
//              android:foregroundServiceType="mediaPlayback"
//              android:exported="true">
//       <intent-filter>
//         <action android:name="android.media.browse.MediaBrowserService"/>
//       </intent-filter>
//     </service>
//     <receiver android:name="com.ryanheise.audioservice.MediaButtonReceiver"
//               android:exported="true">
//       <intent-filter>
//         <action android:name="android.intent.action.MEDIA_BUTTON"/>
//       </intent-filter>
//     </receiver>
//   iOS – Info.plist must contain:
//     <key>UIBackgroundModes</key>
//     <array><string>audio</string></array>

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
      androidNotificationOngoing: true,
    ),
  );
}
