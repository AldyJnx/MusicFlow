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

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private readonly anthropic: Anthropic | null;
  private readonly model: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
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
        where: { id: data.trackId, userId },
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
}
