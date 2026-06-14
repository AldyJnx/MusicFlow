import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/api/ai_agent_repository.dart';
import 'package:musicflow_mobile/core/api/analytics_repository.dart';
import 'package:musicflow_mobile/core/api/auth_repository.dart';
import 'package:musicflow_mobile/core/api/dio_client.dart';
import 'package:musicflow_mobile/core/api/playlists_repository.dart';
import 'package:musicflow_mobile/core/api/tracks_repository.dart';
import 'package:musicflow_mobile/core/storage/token_storage.dart';

final tokenStorageProvider = Provider<TokenStorage>((ref) {
  return TokenStorage();
});

final dioClientProvider = Provider<DioClient>((ref) {
  final storage = ref.watch(tokenStorageProvider);
  return DioClient(tokenStorage: storage);
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(dioClientProvider));
});

final tracksRepositoryProvider = Provider<TracksRepository>((ref) {
  return TracksRepository(ref.watch(dioClientProvider));
});

final playlistsRepositoryProvider = Provider<PlaylistsRepository>((ref) {
  return PlaylistsRepository(ref.watch(dioClientProvider));
});

final aiAgentRepositoryProvider = Provider<AiAgentRepository>((ref) {
  return AiAgentRepository(ref.watch(dioClientProvider));
});

final analyticsRepositoryProvider = Provider<AnalyticsRepository>((ref) {
  return AnalyticsRepository(ref.watch(dioClientProvider));
});
