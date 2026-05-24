import 'package:flutter/material.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  static const Color _bg = Color(0xFF081017);
  static const Color _surface = Color(0xFF141C24);
  static const Color _surfaceAlt = Color(0xFF171F27);
  static const Color _accent = Color(0xFF2FD4FF);
  static const Color _textMuted = Color(0xFF9AA7B7);
  static const Color _trackOff = Color(0xFF2C3440);

  bool _notificationsEnabled = true;
  bool _wifiOnlyDownloads = false;
  bool _assistantEnabled = true;
  String _streamingQuality = 'Alta';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
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
                      color: _accent,
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
                  color: _surface,
                  borderRadius: BorderRadius.circular(26),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 68,
                      height: 68,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: _accent.withOpacity(0.7), width: 2),
                        image: const DecorationImage(
                          image: NetworkImage('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80'),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Alex Nebula',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'PLAN PREMIUM',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: _textMuted,
                              letterSpacing: 0.8,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'VELOCITY',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
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
                value: _notificationsEnabled,
                onChanged: (value) => setState(() => _notificationsEnabled = value),
              ),
              const SizedBox(height: 12),
              _SettingValueTile(
                icon: Icons.hd_rounded,
                title: 'Calidad de Streaming',
                value: _streamingQuality,
                onTap: _cycleStreamingQuality,
              ),
              const SizedBox(height: 12),
              _SettingSwitchTile(
                icon: Icons.wifi_rounded,
                title: 'Descarga solo con Wi-Fi',
                value: _wifiOnlyDownloads,
                onChanged: (value) => setState(() => _wifiOnlyDownloads = value),
              ),
              const SizedBox(height: 28),
              _SectionLabel(title: 'IA Y EXPERIENCIA'),
              const SizedBox(height: 14),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
                decoration: BoxDecoration(
                  color: _surface,
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
                            color: _surfaceAlt,
                          ),
                          child: const Icon(
                            Icons.auto_awesome_rounded,
                            color: _accent,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            'Habilitar Asistente IA',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        _SettingsSwitch(
                          value: _assistantEnabled,
                          onChanged: (value) => setState(() => _assistantEnabled = value),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Padding(
                      padding: const EdgeInsets.only(left: 56),
                      child: Text(
                        'Activa el chatbot inteligente para descubrimientos musicales personalizados y soporte en tiempo real.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: _textMuted,
                          height: 1.45,
                        ),
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

  void _cycleStreamingQuality() {
    const values = ['Baja', 'Media', 'Alta'];
    final currentIndex = values.indexOf(_streamingQuality);
    final next = values[(currentIndex + 1) % values.length];
    setState(() => _streamingQuality = next);
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
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: BoxDecoration(
        color: _SettingsScreenState._surface,
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
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          decoration: BoxDecoration(
            color: _SettingsScreenState._surface,
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
                  color: _SettingsScreenState._accent,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(width: 4),
              const Icon(
                Icons.chevron_right_rounded,
                color: Colors.white60,
              ),
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
    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: _SettingsScreenState._surfaceAlt,
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
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: 50,
        height: 28,
        padding: const EdgeInsets.symmetric(horizontal: 3),
        decoration: BoxDecoration(
          color: value ? _SettingsScreenState._accent : _SettingsScreenState._trackOff,
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
