import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/providers/providers.dart';
import 'package:musicflow_mobile/shared/models/user.dart';

class AuthState {
  const AuthState({
    this.user,
    this.isInitializing = true,
  });

  final AuthUser? user;
  final bool isInitializing;

  bool get isAuthenticated => user != null;

  AuthState copyWith({AuthUser? user, bool? isInitializing, bool clearUser = false}) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isInitializing: isInitializing ?? this.isInitializing,
    );
  }
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._ref) : super(const AuthState()) {
    _bootstrap();
  }

  final Ref _ref;

  Future<void> _bootstrap() async {
    final storage = _ref.read(tokenStorageProvider);
    final token = await storage.readAccessToken();
    if (token == null) {
      state = state.copyWith(isInitializing: false, clearUser: true);
      return;
    }
    try {
      final user = await _ref.read(authRepositoryProvider).me();
      state = AuthState(user: user, isInitializing: false);
    } catch (_) {
      await storage.clear();
      state = state.copyWith(isInitializing: false, clearUser: true);
    }
  }

  Future<void> login(String email, String password) async {
    final repo = _ref.read(authRepositoryProvider);
    final session = await repo.login(email: email, password: password);
    await _ref.read(tokenStorageProvider).saveTokens(
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        );
    state = AuthState(user: session.user, isInitializing: false);
  }

  Future<void> register(String email, String username, String password) async {
    final repo = _ref.read(authRepositoryProvider);
    final session = await repo.register(
      email: email,
      username: username,
      password: password,
    );
    await _ref.read(tokenStorageProvider).saveTokens(
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        );
    state = AuthState(user: session.user, isInitializing: false);
  }

  Future<void> logout() async {
    try {
      await _ref.read(authRepositoryProvider).logout();
    } catch (_) {
      // ignore network errors during logout
    }
    await _ref.read(tokenStorageProvider).clear();
    state = state.copyWith(clearUser: true, isInitializing: false);
  }

  Future<void> updateProfile({
    String? username,
    String? password,
  }) async {
    final user = await _ref.read(authRepositoryProvider).updateProfile(
          username: username,
          password: password,
        );
    state = state.copyWith(user: user, isInitializing: false);
  }

  Future<void> deleteAccount() async {
    await _ref.read(authRepositoryProvider).deleteAccount();
    await _ref.read(tokenStorageProvider).clear();
    state = state.copyWith(clearUser: true, isInitializing: false);
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref);
});
