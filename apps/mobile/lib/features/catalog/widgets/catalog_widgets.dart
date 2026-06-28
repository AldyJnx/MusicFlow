import 'package:flutter/material.dart';
import 'package:musicflow_mobile/core/theme/musicflow_theme.dart';

/// A network cover with a tinted icon placeholder for missing/broken images.
class CatalogCoverImage extends StatelessWidget {
  const CatalogCoverImage({
    required this.url,
    required this.fallbackIcon,
    super.key,
    this.color,
  });

  final String? url;
  final IconData fallbackIcon;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final bg = color ?? context.musicFlowColors.surfaceAlt;
    final placeholder = Container(
      color: bg,
      child: Icon(fallbackIcon, color: Colors.white24, size: 40),
    );
    if (url == null || url!.isEmpty) return placeholder;
    return Image.network(
      url!,
      fit: BoxFit.cover,
      width: double.infinity,
      height: double.infinity,
      errorBuilder: (_, __, ___) => placeholder,
    );
  }
}

/// A centered status message with an optional retry button.
class CatalogMessage extends StatelessWidget {
  const CatalogMessage({required this.message, super.key, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final colors = context.musicFlowColors;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(color: colors.textMuted),
            ),
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 12),
            TextButton(onPressed: onRetry, child: const Text('Reintentar')),
          ],
        ],
      ),
    );
  }
}
