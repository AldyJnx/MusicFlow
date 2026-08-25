import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/features/catalog/providers/catalog_providers.dart';
import 'package:musicflow_mobile/features/library/providers/followed_artists_provider.dart';

class ArtistPreferencesScreen extends ConsumerWidget {
  const ArtistPreferencesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.musicFlowColors;
    final followed = ref.watch(followedArtistsProvider);
    final artists = ref.watch(catalogArtistsProvider);
    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: const Text('Artistas preferidos'),
        backgroundColor: colors.background,
      ),
      body: artists.when(
        loading: () =>
            Center(child: CircularProgressIndicator(color: colors.primary)),
        error: (_, _) => Center(
          child: FilledButton.icon(
            onPressed: () => ref.invalidate(catalogArtistsProvider),
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Reintentar'),
          ),
        ),
        data: (items) => ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
          itemCount: items.length,
          separatorBuilder: (_, _) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            final artist = items[index];
            final selected = followed.any(
              (name) => name.toLowerCase() == artist.name.toLowerCase(),
            );
            return ListTile(
              tileColor: colors.surface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              leading: CircleAvatar(
                foregroundImage: artist.imageUrl == null
                    ? null
                    : NetworkImage(artist.imageUrl!),
                backgroundColor: colors.surfaceAlt,
                child: artist.imageUrl == null
                    ? const Icon(Icons.person_rounded)
                    : null,
              ),
              title: Text(
                artist.name,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
              subtitle: Text(
                '${artist.trackCount} canciones',
                style: TextStyle(color: colors.textMuted),
              ),
              trailing: IconButton(
                tooltip: selected ? 'Dejar de seguir' : 'Seguir',
                icon: Icon(
                  selected
                      ? Icons.check_circle_rounded
                      : Icons.add_circle_outline_rounded,
                  color: selected ? colors.primary : colors.textMuted,
                ),
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
              ),
            );
          },
        ),
      ),
    );
  }
}
