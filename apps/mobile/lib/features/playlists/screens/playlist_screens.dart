import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/providers/app_settings_provider.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/core/widgets/app_bottom_navigation.dart';
import 'package:musicflow_mobile/core/widgets/floating_ai_bubble.dart';
import 'package:musicflow_mobile/core/widgets/mini_player_bar.dart';
import 'package:musicflow_mobile/features/library/providers/playlists_providers.dart';
import 'package:musicflow_mobile/features/library/providers/tracks_providers.dart';
import 'package:musicflow_mobile/features/player/providers/player_controller.dart';
import 'package:musicflow_mobile/shared/models/track.dart';

class PlaylistScreen extends ConsumerWidget {
  const PlaylistScreen({super.key});

  static const Color _accentCyan = Color(0xFF00CFFF);
  static const Color _lightBlue = Color(0xFF4FC3F7);
  static const Color _bgDark = Color(0xFF08131C);
  static const Color _bgMid = Color(0xFF0B1F2A);
  static const Color _bgTop = Color(0xFF103244);
  static const Color _card = Color(0xFF132632);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    const tracksQuery = TracksQuery(take: 5);
    final tracksAsync = ref.watch(savedTracksListProvider(tracksQuery));
    final playlistsAsync = ref.watch(playlistsProvider);

