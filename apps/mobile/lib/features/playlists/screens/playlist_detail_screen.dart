import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/core/widgets/app_bottom_navigation.dart';
import 'package:musicflow_mobile/core/widgets/mini_player_bar.dart';
import 'package:musicflow_mobile/features/library/providers/playlists_providers.dart';
import 'package:musicflow_mobile/features/player/providers/player_controller.dart';
import 'package:musicflow_mobile/shared/models/track.dart';

class PlaylistDetailScreen extends ConsumerWidget {
  const PlaylistDetailScreen({required this.playlistId, super.key});

  final String playlistId;

  static const Color _accentCyan = Color(0xFF00CFFF);
  static const Color _lightBlue = Color(0xFF4FC3F7);
  static const Color _bgDark = Color(0xFF071A24);
  static const Color _bgMid = Color(0xFF0A2230);
  static const Color _bgTop = Color(0xFF103244);
  static const Color _card = Color(0xFF102734);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final playlistAsync = ref.watch(playlistDetailProvider(playlistId));

    return Scaffold(
      backgroundColor: _bgDark,
      bottomNavigationBar: const AppBottomNavigation(
        currentRoute: AppRoutes.playlists,
      ),
      bottomSheet: const MiniPlayerBar(),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [_bgTop, _bgMid, _bgDark],
            stops: [0.0, 0.28, 0.78],
          ),
        ),
        child: SafeArea(
          child: playlistAsync.when(
            loading: () => const Center(
              child: CircularProgressIndicator(color: _accentCyan),
            ),
            error: (_, __) => _PlaylistDetailMessage(
              message: 'No se pudo cargar esta biblioteca.',
              onRetry: () => ref.invalidate(playlistDetailProvider(playlistId)),
            ),
            data: (playlist) {
              final tracks = playlist.tracks;
              final coverArt = _firstCover(tracks) ?? playlist.coverArt;

              return SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 126),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        IconButton(
                          onPressed: () => Navigator.of(context).maybePop(),
                          icon: const Icon(Icons.arrow_back_ios_new_rounded),
                          color: Colors.white,
                        ),
                        const Spacer(),
                        Text(
                          'MusicFlow',
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: _accentCyan,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const Spacer(),
                        IconButton(
                          onPressed: () => _editPlaylist(
                            context,
                            ref,
                            id: playlist.id,
                            name: playlist.name,
                            description: playlist.description,
                          ),
                          icon: const Icon(Icons.edit_rounded),
                          color: _accentCyan,
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(30),
                      child: SizedBox(
                        width: double.infinity,
                        height: 220,
                        child: coverArt != null && coverArt.isNotEmpty
                            ? Image.network(
                                coverArt,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) =>
                                    const _PlaylistCoverFallback(),
                              )
                            : const _PlaylistCoverFallback(),
                      ),
                    ),
                    const SizedBox(height: 22),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            playlist.name,
                            style: theme.textTheme.displaySmall?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              height: 0.98,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        IconButton(
                          onPressed: () => _sharePlaylist(
                            context,
                            playlist.name,
                            tracks.length,
                          ),
                          icon: const Icon(Icons.ios_share_rounded),
                          color: _accentCyan,
                          tooltip: 'Compartir biblioteca',
                        ),
                        IconButton(
                          onPressed: () => context.push(
                            '${AppRoutes.playlistEqualizer}/${playlist.id}',
                          ),
                          icon: const Icon(Icons.equalizer_rounded),
                          color: _accentCyan,
                          tooltip: 'Ecualizar biblioteca',
                        ),
                      ],
                    ),
                    if (playlist.description.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        playlist.description,
                        style: theme.textTheme.bodyLarge?.copyWith(
                          color: Colors.white70,
                          height: 1.35,
                        ),
                      ),
                    ],
                    const SizedBox(height: 10),
                    Text(
                      '${tracks.length} canciones',
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: _lightBlue,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: tracks.isEmpty
                            ? null
                            : () => ref
                                  .read(playerControllerProvider.notifier)
                                  .playTrackList(
                                    tracks,
                                    startIndex: 0,
                                    playlistId: playlist.id,
                                  ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _accentCyan,
                          foregroundColor: _bgDark,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 15),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                        icon: const Icon(Icons.play_arrow_rounded),
                        label: const Text(
                          'Reproducir biblioteca',
                          style: TextStyle(fontWeight: FontWeight.w900),
                        ),
                      ),
                    ),
                    const SizedBox(height: 26),
                    if (tracks.isEmpty)
                      const _PlaylistDetailMessage(
                        message: 'Esta biblioteca aun no tiene canciones.',
                      )
                    else
                      ListView.separated(
                        itemCount: tracks.length,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          return _PlaylistTrackTile(
                            track: tracks[index],
                            onPlay: () => ref
                                .read(playerControllerProvider.notifier)
                                .playTrackList(
                                  tracks,
                                  startIndex: index,
                                  playlistId: playlist.id,
                                ),
                          );
                        },
                      ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  String? _firstCover(List<Track> tracks) {
    for (final track in tracks) {
      final cover = track.coverArt;
      if (cover != null && cover.isNotEmpty) return cover;
    }
    return null;
  }

  Future<void> _editPlaylist(
    BuildContext context,
    WidgetRef ref, {
    required String id,
    required String name,
    required String description,
  }) async {
    final data = await showDialog<({String name, String description})>(
      context: context,
      builder: (_) => _EditPlaylistDialog(
        initialName: name,
        initialDescription: description,
      ),
    );

    if (data == null) return;
    try {
      await ref
          .read(playlistsRepositoryProvider)
          .updatePlaylist(
            id: id,
            name: data.name,
            description: data.description,
          );
      ref.invalidate(playlistDetailProvider(id));
      ref.invalidate(playlistsProvider);
    } catch (_) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo editar la biblioteca.')),
      );
    }
  }

  Future<void> _sharePlaylist(
    BuildContext context,
    String name,
    int trackCount,
  ) async {
    await Clipboard.setData(
      ClipboardData(text: 'Escucha mi biblioteca "$name" en MusicFlow.'),
    );
    if (!context.mounted) return;

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(
            trackCount == 1
                ? 'Enlace de "$name" copiado. Tiene 1 cancion.'
                : 'Enlace de "$name" copiado. Tiene $trackCount canciones.',
          ),
        ),
      );
  }
}

