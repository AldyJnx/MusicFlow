import 'package:flutter/foundation.dart';

/// Configuration constants and environment-resolved values for the mobile app.
class AppConfig {
  AppConfig._();

  // Use the host machine's LAN IP by default so a physical Android phone can
  // reach the local backend. For Android emulator, override with:
  // --dart-define=API_BASE_URL=http://10.0.2.2:8000/api
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000/api',
  );

  // Store billing is intentionally disabled until Google Play Billing and
  // StoreKit are integrated. Never route mobile purchases through web Stripe.
  static const bool billingEnabled = bool.fromEnvironment(
    'MOBILE_BILLING_ENABLED',
    defaultValue: false,
  );

  static const String r2AudioPublicBase = String.fromEnvironment(
    'R2_AUDIO_PUBLIC_BASE',
    defaultValue: 'https://pub-f44a489bc1e94270836132b3136f0a8c.r2.dev',
  );

  static const String r2ImagesPublicBase = String.fromEnvironment(
    'R2_IMAGES_PUBLIC_BASE',
    defaultValue: 'https://pub-7f3d08bcabf44d68b2a57424acfc9d48.r2.dev',
  );

  // Cast Application IDs are public client identifiers, not secrets. The
  // debug fallback keeps local device launches working when VS Code is started
  // without the development dart-define file. Release builds default to the
  // published MusicFlow receiver, while CI can still override the value.
  // Google's Default Media Receiver lets local builds discover and cast to
  // devices on the LAN without registering every test TV in our console.
  static const String _debugCastReceiverAppId = 'CC1AD845';
  static const String _productionCastReceiverAppId = '47AE1B10';
  static const String _configuredCastReceiverAppId = String.fromEnvironment(
    'CAST_RECEIVER_APP_ID',
    defaultValue: '',
  );

  static String get castReceiverAppId {
    if (_configuredCastReceiverAppId.isNotEmpty) {
      return _configuredCastReceiverAppId;
    }
    return kDebugMode ? _debugCastReceiverAppId : _productionCastReceiverAppId;
  }

  static bool get isCastConfigured => castReceiverAppId.isNotEmpty;

  // Web OAuth client ID of the MusicFlow Google Cloud project. It is a public
  // identifier, so it is safe to ship inside the binary. Google issues the ID
  // token of a native sign-in with this value as its `aud`, which is why the
  // backend allow-lists it as GOOGLE_MOBILE_AUDIENCES.
  static const String googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    // OAuth client IDs identify an application; they are not secrets. Keeping
    // this checked-in value makes the native button and token flow work in
    // debug *and release* when an IDE does not forward development.json.
    // Deployments can still override it with GOOGLE_WEB_CLIENT_ID.
    defaultValue:
        '543837527956-scf3lh11ijv1bl8j4usk89i723irmpbd.apps.googleusercontent.com',
  );

  static bool get isGoogleSignInConfigured => googleWebClientId.isNotEmpty;
}
