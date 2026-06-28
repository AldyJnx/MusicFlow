import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/core/widgets/app_bottom_navigation.dart';
import 'package:musicflow_mobile/core/widgets/mini_player_bar.dart';
import 'package:musicflow_mobile/features/catalog/providers/catalog_providers.dart';
import 'package:musicflow_mobile/features/catalog/widgets/catalog_widgets.dart';
import 'package:musicflow_mobile/shared/models/catalog.dart';

/// Spotify-like browse of the shared catalog: every artist with their cover and
/// album/track counts. Tapping one opens the artist's albums and songs.
class CatalogScreen extends ConsumerWidget {
  const CatalogScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.musicFlowColors;
    final artistsAsync = ref.watch(catalogArtistsProvider);

    return Scaffold(
      backgroundColor: colors.background,
      bottomNavigationBar: const AppBottomNavigation(
        currentRoute: AppRoutes.catalog,
      ),
      bottomSheet: const MiniPlayerBar(),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [colors.gradientStart, colors.gradientEnd, colors.background],
            stops: const [0.0, 0.28, 0.78],
          ),
        ),
        child: SafeArea(
          child: artistsAsync.when(
            loading: () =>
                Center(child: CircularProgressIndicator(color: colors.primary)),
            error: (_, __) => CatalogMessage(
              message: 'No se pudo cargar el catálogo.',
              onRetry: () => ref.invalidate(catalogArtistsProvider),
            ),
            data: (artists) {
              if (artists.isEmpty) {
                return const CatalogMessage(
                  message: 'El catálogo aún no tiene artistas.',
                );
              }
              return CustomScrollView(
                slivers: [
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                    sliver: SliverToBoxAdapter(
                      child: Text(
                        'Catálogo',
                        style: Theme.of(context).textTheme.headlineSmall
                            ?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                            ),
                      ),
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 126),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            mainAxisSpacing: 16,
                            crossAxisSpacing: 16,
                            childAspectRatio: 0.78,
                          ),
                      delegate: SliverChildBuilderDelegate((context, i) {
                        final artist = artists[i];
                        return _ArtistCard(
                          artist: artist,
                          onTap: () => context.push(
                            '${AppRoutes.catalogArtist}/${artist.id}',
                          ),
                        );
                      }, childCount: artists.length),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _ArtistCard extends StatelessWidget {
  const _ArtistCard({required this.artist, required this.onTap});

  final CatalogArtist artist;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return GestureDetector(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: CatalogCoverImage(
                url: artist.imageUrl,
                fallbackIcon: Icons.person_rounded,
                color: colors.surfaceAlt,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            artist.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
          Text(
            '${artist.albumCount} álbumes · ${artist.trackCount} canciones',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(color: colors.textMuted, fontSize: 11),
          ),
        ],
      ),
    );
  }
}
