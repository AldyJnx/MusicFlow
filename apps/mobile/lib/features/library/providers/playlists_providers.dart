import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/shared/models/playlist.dart';

final playlistsProvider = FutureProvider.autoDispose<List<Playlist>>((ref) {
  return ref.watch(playlistsRepositoryProvider).listPlaylists();
});

final playlistDetailProvider = FutureProvider.autoDispose
    .family<Playlist, String>((ref, id) {
      return ref.watch(playlistsRepositoryProvider).getPlaylist(id);
    });
