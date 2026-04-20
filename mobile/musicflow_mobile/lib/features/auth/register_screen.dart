import 'package:flutter/material.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  static const Color _accentCyan = Color(0xFF00CFFF);
  static const Color _lightBlue = Color(0xFF4FC3F7);
  static const Color _bgDark = Color(0xFF071A24);
  static const Color _bgMid = Color(0xFF0A2230);
  static const Color _bgTop = Color(0xFF0E3447);
  static const Color _cardDark = Color(0xFF11181F);
  static const Color _inputFill = Color(0xFF1C242D);

  bool _obscurePassword = true;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: _bgDark,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [_bgTop, _bgMid, _bgDark],
            stops: [0.0, 0.24, 0.8],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(18, 56, 18, 42),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(18, 28, 18, 26),
                  decoration: BoxDecoration(
                    color: _cardDark.withOpacity(0.95),
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.04),
                    ),
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
                                color: _accentCyan,
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
                      _RegisterFieldLabel(text: 'NOMBRE COMPLETO'),
                      const SizedBox(height: 10),
                      _RegisterInputContainer(
                        child: TextField(
                          cursorColor: _accentCyan,
                          style: const TextStyle(color: Colors.white),
                          decoration: _inputDecoration(
                            hintText: 'Tu nombre',
                            prefixIcon: Icons.person_outline_rounded,
                          ),
                        ),
                      ),
                      const SizedBox(height: 22),
                      _RegisterFieldLabel(text: 'EMAIL'),
                      const SizedBox(height: 10),
                      _RegisterInputContainer(
                        child: TextField(
                          cursorColor: _accentCyan,
                          keyboardType: TextInputType.emailAddress,
                          style: const TextStyle(color: Colors.white),
                          decoration: _inputDecoration(
                            hintText: 'nombre@ejemplo.com',
                            prefixIcon: Icons.mail_outline_rounded,
                          ),
                        ),
                      ),
                      const SizedBox(height: 22),
                      _RegisterFieldLabel(text: 'CONTRASENA'),
                      const SizedBox(height: 10),
                      _RegisterInputContainer(
                        child: TextField(
                          cursorColor: _accentCyan,
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
                        ),
                      ),
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
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _lightBlue,
                            foregroundColor: _bgDark,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(vertical: 20),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(999),
                              side: BorderSide(
                                color: _accentCyan.withOpacity(0.45),
                                width: 2,
                              ),
                            ),
                          ),
                          child: Text(
                            'CREAR CUENTA',
                            style: theme.textTheme.titleMedium?.copyWith(
                              color: _bgDark,
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
                            onPressed: () {},
                            style: TextButton.styleFrom(
                              padding: EdgeInsets.zero,
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: Text(
                              'Inicia sesion',
                              style: theme.textTheme.bodyLarge?.copyWith(
                                color: _lightBlue,
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
                          color: _accentCyan.withOpacity(
                            index == 3 ? 1 : 0.55,
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
    );
  }
}

class _RegisterFieldLabel extends StatelessWidget {
  const _RegisterFieldLabel({
    required this.text,
  });

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
  const _RegisterInputContainer({
    required this.child,
  });

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
