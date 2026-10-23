import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:musicflow_mobile/core/theme/musicflow_palettes.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/features/auth/artist_onboarding_screen.dart';
import 'package:musicflow_mobile/features/catalog/providers/catalog_providers.dart';
import 'package:musicflow_mobile/shared/models/catalog.dart';

void main() {
  testWidgets('artist onboarding caps selection at five', (tester) async {
    tester.view.physicalSize = const Size(400, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final artists = List.generate(
      6,
      (index) => CatalogArtist(
        id: 'artist-$index',
        name: 'Artist $index',
        slug: 'artist-$index',
      ),
    );
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          catalogArtistsProvider.overrideWith((ref) async => artists),
          catalogArtistsPageProvider.overrideWith(
            (ref, request) async => CatalogArtistPage(
              items: request.page == 0 ? artists : const [],
              total: artists.length,
            ),
          ),
        ],
        child: MaterialApp(
          theme: MusicFlowTheme.fromPalette(
            MusicFlowPalettes.byId(MusicFlowPalettes.defaultId),
          ),
          home: const ArtistOnboardingScreen(),
        ),
      ),
    );
    // The screen contains an indeterminate progress indicator while providers
    // resolve, so advance a bounded number of frames instead of waiting for
    // every animation in the tree to stop.
    await tester.pump();
    await tester.pump();

    for (var index = 0; index < 6; index += 1) {
      await tester.tap(find.text('Artist $index'));
      await tester.pump();
    }
    expect(find.text('5/5 seleccionados'), findsOneWidget);
  });
}
