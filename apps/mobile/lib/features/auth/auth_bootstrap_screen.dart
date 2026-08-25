import 'package:flutter/material.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';

class AuthBootstrapScreen extends StatelessWidget {
  const AuthBootstrapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return Scaffold(
      backgroundColor: colors.background,
      body: Center(
        child: SizedBox.square(
          dimension: 28,
          child: CircularProgressIndicator(
            color: colors.primary,
            strokeWidth: 2.5,
          ),
        ),
      ),
    );
  }
}
