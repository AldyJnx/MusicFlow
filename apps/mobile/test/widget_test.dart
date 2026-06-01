import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:musicflow_mobile/main.dart';

void main() {
  testWidgets('MusicFlowApp builds', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: MusicFlowApp()));
    expect(find.byType(MusicFlowApp), findsOneWidget);
  });
}
