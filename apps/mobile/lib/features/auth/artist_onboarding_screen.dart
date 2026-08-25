import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/features/auth/providers/auth_controller.dart';
import 'package:musicflow_mobile/features/catalog/providers/catalog_providers.dart';
import 'package:musicflow_mobile/features/library/providers/followed_artists_provider.dart';
import 'package:musicflow_mobile/shared/models/catalog.dart';

class ArtistOnboardingScreen extends ConsumerStatefulWidget {
  const ArtistOnboardingScreen({super.key});

  @override
  ConsumerState<ArtistOnboardingScreen> createState() =>
      _ArtistOnboardingScreenState();
}

class _ArtistOnboardingScreenState
    extends ConsumerState<ArtistOnboardingScreen> {
  final Set<String> _selected = <String>{};
  final PageController _pageController = PageController();
  final TextEditingController _searchController = TextEditingController();
  Timer? _searchDebounce;
  String _query = '';
  bool _submitting = false;

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _pageController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    if (_submitting) return;
    setState(() => _submitting = true);
    try {
      await ref
          .read(authRepositoryProvider)
          .completeOnboarding(_selected.toList(growable: false));
      await ref.read(authControllerProvider.notifier).refreshCurrentUser();
      await ref.read(followedArtistsProvider.notifier).refresh();
      if (mounted) context.go(AppRoutes.headphonesTip);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No pudimos guardar tus artistas. Intenta de nuevo.'),
        ),
      );
      setState(() => _submitting = false);
    }
  }

  void _toggle(CatalogArtist artist) {
    setState(() {
      if (_selected.contains(artist.id)) {
        _selected.remove(artist.id);
      } else if (_selected.length < 5) {
        _selected.add(artist.id);
      }
    });
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 250), () {
      if (!mounted) return;
      setState(() => _query = value.trim());
      if (_pageController.hasClients) _pageController.jumpToPage(0);
    });
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    final firstPage = ref.watch(
      catalogArtistsPageProvider((query: _query, page: 0)),
    );
    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: _submitting ? null : _finish,
                  child: const Text('Omitir'),
                ),
              ),
              Text(
                'Elige tus artistas',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Selecciona hasta 5 para personalizar tus recomendaciones.',
                style: Theme.of(
                  context,
                ).textTheme.bodyLarge?.copyWith(color: Colors.white70),
              ),
              const SizedBox(height: 8),
              Text(
                '${_selected.length}/5 seleccionados',
                style: TextStyle(
                  color: colors.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _searchController,
                onChanged: _onSearchChanged,
                textInputAction: TextInputAction.search,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Buscar artista',
                  prefixIcon: const Icon(Icons.search_rounded),
                  suffixIcon: _searchController.text.isEmpty
                      ? null
                      : IconButton(
                          icon: const Icon(Icons.close_rounded),
                          onPressed: () {
                            _searchController.clear();
                            _onSearchChanged('');
                          },
                        ),
                ),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: firstPage.when(
                  loading: () => Center(
                    child: CircularProgressIndicator(color: colors.primary),
                  ),
                  error: (_, _) => Center(
                    child: FilledButton.icon(
                      onPressed: () => ref.invalidate(catalogArtistsProvider),
                      icon: const Icon(Icons.refresh_rounded),
                      label: const Text('Reintentar'),
                    ),
                  ),
                  data: (page) {
                    final pages = (page.total / 6)
                        .ceil()
                        .clamp(1, 9999)
                        .toInt();
                    return PageView.builder(
                      controller: _pageController,
                      itemCount: pages,
                      itemBuilder: (context, index) => _ArtistChoicesPage(
                        query: _query,
                        page: index,
                        selectedIds: _selected,
                        onTap: _toggle,
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 54,
                child: FilledButton(
                  onPressed: _submitting ? null : _finish,
                  child: _submitting
                      ? const SizedBox.square(
                          dimension: 22,
                          child: CircularProgressIndicator(strokeWidth: 2.5),
                        )
                      : Text(
                          _selected.isEmpty
                              ? 'Continuar sin seleccionar'
                              : 'Continuar',
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ArtistChoicesPage extends ConsumerWidget {
  const _ArtistChoicesPage({
    required this.query,
    required this.page,
    required this.selectedIds,
    required this.onTap,
  });

  final String query;
  final int page;
  final Set<String> selectedIds;
  final ValueChanged<CatalogArtist> onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final artists = ref.watch(
      catalogArtistsPageProvider((query: query, page: page)),
    );
    return artists.when(
      loading: () => Center(
        child: CircularProgressIndicator(
          color: context.musicFlowColors.primary,
        ),
      ),
      error: (_, _) => Center(
        child: IconButton.filled(
          onPressed: () => ref.invalidate(
            catalogArtistsPageProvider((query: query, page: page)),
          ),
          icon: const Icon(Icons.refresh_rounded),
          tooltip: 'Reintentar',
        ),
      ),
      data: (result) {
        if (result.items.isEmpty) {
          return const Center(
            child: Text(
              'No encontramos artistas.',
              style: TextStyle(color: Colors.white70),
            ),
          );
        }
        return GridView.builder(
          padding: const EdgeInsets.only(top: 4),
          itemCount: result.items.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 16,
            crossAxisSpacing: 12,
            childAspectRatio: 0.78,
          ),
          itemBuilder: (context, index) {
            final artist = result.items[index];
            final selected = selectedIds.contains(artist.id);
            return _ArtistChoice(
              artist: artist,
              selected: selected,
              disabled: !selected && selectedIds.length == 5,
              onTap: () => onTap(artist),
            );
          },
        );
      },
    );
  }
}

class _ArtistChoice extends StatelessWidget {
  const _ArtistChoice({
    required this.artist,
    required this.selected,
    required this.disabled,
    required this.onTap,
  });

  final CatalogArtist artist;
  final bool selected;
  final bool disabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return Opacity(
      opacity: disabled ? 0.45 : 1,
      child: InkWell(
        onTap: disabled ? null : onTap,
        borderRadius: BorderRadius.circular(8),
        child: Column(
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  ClipOval(
                    child: artist.imageUrl == null
                        ? _fallback(colors)
                        : Image.network(
                            artist.imageUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => _fallback(colors),
                          ),
                  ),
                  if (selected)
                    DecoratedBox(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: colors.primary, width: 4),
                      ),
                    ),
                  if (selected)
                    Align(
                      alignment: Alignment.bottomRight,
                      child: CircleAvatar(
                        radius: 14,
                        backgroundColor: colors.primary,
                        child: const Icon(
                          Icons.check_rounded,
                          size: 18,
                          color: Colors.black,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              artist.name,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _fallback(MusicFlowThemeColors colors) {
    return ColoredBox(
      color: colors.surface,
      child: Icon(Icons.person_rounded, color: colors.primary, size: 42),
    );
  }
}
