class LyricsResponse {
  const LyricsResponse({
    required this.trackId,
    this.lrc,
    this.text,
    required this.hasLyrics,
  });

  factory LyricsResponse.fromJson(Map<String, dynamic> json) {
    return LyricsResponse(
      trackId: json['trackId'] as String? ?? '',
      lrc: json['lrc'] as String?,
      text: json['text'] as String?,
      hasLyrics: json['hasLyrics'] as bool? ?? false,
    );
  }

  final String trackId;
  final String? lrc;
  final String? text;
  final bool hasLyrics;

  List<LyricLine> get lines {
    final rawLrc = lrc;
    if (rawLrc != null && rawLrc.trim().isNotEmpty) {
      final parsed = parseLrc(rawLrc);
      if (parsed.isNotEmpty) return parsed;
    }

    final rawText = text;
    if (rawText == null || rawText.trim().isEmpty) return const [];
    return rawText
        .split(RegExp(r'\r?\n'))
        .map((line) => line.trim())
        .where((line) => line.isNotEmpty)
        .map((line) => LyricLine(time: null, text: line))
        .toList(growable: false);
  }
}

class LyricLine {
  const LyricLine({required this.time, required this.text});

  final Duration? time;
  final String text;
}

final _timestampPattern = RegExp(r'\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]');

List<LyricLine> parseLrc(String raw) {
  final lines = <LyricLine>[];

  for (final rawLine in raw.split(RegExp(r'\r?\n'))) {
    final matches = _timestampPattern.allMatches(rawLine).toList();
    if (matches.isEmpty) continue;

    final text = rawLine.replaceAll(_timestampPattern, '').trim();
    if (text.isEmpty) continue;

    for (final match in matches) {
      final minutes = int.tryParse(match.group(1) ?? '') ?? 0;
      final seconds = int.tryParse(match.group(2) ?? '') ?? 0;
      final fraction = match.group(3) ?? '0';
      final milliseconds = fraction.length == 1
          ? int.parse(fraction) * 100
          : fraction.length == 2
          ? int.parse(fraction) * 10
          : int.parse(fraction.padRight(3, '0').substring(0, 3));

      lines.add(
        LyricLine(
          time: Duration(
            minutes: minutes,
            seconds: seconds,
            milliseconds: milliseconds,
          ),
          text: text,
        ),
      );
    }
  }

  lines.sort(
    (a, b) => (a.time ?? Duration.zero).compareTo(b.time ?? Duration.zero),
  );
  return lines;
}
