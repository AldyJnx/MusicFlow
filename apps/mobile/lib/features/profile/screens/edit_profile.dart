import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/widgets/app_bottom_navigation.dart';
import 'package:musicflow_mobile/features/auth/providers/auth_controller.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  static const Color _bg = Color(0xFF09111A);
  static const Color _field = Color(0xFF222730);
  static const Color _fieldBorder = Color(0xFF2B313C);
  static const Color _text = Colors.white;
  static const Color _muted = Color(0xFF8D97A8);
  static const Color _label = Color(0xFF98A8D6);
  static const Color _cyan = Color(0xFF35D8FF);
  static const Color _cyanSoft = Color(0xFF73E5FF);
  static const Color _dangerBg = Color(0xFF2A1118);
  static const Color _dangerText = Color(0xFFFF4F61);
  static const Color _divider = Color(0x1FFFFFFF);

  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  String _initialUsername = '';
  bool _initialized = false;
  bool _showPassword = false;
  bool _isSaving = false;
  bool _isDeleting = false;
  String? _message;

  bool get _hasChanges {
    return _usernameController.text.trim() != _initialUsername ||
        _passwordController.text.isNotEmpty;
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _syncControllersFromUser() {
    if (_initialized) return;
    final user = ref.read(authControllerProvider).user;
    if (user == null) return;
    _initialUsername = user.username;
    _usernameController.text = user.username;
    _emailController.text = user.email;
    _initialized = true;
  }

  Future<void> _save() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text;

    if (username.length < 3 || username.length > 30) {
      setState(() => _message = 'El usuario debe tener entre 3 y 30 caracteres.');
      return;
    }
    if (!RegExp(r'^[a-zA-Z0-9_-]+$').hasMatch(username)) {
      setState(() => _message = 'El usuario solo permite letras, numeros, guion y guion bajo.');
      return;
    }
    if (password.isNotEmpty &&
        !RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)').hasMatch(password)) {
      setState(() => _message = 'La nueva contrasena debe incluir mayuscula, minuscula y numero.');
      return;
    }

    setState(() {
      _isSaving = true;
      _message = null;
    });

    try {
      await ref.read(authControllerProvider.notifier).updateProfile(
            username: username == _initialUsername ? null : username,
            password: password.isEmpty ? null : password,
          );
      if (!mounted) return;
      setState(() {
        _initialUsername = username;
        _passwordController.clear();
        _message = 'Perfil actualizado.';
      });
    } on DioException catch (e) {
      final data = e.response?.data;
      final raw = data is Map ? data['message'] : null;
      setState(() => _message = raw?.toString() ?? 'No se pudo actualizar el perfil.');
    } catch (_) {
      setState(() => _message = 'No se pudo actualizar el perfil.');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _confirmDeleteAccount() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF121A21),
        title: const Text(
          'Eliminar cuenta',
          style: TextStyle(color: _text, fontWeight: FontWeight.w800),
        ),
        content: const Text(
          'Seguro que deseas eliminar la cuenta?',
          style: TextStyle(color: _muted, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar', style: TextStyle(color: _cyan)),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text(
              'Eliminar',
              style: TextStyle(color: _dangerText),
            ),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _isDeleting = true;
      _message = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).deleteAccount();
    } catch (_) {
      if (mounted) {
        setState(() {
          _isDeleting = false;
          _message = 'No se pudo eliminar la cuenta.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    _syncControllersFromUser();
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      backgroundColor: _bg,
      bottomNavigationBar: const AppBottomNavigation(
        currentRoute: AppRoutes.profile,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 8),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).maybePop(),
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, color: _text, size: 22),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                  ),
                  const SizedBox(width: 6),
                  const Expanded(
                    child: Text(
                      'Editar Perfil',
                      style: TextStyle(
                        color: _text,
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    decoration: BoxDecoration(
                      color: _hasChanges ? _cyan : const Color(0xFF2B3340),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: TextButton(
                      onPressed: _hasChanges && !_isSaving ? _save : null,
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 10),
                        foregroundColor: const Color(0xFF07111B),
                        disabledForegroundColor: const Color(0xFF97A0B0),
                      ),
                      child: Text(
                        _isSaving ? 'Guardando...' : 'Guardar',
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 10, 24, 28),
                child: Column(
                  children: [
                    const SizedBox(height: 8),
                    _Avatar(user?.avatar),
                    const SizedBox(height: 14),
                    const Text(
                      'CAMBIAR FOTO',
                      style: TextStyle(
                        color: _cyan,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.4,
                      ),
                    ),
                    const SizedBox(height: 30),
                    _ProfileField(
                      label: 'NOMBRE DE USUARIO',
                      controller: _usernameController,
                      icon: Icons.person_outline_rounded,
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 22),
                    _ProfileField(
                      label: 'CORREO ELECTRONICO',
                      controller: _emailController,
                      icon: Icons.mail_outline_rounded,
                      keyboardType: TextInputType.emailAddress,
                      readOnly: true,
                    ),
                    const SizedBox(height: 22),
                    _ProfileField(
                      label: 'NUEVA CONTRASENA',
                      controller: _passwordController,
                      icon: Icons.lock_outline_rounded,
                      obscureText: !_showPassword,
                      onChanged: (_) => setState(() {}),
                      trailing: IconButton(
                        onPressed: () => setState(() => _showPassword = !_showPassword),
                        icon: Icon(
                          _showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          color: _muted,
                        ),
                      ),
                    ),
                    if (_message != null) ...[
                      const SizedBox(height: 18),
                      Text(
                        _message!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: _cyanSoft, fontWeight: FontWeight.w700),
                      ),
                    ],
                    const SizedBox(height: 32),
                    Container(height: 1, width: double.infinity, color: _divider),
                    const SizedBox(height: 24),
                    InkWell(
                      onTap: _isDeleting ? null : _confirmDeleteAccount,
                      borderRadius: BorderRadius.circular(999),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                        decoration: BoxDecoration(
                          color: _dangerBg,
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: const Color(0x22FF4F61)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.disabled_by_default_rounded, color: _dangerText, size: 20),
                            const SizedBox(width: 10),
                            Text(
                              _isDeleting ? 'Eliminando cuenta...' : 'Eliminar cuenta',
                              style: const TextStyle(
                                color: _dangerText,
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    const Text(
                      'Esta accion desactiva tu cuenta y cerrara tu sesion.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Color(0xFF9BA5B4),
                        fontSize: 13.5,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar(this.avatar);

  final String? avatar;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: 126,
          height: 126,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: _EditProfileScreenState._cyanSoft, width: 4),
            boxShadow: const [
              BoxShadow(
                color: Color(0x3300CFFF),
                blurRadius: 18,
                offset: Offset(0, 8),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: avatar != null && avatar!.isNotEmpty
              ? Image.network(
                  avatar!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const _AvatarFallback(),
                )
              : const _AvatarFallback(),
        ),
        Positioned(
          right: -2,
          bottom: 8,
          child: Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: _EditProfileScreenState._cyanSoft,
              shape: BoxShape.circle,
              border: Border.all(color: _EditProfileScreenState._bg, width: 3),
            ),
            child: const Icon(Icons.photo_camera_outlined, color: _EditProfileScreenState._bg, size: 22),
          ),
        ),
      ],
    );
  }
}

class _AvatarFallback extends StatelessWidget {
  const _AvatarFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF17232D),
      child: const Icon(Icons.person_rounded, color: Colors.white70, size: 72),
    );
  }
}

class _ProfileField extends StatelessWidget {
  const _ProfileField({
    required this.label,
    required this.controller,
    required this.icon,
    this.keyboardType,
    this.obscureText = false,
    this.trailing,
    this.readOnly = false,
    this.onChanged,
  });

  final String label;
  final TextEditingController controller;
  final IconData icon;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? trailing;
  final bool readOnly;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: _EditProfileScreenState._label,
            fontSize: 13,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.4,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: readOnly ? _EditProfileScreenState._field.withOpacity(0.55) : _EditProfileScreenState._field,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: _EditProfileScreenState._fieldBorder),
          ),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            obscureText: obscureText,
            readOnly: readOnly,
            onChanged: onChanged,
            style: TextStyle(
              color: readOnly ? _EditProfileScreenState._muted : _EditProfileScreenState._text,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
            decoration: InputDecoration(
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
              prefixIcon: Icon(icon, color: _EditProfileScreenState._muted),
              suffixIcon: trailing,
            ),
          ),
        ),
      ],
    );
  }
}
