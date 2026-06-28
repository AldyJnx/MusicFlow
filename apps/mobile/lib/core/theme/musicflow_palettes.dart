import 'package:flutter/material.dart';

class MusicFlowPalette {
  const MusicFlowPalette({
    required this.id,
    required this.name,
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

  final String id;
  final String name;
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
}

abstract final class MusicFlowPalettes {
  static const defaultId = 'default';

  static const allowed = <MusicFlowPalette>[
    MusicFlowPalette(
      id: defaultId,
      name: 'Predeterminado',
      background: Color(0xFF07131A),
      surface: Color(0xFF132A36),
      surfaceAlt: Color(0xFF183746),
      primary: Color(0xFF14E3F7),
      secondary: Color(0xFF2C8DFF),
      textMuted: Color(0xFF9AA7B7),
      gradientStart: Color(0xFF053C4D),
      gradientEnd: Color(0xFF03252F),
      cardGradientStart: Color(0xFF083E4E),
      cardGradientEnd: Color(0xFF06202A),
      border: Color(0x553CCEFF),
      shadow: Color(0x6600CFFF),
    ),
    MusicFlowPalette(
      id: 'cosmos',
      name: 'Cosmos',
      background: Color(0xFF11111C),
      surface: Color(0xFF1B1729),
      surfaceAlt: Color(0xFF26213A),
      primary: Color(0xFF8A5CF6),
      secondary: Color(0xFFE24BBF),
      textMuted: Color(0xFFB7ABC9),
      gradientStart: Color(0xFF8358F1),
      gradientEnd: Color(0xFFE24AB9),
      cardGradientStart: Color(0xFF2D1F4C),
      cardGradientEnd: Color(0xFF1A1329),
      border: Color(0x668A5CF6),
      shadow: Color(0x668A5CF6),
    ),
    MusicFlowPalette(
      id: 'ocean',
      name: 'Oceano',
      background: Color(0xFF06151E),
      surface: Color(0xFF112A38),
      surfaceAlt: Color(0xFF173A4B),
      primary: Color(0xFF308DFF),
      secondary: Color(0xFF58D8F5),
      textMuted: Color(0xFFA5B8C7),
      gradientStart: Color(0xFF328DFF),
      gradientEnd: Color(0xFF59D3EF),
      cardGradientStart: Color(0xFF123D66),
      cardGradientEnd: Color(0xFF0B2538),
      border: Color(0x66308DFF),
      shadow: Color(0x66308DFF),
    ),
    MusicFlowPalette(
      id: 'sunset',
      name: 'Atardecer',
      background: Color(0xFF171117),
      surface: Color(0xFF271A22),
      surfaceAlt: Color(0xFF37222C),
      primary: Color(0xFFFF8452),
      secondary: Color(0xFFFF5471),
      textMuted: Color(0xFFC8A9B1),
      gradientStart: Color(0xFFFF874D),
      gradientEnd: Color(0xFFFF526D),
      cardGradientStart: Color(0xFF4B2630),
      cardGradientEnd: Color(0xFF27141A),
      border: Color(0x66FF8452),
      shadow: Color(0x66FF5471),
    ),
    MusicFlowPalette(
      id: 'forest',
      name: 'Selva',
      background: Color(0xFF071712),
      surface: Color(0xFF122820),
      surfaceAlt: Color(0xFF18362B),
      primary: Color(0xFF3DDB82),
      secondary: Color(0xFF62EAC8),
      textMuted: Color(0xFFA4BDB1),
      gradientStart: Color(0xFF38D878),
      gradientEnd: Color(0xFF5AE8C4),
      cardGradientStart: Color(0xFF143A2A),
      cardGradientEnd: Color(0xFF0B2119),
      border: Color(0x663DDB82),
      shadow: Color(0x663DDB82),
    ),
    MusicFlowPalette(
      id: 'magma',
      name: 'Magma',
      background: Color(0xFF180F12),
      surface: Color(0xFF2A171B),
      surfaceAlt: Color(0xFF3A2023),
      primary: Color(0xFFFF6044),
      secondary: Color(0xFFFF3D61),
      textMuted: Color(0xFFC8A6AA),
      gradientStart: Color(0xFFFF633F),
      gradientEnd: Color(0xFFFF3C61),
      cardGradientStart: Color(0xFF4D211E),
      cardGradientEnd: Color(0xFF281312),
      border: Color(0x66FF6044),
      shadow: Color(0x66FF3D61),
    ),
    MusicFlowPalette(
      id: 'lila',
      name: 'Lila',
      background: Color(0xFF121020),
      surface: Color(0xFF211A32),
      surfaceAlt: Color(0xFF2E2344),
      primary: Color(0xFF9B63FF),
      secondary: Color(0xFFC24BE8),
      textMuted: Color(0xFFBCADC9),
      gradientStart: Color(0xFF9B63FF),
      gradientEnd: Color(0xFFC24BE8),
      cardGradientStart: Color(0xFF332154),
      cardGradientEnd: Color(0xFF211633),
      border: Color(0x669B63FF),
      shadow: Color(0x669B63FF),
    ),
    MusicFlowPalette(
      id: 'ice',
      name: 'Hielo',
      background: Color(0xFF0B121C),
      surface: Color(0xFF172232),
      surfaceAlt: Color(0xFF213149),
      primary: Color(0xFF62D5F4),
      secondary: Color(0xFF8198FF),
      textMuted: Color(0xFFB4C0D6),
      gradientStart: Color(0xFF63D3F0),
      gradientEnd: Color(0xFF8297FF),
      cardGradientStart: Color(0xFF1C3654),
      cardGradientEnd: Color(0xFF121B2A),
      border: Color(0x6662D5F4),
      shadow: Color(0x6662D5F4),
    ),
    MusicFlowPalette(
      id: 'mono',
      name: 'Mono',
      background: Color(0xFF0F1117),
      surface: Color(0xFF1A1D26),
      surfaceAlt: Color(0xFF252936),
      primary: Color(0xFFE2E8F7),
      secondary: Color(0xFFAEB8CF),
      textMuted: Color(0xFFA8AFBE),
      gradientStart: Color(0xFFB9C2D8),
      gradientEnd: Color(0xFFF0F3FA),
      cardGradientStart: Color(0xFF282D38),
      cardGradientEnd: Color(0xFF181B22),
      border: Color(0x66AEB8CF),
      shadow: Color(0x55E2E8F7),
    ),
  ];

  static MusicFlowPalette byId(String id) {
    return allowed.firstWhere(
      (palette) => palette.id == id,
      orElse: () => allowed.first,
    );
  }
}
