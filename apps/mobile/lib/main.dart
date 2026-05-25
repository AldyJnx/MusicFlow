import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/app/router.dart';
import 'package:musicflow_mobile/core/audio/audio_service_init.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initAudioService();
  runApp(const ProviderScope(child: MusicFlowApp()));
}

class MusicFlowApp extends ConsumerWidget {
  const MusicFlowApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'MusicFlow',
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF14E3F7),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF07131A),
      ),
      routerConfig: router,
    );
  }
}
