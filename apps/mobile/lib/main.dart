import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/app/router.dart';
import 'package:musicflow_mobile/core/audio/audio_service_init.dart';
import 'package:musicflow_mobile/core/providers/app_settings_provider.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  PaintingBinding.instance.imageCache.maximumSize = 300;
  PaintingBinding.instance.imageCache.maximumSizeBytes = 160 << 20;
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  unawaited(initAudioService());
  runApp(const ProviderScope(child: MusicFlowApp()));
}

class MusicFlowApp extends ConsumerWidget {
  const MusicFlowApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final palette = ref.watch(appSettingsProvider).palette;
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'MusicFlow',
      theme: MusicFlowTheme.fromPalette(palette),
      routerConfig: router,
    );
  }
}
