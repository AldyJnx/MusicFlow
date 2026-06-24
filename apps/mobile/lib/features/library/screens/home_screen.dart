import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/providers/app_settings_provider.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/core/widgets/app_bottom_navigation.dart';
import 'package:musicflow_mobile/core/widgets/floating_ai_bubble.dart';
import 'package:musicflow_mobile/core/widgets/mini_player_bar.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/features/auth/providers/auth_controller.dart';
import 'package:musicflow_mobile/features/library/providers/followed_artists_provider.dart';
import 'package:musicflow_mobile/features/library/providers/tracks_providers.dart';
import 'package:musicflow_mobile/features/player/providers/player_controller.dart';
import 'package:musicflow_mobile/shared/models/track.dart';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final _tracksQueryProvider = StateProvider.autoDispose<String>((ref) => '');

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  static const Color _accentCyan = Color(0xFF00CFFF);
  static const Color _lightBlue = Color(0xFF4FC3F7);
  static const Color _cardSoft = Color(0xFF132F3F);

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _searchController = TextEditingController();
  Timer? _debounce;

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      if (mounted) {
        ref.read(_tracksQueryProvider.notifier).state = value.trim();
      }
    });
  }

  void _openPlaylistScreen(BuildContext context) {
    context.push(AppRoutes.playlists);
  }

  Future<void> _toggleFavorite({
    required Track track,
    required bool isSaved,
    required String savedIdsKey,
  }) async {
    final repo = ref.read(tracksRepositoryProvider);
    try {
      if (isSaved) {
        await repo.unsaveTrack(track.id);
      } else {
        await repo.saveTrack(track.id);
      }
      ref.invalidate(savedTrackIdsProvider(savedIdsKey));
      ref.invalidate(savedTracksListProvider(const TracksQuery(take: 5)));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo actualizar favoritos.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = context.musicFlowColors;
    final authState = ref.watch(authControllerProvider);
    final username = authState.user?.username ?? 'Oyente';
    final searchQuery = ref.watch(_tracksQueryProvider);
    final tracksQuery = TracksQuery(
      search: searchQuery.isEmpty ? null : searchQuery,
      take: 5,
    );
    final tracksAsync = ref.watch(tracksListProvider(tracksQuery));
    final recentlyPlayedAsync = ref.watch(recentlyPlayedTracksProvider(5));
    final artistsAsync = ref.watch(artistsProvider);
    final followedArtists = ref.watch(followedArtistsProvider);

    return Scaffold(
      backgroundColor: colors.background,
      bottomNavigationBar: const AppBottomNavigation(
        currentRoute: AppRoutes.home,
      ),
      bottomSheet: const MiniPlayerBar(),
      body: _withAiBubble(
        context,
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                colors.gradientStart,
                colors.gradientEnd,
                colors.background,
              ],
            ),
          ),
          child: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 118),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Align(
                    alignment: Alignment.centerRight,
                    child: _buildPlanPill(context, theme),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Hola $username',
                              style: theme.textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                            Text(
                              'Descubre tu musica de hoy',
                              style: theme.textTheme.bodyLarge?.copyWith(
                                color: Colors.white70,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(
                          Icons.notifications_none_rounded,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // Search
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: colors.border),
                    ),
                    child: TextField(
                      controller: _searchController,
                      style: const TextStyle(color: Colors.white),
                      onChanged: _onSearchChanged,
                      decoration: const InputDecoration(
                        icon: Icon(Icons.search_rounded, color: Colors.white70),
                        hintText: '¿Que quieres escuchar hoy?',
                        hintStyle: TextStyle(color: Colors.white54),
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (searchQuery.isNotEmpty) ...[
                    _buildSearchResults(
                      context,
                      theme,
                      searchQuery,
                      artistsAsync,
                      tracksAsync,
                    ),
                    const SizedBox(height: 24),
                  ] else ...[
                    const SizedBox(height: 24),
                    // Hero card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(22),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(28),
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            colors.cardGradientEnd,
                            colors.cardGradientStart,
                          ],
                        ),
                        border: Border.all(color: colors.border),
                        boxShadow: [
                          BoxShadow(
                            color: colors.shadow.withValues(alpha: 0.24),
                            blurRadius: 24,
                            offset: Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: colors.primary.withValues(alpha: 0.14),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              'Playlist del dia',
                              style: theme.textTheme.labelLarge?.copyWith(
                                color: colors.secondary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'MusicFlow Mix',
                            style: theme.textTheme.headlineMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            'Una mezcla perfecta para empezar con ritmo, enfoque y un toque futurista.',
                            style: theme.textTheme.bodyLarge?.copyWith(
                              color: Colors.white70,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 22),
                          Row(
                            children: [
                              ElevatedButton.icon(
                                onPressed: () {},
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: colors.secondary,
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 18,
                                    vertical: 14,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                                icon: const Icon(Icons.play_arrow_rounded),
                                label: const Text('Reproducir'),
                              ),
                              const SizedBox(width: 12),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.08),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Icon(
                                  Icons.auto_awesome_rounded,
                                  color: colors.primary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),
                  ],
                  // Songs from API
                  _SectionHeader(
                    title: 'Canciones',
                    onSeeAll: () => _openPlaylistScreen(context),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 176,
                    child: tracksAsync.when(
                      loading: () => Center(
                        child: CircularProgressIndicator(color: colors.primary),
                      ),
                      error: (error, _) => _SongsLoadMessage(
                        message:
                            'No se pudo conectar con tu biblioteca. Revisa la API.',
                        onRetry: () =>
                            ref.invalidate(tracksListProvider(tracksQuery)),
                      ),
                      data: (response) {
                        final tracks = _prioritizeFollowedArtists(
                          response.tracks,
                          followedArtists,
                        );
                        if (tracks.isEmpty) {
                          return const _SongsLoadMessage(
                            message: 'Aun no hay canciones disponibles.',
                          );
                        }
                        final savedIdsKey = tracks
                            .map((track) => track.id)
                            .join('|');
                        final savedIds = ref
                            .watch(savedTrackIdsProvider(savedIdsKey))
                            .maybeWhen(
                              data: (ids) => ids,
                              orElse: () => const <String>{},
                            );

                        return ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: tracks.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(width: 14),
                          itemBuilder: (context, index) {
                            final track = tracks[index];
                            return _SongPreviewCard(
                              track: track,
                              isSaved: savedIds.contains(track.id),
                              onPlay: () async {
                                await ref
                                    .read(playerControllerProvider.notifier)
                                    .playTrackList(tracks, startIndex: index);
                              },
                              onFavorite: () => _toggleFavorite(
                                track: track,
                                isSaved: savedIds.contains(track.id),
                                savedIdsKey: savedIdsKey,
                              ),
                              onEqualizer: () async {
                                await ref
                                    .read(playerControllerProvider.notifier)
                                    .playTrackList(tracks, startIndex: index);
                                if (mounted) context.push(AppRoutes.equalizer);
                              },
                            );
                          },
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 28),
                  // Tracks section header
                  _SectionHeader(
                    title: searchQuery.isEmpty
                        ? 'Escuchado recientemente'
                        : 'Resultados de búsqueda',
                    onSeeAll: () {},
                  ),
                  const SizedBox(height: 12),
                  if (searchQuery.isEmpty)
                    recentlyPlayedAsync.when(
                      loading: _buildTrackListLoading,
                      error: (_, __) => _buildTrackListError(
                        context,
                        theme,
                        message:
                            'No se pudo cargar tu historial de escucha reciente.',
                        onRetry: () =>
                            ref.invalidate(recentlyPlayedTracksProvider(5)),
                      ),
                      data: (tracks) => _buildVerticalTrackList(
                        theme: theme,
                        tracks: tracks,
                        emptyMessage:
                            'Aun no tienes canciones escuchadas recientemente.',
                      ),
                    )
                  else
                    tracksAsync.when(
                      loading: _buildTrackListLoading,
                      error: (_, __) => _buildTrackListError(
                        context,
                        theme,
                        message: 'No se pudieron cargar las canciones.',
                        onRetry: () =>
                            ref.invalidate(tracksListProvider(tracksQuery)),
                      ),
                      data: (response) {
                        final tracks = _prioritizeFollowedArtists(
                          response.tracks,
                          followedArtists,
                        );
                        return _buildVerticalTrackList(
                          theme: theme,
                          tracks: tracks,
                          emptyMessage:
                              'No se encontraron canciones para "$searchQuery".',
                        );
                      },
                    ),
                  const SizedBox(height: 8),
                  // AI recommendations promo
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: HomeScreen._cardSoft.withOpacity(0.72),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: HomeScreen._lightBlue.withOpacity(0.15),
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: HomeScreen._accentCyan.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(
                            Icons.auto_awesome_rounded,
                            color: HomeScreen._accentCyan,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Recomendaciones con IA',
                                style: theme.textTheme.titleSmall?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Pronto podras descubrir mezclas personalizadas segun tu mood.',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: Colors.white60,
                                  height: 1.35,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _withAiBubble(BuildContext context, Widget child) {
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

  Widget _buildPlanPill(BuildContext context, ThemeData theme) {
    return SizedBox(
      width: 182,
      child: InkWell(
        onTap: () {
          context.push(AppRoutes.premium);
        },
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.06),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: Colors.white.withOpacity(0.05)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.workspace_premium_rounded,
                size: 16,
                color: HomeScreen._accentCyan.withOpacity(0.95),
              ),
              const SizedBox(width: 8),
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'PLAN',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: Colors.white54,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1,
                    ),
                  ),
                  Text(
                    'GRATUITO',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.4,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTrackListLoading() {
    return const Center(
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 32),
        child: CircularProgressIndicator(color: HomeScreen._accentCyan),
      ),
    );
  }

  Widget _buildTrackListError(
    BuildContext context,
    ThemeData theme, {
    required String message,
    required VoidCallback onRetry,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        children: [
          Text(
            message,
            style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white54),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: onRetry,
            child: const Text(
              'Reintentar',
              style: TextStyle(color: HomeScreen._lightBlue),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerticalTrackList({
    required ThemeData theme,
    required List<Track> tracks,
    required String emptyMessage,
  }) {
    if (tracks.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Center(
          child: Text(
            emptyMessage,
            style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white54),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    return ListView.separated(
      itemCount: tracks.length,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final track = tracks[index];
        return _TrackCard(
          track: track,
          onPlay: () async {
            await ref
                .read(playerControllerProvider.notifier)
                .playTrackList(tracks, startIndex: index);
          },
        );
      },
    );
  }

  List<Track> _prioritizeFollowedArtists(
    List<Track> tracks,
    Set<String> followedArtists,
  ) {
    if (followedArtists.isEmpty) return tracks;
    final copy = [...tracks];
    copy.sort((a, b) {
      final aFollowed = followedArtists.contains(a.artist);
      final bFollowed = followedArtists.contains(b.artist);
      if (aFollowed == bFollowed) return 0;
      return aFollowed ? -1 : 1;
    });
    return copy;
  }

  Widget _buildSearchResults(
    BuildContext context,
    ThemeData theme,
    String query,
    AsyncValue<List<String>> artistsAsync,
    AsyncValue<TracksListResponse> tracksAsync,
  ) {
    final normalizedQuery = query.toLowerCase();
    final artists = artistsAsync.maybeWhen(
      data: (items) => items
          .where((artist) => artist.toLowerCase().contains(normalizedQuery))
          .take(4)
          .toList(),
      orElse: () => const <String>[],
    );

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: HomeScreen._cardSoft.withOpacity(0.82),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: HomeScreen._accentCyan.withOpacity(0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (artistsAsync.isLoading || tracksAsync.isLoading)
            const LinearProgressIndicator(
              minHeight: 2,
              color: HomeScreen._accentCyan,
              backgroundColor: Colors.white10,
            ),
          if (artists.isNotEmpty) ...[
            Text(
              'Artistas',
              style: theme.textTheme.titleSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 10),
            ...artists.map(
              (artist) => _SearchResultTile(
                icon: Icons.person_rounded,
                title: artist,
                subtitle: 'Perfil del artista',
                onTap: () {
                  context.push(
                    '${AppRoutes.artist}/${Uri.encodeComponent(artist)}',
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
          ],
          Text(
            'Canciones',
            style: theme.textTheme.titleSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 10),
          tracksAsync.when(
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const Text(
              'No se pudieron buscar canciones.',
              style: TextStyle(color: Colors.white60),
            ),
            data: (response) {
              final tracks = response.tracks;
              if (tracks.isEmpty && artists.isEmpty) {
                return const Text(
                  'No encontramos artistas ni canciones.',
                  style: TextStyle(color: Colors.white60),
                );
              }
              if (tracks.isEmpty) {
                return const Text(
                  'No hay canciones con ese nombre.',
                  style: TextStyle(color: Colors.white60),
                );
              }
              return Column(
                children: List.generate(tracks.length, (index) {
                  final track = tracks[index];
                  return _SearchResultTile(
                    icon: Icons.music_note_rounded,
                    title: track.title,
                    subtitle: track.artist,
                    coverArt: track.coverArt,
                    onTap: () {
                      ref
                          .read(playerControllerProvider.notifier)
                          .playTrackList(tracks, startIndex: index);
                    },
                  );
                }),
              );
            },
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Track card
// ---------------------------------------------------------------------------

class _SongPreviewCard extends StatelessWidget {
  const _SongPreviewCard({
    required this.track,
    required this.isSaved,
    required this.onPlay,
    required this.onFavorite,
    required this.onEqualizer,
  });

  final Track track;
  final bool isSaved;
  final Future<void> Function() onPlay;
  final Future<void> Function() onFavorite;
  final Future<void> Function() onEqualizer;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onPlay,
      borderRadius: BorderRadius.circular(24),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Container(
          width: 158,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF12384A), Color(0xFF0A1B25)],
            ),
            border: Border.all(color: HomeScreen._accentCyan.withOpacity(0.14)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x2200CFFF),
                blurRadius: 18,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (track.coverArt != null && track.coverArt!.isNotEmpty)
                Image.network(
                  track.coverArt!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const _SongIcon(),
                )
              else
                const _SongIcon(),
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withOpacity(0.08),
                      const Color(0xFF071A24).withOpacity(0.86),
                    ],
                    stops: const [0.32, 1],
                  ),
                ),
              ),
              Positioned(
                top: 10,
                left: 10,
                child: _RoundCardAction(
                  icon: isSaved
                      ? Icons.favorite_rounded
                      : Icons.favorite_border_rounded,
                  color: isSaved ? const Color(0xFFFF4F7A) : Colors.white,
                  onTap: onFavorite,
                ),
              ),
              Positioned(
                top: 10,
                right: 10,
                child: _RoundCardAction(
                  icon: Icons.equalizer_rounded,
                  color: HomeScreen._accentCyan,
                  onTap: onEqualizer,
                ),
              ),
              Positioned(
                left: 14,
                right: 14,
                bottom: 14,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      track.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        height: 1.08,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      track.artist,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SearchResultTile extends StatelessWidget {
  const _SearchResultTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.coverArt,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final String? coverArt;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: SizedBox(
                width: 44,
                height: 44,
                child: coverArt != null && coverArt!.isNotEmpty
                    ? Image.network(
                        coverArt!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _SearchFallback(icon),
                      )
                    : _SearchFallback(icon),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.white60, fontSize: 12),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Colors.white38),
          ],
        ),
      ),
    );
  }
}

class _SearchFallback extends StatelessWidget {
  const _SearchFallback(this.icon);

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1E90FF), HomeScreen._accentCyan],
        ),
      ),
      child: Icon(icon, color: Colors.white, size: 24),
    );
  }
}

class _RoundCardAction extends StatelessWidget {
  const _RoundCardAction({
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final Color color;
  final Future<void> Function() onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withOpacity(0.28),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: () {
          onTap();
        },
        child: SizedBox(
          width: 34,
          height: 34,
          child: Icon(icon, color: color, size: 19),
        ),
      ),
    );
  }
}

class _SongIcon extends StatelessWidget {
  const _SongIcon();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.12),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Icon(Icons.graphic_eq_rounded, color: Colors.white),
    );
  }
}

