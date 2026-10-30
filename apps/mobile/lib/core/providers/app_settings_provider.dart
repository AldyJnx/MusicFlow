import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/core/notifications/notification_permission_service.dart';
import 'package:musicflow_mobile/core/theme/musicflow_palettes.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppSettingsState {
  const AppSettingsState({
    this.aiAssistantEnabled = true,
    this.notificationsEnabled = false,
    this.themeId = MusicFlowPalettes.defaultId,
    this.lyricsScale = 1.0,
  });

  final bool aiAssistantEnabled;
  final bool notificationsEnabled;
  final String themeId;
  final double lyricsScale;

  MusicFlowPalette get palette => MusicFlowPalettes.byId(themeId);

  AppSettingsState copyWith({
    bool? aiAssistantEnabled,
    bool? notificationsEnabled,
    String? themeId,
    double? lyricsScale,
  }) {
    return AppSettingsState(
      aiAssistantEnabled: aiAssistantEnabled ?? this.aiAssistantEnabled,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      themeId: themeId ?? this.themeId,
      lyricsScale: lyricsScale ?? this.lyricsScale,
    );
  }
}

final appSettingsProvider =
    StateNotifierProvider<AppSettingsController, AppSettingsState>((ref) {
      return AppSettingsController();
    });

class AppSettingsController extends StateNotifier<AppSettingsState> {
  AppSettingsController() : super(const AppSettingsState()) {
    _load();
  }

  static const _aiAssistantEnabledKey = 'ai_assistant_enabled';
  static const _notificationsEnabledKey = 'notifications_enabled';
  static const _themeIdKey = 'theme_id';
  static const _lyricsScaleKey = 'lyrics_scale';
  static const _notifications = NotificationPermissionService();

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final storedNotifications = prefs.getBool(_notificationsEnabledKey);
    final systemNotificationsEnabled = await _notifications
        .areNotificationsEnabled();
    state = state.copyWith(
      aiAssistantEnabled: prefs.getBool(_aiAssistantEnabledKey) ?? true,
      notificationsEnabled:
          (storedNotifications ?? systemNotificationsEnabled) &&
          systemNotificationsEnabled,
      themeId: prefs.getString(_themeIdKey) ?? MusicFlowPalettes.defaultId,
      lyricsScale: (prefs.getDouble(_lyricsScaleKey) ?? 1.0).clamp(0.85, 1.25),
    );
  }

  Future<void> setAiAssistantEnabled(bool value) async {
    state = state.copyWith(aiAssistantEnabled: value);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_aiAssistantEnabledKey, value);
  }

  Future<bool> setNotificationsEnabled(bool value) async {
    final enabled = value ? await _notifications.requestNotifications() : false;
    state = state.copyWith(notificationsEnabled: enabled);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_notificationsEnabledKey, enabled);
    return enabled;
  }

  Future<void> openNotificationSettings() {
    return _notifications.openNotificationSettings();
  }

  Future<void> setTheme(String themeId) async {
    final safeThemeId = MusicFlowPalettes.byId(themeId).id;
    state = state.copyWith(themeId: safeThemeId);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeIdKey, safeThemeId);
  }

  Future<void> setLyricsScale(double value) async {
    final safeValue = value.clamp(0.85, 1.25).toDouble();
    state = state.copyWith(lyricsScale: safeValue);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble(_lyricsScaleKey, safeValue);
  }
}
