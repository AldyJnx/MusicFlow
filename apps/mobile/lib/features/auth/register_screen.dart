import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/core/config/app_config.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';
import 'package:musicflow_mobile/features/auth/providers/auth_controller.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  static const Color _inputFill = Color(0xFF1C242D);

  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await ref
          .read(authControllerProvider.notifier)
          .register(
            _emailController.text.trim(),
            _usernameController.text.trim(),
            _passwordController.text,
          );
      // Success: GoRouter redirect handles navigation automatically.
    } on DioException catch (e) {
      final data = e.response?.data;
      String message;
      if (e.response == null) {
        message =
            'No se pudo conectar con la API en ${AppConfig.apiBaseUrl}. Verifica que el backend esté activo y que tu teléfono esté en la misma red Wi-Fi.';
      } else if (data is Map && data['message'] != null) {
        final raw = data['message'];
        message = raw is List ? raw.join(', ') : raw.toString();
      } else {
        message = 'No se pudo crear la cuenta';
      }
      if (mounted) {
        setState(() => _errorMessage = message);
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => _errorMessage = 'No pudimos iniciar sesión, intenta de nuevo.',
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = context.musicFlowColors;

    return Scaffold(
      backgroundColor: colors.background,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              colors.gradientStart,
              colors.gradientEnd,
              colors.background,
            ],
            stops: [0.0, 0.24, 0.8],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(18, 56, 18, 42),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(18, 28, 18, 26),
                    decoration: BoxDecoration(
                      color: colors.surface.withValues(alpha: 0.95),
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: Colors.white.withOpacity(0.04)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        RichText(
                          text: TextSpan(
                            style: theme.textTheme.displaySmall?.copyWith(
                              fontWeight: FontWeight.w900,
                              height: 0.95,
                              color: Colors.white,
                            ),
                            children: [
                              const TextSpan(text: 'Unete a\nMusic '),
                              TextSpan(
                                text: 'Flow',
                                style: theme.textTheme.displaySmall?.copyWith(
                                  fontWeight: FontWeight.w900,
                                  color: colors.primary,
                                  height: 0.95,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 18),
                        Text(
                          'Sincroniza tu ritmo con la IA mas avanzada y descubre musica sin limites.',
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: Colors.white54,
                            fontWeight: FontWeight.w700,
                            height: 1.45,
                          ),
                        ),
                        const SizedBox(height: 28),
                        _RegisterFieldLabel(text: 'NOMBRE DE USUARIO'),
                        const SizedBox(height: 10),
                        _RegisterInputContainer(
                          child: TextFormField(
                            controller: _usernameController,
                            cursorColor: colors.primary,
                            style: const TextStyle(color: Colors.white),
                            decoration: _inputDecoration(
                              hintText: 'Tu nombre de usuario',
                              prefixIcon: Icons.person_outline_rounded,
                            ),
                            validator: (v) {
                              final username = v?.trim() ?? '';
                              if (username.isEmpty) {
                                return 'Ingresa un nombre de usuario';
                              }
                              if (username.length < 3 || username.length > 30) {
                                return 'Debe tener entre 3 y 30 caracteres';
                              }
                              if (!RegExp(
                                r'^[a-zA-Z0-9_-]+$',
                              ).hasMatch(username)) {
                                return 'Solo letras, números, guion y guion bajo';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(height: 22),
                        _RegisterFieldLabel(text: 'EMAIL'),
                        const SizedBox(height: 10),
                        _RegisterInputContainer(
                          child: TextFormField(
                            controller: _emailController,
                            cursorColor: colors.primary,
                            keyboardType: TextInputType.emailAddress,
                            style: const TextStyle(color: Colors.white),
                            decoration: _inputDecoration(
                              hintText: 'nombre@ejemplo.com',
                              prefixIcon: Icons.mail_outline_rounded,
                            ),
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) {
                                return 'Ingresa tu correo';
                              }
                              if (!RegExp(
                                r'^[^@]+@[^@]+\.[^@]+',
                              ).hasMatch(v.trim())) {
                                return 'Correo inválido';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(height: 22),
                        _RegisterFieldLabel(text: 'CONTRASENA'),
                        const SizedBox(height: 10),
                        _RegisterInputContainer(
                          child: TextFormField(
                            controller: _passwordController,
                            cursorColor: colors.primary,
                            obscureText: _obscurePassword,
                            style: const TextStyle(color: Colors.white),
                            decoration: _inputDecoration(
                              hintText: '••••••••',
                              prefixIcon: Icons.lock_outline_rounded,
                              suffixIcon: IconButton(
                                onPressed: () {
                                  setState(() {
                                    _obscurePassword = !_obscurePassword;
                                  });
                                },
                                icon: Icon(
                                  _obscurePassword
                                      ? Icons.visibility_outlined
                                      : Icons.visibility_off_outlined,
                                  color: Colors.white38,
                                ),
                              ),
                            ),
                            validator: (v) {
                              if (v == null || v.isEmpty) {
                                return 'Ingresa una contraseña';
                              }
                              if (v.length < 8) {
                                return 'La contraseña debe tener al menos 8 caracteres';
                              }
                              if (!RegExp(
                                r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)',
                              ).hasMatch(v)) {
                                return 'Debe incluir mayúscula, minúscula y número';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(height: 22),
                        _RegisterFieldLabel(text: 'CONFIRMAR CONTRASENA'),
                        const SizedBox(height: 10),
                        _RegisterInputContainer(
                          child: TextFormField(
                            controller: _confirmPasswordController,
                            cursorColor: colors.primary,
                            obscureText: _obscureConfirmPassword,
                            style: const TextStyle(color: Colors.white),
                            decoration: _inputDecoration(
                              hintText: '••••••••',
                              prefixIcon: Icons.lock_outline_rounded,
                              suffixIcon: IconButton(
                                onPressed: () {
                                  setState(() {
                                    _obscureConfirmPassword =
                                        !_obscureConfirmPassword;
                                  });
                                },
                                icon: Icon(
                                  _obscureConfirmPassword
                                      ? Icons.visibility_outlined
                                      : Icons.visibility_off_outlined,
                                  color: Colors.white38,
                                ),
                              ),
                            ),
                            validator: (v) {
                              if (v == null || v.isEmpty) {
                                return 'Confirma tu contraseña';
                              }
                              if (v != _passwordController.text) {
                                return 'Las contraseñas no coinciden';
                              }
                              return null;
                            },
                          ),
                        ),
                        if (_errorMessage != null) ...[
                          const SizedBox(height: 16),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0x22FF5A5F),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              _errorMessage!,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFFFF8A8D),
                              ),
                            ),
                          ),
                        ],
                        const SizedBox(height: 30),
                        Container(
                          width: double.infinity,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(999),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x6600CFFF),
                                blurRadius: 22,
                                offset: Offset(0, 10),
                              ),
                            ],
                          ),
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _submit,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: colors.secondary,
                              foregroundColor: colors.background,
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(999),
                                side: BorderSide(
                                  color: colors.shadow.withValues(alpha: 0.45),
                                  width: 2,
                                ),
                              ),
                            ),
                            child: _isLoading
                                ? SizedBox(
                                    width: 22,
                                    height: 22,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      color: colors.background,
                                    ),
                                  )
                                : Text(
                                    'CREAR CUENTA',
                                    style: theme.textTheme.titleMedium
                                        ?.copyWith(
                                          color: colors.background,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: 0.6,
                                        ),
                                  ),
                          ),
                        ),
                        const SizedBox(height: 18),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              '¿Ya tienes cuenta? ',
                              style: theme.textTheme.bodyLarge?.copyWith(
                                color: Colors.white54,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            TextButton(
                              onPressed: () => context.go('/login'),
                              style: TextButton.styleFrom(
                                padding: EdgeInsets.zero,
                                minimumSize: Size.zero,
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              ),
                              child: Text(
                                'Inicia sesion',
                                style: theme.textTheme.bodyLarge?.copyWith(
                                  color: colors.secondary,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 42),
                  Center(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: List.generate(
                        7,
                        (index) => Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: index.isEven ? 3 : 2,
                          height: index.isEven ? 14 : 8,
                          decoration: BoxDecoration(
                            color: colors.primary.withValues(
                              alpha: index == 3 ? 1 : 0.55,
                            ),
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String hintText,
    required IconData prefixIcon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      hintText: hintText,
      hintStyle: const TextStyle(color: Colors.white24),
      prefixIcon: Icon(prefixIcon, color: Colors.white24),
      suffixIcon: suffixIcon,
      border: InputBorder.none,
      contentPadding: const EdgeInsets.symmetric(vertical: 18),
      errorStyle: const TextStyle(color: Color(0xFFFF8A8D), fontSize: 12),
    );
  }
}

class _RegisterFieldLabel extends StatelessWidget {
  const _RegisterFieldLabel({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: Theme.of(context).textTheme.labelLarge?.copyWith(
        color: const Color(0xFF5AD6FF),
        fontWeight: FontWeight.w800,
        letterSpacing: 1.2,
      ),
    );
  }
}

class _RegisterInputContainer extends StatelessWidget {
  const _RegisterInputContainer({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: _RegisterScreenState._inputFill,
        borderRadius: BorderRadius.circular(22),
      ),
      child: child,
    );
  }
}
