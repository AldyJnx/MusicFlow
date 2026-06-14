import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppSettingsState {
  const AppSettingsState({this.aiAssistantEnabled = true});

  final bool aiAssistantEnabled;

  AppSettingsState copyWith({bool? aiAssistantEnabled}) {
    return AppSettingsState(
      aiAssistantEnabled: aiAssistantEnabled ?? this.aiAssistantEnabled,
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

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    state = state.copyWith(
      aiAssistantEnabled: prefs.getBool(_aiAssistantEnabledKey) ?? true,
    );
  }

  Future<void> setAiAssistantEnabled(bool value) async {
    state = state.copyWith(aiAssistantEnabled: value);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_aiAssistantEnabledKey, value);
  }
}