class _SongsLoadMessage extends StatelessWidget {
  const _SongsLoadMessage({required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            message,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: Colors.white54),
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 8),
            TextButton(
              onPressed: onRetry,
              child: const Text(
                'Reintentar',
                style: TextStyle(color: HomeScreen._accentCyan),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _TrackCard extends StatelessWidget {
  const _TrackCard({required this.track, required this.onPlay});

  final Track track;
  final Future<void> Function() onPlay;

  static const Color _primaryBlue = Color(0xFF1E90FF);
  static const Color _accentCyan = Color(0xFF00CFFF);
  static const Color _cardDark = Color(0xFF102734);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: () {
        onPlay();
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: _cardDark.withOpacity(0.92),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(0.06)),
        ),
        child: Row(
          children: [
            // Cover art
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: SizedBox(
                width: 56,
                height: 56,
                child: track.coverArt != null && track.coverArt!.isNotEmpty
                    ? Image.network(
                        track.coverArt!,
                        fit: BoxFit.cover,
                        errorBuilder: (ctx, err, st) => _coverPlaceholder(),
                      )
                    : _coverPlaceholder(),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    track.title,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    track.artist,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.white60,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (track.album.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      track.album,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.white38,
                        fontSize: 11,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            Text(
              _formatDuration(track.durationMs),
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.white60),
            ),
            IconButton(
              onPressed: onPlay,
              icon: const Icon(Icons.play_circle_fill_rounded),
              color: _accentCyan,
            ),
          ],
        ),
      ),
    );
  }

  Widget _coverPlaceholder() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [_primaryBlue, _accentCyan],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Icon(Icons.music_note_rounded, color: Colors.white),
    );
  }

  String _formatDuration(int ms) {
    final total = ms ~/ 1000;
    final minutes = total ~/ 60;
    final seconds = total % 60;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }
}

// ---------------------------------------------------------------------------
// Shared widgets
// ---------------------------------------------------------------------------

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.onSeeAll});

  final String title;
  final VoidCallback onSeeAll;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
        ),
        TextButton(
          onPressed: onSeeAll,
          child: const Text(
            'Ver todo',
            style: TextStyle(
              color: HomeScreen._accentCyan,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}
