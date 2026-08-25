import 'package:flutter/material.dart';
import 'package:flutter_chrome_cast/entities.dart';
import 'package:musicflow_mobile/core/cast/cast_service.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';

/// Shows the devices discovered by the Google Cast SDK on the local network.
///
/// This avoids creating a temporary native [MediaRouteButton], which requires
/// an AppCompat theme and crashed when Flutter's activity used a transparent
/// background. Discovery and the Cast session are still fully native.
Future<bool> showCastDevicePicker(BuildContext context) async {
  final cast = CastService.instance;
  await cast.startDiscovery();
  if (!context.mounted) {
    await cast.stopDiscovery();
    return false;
  }

  try {
    return await showModalBottomSheet<bool>(
          context: context,
          backgroundColor: Colors.transparent,
          isScrollControlled: true,
          builder: (_) => _CastDevicePicker(cast: cast),
        ) ??
        false;
  } finally {
    await cast.stopDiscovery();
  }
}

class _CastDevicePicker extends StatefulWidget {
  const _CastDevicePicker({required this.cast});

  final CastService cast;

  @override
  State<_CastDevicePicker> createState() => _CastDevicePickerState();
}

class _CastDevicePickerState extends State<_CastDevicePicker> {
  String? _connectingDeviceId;
  String? _error;

  Future<void> _connect(GoogleCastDevice device) async {
    if (_connectingDeviceId != null) return;
    setState(() {
      _connectingDeviceId = device.deviceID;
      _error = null;
    });

    try {
      final connected = await widget.cast.connect(device);
      if (!mounted) return;
      if (connected) {
        Navigator.of(context).pop(true);
      } else {
        setState(() {
          _error = 'No se pudo conectar con ${device.friendlyName}.';
          _connectingDeviceId = null;
        });
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'No se pudo conectar con ${device.friendlyName}.';
        _connectingDeviceId = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return SafeArea(
      top: false,
      child: Container(
        constraints: const BoxConstraints(maxHeight: 460),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(top: BorderSide(color: colors.border)),
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 38,
                  height: 4,
                  decoration: BoxDecoration(
                    color: colors.textMuted.withValues(alpha: 0.45),
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: colors.primary.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.cast_rounded, color: colors.primary),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Transmitir a',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    tooltip: 'Cerrar',
                    icon: const Icon(Icons.close_rounded),
                    color: Colors.white70,
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Dispositivos disponibles en tu red Wi-Fi',
                style: TextStyle(color: colors.textMuted),
              ),
              if (_error != null) ...[
                const SizedBox(height: 14),
                Text(
                  _error!,
                  style: const TextStyle(
                    color: Color(0xFFFF7895),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
              const SizedBox(height: 14),
              Expanded(
                child: StreamBuilder<List<GoogleCastDevice>>(
                  stream: widget.cast.devices,
                  initialData: const [],
                  builder: (context, snapshot) {
                    final devices = snapshot.data ?? const [];
                    if (devices.isEmpty) {
                      return _SearchingForDevices(colors: colors);
                    }
                    return ListView.separated(
                      padding: EdgeInsets.zero,
                      itemCount: devices.length,
                      separatorBuilder: (_, _) => Divider(
                        color: colors.border.withValues(alpha: 0.65),
                        height: 1,
                      ),
                      itemBuilder: (context, index) {
                        final device = devices[index];
                        final isConnecting =
                            _connectingDeviceId == device.deviceID;
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 2,
                            vertical: 4,
                          ),
                          leading: Icon(
                            Icons.tv_rounded,
                            color: colors.primary,
                            size: 29,
                          ),
                          title: Text(
                            device.friendlyName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          subtitle: Text(
                            device.modelName ?? 'Dispositivo Google Cast',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(color: colors.textMuted),
                          ),
                          trailing: isConnecting
                              ? SizedBox(
                                  height: 22,
                                  width: 22,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2.5,
                                    color: colors.primary,
                                  ),
                                )
                              : Icon(
                                  Icons.chevron_right_rounded,
                                  color: colors.textMuted,
                                ),
                          onTap: isConnecting ? null : () => _connect(device),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SearchingForDevices extends StatelessWidget {
  const _SearchingForDevices({required this.colors});

  final MusicFlowThemeColors colors;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 28,
            height: 28,
            child: CircularProgressIndicator(
              color: colors.primary,
              strokeWidth: 2.5,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Buscando dispositivos...',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          Text(
            'Verifica que el televisor y el teléfono usen la misma red Wi-Fi.',
            textAlign: TextAlign.center,
            style: TextStyle(color: colors.textMuted),
          ),
        ],
      ),
    );
  }
}
