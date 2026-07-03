import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/shared/models/lyrics.dart';

final lyricsProvider = FutureProvider.autoDispose
    .family<LyricsResponse, String>((ref, trackId) {
      return ref.watch(tracksRepositoryProvider).getLyrics(trackId);
    });
