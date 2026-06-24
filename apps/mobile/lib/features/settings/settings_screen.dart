import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/providers/app_settings_provider.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/features/auth/providers/auth_controller.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  static const Color _trackOff = Color(0xFF2C3440);

  bool _wifiOnlyDownloads = false;

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authControllerProvider).user;
    final settings = ref.watch(appSettingsProvider);
    final colors = context.musicFlowColors;
    final username = user?.username ?? 'MusicFlow';
    final plan = user?.isPremium == true ? 'PLAN PREMIUM' : 'PLAN GRATUITO';

    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 26),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).maybePop(),
                    icon: const Icon(Icons.arrow_back_ios_new_rounded),
                    color: Colors.white,
                    splashRadius: 20,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'CONFIGURACIÓN',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: colors.primary,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.8,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 26),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: colors.surface,
                  borderRadius: BorderRadius.circular(26),
                ),
                child: Row(
                  children: [
                    _SettingsAvatar(avatar: user?.avatar),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            username,
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            plan,
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
                                  color: colors.textMuted,
                                  letterSpacing: 0.8,
                                ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'MUSICFLOW',
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
                                  color: Colors.white,
                                  letterSpacing: 0.8,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              _SectionLabel(title: 'GENERAL'),
              const SizedBox(height: 14),
              _SettingSwitchTile(
                icon: Icons.notifications_none_rounded,
                title: 'Notificaciones',
                value: settings.notificationsEnabled,
                onChanged: (value) async {
                  final enabled = await ref
                      .read(appSettingsProvider.notifier)
                      .setNotificationsEnabled(value);
                  if (!context.mounted || enabled || !value) return;
                  ScaffoldMessenger.of(context)
                    ..hideCurrentSnackBar()
                    ..showSnackBar(
                      SnackBar(
                        content: const Text(
                          'Activa las notificaciones desde la configuracion del sistema.',
                        ),
                        action: SnackBarAction(
                          label: 'Abrir',
                          onPressed: () => ref
                              .read(appSettingsProvider.notifier)
                              .openNotificationSettings(),
                        ),
                      ),
                    );
                },
              ),
              const SizedBox(height: 12),
              _SettingValueTile(
                icon: Icons.palette_outlined,
                title: 'Temas',
                value: settings.palette.name,
                onTap: () => context.push(AppRoutes.themes),
              ),
              const SizedBox(height: 12),
              _SettingSwitchTile(
                icon: Icons.wifi_rounded,
                title: 'Descarga solo con Wi-Fi',
                value: _wifiOnlyDownloads,
                onChanged: (value) =>
                    setState(() => _wifiOnlyDownloads = value),
              ),
              const SizedBox(height: 28),
              _SectionLabel(title: 'IA Y EXPERIENCIA'),
              const SizedBox(height: 14),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
                decoration: BoxDecoration(
                  color: colors.surface,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: colors.surfaceAlt,
                          ),
                          child: Icon(
                            Icons.auto_awesome_rounded,
                            color: colors.primary,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            'Habilitar Asistente IA',
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                        ),
                        _SettingsSwitch(
                          value: settings.aiAssistantEnabled,
                          onChanged: (value) => ref
                              .read(appSettingsProvider.notifier)
                              .setAiAssistantEnabled(value),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Padding(
                      padding: const EdgeInsets.only(left: 56),
                      child: Text(
                        'Activa el chatbot inteligente para descubrimientos musicales personalizados y soporte en tiempo real.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colors.textMuted,
                          height: 1.45,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              _SettingValueTile(
                icon: Icons.equalizer_rounded,
                title: 'Ecualización Automática',
                value: '',
                onTap: () => context.push(AppRoutes.equalizer),
              ),
              const SizedBox(height: 28),
              _SectionLabel(title: 'CUENTA'),
              const SizedBox(height: 14),
              _SettingValueTile(
                icon: Icons.lock_outline_rounded,
                title: 'Privacidad',
                value: '',
                onTap: () {},
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: Theme.of(context).textTheme.labelLarge?.copyWith(
        color: const Color(0xFFC9D2DE),
        fontWeight: FontWeight.w800,
        letterSpacing: 2.2,
      ),
    );
  }
}

class _SettingsAvatar extends StatelessWidget {
  const _SettingsAvatar({required this.avatar});

  final String? avatar;

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    final hasAvatar = avatar != null && avatar!.trim().isNotEmpty;

    return Container(
      width: 68,
      height: 68,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: colors.primary.withValues(alpha: 0.7),
          width: 2,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: hasAvatar
          ? Image.network(
              avatar!,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) =>
                  const _SettingsAvatarFallback(),
            )
          : const _SettingsAvatarFallback(),
    );
  }
}

class _SettingsAvatarFallback extends StatelessWidget {
  const _SettingsAvatarFallback();

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return Container(
      color: colors.surfaceAlt,
      child: const Icon(Icons.person_rounded, color: Colors.white70, size: 36),
    );
  }
}

class _SettingSwitchTile extends StatelessWidget {
  const _SettingSwitchTile({
    required this.icon,
    required this.title,
    required this.value,
    required this.onChanged,
  });

  final IconData icon;
  final String title;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Row(
        children: [
          _LeadingIcon(icon: icon),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          _SettingsSwitch(value: value, onChanged: onChanged),
        ],
      ),
    );
  }
}

class _SettingValueTile extends StatelessWidget {
  const _SettingValueTile({
    required this.icon,
    required this.title,
    required this.value,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(22),
          ),
          child: Row(
            children: [
              _LeadingIcon(icon: icon),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Text(
                value,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: colors.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right_rounded, color: Colors.white60),
            ],
          ),
        ),
      ),
    );
  }
}

class _LeadingIcon extends StatelessWidget {
  const _LeadingIcon({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: colors.surfaceAlt,
      ),
      child: Icon(icon, color: Colors.white70),
    );
  }
}

class _SettingsSwitch extends StatelessWidget {
  const _SettingsSwitch({required this.value, required this.onChanged});

  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: 50,
        height: 28,
        padding: const EdgeInsets.symmetric(horizontal: 3),
        decoration: BoxDecoration(
          color: value ? colors.primary : _SettingsScreenState._trackOff,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Align(
          alignment: value ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            width: 22,
            height: 22,
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
          ),
        ),
      ),
    );
  }
}
