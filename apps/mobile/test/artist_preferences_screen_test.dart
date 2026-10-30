import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:musicflow_mobile/core/api/auth_repository.dart';
import 'package:musicflow_mobile/core/api/dio_client.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/core/storage/token_storage.dart';
import 'package:musicflow_mobile/core/theme/musicflow_palettes.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/features/catalog/providers/catalog_providers.dart';
import 'package:musicflow_mobile/features/library/providers/followed_artists_provider.dart';
import 'package:musicflow_mobile/features/settings/artist_preferences_screen.dart';
import 'package:musicflow_mobile/shared/models/catalog.dart';

class _FakeAuthRepository extends AuthRepository {
  _FakeAuthRepository() : super(DioClient(tokenStorage: TokenStorage()));

  @override
  Future<List<Map<String, dynamic>>> listFollowedArtists() async => const [];
}

class _FakeFollowedArtistsController extends FollowedArtistsController {
  _FakeFollowedArtistsController(super.ref);

  @override
  Future<void> toggle(String artist) async {
    state = state.contains(artist)
        ? ({...state}..remove(artist))
        : {...state, artist};
  }
}

void main() {
  final artists = List.generate(
    12,
    (index) => CatalogArtist(
      id: 'artist-$index',
      name: 'Artist $index',
      slug: 'artist-$index',
    ),
  );

  Widget buildScreen() {
    return ProviderScope(
      overrides: [
        catalogArtistsPageProvider.overrideWith((ref, request) async {
          const perPage = 6;
          final start = request.page * perPage;
          final end = (start + perPage).clamp(0, artists.length);
          return CatalogArtistPage(
            items: start >= artists.length
                ? const []
                : artists.sublist(start, end),
            total: artists.length,
          );
        }),
        followedArtistsProvider.overrideWith(
          (ref) => _FakeFollowedArtistsController(ref),
        ),
        authRepositoryProvider.overrideWith((ref) => _FakeAuthRepository()),
      ],
      child: MaterialApp(
        theme: MusicFlowTheme.fromPalette(
          MusicFlowPalettes.byId(MusicFlowPalettes.defaultId),
        ),
        home: const ArtistPreferencesScreen(),
      ),
    );
  }

  testWidgets('swipes between pages without Previous/Next buttons', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(400, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(buildScreen());
    await tester.pump();
    await tester.pump();

    expect(find.text('Anterior'), findsNothing);
    expect(find.text('Siguiente'), findsNothing);
    expect(find.text('1/2'), findsOneWidget);
    expect(find.text('Artist 0'), findsOneWidget);

    await tester.drag(find.byType(PageView), const Offset(-400, 0));
    await tester.pumpAndSettle();

    expect(find.text('2/2'), findsOneWidget);
    expect(find.text('Artist 7'), findsOneWidget);
  });

  testWidgets('updates the selected artist counter in real time', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(400, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(buildScreen());
    await tester.pump();
    await tester.pump();

    expect(find.text('0 artistas seleccionados'), findsOneWidget);

    await tester.tap(find.text('Artist 0'));
    await tester.pump();

    expect(find.text('1 artista seleccionado'), findsOneWidget);

    await tester.tap(find.text('Artist 1'));
    await tester.pump();

    expect(find.text('2 artistas seleccionados'), findsOneWidget);
  });
}
