import 'package:flutter/material.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/widgets/app_bottom_navigation.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
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

  final String _initialName = 'Leonardo Olortegui';
  final String _initialEmail = 'leonardo@gmail.com';
  final String _initialPhone = '+51 987 654 321';
  final String _initialPassword = '••••••••••••';

  late final TextEditingController _nameController;
  late final TextEditingController _emailController;
  late final TextEditingController _phoneController;
  late final TextEditingController _passwordController;

  bool _showPassword = false;
  bool _hasChanges = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: _initialName)..addListener(_recomputeChanges);
    _emailController = TextEditingController(text: _initialEmail)..addListener(_recomputeChanges);
    _phoneController = TextEditingController(text: _initialPhone)..addListener(_recomputeChanges);
    _passwordController = TextEditingController(text: _initialPassword)..addListener(_recomputeChanges);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _recomputeChanges() {
    final changed = _nameController.text != _initialName ||
        _emailController.text != _initialEmail ||
        _phoneController.text != _initialPhone ||
        _passwordController.text != _initialPassword;

    if (changed != _hasChanges) {
      setState(() {
        _hasChanges = changed;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
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
                      boxShadow: _hasChanges
                          ? const [
                              BoxShadow(
                                color: Color(0x5535D8FF),
                                blurRadius: 16,
                                offset: Offset(0, 6),
                              ),
                            ]
                          : const [],
                    ),
                    child: TextButton(
                      onPressed: _hasChanges ? () {} : null,
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                        foregroundColor: const Color(0xFF07111B),
                        disabledForegroundColor: const Color(0xFF97A0B0),
                      ),
                      child: const Text(
                        'Guardar',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
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
                    Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Container(
                          width: 126,
                          height: 126,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: _cyanSoft, width: 4),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x3300CFFF),
                                blurRadius: 18,
                                offset: Offset(0, 8),
                              ),
                            ],
                            image: const DecorationImage(
                              image: NetworkImage('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80'),
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        Positioned(
                          right: -2,
                          bottom: 8,
                          child: Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: _cyanSoft,
                              shape: BoxShape.circle,
                              border: Border.all(color: _bg, width: 3),
                            ),
                            child: const Icon(Icons.photo_camera_outlined, color: _bg, size: 22),
                          ),
                        ),
                      ],
                    ),
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
                      label: 'NOMBRE COMPLETO',
                      controller: _nameController,
                      icon: Icons.person_outline_rounded,
                    ),
                    const SizedBox(height: 22),
                    _ProfileField(
                      label: 'CORREO ELECTRÓNICO',
                      controller: _emailController,
                      icon: Icons.mail_outline_rounded,
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 22),
                    _ProfileField(
                      label: 'TELÉFONO',
                      controller: _phoneController,
                      icon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 22),
                    _ProfileField(
                      label: 'CONTRASEÑA',
                      controller: _passwordController,
                      icon: Icons.lock_outline_rounded,
                      obscureText: !_showPassword,
                      trailing: IconButton(
                        onPressed: () => setState(() => _showPassword = !_showPassword),
                        icon: Icon(
                          _showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          color: _muted,
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    Container(
                      height: 1,
                      width: double.infinity,
                      color: _divider,
                    ),
                    const SizedBox(height: 24),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                      decoration: BoxDecoration(
                        color: _dangerBg,
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: const Color(0x22FF4F61)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.disabled_by_default_rounded, color: _dangerText, size: 20),
                          SizedBox(width: 10),
                          Text(
                            'Eliminar cuenta',
                            style: TextStyle(
                              color: _dangerText,
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                    const Text(
                      'Esta acción es permanente y eliminará toda tu biblioteca\ny preferencias guardadas.',
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

class _ProfileField extends StatelessWidget {
  const _ProfileField({
    required this.label,
    required this.controller,
    required this.icon,
    this.keyboardType,
    this.obscureText = false,
    this.trailing,
  });

  final String label;
  final TextEditingController controller;
  final IconData icon;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? trailing;

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
            color: _EditProfileScreenState._field,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: _EditProfileScreenState._fieldBorder),
          ),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            obscureText: obscureText,
            style: const TextStyle(
              color: _EditProfileScreenState._text,
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
