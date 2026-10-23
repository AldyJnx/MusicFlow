import { ConfigService } from "@nestjs/config";
import {
  NvidiaNimClient,
  NvidiaNimResponseError,
  NvidiaNimUnavailableError,
} from "./nvidia-nim.client";

function makeClient(env: Record<string, string | undefined>) {
  const config = {
    get: (key: string) => env[key],
  } as unknown as ConfigService;
  return new NvidiaNimClient(config);
}

const OK_BODY = {
  choices: [{ message: { content: '{"items":[]}' } }],
  usage: { prompt_tokens: 11, completion_tokens: 7 },
};

describe("NvidiaNimClient", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function mockFetch(
    responses: {
      status: number;
      body: unknown;
      headers?: Record<string, string>;
    }[],
  ) {
    let call = 0;
    global.fetch = jest.fn(async () => {
      const next = responses[Math.min(call, responses.length - 1)];
      call += 1;
      return {
        ok: next.status >= 200 && next.status < 300,
        status: next.status,
        headers: { get: (k: string) => next.headers?.[k] ?? null },
        json: async () => next.body,
        text: async () => JSON.stringify(next.body),
      };
    }) as unknown as typeof fetch;
    return global.fetch as jest.Mock;
  }

  it("stays disabled when the key is empty or a placeholder", () => {
    expect(makeClient({ NVIDIA_API_KEY: "" }).isEnabled()).toBe(false);
    expect(
      makeClient({ NVIDIA_API_KEY: "your-nvidia-api-key" }).isEnabled(),
    ).toBe(false);
  });

  it("rejects immediately when disabled, without calling the network", async () => {
    const client = makeClient({ NVIDIA_API_KEY: "" });
    const fetchSpy = mockFetch([{ status: 200, body: OK_BODY }]);

    await expect(
      client.completeJson({
        system: "s",
        user: "u",
        schema: {},
        schemaName: "T",
      }),
    ).rejects.toBeInstanceOf(NvidiaNimUnavailableError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends the JSON schema response format and disables thinking", async () => {
    const client = makeClient({ NVIDIA_API_KEY: "nvapi-test" });
    const fetchSpy = mockFetch([{ status: 200, body: OK_BODY }]);

    await client.completeJson({
      system: "sistema",
      user: "entrada",
      schema: { type: "object" },
      schemaName: "T",
    });

    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    const sent = JSON.parse(init.body as string);
    expect(sent.model).toBe("nvidia/nemotron-3-super-120b-a12b");
    expect(sent.response_format).toEqual({
      type: "json_schema",
      json_schema: { name: "T", strict: true, schema: { type: "object" } },
    });
    // The endpoint no longer accepts the provider-specific guided_json field.
    expect(sent.nvext).toBeUndefined();
    expect(sent.chat_template_kwargs).toEqual({ enable_thinking: false });
    expect(sent.messages[0]).toEqual({ role: "system", content: "sistema" });
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer nvapi-test",
    );
  });

  it("parses usage from the response", async () => {
    const client = makeClient({ NVIDIA_API_KEY: "nvapi-test" });
    mockFetch([{ status: 200, body: OK_BODY }]);

    const result = await client.completeJson({
      system: "s",
      user: "u",
      schema: {},
      schemaName: "T",
    });

    expect(result.data).toEqual({ items: [] });
    expect(result.usage).toEqual({ promptTokens: 11, completionTokens: 7 });
  });

  it("strips a fenced code block around the JSON", async () => {
    const client = makeClient({ NVIDIA_API_KEY: "nvapi-test" });
    mockFetch([
      {
        status: 200,
        body: {
          ...OK_BODY,
          choices: [{ message: { content: '```json\n{"items":[1]}\n```' } }],
        },
      },
    ]);

    const result = await client.completeJson({
      system: "s",
      user: "u",
      schema: {},
      schemaName: "T",
    });
    expect(result.data).toEqual({ items: [1] });
  });

  it("maps 401/403 to a configuration error and does not retry", async () => {
    const client = makeClient({ NVIDIA_API_KEY: "nvapi-test" });
    const fetchSpy = mockFetch([{ status: 401, body: { error: "bad key" } }]);

    await expect(
      client.completeJson({
        system: "s",
        user: "u",
        schema: {},
        schemaName: "T",
      }),
    ).rejects.toBeInstanceOf(NvidiaNimUnavailableError);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("maps 429 to a free-tier limit error and does not retry", async () => {
    const client = makeClient({ NVIDIA_API_KEY: "nvapi-test" });
    const fetchSpy = mockFetch([{ status: 429, body: { error: "rate" } }]);

    await expect(
      client.completeJson({
        system: "s",
        user: "u",
        schema: {},
        schemaName: "T",
      }),
    ).rejects.toBeInstanceOf(NvidiaNimUnavailableError);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("retries 5xx up to the configured limit", async () => {
    const client = makeClient({
      NVIDIA_API_KEY: "nvapi-test",
      NVIDIA_AI_MAX_RETRIES: "2",
    });
    const fetchSpy = mockFetch([
      { status: 503, body: { error: "upstream" } },
      { status: 503, body: { error: "upstream" } },
      { status: 200, body: OK_BODY },
    ]);

    const result = await client.completeJson({
      system: "s",
      user: "u",
      schema: {},
      schemaName: "T",
    });

    expect(result.data).toEqual({ items: [] });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("does not retry a 400", async () => {
    const client = makeClient({
      NVIDIA_API_KEY: "nvapi-test",
      NVIDIA_AI_MAX_RETRIES: "3",
    });
    const fetchSpy = mockFetch([{ status: 400, body: { error: "schema" } }]);

    await expect(
      client.completeJson({
        system: "s",
        user: "u",
        schema: {},
        schemaName: "T",
      }),
    ).rejects.toThrow(/HTTP 400/);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("throws a response error when the payload is not JSON", async () => {
    const client = makeClient({ NVIDIA_API_KEY: "nvapi-test" });
    mockFetch([
      {
        status: 200,
        body: { choices: [{ message: { content: "not json" } }] },
      },
    ]);

    await expect(
      client.completeJson({
        system: "s",
        user: "u",
        schema: {},
        schemaName: "T",
      }),
    ).rejects.toBeInstanceOf(NvidiaNimResponseError);
  });

  it("honours a custom model and strips a trailing slash from the base URL", async () => {
    const client = makeClient({
      NVIDIA_API_KEY: "nvapi-test",
      NVIDIA_AI_MODEL: "nvidia/otro-model",
      NVIDIA_AI_BASE_URL: "https://nim.example.com/v1/",
    });
    const fetchSpy = mockFetch([{ status: 200, body: OK_BODY }]);

    await client.completeJson({
      system: "s",
      user: "u",
      schema: {},
      schemaName: "T",
    });

    expect(fetchSpy.mock.calls[0][0]).toBe(
      "https://nim.example.com/v1/chat/completions",
    );
    expect(
      JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
        .model,
    ).toBe("nvidia/otro-model");
  });
});
