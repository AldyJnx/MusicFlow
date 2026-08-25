import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:musicflow_mobile/app/routes.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';

class HeadphonesTipScreen extends StatefulWidget {
  const HeadphonesTipScreen({super.key});

  @override
  State<HeadphonesTipScreen> createState() => _HeadphonesTipScreenState();
}

class _HeadphonesTipScreenState extends State<HeadphonesTipScreen> {
  @override
  void initState() {
    super.initState();
    Timer(const Duration(milliseconds: 950), () {
      if (mounted) context.go(AppRoutes.home);
    });
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
            stops: const [0, 0.42, 1],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 104,
                  height: 104,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: colors.primary.withValues(alpha: 0.14),
                    boxShadow: [
                      BoxShadow(
                        color: colors.shadow.withValues(alpha: 0.28),
                        blurRadius: 28,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Icon(
                    Icons.headphones_rounded,
                    color: colors.primary,
                    size: 58,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Mejor experiencia\ncon audifonos',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.headlineMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    height: 1.05,
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: 34,
                  height: 34,
                  child: CircularProgressIndicator(
                    color: colors.primary,
                    strokeWidth: 3,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
