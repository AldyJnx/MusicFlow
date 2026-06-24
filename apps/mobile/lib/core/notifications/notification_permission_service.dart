import 'package:permission_handler/permission_handler.dart';

class NotificationPermissionService {
  const NotificationPermissionService();

  Future<bool> areNotificationsEnabled() async {
    final status = await Permission.notification.status;
    return status.isGranted || status.isLimited;
  }

  Future<bool> requestNotifications() async {
    final current = await Permission.notification.status;
    if (current.isGranted || current.isLimited) return true;
    if (current.isPermanentlyDenied) return false;

    final next = await Permission.notification.request();
    return next.isGranted || next.isLimited;
  }

  Future<void> openNotificationSettings() {
    return openAppSettings();
  }
}
