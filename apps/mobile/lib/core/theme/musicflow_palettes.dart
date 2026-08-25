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
      background: Color(0xFF11121C),
      surface: Color(0xFF1A1828),
      surfaceAlt: Color(0xFF242136),
      primary: Color(0xFF7D68D8),
      secondary: Color(0xFFC25AA9),
      textMuted: Color(0xFFB5AAC7),
      gradientStart: Color(0xFF2A2448),
      gradientEnd: Color(0xFF3A2544),
      cardGradientStart: Color(0xFF2A2146),
      cardGradientEnd: Color(0xFF181527),
      border: Color(0x557D68D8),
      shadow: Color(0x447D68D8),
    ),
    MusicFlowPalette(
      id: 'ocean',
      name: 'Oceano',
      background: Color(0xFF06151E),
      surface: Color(0xFF112A38),
      surfaceAlt: Color(0xFF173A4B),
      primary: Color(0xFF4B9EE6),
      secondary: Color(0xFF63C2D7),
      textMuted: Color(0xFFA5B8C7),
      gradientStart: Color(0xFF123B55),
      gradientEnd: Color(0xFF164A5A),
      cardGradientStart: Color(0xFF123852),
      cardGradientEnd: Color(0xFF0B2538),
      border: Color(0x554B9EE6),
      shadow: Color(0x444B9EE6),
    ),
    MusicFlowPalette(
      id: 'sunset',
      name: 'Atardecer',
      background: Color(0xFF171117),
      surface: Color(0xFF271A22),
      surfaceAlt: Color(0xFF37222C),
      primary: Color(0xFFE58A61),
      secondary: Color(0xFFD96778),
      textMuted: Color(0xFFC8A9B1),
      gradientStart: Color(0xFF46252A),
      gradientEnd: Color(0xFF51272F),
      cardGradientStart: Color(0xFF432630),
      cardGradientEnd: Color(0xFF27141A),
      border: Color(0x55E58A61),
      shadow: Color(0x44D96778),
    ),
    MusicFlowPalette(
      id: 'forest',
      name: 'Selva',
      background: Color(0xFF071712),
      surface: Color(0xFF122820),
      surfaceAlt: Color(0xFF18362B),
      primary: Color(0xFF57C987),
      secondary: Color(0xFF68CDB5),
      textMuted: Color(0xFFA4BDB1),
      gradientStart: Color(0xFF163A2A),
      gradientEnd: Color(0xFF1C4538),
      cardGradientStart: Color(0xFF163628),
      cardGradientEnd: Color(0xFF0B2119),
      border: Color(0x5557C987),
      shadow: Color(0x4457C987),
    ),
    MusicFlowPalette(
      id: 'magma',
      name: 'Magma',
      background: Color(0xFF180F12),
      surface: Color(0xFF2A171B),
      surfaceAlt: Color(0xFF3A2023),
      primary: Color(0xFFE36B5A),
      secondary: Color(0xFFD85269),
      textMuted: Color(0xFFC8A6AA),
      gradientStart: Color(0xFF4A211F),
      gradientEnd: Color(0xFF4E202B),
      cardGradientStart: Color(0xFF43211F),
      cardGradientEnd: Color(0xFF281312),
      border: Color(0x55E36B5A),
      shadow: Color(0x44D85269),
    ),
    MusicFlowPalette(
      id: 'lila',
      name: 'Lila',
      background: Color(0xFF121020),
      surface: Color(0xFF211A32),
      surfaceAlt: Color(0xFF2E2344),
      primary: Color(0xFF9470D9),
      secondary: Color(0xFFA85FC9),
      textMuted: Color(0xFFBCADC9),
      gradientStart: Color(0xFF2D244B),
      gradientEnd: Color(0xFF38234B),
      cardGradientStart: Color(0xFF2E234C),
      cardGradientEnd: Color(0xFF211633),
      border: Color(0x559470D9),
      shadow: Color(0x449470D9),
    ),
    MusicFlowPalette(
      id: 'ice',
      name: 'Hielo',
      background: Color(0xFF0B121C),
      surface: Color(0xFF172232),
      surfaceAlt: Color(0xFF213149),
      primary: Color(0xFF74C4DD),
      secondary: Color(0xFF879FE0),
      textMuted: Color(0xFFB4C0D6),
      gradientStart: Color(0xFF173047),
      gradientEnd: Color(0xFF202D4E),
      cardGradientStart: Color(0xFF1A314C),
      cardGradientEnd: Color(0xFF121B2A),
      border: Color(0x5574C4DD),
      shadow: Color(0x4474C4DD),
    ),
    MusicFlowPalette(
      id: 'mono',
      name: 'Mono',
      background: Color(0xFF101217),
      surface: Color(0xFF191C24),
      surfaceAlt: Color(0xFF232733),
      primary: Color(0xFFC6CEDD),
      secondary: Color(0xFF9FA9BA),
      textMuted: Color(0xFFA5ADBA),
      gradientStart: Color(0xFF20242D),
      gradientEnd: Color(0xFF303540),
      cardGradientStart: Color(0xFF252A34),
      cardGradientEnd: Color(0xFF171A21),
      border: Color(0x55AEB8CF),
      shadow: Color(0x33C6CEDD),
    ),
  ];

  static MusicFlowPalette byId(String id) {
    return allowed.firstWhere(
      (palette) => palette.id == id,
      orElse: () => allowed.first,
    );
  }
}
