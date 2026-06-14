import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/api/analytics_repository.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';

final profileStatsProvider = FutureProvider.autoDispose<ListeningStats>((ref) {
  return ref.watch(analyticsRepositoryProvider).getStats();
});
