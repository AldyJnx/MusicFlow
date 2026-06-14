import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/widgets/app_bottom_navigation.dart';
import 'package:musicflow_mobile/core/widgets/mini_player_bar.dart';
import 'package:musicflow_mobile/features/library/providers/followed_artists_provider.dart';
import 'package:musicflow_mobile/features/library/providers/tracks_providers.dart';
import 'package:musicflow_mobile/features/player/providers/player_controller.dart';
import 'package:musicflow_mobile/shared/models/track.dart';

class ArtistDetailScreen extends ConsumerWidget {
  const ArtistDetailScreen({required this.artist, super.key});

  final String artist;

  static const Color _accentCyan = Color(0xFF00CFFF);
  static const Color _lightBlue = Color(0xFF4FC3F7);
  static const Color _bgDark = Color(0xFF071A24);
  static const Color _bgMid = Color(0xFF0A2230);
  static const Color _bgTop = Color(0xFF0E3447);
  static const Color _card = Color(0xFF102734);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final query = TracksQuery(artist: artist, take: 20);
    final tracksAsync = ref.watch(tracksListProvider(query));
    final isFollowing = ref.watch(
      followedArtistsProvider.select((artists) => artists.contains(artist)),
    );

    return Scaffold(
      backgroundColor: _bgDark,
      bottomNavigationBar: const AppBottomNavigation(
        currentRoute: AppRoutes.home,
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
          child: tracksAsync.when(
            loading: () => const Center(
              child: CircularProgressIndicator(color: _accentCyan),
            ),
            error: (_, __) => _ArtistMessage(
              message: 'No se pudo cargar el artista.',
              onRetry: () => ref.invalidate(tracksListProvider(query)),
            ),
            data: (response) {
              final tracks = response.tracks;
              String? coverArt;
              for (final track in tracks) {
                final candidate = track.coverArt;
                if (candidate != null && candidate.isNotEmpty) {
                  coverArt = candidate;
                  break;
                }
              }

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
                        const SizedBox(width: 48),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Center(
                      child: ClipOval(
                        child: SizedBox(
                          width: 148,
                          height: 148,
                          child: coverArt != null
                              ? Image.network(
                                  coverArt,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) =>
                                      const _ArtistFallback(),
                                )
                              : const _ArtistFallback(),
                        ),
                      ),
                    ),
                    const SizedBox(height: 22),
                    Center(
                      child: Text(
                        artist,
                        textAlign: TextAlign.center,
                        style: theme.textTheme.displaySmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          height: 0.98,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Center(
                      child: Text(
                        '${tracks.length} canciones disponibles',
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: _lightBlue,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Center(
                      child: OutlinedButton.icon(
                        onPressed: () => ref
                            .read(followedArtistsProvider.notifier)
                            .toggle(artist),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: isFollowing ? _bgDark : _accentCyan,
                          backgroundColor: isFollowing
                              ? _accentCyan
                              : Colors.transparent,
                          side: const BorderSide(color: _accentCyan),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 22,
                            vertical: 12,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                        icon: Icon(
                          isFollowing
                              ? Icons.check_rounded
                              : Icons.person_add_alt_1_rounded,
                        ),
                        label: Text(
                          isFollowing ? 'Siguiendo' : 'Seguir',
                          style: const TextStyle(fontWeight: FontWeight.w900),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: tracks.isEmpty
                            ? null
                            : () => ref
                                  .read(playerControllerProvider.notifier)
                                  .playTrackList(tracks, startIndex: 0),
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
                          'Reproducir artista',
                          style: TextStyle(fontWeight: FontWeight.w900),
                        ),
                      ),
                    ),
                    const SizedBox(height: 28),
                    Text(
                      'Canciones',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 14),
                    if (tracks.isEmpty)
                      const _ArtistMessage(
                        message: 'No hay canciones para este artista.',
                      )
                    else
                      ListView.separated(
                        itemCount: tracks.length,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          return _ArtistTrackTile(
                            track: tracks[index],
                            onPlay: () => ref
                                .read(playerControllerProvider.notifier)
                                .playTrackList(tracks, startIndex: index),
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
}

class _ArtistTrackTile extends StatelessWidget {
  const _ArtistTrackTile({required this.track, required this.onPlay});

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
          color: ArtistDetailScreen._card.withOpacity(0.9),
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
                        errorBuilder: (_, __, ___) => const _ArtistFallback(),
                      )
                    : const _ArtistFallback(),
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
                    track.album.isEmpty ? track.artist : track.album,
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
              color: ArtistDetailScreen._accentCyan,
            ),
          ],
        ),
      ),
    );
  }
}

class _ArtistMessage extends StatelessWidget {
  const _ArtistMessage({required this.message, this.onRetry});

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
                  style: TextStyle(color: ArtistDetailScreen._accentCyan),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ArtistFallback extends StatelessWidget {
  const _ArtistFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1E90FF), ArtistDetailScreen._accentCyan],
        ),
      ),
      child: const Icon(Icons.person_rounded, color: Colors.white, size: 32),
    );
  }
}
