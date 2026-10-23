import 'package:google_sign_in/google_sign_in.dart';
import 'package:musicflow_mobile/core/config/app_config.dart';

/// Raised when Google sign-in cannot be attempted at all, either because the
/// build has no Web client ID or because the platform returned no ID token.
class GoogleSignInUnavailable implements Exception {
  const GoogleSignInUnavailable();
}

/// Raised when the user dismissed the account chooser. The UI shows no error
/// for this case, because it is a deliberate user action.
class GoogleSignInCancelled implements Exception {
  const GoogleSignInCancelled();
}

/// A safe, actionable description of a native Google configuration failure.
/// The plugin can include platform details, so callers must show [message]
/// instead of forwarding its raw exception.
class GoogleSignInFailure implements Exception {
  const GoogleSignInFailure(this.message);

  final String message;

  factory GoogleSignInFailure.fromException(GoogleSignInException error) {
    switch (error.code) {
      case GoogleSignInExceptionCode.clientConfigurationError:
      case GoogleSignInExceptionCode.providerConfigurationError:
        return const GoogleSignInFailure(
          'Google Sign-In necesita registrar la app Android '
          'com.musicflow.app y la huella SHA-1 de esta compilación en Google Cloud.',
        );
      case GoogleSignInExceptionCode.uiUnavailable:
        return const GoogleSignInFailure(
          'Google no puede mostrar el selector de cuenta en este momento. '
          'Vuelve a abrir la aplicación e inténtalo de nuevo.',
        );
      case GoogleSignInExceptionCode.interrupted:
        return const GoogleSignInFailure(
          'El inicio con Google fue interrumpido. Inténtalo de nuevo.',
        );
      case GoogleSignInExceptionCode.userMismatch:
        return const GoogleSignInFailure(
          'La cuenta de Google cambió durante el inicio. Inténtalo nuevamente.',
        );
      case GoogleSignInExceptionCode.unknownError:
        return const GoogleSignInFailure(
          'Google no pudo completar el inicio de sesión. Verifica la conexión '
          'y la configuración OAuth de Android.',
        );
      case GoogleSignInExceptionCode.canceled:
        return const GoogleSignInFailure('El inicio con Google fue cancelado.');
    }
  }
}

/// Wraps the platform "Sign in with Google" SDK.
///
/// Google issues the returned ID token with `aud` set to [serverClientId], so
/// the Web OAuth client ID of the project is what both the web and the mobile
/// clients present to the backend. The Android client (package name + signing
/// SHA) authorises the binary during the native flow and never appears here.
class GoogleSignInService {
  GoogleSignInService({GoogleSignIn? signIn})
    : _signIn = signIn ?? GoogleSignIn.instance;

  final GoogleSignIn _signIn;
  Future<void>? _initialization;

  bool get isConfigured => AppConfig.isGoogleSignInConfigured;

  Future<void> _ensureInitialized() {
    return _initialization ??= _signIn.initialize(
      serverClientId: AppConfig.googleWebClientId,
    );
  }

  /// Runs the native account chooser and returns a signed Google ID token.
  Future<String> requestIdToken() async {
    if (!isConfigured) {
      throw const GoogleSignInUnavailable();
    }

    await _ensureInitialized();

    final GoogleSignInAccount account;
    try {
      account = await _signIn.authenticate();
    } on GoogleSignInException catch (error) {
      if (error.code == GoogleSignInExceptionCode.canceled) {
        throw const GoogleSignInCancelled();
      }
      throw GoogleSignInFailure.fromException(error);
    }

    final idToken = account.authentication.idToken;
    if (idToken == null || idToken.isEmpty) {
      throw const GoogleSignInUnavailable();
    }

    return idToken;
  }

  /// Clears the Google session so a later sign-in asks the user again instead
  /// of silently reusing the cached account.
  Future<void> signOut() async {
    if (!isConfigured) return;
    try {
      await _ensureInitialized();
      await _signIn.signOut();
    } catch (_) {
      // A Google outage must not block logging out of MusicFlow.
    }
  }
}
