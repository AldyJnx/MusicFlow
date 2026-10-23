import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/** Default model. Kept overridable so the admin can pin a different NIM. */
export const DEFAULT_NVIDIA_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 20_000;

export type JsonSchema = Record<string, unknown>;

export interface NvidiaNimUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface NvidiaNimResult<T> {
  data: T;
  usage: NvidiaNimUsage;
  latencyMs: number;
}

/**
 * Raised when the endpoint cannot be reached or the key is missing. The admin
 * sees this as a 503 with a Spanish message instead of an opaque 500, because
 * the free tier is best effort and fails often.
 */
export class NvidiaNimUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NvidiaNimUnavailableError";
  }
}

/** Raised when the endpoint answers but the payload is unusable. */
export class NvidiaNimResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NvidiaNimResponseError";
  }
}

interface NvidiaNimRequest {
  system: string;
  user: string;
  schema: JsonSchema;
  schemaName: string;
  maxTokens?: number;
  temperature?: number;
}

@Injectable()
export class NvidiaNimClient {
  private readonly logger = new Logger(NvidiaNimClient.name);

  private readonly apiKey: string | null;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>("NVIDIA_API_KEY")?.trim();
    // Guard against the placeholder values that ship in the .env examples.
    this.apiKey = key && !/^(your|replace|todo|<)/i.test(key) ? key : null;

    this.baseUrl = (
      this.configService.get<string>("NVIDIA_AI_BASE_URL") ?? DEFAULT_BASE_URL
    ).replace(/\/+$/, "");
    this.model =
      this.configService.get<string>("NVIDIA_AI_MODEL")?.trim() ||
      DEFAULT_NVIDIA_MODEL;
    this.timeoutMs = this.readInt("NVIDIA_AI_TIMEOUT_MS", DEFAULT_TIMEOUT_MS);
    this.maxRetries = this.readInt(
      "NVIDIA_AI_MAX_RETRIES",
      DEFAULT_MAX_RETRIES,
    );

    if (!this.apiKey) {
      this.logger.warn(
        "NVIDIA_API_KEY not set - the admin catalog assistant stays disabled.",
      );
    }
  }

  get modelName(): string {
    return this.model;
  }

  isEnabled(): boolean {
    return this.apiKey !== null;
  }

  /**
   * Calls the chat completions endpoint and returns the parsed JSON object.
   *
   * `nvext.guided_json` constrains decoding to the given schema, so the reply is
   * machine readable without a repair pass. `enable_thinking: false` keeps
   * latency predictable for the short classification-style prompts used here;
   * the reasoning is captured in the finding instead.
   */
  async completeJson<T>(
    request: NvidiaNimRequest,
  ): Promise<NvidiaNimResult<T>> {
    if (!this.apiKey) {
      throw new NvidiaNimUnavailableError(
        "NVIDIA_API_KEY no está configurada. Pega tu clave nvapi- en apps/backend/.env.",
      );
    }

    const startedAt = Date.now();
    const body = {
      model: this.model,
      temperature: request.temperature ?? 0.1,
      max_tokens: request.maxTokens ?? 2_048,
      messages: [
        { role: "system", content: request.system },
        { role: "user", content: request.user },
      ],
      // `nvext.guided_json` was removed from the current NVIDIA endpoint.
      // OpenAI-compatible JSON Schema output is supported by NIM and keeps the
      // response machine-readable without sending an unknown provider field.
      response_format: {
        type: "json_schema",
        json_schema: {
          name: request.schemaName,
          strict: true,
          schema: request.schema,
        },
      },
      chat_template_kwargs: { enable_thinking: false },
    };

    let lastError: Error = new Error("unknown");
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.attempt<T>(body, startedAt);
      } catch (error) {
        lastError = error as Error;
        const retryable = this.isRetryable(error as Error);
        if (!retryable || attempt === this.maxRetries) break;
        const delay = this.backoffMs(
          attempt,
          (error as { retryAfterMs?: number }).retryAfterMs,
        );
        this.logger.warn(
          `NVIDIA NIM ${this.model} falló (${lastError.message}); reintento ${attempt + 1}/${this.maxRetries} en ${delay} ms.`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  private async attempt<T>(
    body: unknown,
    startedAt: number,
  ): Promise<NvidiaNimResult<T>> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      const detail = (await response.text().catch(() => "")).slice(0, 500);
      const error = new Error(`HTTP ${response.status}: ${detail}`);
      if (response.status === 429 || response.status >= 500) {
        Object.assign(error, {
          retryAfterMs: this.parseRetryAfter(
            response.headers.get("retry-after"),
          ),
        });
      }
      if (response.status === 401 || response.status === 403) {
        throw new NvidiaNimUnavailableError(
          "NVIDIA rechazó la API key (401/403). Revisa NVIDIA_API_KEY en apps/backend/.env.",
        );
      }
      if (response.status === 429) {
        throw new NvidiaNimUnavailableError(
          "Se alcanzó el límite de peticiones del endpoint gratuito de NVIDIA (40/min). Reintenta en un minuto.",
        );
      }
      throw error;
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new NvidiaNimResponseError("La respuesta de NVIDIA vino vacía.");
    }

    return {
      data: this.parseJson<T>(content),
      usage: {
        promptTokens: payload.usage?.prompt_tokens ?? 0,
        completionTokens: payload.usage?.completion_tokens ?? 0,
      },
      latencyMs: Date.now() - startedAt,
    };
  }

  private parseJson<T>(content: string): T {
    // Guarded decoding should return bare JSON, but free-tier endpoints
    // occasionally wrap it in a fenced block.
    const cleaned = content
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      throw new NvidiaNimResponseError(
        "NVIDIA no devolvió JSON válido pese al guided_json.",
      );
    }
  }

  private isRetryable(error: Error): boolean {
    if (error instanceof NvidiaNimUnavailableError) return false;
    if (error.name === "TimeoutError" || error.name === "AbortError")
      return true;
    // fetch wraps connection failures in a TypeError.
    if (error instanceof TypeError) return true;
    return /HTTP (429|5\d\d)/.test(error.message);
  }

  private backoffMs(attempt: number, retryAfterMs?: number): number {
    if (retryAfterMs !== undefined) {
      return Math.min(retryAfterMs, MAX_RETRY_DELAY_MS);
    }
    return Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, MAX_RETRY_DELAY_MS);
  }

  private parseRetryAfter(header: string | null): number | undefined {
    if (!header) return undefined;
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1_000);
    const date = Date.parse(header);
    if (Number.isNaN(date)) return undefined;
    return Math.max(0, date - Date.now());
  }

  private readInt(name: string, fallback: number): number {
    const raw = Number(this.configService.get<string>(name));
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
  }
}
