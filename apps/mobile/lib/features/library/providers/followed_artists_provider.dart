import 'package:flutter_riverpod/flutter_riverpod.dart';

class FollowedArtistsController extends StateNotifier<Set<String>> {
  FollowedArtistsController() : super(<String>{});

  bool isFollowing(String artist) => state.contains(artist);

  void toggle(String artist) {
    final next = {...state};
    if (!next.add(artist)) {
      next.remove(artist);
    }
    state = next;
  }
}

final followedArtistsProvider =
    StateNotifierProvider<FollowedArtistsController, Set<String>>((ref) {
      return FollowedArtistsController();
    });
