import 'package:flutter/material.dart';
import 'package:musicflow_mobile/core/theme/musicflow_palettes.dart';

class MusicFlowThemeColors extends ThemeExtension<MusicFlowThemeColors> {
  const MusicFlowThemeColors({
    required this.background,
    required this.surface,
    required this.surfaceAlt,
    required this.primary,
    required this.secondary,
    required this.textMuted,
    required this.gradientStart,
    required this.gradientEnd,
    required this.cardGradientStart,
    required this.cardGradientEnd,
    required this.border,
    required this.shadow,
  });

  final Color background;
  final Color surface;
  final Color surfaceAlt;
  final Color primary;
  final Color secondary;
  final Color textMuted;
  final Color gradientStart;
  final Color gradientEnd;
  final Color cardGradientStart;
  final Color cardGradientEnd;
  final Color border;
  final Color shadow;

  factory MusicFlowThemeColors.fromPalette(MusicFlowPalette palette) {
    return MusicFlowThemeColors(
      background: palette.background,
      surface: palette.surface,
      surfaceAlt: palette.surfaceAlt,
      primary: palette.primary,
      secondary: palette.secondary,
      textMuted: palette.textMuted,
      gradientStart: palette.gradientStart,
      gradientEnd: palette.gradientEnd,
      cardGradientStart: palette.cardGradientStart,
      cardGradientEnd: palette.cardGradientEnd,
      border: palette.border,
      shadow: palette.shadow,
    );
  }

  @override
  MusicFlowThemeColors copyWith({
    Color? background,
    Color? surface,
    Color? surfaceAlt,
    Color? primary,
    Color? secondary,
    Color? textMuted,
    Color? gradientStart,
    Color? gradientEnd,
    Color? cardGradientStart,
    Color? cardGradientEnd,
    Color? border,
    Color? shadow,
  }) {
    return MusicFlowThemeColors(
      background: background ?? this.background,
      surface: surface ?? this.surface,
      surfaceAlt: surfaceAlt ?? this.surfaceAlt,
      primary: primary ?? this.primary,
      secondary: secondary ?? this.secondary,
      textMuted: textMuted ?? this.textMuted,
      gradientStart: gradientStart ?? this.gradientStart,
      gradientEnd: gradientEnd ?? this.gradientEnd,
      cardGradientStart: cardGradientStart ?? this.cardGradientStart,
      cardGradientEnd: cardGradientEnd ?? this.cardGradientEnd,
      border: border ?? this.border,
      shadow: shadow ?? this.shadow,
    );
  }

  @override
  MusicFlowThemeColors lerp(
    ThemeExtension<MusicFlowThemeColors>? other,
    double t,
  ) {
    if (other is! MusicFlowThemeColors) return this;
    return MusicFlowThemeColors(
      background: Color.lerp(background, other.background, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceAlt: Color.lerp(surfaceAlt, other.surfaceAlt, t)!,
      primary: Color.lerp(primary, other.primary, t)!,
      secondary: Color.lerp(secondary, other.secondary, t)!,
      textMuted: Color.lerp(textMuted, other.textMuted, t)!,
      gradientStart: Color.lerp(gradientStart, other.gradientStart, t)!,
      gradientEnd: Color.lerp(gradientEnd, other.gradientEnd, t)!,
      cardGradientStart: Color.lerp(
        cardGradientStart,
        other.cardGradientStart,
        t,
      )!,
      cardGradientEnd: Color.lerp(cardGradientEnd, other.cardGradientEnd, t)!,
      border: Color.lerp(border, other.border, t)!,
      shadow: Color.lerp(shadow, other.shadow, t)!,
    );
  }
}

extension MusicFlowThemeX on BuildContext {
  MusicFlowThemeColors get musicFlowColors {
    return Theme.of(this).extension<MusicFlowThemeColors>() ??
        MusicFlowThemeColors.fromPalette(MusicFlowPalettes.allowed.first);
  }
}

abstract final class MusicFlowTheme {
  static ThemeData fromPalette(MusicFlowPalette palette) {
    final appColors = MusicFlowThemeColors.fromPalette(palette);
    final scheme =
        ColorScheme.fromSeed(
          seedColor: palette.primary,
          brightness: Brightness.dark,
        ).copyWith(
          primary: palette.primary,
          secondary: palette.secondary,
          surface: palette.surface,
          onSurface: Colors.white,
        );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: scheme,
      scaffoldBackgroundColor: palette.background,
      extensions: [appColors],
      appBarTheme: AppBarTheme(
        backgroundColor: palette.background,
        foregroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
      ),
      iconTheme: IconThemeData(color: palette.textMuted),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: palette.primary,
        linearTrackColor: palette.surfaceAlt,
      ),
      sliderTheme: SliderThemeData(
        activeTrackColor: palette.primary,
        inactiveTrackColor: palette.surfaceAlt,
        thumbColor: Colors.white,
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          return states.contains(WidgetState.selected)
              ? Colors.white
              : palette.textMuted;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          return states.contains(WidgetState.selected)
              ? palette.primary
              : palette.surfaceAlt;
        }),
      ),
    );
  }
}
