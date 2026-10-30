import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/features/catalog/providers/catalog_providers.dart';
import 'package:musicflow_mobile/features/library/providers/followed_artists_provider.dart';
import 'package:musicflow_mobile/shared/models/catalog.dart';

class ArtistPreferencesScreen extends ConsumerStatefulWidget {
  const ArtistPreferencesScreen({super.key});

  @override
  ConsumerState<ArtistPreferencesScreen> createState() =>
      _ArtistPreferencesScreenState();
}

class _ArtistPreferencesScreenState
    extends ConsumerState<ArtistPreferencesScreen> {
  static const _artistsPerPage = 6;
  final _pageController = PageController();
  var _page = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  String _selectedLabel(int count) {
    if (count == 1) return '1 artista seleccionado';
    return '$count artistas seleccionados';
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    final followed = ref.watch(followedArtistsProvider);
    final firstPage = ref.watch(
      catalogArtistsPageProvider((query: '', page: 0)),
    );
    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: const Text('Artistas preferidos'),
        backgroundColor: colors.background,
      ),
      body: firstPage.when(
        loading: () =>
            Center(child: CircularProgressIndicator(color: colors.primary)),
        error: (_, _) => Center(
          child: FilledButton.icon(
            onPressed: () => ref.invalidate(
              catalogArtistsPageProvider((query: '', page: 0)),
            ),
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Reintentar'),
          ),
        ),
        data: (pageData) {
          if (pageData.total == 0) {
            return Center(
              child: Text(
                'No hay artistas disponibles.',
                style: TextStyle(color: colors.textMuted),
              ),
            );
          }
          final totalPages = (pageData.total / _artistsPerPage).ceil();
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Desliza con el dedo a izquierda o derecha para explorar '
                      'artistas y marcar tus preferidos.',
                      style: TextStyle(color: colors.textMuted),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.check_circle_rounded,
                          size: 16,
                          color: colors.primary,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            _selectedLabel(followed.length),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: colors.primary,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        Text(
                          '${_page + 1}/$totalPages',
                          style: TextStyle(
                            color: colors.textMuted,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: totalPages,
                  onPageChanged: (index) => setState(() => _page = index),
                  itemBuilder: (context, index) =>
                      _ArtistPreferencesPage(page: index),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ArtistPreferencesPage extends ConsumerWidget {
  const _ArtistPreferencesPage({required this.page});

  final int page;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.musicFlowColors;
    final followed = ref.watch(followedArtistsProvider);
    final artists = ref.watch(
      catalogArtistsPageProvider((query: '', page: page)),
    );
    return artists.when(
      loading: () =>
          Center(child: CircularProgressIndicator(color: colors.primary)),
      error: (_, _) => Center(
        child: FilledButton.icon(
          onPressed: () => ref.invalidate(
            catalogArtistsPageProvider((query: '', page: page)),
          ),
          icon: const Icon(Icons.refresh_rounded),
          label: const Text('Reintentar'),
        ),
      ),
      data: (pageData) {
        final items = pageData.items;
        if (items.isEmpty) {
          return Center(
            child: Text(
              'No hay artistas disponibles.',
              style: TextStyle(color: colors.textMuted),
            ),
          );
        }
        return GridView.builder(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.84,
          ),
          itemCount: items.length,
          itemBuilder: (context, index) {
            final artist = items[index];
            final selected = followed.any(
              (name) => name.toLowerCase() == artist.name.toLowerCase(),
            );
            return _ArtistPreferenceCard(
              artist: artist,
              selected: selected,
              onPressed: () async {
                try {
                  await ref
                      .read(followedArtistsProvider.notifier)
                      .toggle(artist.name);
                } catch (_) {
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('No se pudo actualizar el artista.'),
                    ),
                  );
                }
              },
            );
          },
        );
      },
    );
  }
}

class _ArtistPreferenceCard extends StatelessWidget {
  const _ArtistPreferenceCard({
    required this.artist,
    required this.selected,
    required this.onPressed,
  });

  final CatalogArtist artist;
  final bool selected;
  final Future<void> Function() onPressed;

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return Material(
      color: colors.surface,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 27,
                    foregroundImage: artist.imageUrl == null
                        ? null
                        : NetworkImage(artist.imageUrl!),
                    backgroundColor: colors.surfaceAlt,
                    child: artist.imageUrl == null
                        ? const Icon(Icons.person_rounded)
                        : null,
                  ),
                  const Spacer(),
                  Icon(
                    selected
                        ? Icons.check_circle_rounded
                        : Icons.add_circle_outline_rounded,
                    color: selected ? colors.primary : colors.textMuted,
                  ),
                ],
              ),
              const Spacer(),
              Text(
                artist.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${artist.trackCount} canciones',
                style: TextStyle(color: colors.textMuted, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
