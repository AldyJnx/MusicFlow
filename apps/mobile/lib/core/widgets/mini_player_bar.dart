import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/features/player/providers/player_controller.dart';

class MiniPlayerBar extends ConsumerWidget {
  const MiniPlayerBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.musicFlowColors;
    final track = ref.watch(
      playerControllerProvider.select((state) => state.currentTrack),
    );
    final isPlaying = ref.watch(
      playerControllerProvider.select((state) => state.isPlaying),
    );

    if (track == null) {
      return const SizedBox.shrink();
    }

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(18, 0, 18, 8),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {
              if (GoRouterState.of(context).uri.path != AppRoutes.nowPlaying) {
                context.push(AppRoutes.nowPlaying);
              }
            },
            borderRadius: BorderRadius.circular(22),
            child: Container(
              height: 64,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: BoxDecoration(
                color: colors.surface.withValues(alpha: 0.98),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: colors.border),
                boxShadow: [
                  BoxShadow(
                    color: colors.shadow.withValues(alpha: 0.28),
                    blurRadius: 20,
                    offset: Offset(0, 10),
                  ),
                ],
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: SizedBox(
                      width: 46,
                      height: 46,
                      child:
                          track.coverArt != null && track.coverArt!.isNotEmpty
                          ? Image.network(
                              track.coverArt!,
                              fit: BoxFit.cover,
                              cacheWidth: 96,
                              cacheHeight: 96,
                              filterQuality: FilterQuality.low,
                              errorBuilder: (_, _, _) =>
                                  const _MiniCoverPlaceholder(),
                            )
                          : const _MiniCoverPlaceholder(),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: SizedBox(
                      height: 46,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'MusicFlow',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: colors.primary,
                              fontSize: 11,
                              height: 1,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.4,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            track.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12.5,
                              height: 1.05,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 1),
                          Text(
                            track.artist,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white60,
                              fontSize: 10.5,
                              height: 1,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: colors.primary,
                    ),
                    child: IconButton(
                      padding: EdgeInsets.zero,
                      onPressed: () => ref
                          .read(playerControllerProvider.notifier)
                          .togglePlay(),
                      icon: Icon(
                        isPlaying
                            ? Icons.pause_rounded
                            : Icons.play_arrow_rounded,
                        color: colors.background,
                      ),
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
}

class _MiniCoverPlaceholder extends StatelessWidget {
  const _MiniCoverPlaceholder();

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [colors.secondary, colors.primary]),
      ),
      child: const Icon(Icons.music_note_rounded, color: Colors.white),
    );
  }
}
