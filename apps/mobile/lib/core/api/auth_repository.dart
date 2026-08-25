import 'package:dio/dio.dart';
import 'package:musicflow_mobile/core/api/dio_client.dart';
import 'package:musicflow_mobile/shared/models/user.dart';

class AuthRepository {
  AuthRepository(this._client);

  final DioClient _client;

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final res = await _client.dio.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'email': email, 'password': password},
      options: Options(extra: {'skipAuth': true}),
    );
    return AuthSession.fromJson(res.data!);
  }

  Future<AuthSession> register({
    required String email,
    required String username,
    required String password,
  }) async {
    final res = await _client.dio.post<Map<String, dynamic>>(
      '/auth/register',
      data: {'email': email, 'username': username, 'password': password},
      options: Options(extra: {'skipAuth': true}),
    );
    return AuthSession.fromJson(res.data!);
  }

  Future<AuthUser> me() async {
    final res = await _client.dio.get<Map<String, dynamic>>('/auth/me');
    return AuthUser.fromJson(res.data!);
  }

  Future<void> logout() async {
    await _client.dio.post('/auth/logout');
  }

  Future<void> forgotPassword(String email) async {
    await _client.dio.post(
      '/auth/forgot-password',
      data: {'email': email},
      options: Options(extra: {'skipAuth': true}),
    );
  }

  Future<AuthUser> updateProfile({String? username, String? password}) async {
    final res = await _client.dio.patch<Map<String, dynamic>>(
      '/users/me',
      data: {
        if (username != null && username.isNotEmpty) 'username': username,
        if (password != null && password.isNotEmpty) 'password': password,
      },
    );
    return AuthUser.fromJson(res.data!);
  }

  Future<void> deleteAccount() async {
    await _client.dio.delete('/users/me');
  }

  Future<void> completeOnboarding(List<String> artistIds) async {
    await _client.dio.post(
      '/users/me/onboarding',
      data: {'artistIds': artistIds},
    );
  }

  Future<List<Map<String, dynamic>>> listFollowedArtists() async {
    final res = await _client.dio.get<List<dynamic>>(
      '/users/me/followed-artists',
    );
    return (res.data ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .toList(growable: false);
  }

  Future<void> recordActivity({
    required String timezone,
    bool? notificationConsent,
  }) async {
    await _client.dio.post(
      '/users/me/activity',
      data: {'timezone': timezone, 'notificationConsent': ?notificationConsent},
    );
  }
}