    return Scaffold(
      backgroundColor: _bgDark,
      bottomNavigationBar: const AppBottomNavigation(
        currentRoute: AppRoutes.playlists,
      ),
      bottomSheet: const MiniPlayerBar(),
      body: _withAiBubble(
        context,
        ref,
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [_bgTop, _bgMid, _bgDark],
              stops: [0.0, 0.25, 0.72],
            ),
          ),
          child: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 126),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      _CircleIcon(
                        icon: Icons.person_rounded,
                        onTap: () => context.go(AppRoutes.profile),
                      ),
                      Expanded(
                        child: Center(
                          child: Text(
                            'MusicFlow',
                            style: theme.textTheme.titleLarge?.copyWith(
                              color: _lightBlue,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                      const _CircleIcon(icon: Icons.search_rounded),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Biblioteca',
                    style: theme.textTheme.displaySmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      height: 0.95,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Tus bibliotecas, canciones guardadas y subidas aparecen aqui.',
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: Colors.white70,
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 22),
                  const Row(
                    children: [
                      _FilterChip(label: 'Canciones', selected: true),
                      SizedBox(width: 12),
                      _FilterChip(label: 'Albumes'),
                      SizedBox(width: 12),
                      _FilterChip(label: 'Artistas'),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Bibliotecas',
                          style: theme.textTheme.headlineSmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      IconButton.filled(
                        onPressed: () => _createLibrary(context, ref),
                        style: IconButton.styleFrom(
                          backgroundColor: _accentCyan,
                          foregroundColor: _bgDark,
                        ),
                        icon: const Icon(Icons.add_rounded),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  playlistsAsync.when(
                    loading: () => const Padding(
                      padding: EdgeInsets.symmetric(vertical: 18),
                      child: Center(
                        child: CircularProgressIndicator(color: _accentCyan),
                      ),
                    ),
                    error: (_, __) => _LibraryMessage(
                      title: 'No se pudieron cargar tus bibliotecas',
                      subtitle:
                          'Revisa la conexion con la API e intenta otra vez.',
                      actionLabel: 'Reintentar',
                      onAction: () => ref.invalidate(playlistsProvider),
                    ),
                    data: (playlists) {
                      if (playlists.isEmpty) {
                        return _LibraryMessage(
                          title: 'Crea tu primera biblioteca',
                          subtitle:
                              'Organiza tus canciones por mood, artista o momento sin duplicarlas dentro de la misma biblioteca.',
                          actionLabel: 'Crear biblioteca',
                          onAction: () => _createLibrary(context, ref),
                        );
                      }

                      return SizedBox(
                        height: 132,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: playlists.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(width: 12),
                          itemBuilder: (context, index) {
                            final playlist = playlists[index];
                            return _PlaylistCard(
                              id: playlist.id,
                              title: playlist.name,
                              subtitle: '${playlist.trackCount} canciones',
                              coverArt: playlist.coverArt,
                            );
                          },
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 28),
                  Text(
                    'Canciones guardadas',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 14),
                  tracksAsync.when(
                    loading: () => const Padding(
                      padding: EdgeInsets.symmetric(vertical: 44),
                      child: Center(
                        child: CircularProgressIndicator(color: _accentCyan),
                      ),
                    ),
                    error: (_, __) => _LibraryMessage(
                      title: 'No se pudo cargar tu biblioteca',
                      subtitle:
                          'Revisa la conexion con la API e intenta otra vez.',
                      actionLabel: 'Reintentar',
                      onAction: () =>
                          ref.invalidate(savedTracksListProvider(tracksQuery)),
                    ),
                    data: (response) {
                      final tracks = response.tracks;
                      if (tracks.isEmpty) {
                        return _LibraryMessage(
                          title: 'Aun no tienes canciones guardadas',
                          subtitle:
                              'Toca el corazon de una cancion para agregarla a tus favoritos.',
                          actionLabel: 'Explorar canciones',
                          onAction: () => context.go(AppRoutes.home),
                        );
                      }

                      return Column(
                        children: List.generate(tracks.length, (index) {
                          final track = tracks[index];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 14),
                            child: _TrackTile(
                              index: (index + 1).toString().padLeft(2, '0'),
                              track: track,
                              onPlay: () => ref
                                  .read(playerControllerProvider.notifier)
                                  .playTrackList(tracks, startIndex: index),
                            ),
                          );
                        }),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _withAiBubble(BuildContext context, WidgetRef ref, Widget child) {
    final assistantEnabled = ref.watch(appSettingsProvider).aiAssistantEnabled;

    return LayoutBuilder(
      builder: (context, constraints) {
        return Stack(
          children: [
            Positioned.fill(child: child),
            if (assistantEnabled)
              FloatingAIBubble(
                boundsSize: constraints.biggest,
                onTap: () => context.push(AppRoutes.aiAgent),
                padding: const EdgeInsets.fromLTRB(16, 56, 16, 154),
              ),
          ],
        );
      },
    );
  }

  Future<void> _createLibrary(BuildContext context, WidgetRef ref) async {
    final data = await showDialog<({String name, String description})>(
      context: context,
      builder: (_) => const _CreateLibraryDialog(),
    );

    if (data == null) return;
    try {
      await ref
          .read(playlistsRepositoryProvider)
          .createPlaylist(name: data.name, description: data.description);
      ref.invalidate(playlistsProvider);
    } catch (_) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo crear la biblioteca.')),
      );
    }
  }
}

class _CreateLibraryDialog extends StatefulWidget {
  const _CreateLibraryDialog();

  @override
  State<_CreateLibraryDialog> createState() => _CreateLibraryDialogState();
}

class _CreateLibraryDialogState extends State<_CreateLibraryDialog> {
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();

  bool get _canCreate => _nameController.text.trim().isNotEmpty;

  @override
  void initState() {
    super.initState();
    _nameController.addListener(_refresh);
  }

  @override
  void dispose() {
    _nameController.removeListener(_refresh);
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _refresh() {
    if (mounted) setState(() {});
  }

  void _submit() {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;
    Navigator.of(
      context,
    ).pop((name: name, description: _descriptionController.text.trim()));
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: PlaylistScreen._card,
      title: const Text(
        'Crear biblioteca',
        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _nameController,
            autofocus: true,
            textInputAction: TextInputAction.next,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(
              labelText: 'Nombre',
              labelStyle: TextStyle(color: Colors.white60),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _descriptionController,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _submit(),
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(
              labelText: 'Descripcion',
              labelStyle: TextStyle(color: Colors.white60),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancelar'),
        ),
        TextButton(
          onPressed: _canCreate ? _submit : null,
          child: const Text(
            'Crear',
            style: TextStyle(color: PlaylistScreen._accentCyan),
          ),
        ),
      ],
    );
  }
}

class _PlaylistCard extends StatelessWidget {
  const _PlaylistCard({
    required this.id,
    required this.title,
    required this.subtitle,
    this.coverArt,
  });

  final String id;
  final String title;
  final String subtitle;
  final String? coverArt;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.push('${AppRoutes.playlist}/$id'),
      borderRadius: BorderRadius.circular(22),
      child: Container(
        width: 178,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: PlaylistScreen._card.withOpacity(0.9),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: SizedBox(
                width: 56,
                height: 56,
                child: coverArt != null && coverArt!.isNotEmpty
                    ? Image.network(
                        coverArt!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                            const _TrackCoverFallback(),
                      )
                    : const _TrackCoverFallback(),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      height: 1.05,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.white60, fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CircleIcon extends StatelessWidget {
  const _CircleIcon({required this.icon, this.onTap});

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.08),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white70, size: 22),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, this.selected = false});

  final String label;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        height: 44,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(999),
          gradient: selected
              ? const LinearGradient(
                  colors: [Color(0xFF1E90FF), PlaylistScreen._accentCyan],
                )
              : null,
          color: selected ? null : Colors.white.withOpacity(0.06),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? PlaylistScreen._bgDark : Colors.white70,
            fontWeight: FontWeight.w800,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

class _LibraryMessage extends StatelessWidget {
  const _LibraryMessage({
    required this.title,
    required this.subtitle,
    required this.actionLabel,
    required this.onAction,
  });

  final String title;
  final String subtitle;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(22, 28, 22, 26),
      decoration: BoxDecoration(
        color: PlaylistScreen._card.withOpacity(0.92),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        children: [
          Container(
            width: 68,
            height: 68,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: PlaylistScreen._accentCyan,
            ),
            child: const Icon(
              Icons.library_music_rounded,
              color: PlaylistScreen._bgDark,
              size: 34,
            ),
          ),
          const SizedBox(height: 18),
          Text(
            title,
            textAlign: TextAlign.center,
            style: theme.textTheme.titleLarge?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.white60,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 18),
          ElevatedButton(
            onPressed: onAction,
            style: ElevatedButton.styleFrom(
              backgroundColor: PlaylistScreen._lightBlue,
              foregroundColor: PlaylistScreen._bgDark,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(999),
              ),
            ),
            child: Text(actionLabel),
          ),
        ],
      ),
    );
  }
}

class _TrackTile extends StatelessWidget {
  const _TrackTile({
    required this.index,
    required this.track,
    required this.onPlay,
  });

  final String index;
  final Track track;
  final Future<void> Function() onPlay;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onPlay,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: PlaylistScreen._card.withOpacity(0.9),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(0.04)),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 28,
              child: Text(
                index,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFFC5D4E0),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(width: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: SizedBox(
                width: 54,
                height: 54,
                child: track.coverArt != null && track.coverArt!.isNotEmpty
                    ? Image.network(
                        track.coverArt!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                            const _TrackCoverFallback(),
                      )
                    : const _TrackCoverFallback(),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    track.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    track.artist,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.white60,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Text(
              _formatDuration(track.durationMs),
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.white54),
            ),
            IconButton(
              onPressed: onPlay,
              icon: const Icon(Icons.play_circle_fill_rounded),
              color: PlaylistScreen._accentCyan,
            ),
          ],
        ),
      ),
    );
  }

  String _formatDuration(int ms) {
    final total = ms ~/ 1000;
    final minutes = total ~/ 60;
    final seconds = total % 60;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }
}

class _TrackCoverFallback extends StatelessWidget {
  const _TrackCoverFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1E90FF), PlaylistScreen._accentCyan],
        ),
      ),
      child: const Icon(Icons.music_note_rounded, color: Colors.white),
    );
  }
}
