import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaService } from "@/prisma/prisma.service";
import { AIAppliedTo, AIFeedback } from "@prisma/client";
import { SegmentsService } from "@/modules/equalizer/segments.service";

export interface SuggestedSegment {
  label: string;
  startMs: number;
  endMs: number;
  bands: number[];
  explanation: string;
}

export interface EQSuggestion {
  bands: number[];
  bassBoost: number;
  virtualizer: number;
  loudness: number;
  reverbPreset: string;
  reverbAmount: number;
  explanation: string;
  segments?: SuggestedSegment[];
}

interface SuggestionResult {
  suggestion: EQSuggestion;
  tokensInput: number;
  tokensOutput: number;
  costUsd: number;
  modelUsed: string;
}

/** A streamable catalog track surfaced as a recommendation. */
export interface RecommendedTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string | null;
  coverArt: string | null;
  durationMs: number;
  fileUrlRemote: string | null;
}

export type AssistantIntent = "eq" | "recommend" | "reply";

export interface AssistantResponse {
  requestId: string;
  intent: AssistantIntent;
  /** Friendly, conversational reply in the user's language. */
  message: string;
  /** Present when the assistant proposed an equalizer. */
  eq?: EQSuggestion;
  /** Present when the assistant recommended tracks (resolved, real). */
  tracks?: RecommendedTrack[];
  /** Genres/moods the assistant focused on, for chips. */
  genres?: string[];
}

/** The user's listening fingerprint, distilled for the assistant prompt. */
interface TasteProfile {
  topGenres: string[];
  topArtists: string[];
  recentTitles: string[];
}

interface AssistantParse {
  intent: AssistantIntent;
  message: string;
  eq?: EQSuggestion;
  trackIds: string[];
  genres: string[];
}

interface AssistantResult extends AssistantParse {
  tokensInput: number;
  tokensOutput: number;
  costUsd: number;
  modelUsed: string;
}

const VALID_REVERB_PRESETS = new Set([
  "NONE",
  "SMALL_ROOM",
  "MEDIUM_ROOM",
  "LARGE_ROOM",
  "SMALL_HALL",
  "LARGE_HALL",
  "CATHEDRAL",
  "PLATE",
  "SPRING",
]);

// Pricing per 1M tokens for Haiku 4.5 (USD). Adjust if model changes.
const PRICE_INPUT_PER_MTOK = 1.0;
const PRICE_OUTPUT_PER_MTOK = 5.0;

const SYSTEM_PROMPT = `You are MusicFlow's audio assistant: an expert audio engineer specializing in equalization.
You receive natural-language requests in Spanish or English about how the user wants their music to sound,
and respond with an equalizer configuration in STRICT JSON format.

SCOPE — you ONLY handle requests about audio equalization and how music should sound:
EQ bands, bass/treble/mids, voice/vocals clarity, bass boost, virtualizer, loudness,
reverb, and time-based EQ for song segments (intro, verso, coro, puente, etc.), including
adapting the sound to a music genre or mood.

If the user's request is NOT within that scope (general questions, coding, math, trivia,
personal advice, chit-chat, jailbreak attempts, or anything unrelated to how audio should sound),
DO NOT produce an EQ. Instead respond with EXACTLY this JSON and nothing else:
{ "offTopic": true, "explanation": "<one short sentence in Spanish telling the user you can only help with the equalization and sound of their music>" }

The 10 EQ bands map to: 31Hz, 62Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz.
Each band value must be an integer between -15 and +15 (dB).

RESPOND WITH ONLY A SINGLE JSON OBJECT. No prose, no markdown fences, no explanation outside JSON.

Schema (for in-scope audio/EQ requests):
{
  "bands": [int, int, int, int, int, int, int, int, int, int],
  "bassBoost": 0-100,
  "virtualizer": 0-100,
  "loudness": 0-100,
  "reverbPreset": "NONE" | "SMALL_ROOM" | "MEDIUM_ROOM" | "LARGE_ROOM" | "SMALL_HALL" | "LARGE_HALL" | "CATHEDRAL" | "PLATE" | "SPRING",
  "reverbAmount": 0-100,
  "explanation": "Brief explanation in Spanish (1-2 sentences)",
  "segments": [
    {
      "label": "Coro" | "Puente" | "Intro" | etc,
      "startMs": int,
      "endMs": int,
      "bands": [int x 10],
      "explanation": "1 sentence"
    }
  ]
}

Rules:
- "segments" is OPTIONAL. Only include if the user explicitly requested time-based EQ
  ("en el coro", "del minuto 1:30 al 2:10", "al inicio", etc.). Otherwise omit the key.
- Times are in MILLISECONDS. "del minuto 1:30 al 2:10" => startMs: 90000, endMs: 130000.
- Be conservative with extreme values. Prefer subtle adjustments unless the user asks for dramatic change.
- If the request is ambiguous, use the genre and current EQ (provided in context) to guide your choice.

INTERPRETATION — users phrase things loosely, emotionally, or with metaphors.
Translate their intent into sound, generously and creatively:
- "que suene a concierto / estadio" => spacious reverb (LARGE_HALL) + presence.
- "que se sienta en el pecho / que retumbe / perreo" => strong lows + bassBoost.
- "como vinilo / vieja escuela / nostálgico" => gentle high roll-off, warm mids.
- "para estudiar / relajarme / dormir" => soft, flat-ish, no harsh highs.
- "que reviente / fiesta / al máximo" => loudness + bright highs + lows.
- "claridad / que entienda la letra / podcast" => boosted upper-mids for vocals.
Always map a vague vibe to a sensible EQ rather than refusing. Only the offTopic
path is for requests that have nothing to do with music or sound.`;

