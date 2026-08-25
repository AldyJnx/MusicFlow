import 'dart:async';
import 'dart:io';

import 'package:flutter_chrome_cast/cast_context.dart';
import 'package:flutter_chrome_cast/common.dart';
import 'package:flutter_chrome_cast/discovery.dart';
import 'package:flutter_chrome_cast/entities.dart';
import 'package:flutter_chrome_cast/enums.dart';
import 'package:flutter_chrome_cast/media.dart';
import 'package:flutter_chrome_cast/models.dart';
import 'package:flutter_chrome_cast/session.dart';
import 'package:musicflow_mobile/core/config/app_config.dart';
import 'package:musicflow_mobile/shared/models/track.dart';

class CastService {
  CastService._() {
    _sessionSubscription = GoogleCastSessionManager
        .instance
        .currentSessionStream
        .listen((session) {
          final connected =
              session?.connectionState == GoogleCastConnectState.connected;
          if (_isConnected == connected) return;
          _isConnected = connected;
          _connectionChanges.add(connected);
        });
  }

  static final CastService instance = CastService._();
  final StreamController<bool> _connectionChanges =
      StreamController<bool>.broadcast();
  late final StreamSubscription<GoogleCastSession?> _sessionSubscription;
  bool _initialized = false;
  bool _isConnected = false;
  Future<void>? _initializing;

  bool get isAvailable =>
      (Platform.isAndroid || Platform.isIOS) && AppConfig.isCastConfigured;
  Stream<bool> get connectionChanges => _connectionChanges.stream;
  Stream<List<GoogleCastDevice>> get devices =>
      GoogleCastDiscoveryManager.instance.devicesStream;

  Future<void> initialize() {
    if (_initialized || !isAvailable) return Future.value();
    return _initializing ??= _initialize().whenComplete(() {
      _initializing = null;
    });
  }

  Future<void> _initialize() async {
    final GoogleCastOptions options;
    if (Platform.isIOS) {
      options = IOSGoogleCastOptions(
        GoogleCastDiscoveryCriteriaInitialize.initWithApplicationID(
          AppConfig.castReceiverAppId,
        ),
      );
    } else {
      options = GoogleCastOptionsAndroid(appId: AppConfig.castReceiverAppId);
    }
    final initialized = await GoogleCastContext.instance
        .setSharedInstanceWithOptions(options);
    if (!initialized) {
      throw StateError('Google Cast no pudo inicializarse.');
    }
    _initialized = true;
  }

  Future<void> startDiscovery() async {
    await initialize();
    if (!isAvailable) return;
    await GoogleCastDiscoveryManager.instance.startDiscovery();
  }

  Future<void> stopDiscovery() async {
    if (!isAvailable) return;
    await GoogleCastDiscoveryManager.instance.stopDiscovery();
  }

  Future<bool> connect(GoogleCastDevice device) async {
    await initialize();
    if (!isAvailable) return false;
    return GoogleCastSessionManager.instance.startSessionWithDevice(device);
  }

  Future<bool> syncTrack(Track track) async {
    if (!isAvailable ||
        track.fileUrlRemote == null ||
        track.fileUrlRemote!.isEmpty) {
      return false;
    }
    await initialize();
    if (!GoogleCastSessionManager.instance.hasConnectedSession) return false;

    final audioUrl = Uri.tryParse(track.fileUrlRemote!);
    if (audioUrl == null || !audioUrl.hasScheme) return false;
    final coverUrl = Uri.tryParse(track.coverArt ?? '');
    final images = coverUrl != null && coverUrl.hasScheme
        ? [GoogleCastImage(url: coverUrl)]
        : null;

    await GoogleCastRemoteMediaClient.instance.loadMedia(
      GoogleCastMediaInformation(
        contentId: track.id,
        contentUrl: audioUrl,
        contentType: audioUrl.path.toLowerCase().endsWith('.wav')
            ? 'audio/wav'
            : 'audio/mpeg',
        streamType: CastMediaStreamType.buffered,
        duration: Duration(milliseconds: track.durationMs),
        metadata: GoogleCastMusicMediaMetadata(
          title: track.title,
          artist: track.artist,
          albumName: track.album,
          albumArtist: track.artist,
          images: images,
        ),
      ),
    );
    return true;
  }

  Future<bool?> togglePlayback() async {
    if (!isAvailable ||
        !GoogleCastSessionManager.instance.hasConnectedSession) {
      return null;
    }
    final client = GoogleCastRemoteMediaClient.instance;
    final isPlaying =
        client.mediaStatus?.playerState == CastMediaPlayerState.playing;
    if (isPlaying) {
      await client.pause();
    } else {
      await client.play();
    }
    return !isPlaying;
  }

  Future<void> dispose() async {
    await _sessionSubscription.cancel();
    await _connectionChanges.close();
  }
}
