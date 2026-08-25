import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:musicflow_mobile/app/router.dart';
import 'package:musicflow_mobile/main.dart';

void main() {
  testWidgets('MusicFlowApp builds', (WidgetTester tester) async {
    final router = GoRouter(
      routes: [
        GoRoute(
          path: '/',
          builder: (_, _) => const Scaffold(body: Text('MusicFlow test')),
        ),
      ],
    );
    addTearDown(router.dispose);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [routerProvider.overrideWithValue(router)],
        child: const MusicFlowApp(),
      ),
    );
    await tester.pump();
    expect(find.byType(MusicFlowApp), findsOneWidget);
    expect(find.text('MusicFlow test'), findsOneWidget);
  });
}