class _EditPlaylistDialog extends StatefulWidget {
  const _EditPlaylistDialog({
    required this.initialName,
    required this.initialDescription,
  });

  final String initialName;
  final String initialDescription;

  @override
  State<_EditPlaylistDialog> createState() => _EditPlaylistDialogState();
}

class _EditPlaylistDialogState extends State<_EditPlaylistDialog> {
  late final TextEditingController _nameController;
  late final TextEditingController _descriptionController;

  bool get _canSave => _nameController.text.trim().isNotEmpty;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.initialName)
      ..addListener(_refresh);
    _descriptionController = TextEditingController(
      text: widget.initialDescription,
    );
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
      backgroundColor: PlaylistDetailScreen._card,
      title: const Text(
        'Editar biblioteca',
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
          onPressed: _canSave ? _submit : null,
          child: const Text(
            'Guardar',
            style: TextStyle(color: PlaylistDetailScreen._accentCyan),
          ),
        ),
      ],
    );
  }
}

class _PlaylistTrackTile extends StatelessWidget {
  const _PlaylistTrackTile({required this.track, required this.onPlay});

  final Track track;
  final Future<void> Function() onPlay;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onPlay,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: PlaylistDetailScreen._card.withOpacity(0.92),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Row(
          children: [
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
                            const _PlaylistCoverFallback(),
                      )
                    : const _PlaylistCoverFallback(),
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
            IconButton(
              onPressed: onPlay,
              icon: const Icon(Icons.play_circle_fill_rounded),
              color: PlaylistDetailScreen._accentCyan,
            ),
          ],
        ),
      ),
    );
  }
}

class _PlaylistDetailMessage extends StatelessWidget {
  const _PlaylistDetailMessage({required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 36),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.white60),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 10),
              TextButton(
                onPressed: onRetry,
                child: const Text(
                  'Reintentar',
                  style: TextStyle(color: PlaylistDetailScreen._accentCyan),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PlaylistCoverFallback extends StatelessWidget {
  const _PlaylistCoverFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1E90FF), PlaylistDetailScreen._accentCyan],
        ),
      ),
      child: const Icon(
        Icons.library_music_rounded,
        color: Colors.white,
        size: 42,
      ),
    );
  }
}
