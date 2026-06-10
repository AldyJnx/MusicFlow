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
- If the request is ambiguous, use the genre and current EQ (provided in context) to guide your choice.`;

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
    let jsonText = raw.trim();
    // Strip markdown fences if the model added them despite instructions.
    const fenceMatch = jsonText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (fenceMatch) jsonText = fenceMatch[1].trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error("AI provider returned invalid JSON");
    }

    if (!parsed || typeof parsed !== "object") {
      throw new Error("AI response is not an object");
    }

    const obj = parsed as Record<string, unknown>;

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