const SEGMENT_DETECTION_PROMPT = `You are MusicFlow's audio assistant: an expert audio engineer.
Given a song's metadata (title, artist, genre, total duration), split the song into its
typical musical sections across its ENTIRE duration and propose a tailored 10-band EQ for each.

The 10 EQ bands map to: 31Hz, 62Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz.
Each band value is an integer between -15 and +15 (dB).

RESPOND WITH ONLY A SINGLE JSON OBJECT, no prose or markdown fences:
{
  "segments": [
    {
      "label": "Intro" | "Verso" | "Coro" | "Puente" | "Outro" | etc (Spanish),
      "startMs": int,
      "endMs": int,
      "bands": [int x 10],
      "explanation": "1 short sentence in Spanish"
    }
  ]
}

Rules:
- Cover the WHOLE song from 0 to the given duration. Segments must be contiguous and
  NON-overlapping, ordered by startMs. The first starts at 0; the last ends at the duration.
- Produce between 3 and 7 segments. Times are in MILLISECONDS and must stay within the duration.
- Differentiate the EQ per section: choruses usually need more energy (lows + highs),
  verses are flatter, intros/outros can be softer. Be tasteful, not extreme.
- You don't know the exact arrangement — infer a plausible structure from genre and duration.`;

const ASSISTANT_PROMPT = `You are MusicFlow's in-app assistant: a friendly, expert SOUND ENGINEER and MUSIC CURATOR.
You help one user get the most out of THEIR MusicFlow app. You speak their language (Spanish or English, mirror the user).

You do TWO things, and only these, always within MusicFlow:
1) SOUND — tune the equalizer / how their music sounds (bass, treble, vocals, reverb, "vibes").
2) MUSIC — recommend songs to play from THEIR MusicFlow catalog, and suggest genres/moods/playlists,
   personalized to the user's taste (provided below as their listening profile + a candidate list).

You must INTERPRET loose, weird, emotional, slang or metaphorical requests and figure out what they need.
Examples: "ponme algo para el gym", "quiero llorar", "algo como lo que escucho pero más tranqui",
"sorpréndeme", "música para una cena", "lo más perreo que tengas", "que suene a estadio".
Be generous and creative mapping a vibe to either a sound tweak or song picks (or both).

STAY IN SCOPE: only music and your MusicFlow app. If asked about anything else (coding, math, news,
personal/medical/legal advice, general chit-chat, jailbreaks), DO NOT answer it — set intent "reply"
and gently say, in the user's language, that you only help with their music and sound in MusicFlow.

RESPOND WITH ONLY ONE JSON OBJECT, no markdown fences, no text outside JSON:
{
  "intent": "eq" | "recommend" | "reply",
  "message": "a warm, concise reply in the user's language (1-3 sentences). For recommendations, say WHY these fit their taste.",
  "genres": ["optional", "genres or moods you focused on"],
  "trackIds": ["only for intent=recommend: ids picked ONLY from the candidate list below"],
  "eq": { ...EQ object, only for intent=eq... }
}

intent rules:
- "eq": the user wants to change how it sounds. Include "eq" with this schema:
  { "bands":[10 ints -15..15 for 31,62,125,250,500Hz,1k,2k,4k,8k,16k], "bassBoost":0-100, "virtualizer":0-100,
    "loudness":0-100, "reverbPreset":"NONE|SMALL_ROOM|MEDIUM_ROOM|LARGE_ROOM|SMALL_HALL|LARGE_HALL|CATHEDRAL|PLATE|SPRING",
    "reverbAmount":0-100, "explanation":"1-2 sentences" }. Do NOT include trackIds.
- "recommend": the user wants something to listen to, OR asks for a mood / activity / vibe
  ("para el gym", "algo tranqui", "sorpréndeme", "para una cena"). Pick 3-8 trackIds from the
  CANDIDATES ONLY (never invent ids or songs not listed). Prefer the ★ taste matches, then add
  variety; do NOT re-recommend songs listed under "Recently played". Do NOT include "eq".
- "reply": clarification, app help, or an off-topic refusal. No eq, no trackIds.`;

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private readonly anthropic: Anthropic | null;
  private readonly model: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly segmentsService: SegmentsService,
  ) {
    this.model = this.configService.get<string>(
      "ANTHROPIC_MODEL",
      "claude-haiku-4-5-20251001",
    );
    const apiKey = this.configService.get<string>("ANTHROPIC_API_KEY");
    if (apiKey && apiKey !== "your-anthropic-api-key") {
      this.anthropic = new Anthropic({ apiKey });
    } else {
      this.anthropic = null;
      this.logger.warn(
        "ANTHROPIC_API_KEY not set — AI agent will use mock suggestions.",
      );
    }
  }

  async suggestEQ(
    userId: string,
    data: {
      prompt: string;
      trackId?: string;
      playlistId?: string;
      context?: Record<string, unknown>;
    },
  ): Promise<{ suggestion: EQSuggestion; requestId: string }> {
    const startTime = Date.now();

    const context: Record<string, unknown> = { ...data.context };

    if (data.trackId) {
      const track = await this.prisma.track.findFirst({
        where: { id: data.trackId, OR: [{ userId }, { isCatalog: true }] },
      });
      if (track) {
        context.track = {
          title: track.title,
          artist: track.artist,
          album: track.album,
          genre: track.genre,
          durationMs: track.durationMs,
        };
      }
    }

    const result = this.anthropic
      ? await this.callAgent(data.prompt, context)
      : await this.mockSuggestion(data.prompt, context);

    const responseTimeMs = Date.now() - startTime;

    const aiRequest = await this.prisma.aIRequest.create({
      data: {
        userId,
        trackId: data.trackId,
        prompt: data.prompt,
        context: context as object,
        response: result.suggestion as unknown as object,
        explanation: result.suggestion.explanation,
        modelUsed: result.modelUsed,
        responseTimeMs,
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        costUsd: result.costUsd,
      },
    });

    return {
      suggestion: result.suggestion,
      requestId: aiRequest.id,
    };
  }

  /**
   * The flexible in-app assistant: interprets a free-form request and either
   * tunes the EQ, recommends real catalog tracks personalized to the user's
   * taste, or replies. Stays scoped to music + the app. Persists the exchange.
   */
  async assist(
    userId: string,
    data: { prompt: string; trackId?: string },
  ): Promise<AssistantResponse> {
    const startTime = Date.now();

    // Taste first (the candidate pool is built from it), then fetch the pool and
    // the now-playing context together. The now-playing track is excluded from
    // the pool so the assistant never recommends what's already playing.
    const taste = await this.buildTasteProfile(userId);
    const [candidates, trackCtx] = await Promise.all([
      this.getRecommendationCandidates(taste, data.trackId),
      data.trackId ? this.loadTrackContext(userId, data.trackId) : null,
    ]);

    const result = this.anthropic
      ? await this.callAssistant(data.prompt, taste, candidates, trackCtx)
      : this.mockAssist(data.prompt, taste, candidates);

    // Resolve recommended ids against the real candidate pool so the response
    // can never contain a hallucinated song.
    const byId = new Map(candidates.map((c) => [c.id, c]));
    const tracks =
      result.intent === "recommend"
        ? result.trackIds
            .map((id) => byId.get(id))
            .filter((t): t is RecommendedTrack => t !== undefined)
            .slice(0, 8)
        : [];

    const responseTimeMs = Date.now() - startTime;

    const aiRequest = await this.prisma.aIRequest.create({
      data: {
        userId,
        trackId: data.trackId,
        prompt: data.prompt,
        context: {
          taste,
          intent: result.intent,
          genres: result.genres,
        } as object,
        response: {
          intent: result.intent,
          message: result.message,
          trackIds: tracks.map((t) => t.id),
          genres: result.genres,
          ...(result.eq ? { eq: result.eq } : {}),
        } as unknown as object,
        explanation: result.message,
        modelUsed: result.modelUsed,
        responseTimeMs,
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        costUsd: result.costUsd,
      },
    });

    return {
      requestId: aiRequest.id,
      intent: result.intent,
      message: result.message,
      ...(result.eq ? { eq: result.eq } : {}),
      ...(tracks.length > 0 ? { tracks } : {}),
      ...(result.genres.length > 0 ? { genres: result.genres } : {}),
    };
  }

  /**
   * Distil the user's listening fingerprint from recent plays and saved tracks:
   * the genres and artists they reach for, plus a few recent titles. Cheap,
   * read-only, and resilient to an empty history (returns empty arrays).
   */
  private async buildTasteProfile(userId: string): Promise<TasteProfile> {
    const [plays, saves] = await Promise.all([
      this.prisma.playHistory.findMany({
        where: { userId },
        orderBy: { playedAt: "desc" },
        take: 100,
        select: {
          track: { select: { artist: true, genre: true, title: true } },
        },
      }),
      this.prisma.userLibrarySave.findMany({
        where: { userId },
        take: 60,
        select: { track: { select: { artist: true, genre: true } } },
      }),
    ]);

    const genreCounts = new Map<string, number>();
    const artistCounts = new Map<string, number>();
    const recentTitles: string[] = [];

    // Weight the signals so the profile reflects what the user reaches for NOW:
    // recent plays count more than old ones (linear recency decay over the
    // newest-first list), and an explicit save outweighs a single passive play.
    const bump = (
      map: Map<string, number>,
      key: string | null | undefined,
      weight: number,
    ) => {
      const k = (key ?? "").trim();
      if (k) map.set(k, (map.get(k) ?? 0) + weight);
    };

    const SAVE_WEIGHT = 3;
    plays.forEach((p, i) => {
      // Newest play ≈3x, oldest ≈1x.
      const recency = 1 + 2 * (1 - i / Math.max(plays.length, 1));
      bump(genreCounts, p.track.genre, recency);
      bump(artistCounts, p.track.artist, recency);
      if (recentTitles.length < 8 && p.track.title) {
        recentTitles.push(`${p.track.title} — ${p.track.artist}`);
      }
    });
    for (const s of saves) {
      bump(genreCounts, s.track.genre, SAVE_WEIGHT);
      bump(artistCounts, s.track.artist, SAVE_WEIGHT);
    }

    const top = (map: Map<string, number>, n: number) =>
      Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([k]) => k);

    return {
      topGenres: top(genreCounts, 5),
      topArtists: top(artistCounts, 6),
      recentTitles,
    };
  }

  /**
   * Build the pool the assistant may recommend from: catalog tracks the user
   * can actually stream. Capped and de-duplicated; the model picks ids from it
   * so a recommendation can never be a song that isn't in MusicFlow.
   */
  private async getRecommendationCandidates(
    taste: TasteProfile,
    excludeTrackId?: string,
  ): Promise<RecommendedTrack[]> {
    const select = {
      id: true,
      title: true,
      artist: true,
      album: true,
      genre: true,
      coverArt: true,
      durationMs: true,
      fileUrlRemote: true,
    } as const;

    // Never offer back the track that's already playing.
    const baseWhere = {
      isCatalog: true,
      fileUrlRemote: { not: null },
      ...(excludeTrackId ? { id: { not: excludeTrackId } } : {}),
    };

    // Prefer tracks in the user's top genres, then top up with variety.
    const preferred = taste.topGenres.length
      ? await this.prisma.track.findMany({
          where: { ...baseWhere, genre: { in: taste.topGenres } },
          select,
          take: 40,
        })
      : [];

    const variety = await this.prisma.track.findMany({
      where: baseWhere,
      select,
      orderBy: { playHistory: { _count: "desc" } },
      take: 40,
    });

    const seen = new Set<string>();
    const pool: RecommendedTrack[] = [];
    for (const t of [...preferred, ...variety]) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      pool.push(t);
      if (pool.length >= 60) break;
    }
    return pool;
  }

  private async loadTrackContext(
    userId: string,
    trackId: string,
  ): Promise<{
    title: string;
    artist: string;
    album: string;
    genre: string | null;
  } | null> {
    const track = await this.prisma.track.findFirst({
      where: { id: trackId, OR: [{ userId }, { isCatalog: true }] },
      select: { title: true, artist: true, album: true, genre: true },
    });
    return track ?? null;
  }

  /**
   * Auto-detect EQ segments for a track. Asks the agent (or the mock fallback)
   * to split the song into musical sections with a tailored EQ each, sanitizes
   * the result into contiguous non-overlapping ranges, and persists them as
   * AI-authored segments. Returns the created segments.
   *
   * Refuses if the track already has segments — the caller should clear them
   * first, so detection never collides with manual work.
   */
  async detectSegments(
    userId: string,
    trackId: string,
  ): Promise<{ segments: unknown[]; count: number; requestId: string }> {
    const startTime = Date.now();

    // Visibility, not ownership: segments may attach to catalog tracks too.
    const track = await this.prisma.track.findFirst({
      where: { id: trackId, OR: [{ userId }, { isCatalog: true }] },
    });
    if (!track) {
      throw new NotFoundException("Track not found");
    }

    const existing = await this.prisma.eQSegment.count({
      where: { trackId, userId },
    });
    if (existing > 0) {
      throw new BadRequestException(
        "La canción ya tiene segmentos. Elimínalos antes de detectar con IA.",
      );
    }

    const trackInfo = {
      title: track.title,
      artist: track.artist,
      album: track.album,
      genre: track.genre,
      durationMs: track.durationMs,
    };

    const result = this.anthropic
      ? await this.callAgentForSegments(trackInfo)
      : await this.mockDetectSegments(trackInfo);

    const sanitized = this.sanitizeSegments(result.segments, track.durationMs);

    if (sanitized.length === 0) {
      throw new ServiceUnavailableException(
        "La IA no devolvió segmentos válidos. Intenta de nuevo.",
      );
    }

    const responseTimeMs = Date.now() - startTime;

    // Record the request first so each created segment can reference it.
    const aiRequest = await this.prisma.aIRequest.create({
      data: {
        userId,
        trackId,
        prompt: "[detect-segments]",
        context: { track: trackInfo } as object,
        response: { segments: sanitized } as unknown as object,
        explanation: `Detección automática de ${sanitized.length} segmentos.`,
        modelUsed: result.modelUsed,
        responseTimeMs,
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        costUsd: result.costUsd,
      },
    });

    // Persist sequentially: each create re-checks overlap, and our sanitized
    // ranges are already non-overlapping, so they all succeed in order.
    const created: unknown[] = [];
    for (const seg of sanitized) {
      const segment = await this.segmentsService.create(userId, {
        trackId,
        label: seg.label,
        startMs: seg.startMs,
        endMs: seg.endMs,
        createdBy: "AI",
        aiRequestId: aiRequest.id,
        eqConfig: { bands: seg.bands },
      });
      created.push(segment);
    }

    return {
      segments: created,
      count: created.length,
      requestId: aiRequest.id,
    };
  }

  async acceptSuggestion(
    requestId: string,
    userId: string,
    appliedTo: AIAppliedTo,
    appliedId?: string,
  ) {
    const request = await this.prisma.aIRequest.findFirst({
      where: { id: requestId, userId },
    });

    if (!request) {
      throw new NotFoundException("AI request not found");
    }

    return this.prisma.aIRequest.update({
      where: { id: requestId },
      data: {
        wasAccepted: true,
        appliedTo,
        appliedId,
      },
    });
  }

  async provideFeedback(
    requestId: string,
    userId: string,
    feedback: AIFeedback,
    comment?: string,
  ) {
    const request = await this.prisma.aIRequest.findFirst({
      where: { id: requestId, userId },
    });

    if (!request) {
      throw new NotFoundException("AI request not found");
    }

    return this.prisma.aIRequest.update({
      where: { id: requestId },
      data: {
        feedback,
        feedbackComment: comment ?? "",
      },
    });
  }

  async getHistory(userId: string, params?: { skip?: number; take?: number }) {
    // Query params arrive as strings; Prisma's skip/take require Int. Coerce.
    const skip = Number(params?.skip ?? 0) || 0;
    const take = Math.min(Number(params?.take ?? 20) || 20, 100);

    const [requests, total] = await Promise.all([
      this.prisma.aIRequest.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { track: { select: { title: true, artist: true } } },
      }),
      this.prisma.aIRequest.count({ where: { userId } }),
    ]);

    return { requests, total, skip, take };
  }

  // ============ AI provider call ============

  private async callAgent(
    prompt: string,
    context: Record<string, unknown>,
  ): Promise<SuggestionResult> {
    if (!this.anthropic) {
      throw new ServiceUnavailableException("AI agent not configured");
    }

    const userMessage = this.buildUserMessage(prompt, context);

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            // Cache the system prompt — it's stable across requests.
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: userMessage }],
      });

      const textBlock = response.content.find((c) => c.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("AI provider returned no text content");
      }

      const suggestion = this.parseSuggestion(textBlock.text);

      const tokensInput =
        (response.usage.input_tokens ?? 0) +
        (response.usage.cache_creation_input_tokens ?? 0) +
        (response.usage.cache_read_input_tokens ?? 0);
      const tokensOutput = response.usage.output_tokens ?? 0;
      const costUsd =
        (tokensInput / 1_000_000) * PRICE_INPUT_PER_MTOK +
        (tokensOutput / 1_000_000) * PRICE_OUTPUT_PER_MTOK;

      return {
        suggestion,
        tokensInput,
        tokensOutput,
        costUsd,
        modelUsed: response.model,
      };
    } catch (error) {
      // Off-topic rejections (and other deliberate HTTP errors) must pass through
      // as-is, not be masked as a 503.
      if (error instanceof HttpException) throw error;
      this.logger.error("AI provider call failed", error as Error);
      throw new ServiceUnavailableException(
        "AI service is temporarily unavailable. Please try again.",
      );
    }
  }

  private async callAgentForSegments(track: {
    title: string;
    artist: string;
    album: string;
    genre: string | null;
    durationMs: number;
  }): Promise<{
    segments: SuggestedSegment[];
    tokensInput: number;
    tokensOutput: number;
    costUsd: number;
    modelUsed: string;
  }> {
    if (!this.anthropic) {
      throw new ServiceUnavailableException("AI agent not configured");
    }

    const lines = [
      "Split this song into EQ segments covering its full duration.",
      "",
      "Track:",
      `- Title: ${track.title}`,
      `- Artist: ${track.artist}`,
      `- Album: ${track.album}`,
    ];
    if (track.genre) lines.push(`- Genre: ${track.genre}`);
    lines.push(`- Duration: ${track.durationMs}ms`);

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1500,
        system: [
          {
            type: "text",
            text: SEGMENT_DETECTION_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: lines.join("\n") }],
      });

      const textBlock = response.content.find((c) => c.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("AI provider returned no text content");
      }

      const segments = this.parseSegmentsArray(textBlock.text);

      const tokensInput =
        (response.usage.input_tokens ?? 0) +
        (response.usage.cache_creation_input_tokens ?? 0) +
        (response.usage.cache_read_input_tokens ?? 0);
      const tokensOutput = response.usage.output_tokens ?? 0;
      const costUsd =
        (tokensInput / 1_000_000) * PRICE_INPUT_PER_MTOK +
        (tokensOutput / 1_000_000) * PRICE_OUTPUT_PER_MTOK;

      return {
        segments,
        tokensInput,
        tokensOutput,
        costUsd,
        modelUsed: response.model,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error("AI segment detection failed", error as Error);
      throw new ServiceUnavailableException(
        "AI service is temporarily unavailable. Please try again.",
      );
    }
  }

  private parseSegmentsArray(raw: string): SuggestedSegment[] {
    let jsonText = raw.trim();
    const fenceMatch = jsonText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (fenceMatch) jsonText = fenceMatch[1].trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error("AI provider returned invalid JSON");
    }

    const rawSegments = Array.isArray(parsed)
      ? parsed
      : (parsed as { segments?: unknown }).segments;

    if (!Array.isArray(rawSegments)) return [];

    return rawSegments
      .map((s) => this.validateSegment(s))
      .filter((s): s is SuggestedSegment => s !== null);
  }

  /**
   * Turn a raw list of suggested segments into contiguous, non-overlapping,
   * in-bounds ranges. Sorts by start, clamps to the track duration, trims each
   * start past the previous end, and drops anything shorter than 1s.
   */
  private sanitizeSegments(
    segments: SuggestedSegment[],
    durationMs: number,
  ): SuggestedSegment[] {
    const MIN_LEN = 1000;
    const sorted = [...segments].sort((a, b) => a.startMs - b.startMs);
    const result: SuggestedSegment[] = [];
    let cursor = 0;

    for (const seg of sorted) {
      const start = Math.max(cursor, Math.min(seg.startMs, durationMs));
      const end = Math.min(Math.max(seg.endMs, start), durationMs);
      if (end - start < MIN_LEN) continue;
      result.push({ ...seg, startMs: start, endMs: end });
      cursor = end;
      if (cursor >= durationMs) break;
    }

    return result.slice(0, 12);
  }

  private async callAssistant(
    prompt: string,
    taste: TasteProfile,
    candidates: RecommendedTrack[],
    trackCtx: {
      title: string;
      artist: string;
      album: string;
      genre: string | null;
    } | null,
  ): Promise<AssistantResult> {
    if (!this.anthropic) {
      throw new ServiceUnavailableException("AI agent not configured");
    }

    const userMessage = this.buildAssistantMessage(
      prompt,
      taste,
      candidates,
      trackCtx,
    );

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: [
          {
            type: "text",
            text: ASSISTANT_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: userMessage }],
      });

      const textBlock = response.content.find((c) => c.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("AI provider returned no text content");
      }

      const parsed = this.parseAssistant(textBlock.text);

      const tokensInput =
        (response.usage.input_tokens ?? 0) +
        (response.usage.cache_creation_input_tokens ?? 0) +
        (response.usage.cache_read_input_tokens ?? 0);
      const tokensOutput = response.usage.output_tokens ?? 0;
      const costUsd =
        (tokensInput / 1_000_000) * PRICE_INPUT_PER_MTOK +
        (tokensOutput / 1_000_000) * PRICE_OUTPUT_PER_MTOK;

      return {
        ...parsed,
        tokensInput,
        tokensOutput,
        costUsd,
        modelUsed: response.model,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error("AI assistant call failed", error as Error);
      throw new ServiceUnavailableException(
        "AI service is temporarily unavailable. Please try again.",
      );
    }
  }

  private buildAssistantMessage(
    prompt: string,
    taste: TasteProfile,
    candidates: RecommendedTrack[],
    trackCtx: {
      title: string;
      artist: string;
      album: string;
      genre: string | null;
    } | null,
  ): string {
    const lines: string[] = [];
    lines.push(`User request: ${prompt}`);
    lines.push("");
    lines.push("User taste profile:");
    lines.push(
      `- Favourite genres: ${taste.topGenres.join(", ") || "(unknown yet)"}`,
    );
    lines.push(
      `- Favourite artists: ${taste.topArtists.join(", ") || "(unknown yet)"}`,
    );
    if (taste.recentTitles.length) {
      lines.push(
        `- Recently played (avoid re-recommending these): ${taste.recentTitles.join("; ")}`,
      );
    }
    if (trackCtx) {
      lines.push("");
      lines.push(
        `Now playing: ${trackCtx.title} — ${trackCtx.artist}${
          trackCtx.genre ? ` [${trackCtx.genre}]` : ""
        }`,
      );
    }
    lines.push("");
    const topGenres = new Set(taste.topGenres);
    lines.push(
      "CANDIDATES (recommend ONLY by these ids; ★ = matches their taste — prefer these, then add variety; format `id | Title — Artist [genre]`):",
    );
    for (const c of candidates) {
      const star = c.genre && topGenres.has(c.genre) ? "★ " : "  ";
      lines.push(
        `${star}${c.id} | ${c.title} — ${c.artist}${c.genre ? ` [${c.genre}]` : ""}`,
      );
    }
    return lines.join("\n");
  }

  /**
   * Pull a JSON object out of a model response. Strips markdown fences and, if
   * the model wrapped the JSON in prose despite instructions, falls back to the
   * outermost {...} span — so a stray sentence never fails the whole request.
   */
  private extractJsonObject(raw: string): Record<string, unknown> {
    let text = raw.trim();
    const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (fence) text = fence[1].trim();

    const tryParse = (s: string): Record<string, unknown> | null => {
      try {
        const v: unknown = JSON.parse(s);
        return v && typeof v === "object"
          ? (v as Record<string, unknown>)
          : null;
      } catch {
        return null;
      }
    };

    let obj = tryParse(text);
    if (!obj) {
      const first = text.indexOf("{");
      const last = text.lastIndexOf("}");
      if (first !== -1 && last > first) {
        obj = tryParse(text.slice(first, last + 1));
      }
    }
    if (!obj) throw new Error("AI provider returned invalid JSON");
    return obj;
  }

  private parseAssistant(raw: string): AssistantParse {
    const obj = this.extractJsonObject(raw);

    const intent: AssistantIntent =
      obj.intent === "eq" || obj.intent === "recommend" ? obj.intent : "reply";
    const message =
      typeof obj.message === "string" && obj.message.trim()
        ? obj.message.trim()
        : "Aquí tienes.";
    const genres = Array.isArray(obj.genres)
      ? obj.genres.filter((g): g is string => typeof g === "string").slice(0, 6)
      : [];
    const trackIds = Array.isArray(obj.trackIds)
      ? obj.trackIds
          .filter((id): id is string => typeof id === "string")
          .slice(0, 12)
      : [];

    const eq =
      intent === "eq" && obj.eq && typeof obj.eq === "object"
        ? this.coerceEq(obj.eq as Record<string, unknown>)
        : undefined;

    return { intent, message, genres, trackIds, ...(eq ? { eq } : {}) };
  }

  /** Validate a loose EQ object from the assistant into a safe EQSuggestion. */
  private coerceEq(obj: Record<string, unknown>): EQSuggestion {
    const reverbPreset = VALID_REVERB_PRESETS.has(String(obj.reverbPreset))
      ? String(obj.reverbPreset)
      : "NONE";
    return {
      bands: this.validateBands(obj.bands),
      bassBoost: this.clamp0to100(obj.bassBoost),
      virtualizer: this.clamp0to100(obj.virtualizer),
      loudness: this.clamp0to100(obj.loudness),
      reverbPreset,
      reverbAmount: this.clamp0to100(obj.reverbAmount),
      explanation:
        typeof obj.explanation === "string"
          ? obj.explanation
          : "Configuración generada por la IA.",
    };
  }

  /**
   * Offline fallback for the assistant (no API key). Heuristically picks an
   * intent from keywords and, for recommendations, selects candidates that
   * match the user's top genres — so the feature works end-to-end in dev.
   */
  private mockAssist(
    prompt: string,
    taste: TasteProfile,
    candidates: RecommendedTrack[],
  ): AssistantResult {
    const base = {
      tokensInput: 0,
      tokensOutput: 0,
      costUsd: 0,
      modelUsed: `${this.model}-mock`,
      genres: taste.topGenres.slice(0, 3),
    };
    const p = prompt.toLowerCase();
    const soundWords = [
      "eq",
      "ecualiz",
      "bajo",
      "bass",
      "agudo",
      "voz",
      "vocal",
      "graves",
      "suene",
      "sonido",
      "reverb",
      "brillante",
      "cálid",
      "calid",
    ];
    if (soundWords.some((w) => p.includes(w))) {
      return {
        ...base,
        intent: "eq",
        message:
          "Ajusté el ecualizador para acercarlo a lo que pediste. Puedes aplicarlo abajo.",
        trackIds: [],
        eq: {
          bands:
            p.includes("voz") || p.includes("vocal")
              ? [-2, -1, 0, 3, 5, 5, 3, 0, -1, -2]
              : [6, 5, 4, 2, 0, 0, 0, 1, 2, 1],
          bassBoost: p.includes("voz") ? 0 : 30,
          virtualizer: 0,
          loudness: 0,
          reverbPreset: "NONE",
          reverbAmount: 0,
          explanation: "Ajuste base según tu pedido.",
        },
      };
    }

    // Default to recommendations from the user's top genres (or any candidate).
    const preferred = candidates.filter(
      (c) => c.genre && taste.topGenres.includes(c.genre),
    );
    const pick = (preferred.length ? preferred : candidates).slice(0, 6);
    return {
      ...base,
      intent: pick.length ? "recommend" : "reply",
      message: pick.length
        ? `Según lo que sueles escuchar, te recomiendo estas${
            taste.topGenres.length ? ` (${taste.topGenres[0]})` : ""
          }.`
        : "Cuéntame qué quieres escuchar o cómo quieres que suene tu música.",
      trackIds: pick.map((c) => c.id),
    };
  }

  private buildUserMessage(
    prompt: string,
    context: Record<string, unknown>,
  ): string {
    const lines: string[] = [];
    lines.push(`User request: ${prompt}`);

    const track = context.track as
      | {
          title: string;
          artist: string;
          album: string;
          genre: string | null;
          durationMs: number;
        }
      | undefined;
    if (track) {
      lines.push("");
      lines.push("Track context:");
      lines.push(`- Title: ${track.title}`);
      lines.push(`- Artist: ${track.artist}`);
      lines.push(`- Album: ${track.album}`);
      if (track.genre) lines.push(`- Genre: ${track.genre}`);
      lines.push(`- Duration: ${track.durationMs}ms`);
    }

    const currentEq = context.currentEq as
      | { bands?: number[]; bassBoost?: number }
      | undefined;
    if (currentEq?.bands) {
      lines.push("");
      lines.push(`Current EQ bands: [${currentEq.bands.join(", ")}]`);
    }

    return lines.join("\n");
  }

  private parseSuggestion(raw: string): EQSuggestion {
    const obj = this.extractJsonObject(raw);

    // Scope guard: the model flags requests unrelated to audio/EQ. Reject them
    // with a friendly message instead of fabricating an equalizer.
    if (obj.offTopic === true) {
      const message =
        typeof obj.explanation === "string" && obj.explanation.trim()
          ? obj.explanation
          : "Solo puedo ayudarte con la ecualización y el sonido de tu música.";
      throw new BadRequestException(message);
    }

    const bands = this.validateBands(obj.bands);
    const reverbPreset = VALID_REVERB_PRESETS.has(String(obj.reverbPreset))
      ? String(obj.reverbPreset)
      : "NONE";

    const segments = Array.isArray(obj.segments)
      ? obj.segments
          .map((s) => this.validateSegment(s))
          .filter((s): s is SuggestedSegment => s !== null)
      : undefined;

    return {
      bands,
      bassBoost: this.clamp0to100(obj.bassBoost),
      virtualizer: this.clamp0to100(obj.virtualizer),
      loudness: this.clamp0to100(obj.loudness),
      reverbPreset,
      reverbAmount: this.clamp0to100(obj.reverbAmount),
      explanation:
        typeof obj.explanation === "string"
          ? obj.explanation
          : "Configuración generada por la IA.",
      ...(segments && segments.length > 0 ? { segments } : {}),
    };
  }

  private validateBands(value: unknown): number[] {
    if (!Array.isArray(value) || value.length !== 10) {
      return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    return value.map((v) => {
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n)) return 0;
      return Math.max(-15, Math.min(15, Math.round(n)));
    });
  }

  private validateSegment(value: unknown): SuggestedSegment | null {
    if (!value || typeof value !== "object") return null;
    const s = value as Record<string, unknown>;
    const startMs = Number(s.startMs);
    const endMs = Number(s.endMs);
    if (
      !Number.isFinite(startMs) ||
      !Number.isFinite(endMs) ||
      endMs <= startMs
    ) {
      return null;
    }
    return {
      label: typeof s.label === "string" ? s.label : "Segmento",
      startMs: Math.max(0, Math.floor(startMs)),
      endMs: Math.max(0, Math.floor(endMs)),
      bands: this.validateBands(s.bands),
      explanation: typeof s.explanation === "string" ? s.explanation : "",
    };
  }

  private clamp0to100(value: unknown): number {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  // ============ Mock (dev fallback) ============

  private async mockSuggestion(
    prompt: string,
    context: Record<string, unknown>,
  ): Promise<SuggestionResult> {
    const genre =
      (context.track as { genre?: string } | undefined)?.genre?.toLowerCase() ??
      "";

    let bands = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let explanation = "Configuración base plana.";

    if (
      prompt.toLowerCase().includes("bass") ||
      genre.includes("hip") ||
      genre.includes("electronic")
    ) {
      bands = [6, 5, 4, 2, 0, 0, 0, 0, 0, 0];
      explanation =
        "He aumentado las frecuencias bajas para dar más presencia al bajo y bombo.";
    } else if (
      prompt.toLowerCase().includes("vocal") ||
      prompt.toLowerCase().includes("voz")
    ) {
      bands = [-2, -1, 0, 3, 5, 5, 3, 0, -1, -2];
      explanation =
        "He realzado las frecuencias medias donde se concentra la voz humana.";
    } else if (genre.includes("rock")) {
      bands = [5, 4, 2, 0, -1, 0, 2, 4, 5, 5];
      explanation =
        "Configuración clásica de rock con bajos y agudos pronunciados.";
    } else if (genre.includes("jazz") || genre.includes("classical")) {
      bands = [3, 2, 0, 2, -2, -2, 0, 2, 3, 4];
      explanation =
        "Configuración suave que respeta la dinámica natural de la música.";
    }

    return {
      suggestion: {
        bands,
        bassBoost: 0,
        virtualizer: 0,
        loudness: 0,
        reverbPreset: "NONE",
        reverbAmount: 0,
        explanation,
      },
      tokensInput: 0,
      tokensOutput: 0,
      costUsd: 0,
      modelUsed: `${this.model}-mock`,
    };
  }

  /**
   * Deterministic offline fallback for segment detection. Splits the song into
   * a canonical Intro / Verso / Coro / Verso / Coro final structure by fraction
   * of the duration, with a flatter EQ on verses and more energetic choruses
   * (nudged by genre). Lets the feature work end-to-end without an API key.
   */
  private async mockDetectSegments(track: {
    genre: string | null;
    durationMs: number;
  }): Promise<{
    segments: SuggestedSegment[];
    tokensInput: number;
    tokensOutput: number;
    costUsd: number;
    modelUsed: string;
  }> {
    const genre = (track.genre ?? "").toLowerCase();
    const bassy =
      genre.includes("hip") ||
      genre.includes("electro") ||
      genre.includes("reggae") ||
      genre.includes("pop");

    const verse = bassy
      ? [3, 2, 1, 0, 0, 0, 0, 1, 1, 0]
      : [1, 1, 0, 0, 0, 0, 0, 1, 1, 1];
    const chorus = bassy
      ? [6, 5, 3, 1, 0, 0, 1, 3, 4, 3]
      : [4, 3, 1, 0, -1, 0, 2, 4, 5, 4];
    const soft = [2, 1, 0, 0, -1, -1, 0, 1, 2, 2];

    // Section boundaries as fractions of the total duration.
    const plan: Array<{
      label: string;
      from: number;
      to: number;
      bands: number[];
      explanation: string;
    }> = [
      {
        label: "Intro",
        from: 0,
        to: 0.08,
        bands: soft,
        explanation: "Entrada suave para abrir la canción.",
      },
      {
        label: "Verso",
        from: 0.08,
        to: 0.34,
        bands: verse,
        explanation: "EQ equilibrado que prioriza la voz.",
      },
      {
        label: "Coro",
        from: 0.34,
        to: 0.56,
        bands: chorus,
        explanation: "Más energía en graves y agudos para el coro.",
      },
      {
        label: "Verso",
        from: 0.56,
        to: 0.74,
        bands: verse,
        explanation: "Vuelve a un balance neutro.",
      },
      {
        label: "Coro final",
        from: 0.74,
        to: 1,
        bands: chorus,
        explanation: "Coro final con la mayor presencia.",
      },
    ];

    const dur = track.durationMs;
    const segments: SuggestedSegment[] = plan.map((p) => ({
      label: p.label,
      startMs: Math.round(p.from * dur),
      endMs: Math.round(p.to * dur),
      bands: p.bands,
      explanation: p.explanation,
    }));

    return {
      segments,
      tokensInput: 0,
      tokensOutput: 0,
      costUsd: 0,
      modelUsed: `${this.model}-mock`,
    };
  }
}
