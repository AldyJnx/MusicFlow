import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/features/downloads/providers/downloads_controller.dart';

/// Global offline-downloads state (index + in-flight progress). Kept app-wide
/// (not autoDispose) so the player can resolve local files at any time.
final downloadsControllerProvider =
    StateNotifierProvider<DownloadsController, DownloadsState>((ref) {
      return DownloadsController(ref.watch(downloadsRepositoryProvider));
    });
