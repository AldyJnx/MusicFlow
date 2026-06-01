import 'package:flutter/material.dart';

class PaymentMethodsScreen extends StatefulWidget {
  const PaymentMethodsScreen({super.key});

  @override
  State<PaymentMethodsScreen> createState() => _PaymentMethodsScreenState();
}

class _PaymentMethodsScreenState extends State<PaymentMethodsScreen> {
  static const Color _bg = Color(0xFF08111A);
  static const Color _surface = Color(0xFF171C23);
  static const Color _accent = Color(0xFF35D8FF);
  static const Color _text = Colors.white;
  static const Color _muted = Color(0xFF98A0AE);

  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(22, 10, 22, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withOpacity(0.05),
                    ),
                    child: IconButton(
                      onPressed: () => Navigator.of(context).maybePop(),
                      icon: const Icon(
                        Icons.arrow_back_ios_new_rounded,
                        color: _text,
                        size: 18,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Text(
                    'Métodos de Pago',
                    style: TextStyle(
                      color: _accent,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 54),
              const Text(
                'SELECCIONA UN MÉTODO',
                style: TextStyle(
                  color: Color(0xFFD2D8E2),
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 22),
              _PaymentOptionCard(
                selected: _selectedIndex == 0,
                leading: const _CircleIconBadge(
                  background: Color(0xFF18E57A),
                  icon: Icons.arrow_forward_rounded,
                  iconColor: Color(0xFF032317),
                ),
                title: 'Link (Stripe)',
                subtitle: 'Pago rápido y seguro en un clic',
                trailingBadge: '-10%',
                onTap: () => setState(() => _selectedIndex = 0),
              ),
              const SizedBox(height: 16),
              _PaymentOptionCard(
                selected: _selectedIndex == 1,
                leading: const _CircleIconBadge(
                  background: Color(0xFF1A2230),
                  icon: Icons.credit_card_rounded,
                  iconColor: Color(0xFF2D8CFF),
                ),
                title: 'Visa',
                subtitle: 'Terminada en **** 4242',
                onTap: () => setState(() => _selectedIndex = 1),
              ),
              const SizedBox(height: 16),
              _PaymentOptionCard(
                selected: _selectedIndex == 2,
                leading: const _CircleIconBadge(
                  background: Color(0xFF1A2230),
                  icon: Icons.payments_rounded,
                  iconColor: Color(0xFFFF9C2E),
                ),
                title: 'Mastercard',
                subtitle: 'Terminada en **** 8899',
                onTap: () => setState(() => _selectedIndex = 2),
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(999),
                    gradient: const LinearGradient(
                      colors: [Color(0xFF17CFFF), Color(0xFF73D8FF)],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x4417CFFF),
                        blurRadius: 18,
                        offset: Offset(0, 8),
                      ),
                    ],
                  ),
                  child: TextButton(
                    onPressed: () {},
                    style: TextButton.styleFrom(
                      foregroundColor: const Color(0xFF062033),
                      padding: const EdgeInsets.symmetric(vertical: 22),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                    child: const Text(
                      'Continuar con el pago',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 12),
                child: Text(
                  'Tus datos de pago están encriptados y procesados de forma\nsegura según los estándares PCI-DSS.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF6E7683),
                    fontSize: 12,
                    height: 1.45,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PaymentOptionCard extends StatelessWidget {
  const _PaymentOptionCard({
    required this.selected,
    required this.leading,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.trailingBadge,
  });

  final bool selected;
  final Widget leading;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final String? trailingBadge;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
        decoration: BoxDecoration(
          color: _PaymentMethodsScreenState._surface,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(
            color: selected ? _PaymentMethodsScreenState._accent : Colors.transparent,
            width: 1.4,
          ),
          boxShadow: selected
              ? const [
                  BoxShadow(
                    color: Color(0x2217CFFF),
                    blurRadius: 16,
                    offset: Offset(0, 8),
                  ),
                ]
              : const [],
        ),
        child: Row(
          children: [
            leading,
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          title,
                          style: const TextStyle(
                            color: _PaymentMethodsScreenState._text,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      if (trailingBadge != null) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1F5D73),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            trailingBadge!,
                            style: const TextStyle(
                              color: _PaymentMethodsScreenState._accent,
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: _PaymentMethodsScreenState._muted,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected ? _PaymentMethodsScreenState._accent : Colors.transparent,
                border: Border.all(
                  color: selected ? _PaymentMethodsScreenState._accent : const Color(0xFF4B525F),
                  width: 1.8,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CircleIconBadge extends StatelessWidget {
  const _CircleIconBadge({
    required this.background,
    required this.icon,
    required this.iconColor,
  });

  final Color background;
  final IconData icon;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 46,
      height: 46,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: background,
        boxShadow: const [
          BoxShadow(
            color: Color(0x22000000),
            blurRadius: 8,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Icon(icon, color: iconColor, size: 24),
    );
  }
}
