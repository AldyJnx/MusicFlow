import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CatalogAiFindingStatus } from "@prisma/client";
import { CatalogAiService } from "./catalog-ai.service";
import { NvidiaNimClient } from "./nvidia-nim.client";

const ACTOR_ID = "11111111-1111-1111-1111-111111111111";

type PrismaMock = Record<string, Record<string, jest.Mock>>;

describe("CatalogAiService", () => {
  let service: CatalogAiService;
  let prisma: PrismaMock;
  let catalogService: { updateAlbum: jest.Mock; assignTrack: jest.Mock };
  let nvidia: {
    isEnabled: jest.Mock;
    modelName: string;
    completeJson: jest.Mock;
  };
  let batchSizeEnv: string | undefined;

  beforeEach(() => {
    batchSizeEnv = undefined;
    prisma = {
      album: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      track: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      artist: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      aIRequest: {
        create: jest.fn().mockResolvedValue({ id: "ai-request-1" }),
      },
      catalogAiRun: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      catalogAiFinding: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        groupBy: jest.fn(),
      },
    };
    catalogService = { updateAlbum: jest.fn(), assignTrack: jest.fn() };
    nvidia = {
      isEnabled: jest.fn().mockReturnValue(true),
      modelName: "nvidia/nemotron-3-super-120b-a12b",
      completeJson: jest.fn(),
    };
    const config = {
      get: (key: string) =>
        key === "CATALOG_AI_MAX_BATCH" ? batchSizeEnv : undefined,
    } as unknown as ConfigService;
    service = new CatalogAiService(
      prisma as never,
      catalogService as never,
      nvidia as unknown as NvidiaNimClient,
      config,
    );
  });

  describe("runTask gating", () => {
    it("refuses to run when the key is missing", async () => {
      nvidia.isEnabled.mockReturnValue(false);
      await expect(
        service.runTask("ALBUM_YEAR", ACTOR_ID),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.catalogAiRun.create).not.toHaveBeenCalled();
    });

    it("records an empty run without calling the model when there is nothing to fix", async () => {
      prisma.album.findMany.mockResolvedValue([]);
      prisma.catalogAiRun.create.mockResolvedValue({ id: "run-1" });

      const run = await service.runTask("ALBUM_YEAR", ACTOR_ID);

      expect(nvidia.completeJson).not.toHaveBeenCalled();
      expect(run).toEqual({ id: "run-1" });
    });
  });

  describe("answerAdminQuestion", () => {
    it("answers lyric counts from the current catalog without asking NVIDIA", async () => {
      prisma.track.count.mockResolvedValueOnce(12).mockResolvedValueOnce(5);

      await expect(
        service.answerAdminQuestion(
          "¿Cuántas canciones tienen lyrics y cuántas no tienen?",
        ),
      ).resolves.toEqual({
        answer:
          "En el catálogo actual hay 7 canción(es) con letra y 5 sin letra, de 12 en total.",
        model: "nvidia/nemotron-3-super-120b-a12b",
      });
      expect(nvidia.completeJson).not.toHaveBeenCalled();
    });

    it("lists bounded real catalog tracks missing lyrics without asking NVIDIA", async () => {
      prisma.track.count.mockResolvedValueOnce(2);
      prisma.track.findMany.mockResolvedValueOnce([
        { artist: "Artista A", title: "Sin letra" },
        { artist: "Artista B", title: "Otra sin letra" },
      ]);

      await expect(
        service.answerAdminQuestion("¿Qué canciones faltan lyrics?"),
      ).resolves.toEqual({
        answer:
          "Hay 2 canción(es) sin letra: Artista A — Sin letra; Artista B — Otra sin letra.",
        model: "nvidia/nemotron-3-super-120b-a12b",
      });
      expect(nvidia.completeJson).not.toHaveBeenCalled();
      expect(prisma.track.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 25 }),
      );
    });

    it("audits an admin NVIDIA question before returning its response", async () => {
      prisma.track.count.mockResolvedValueOnce(12).mockResolvedValueOnce(5);

      await service.answerAdminQuestion(
        "Cuántas canciones tienen lyrics y cuántas no tienen?",
        ACTOR_ID,
      );

      expect(prisma.aIRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: ACTOR_ID,
          context: { source: "NVIDIA_ADMIN", scope: "catalog" },
          modelUsed: "nvidia/nemotron-3-super-120b-a12b",
        }),
      });
    });

    it("does not return a successful answer when the NVIDIA audit cannot persist", async () => {
      prisma.track.count.mockResolvedValueOnce(12).mockResolvedValueOnce(5);
      prisma.aIRequest.create.mockRejectedValueOnce(new Error("database down"));

      await expect(
        service.answerAdminQuestion(
          "Cuántas canciones tienen lyrics y cuántas no tienen?",
          ACTOR_ID,
        ),
      ).rejects.toThrow("database down");
    });

    it("allows useful music metadata questions while retaining the MusicFlow scope", async () => {
      nvidia.completeJson.mockResolvedValue({
        data: {
          answer:
            "Michael Jackson fue un artista estadounidense influyente del pop, soul y R&B.",
        },
        usage: { promptTokens: 20, completionTokens: 18 },
      });

      await expect(
        service.answerAdminQuestion(
          "¿Qué descripción breve puedo colocar a Michael Jackson?",
          ACTOR_ID,
        ),
      ).resolves.toEqual({
        answer:
          "Michael Jackson fue un artista estadounidense influyente del pop, soul y R&B.",
        model: "nvidia/nemotron-3-super-120b-a12b",
      });
      expect(nvidia.completeJson).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining("descripciones breves"),
        }),
      );
    });

    it("refuses programming requests outside MusicFlow without calling NVIDIA", async () => {
      await service.answerAdminQuestion("Dame un script de Python", ACTOR_ID);

      expect(nvidia.completeJson).not.toHaveBeenCalled();
      expect(prisma.aIRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            response: expect.objectContaining({
              answer: expect.stringContaining("código"),
            }),
          }),
        }),
      );
    });
  });

  describe("runTask proposals", () => {
    beforeEach(() => {
      prisma.album.findMany.mockResolvedValue([
        {
          id: "album-1",
          title: "Álbom",
          artist: { name: "Artista" },
          tracks: [{ title: "Pista", year: 1998, trackNumber: 1 }],
        },
        {
          id: "album-2",
          title: "Otro",
          artist: { name: "Artista" },
          tracks: [{ title: "Pista 2", year: 2005, trackNumber: 1 }],
        },
      ]);
      prisma.catalogAiRun.create.mockResolvedValue({ id: "run-1" });
    });

    it("persists only proposals whose id was part of the input", async () => {
      nvidia.completeJson.mockResolvedValue({
        data: {
          items: [
            {
              albumId: "album-1",
              year: 1998,
              confidence: "HIGH",
              reasoning: "ok",
            },
            {
              albumId: "album-inexistente",
              year: 1970,
              confidence: "LOW",
              reasoning: "inventado",
            },
          ],
        },
        usage: { promptTokens: 5, completionTokens: 3 },
        latencyMs: 10,
      });

      await service.runTask("ALBUM_YEAR", ACTOR_ID);

      const createArgs = prisma.catalogAiRun.create.mock.calls[0][0];
      const created = createArgs.data.findings.create;
      expect(created).toHaveLength(1);
      expect(created[0].entityId).toBe("album-1");
      expect(created[0].proposedValue).toEqual({ year: 1998 });
    });

    it("drops out-of-range years", async () => {
      nvidia.completeJson.mockResolvedValue({
        data: {
          items: [
            {
              albumId: "album-1",
              year: 1200,
              confidence: "HIGH",
              reasoning: "x",
            },
            {
              albumId: "album-2",
              year: 2020,
              confidence: "MEDIUM",
              reasoning: "y",
            },
          ],
        },
        usage: { promptTokens: 1, completionTokens: 1 },
        latencyMs: 1,
      });

      await service.runTask("ALBUM_YEAR", ACTOR_ID);

      const created =
        prisma.catalogAiRun.create.mock.calls[0][0].data.findings.create;
      expect(created.map((f: { entityId: string }) => f.entityId)).toEqual([
        "album-2",
      ]);
    });

    it("normalises an unknown confidence to LOW", async () => {
      nvidia.completeJson.mockResolvedValue({
        data: {
          items: [
            {
              albumId: "album-1",
              year: 1998,
              confidence: "MUY_ALTO",
              reasoning: "x",
            },
          ],
        },
        usage: { promptTokens: 1, completionTokens: 1 },
        latencyMs: 1,
      });

      await service.runTask("ALBUM_YEAR", ACTOR_ID);

      const created =
        prisma.catalogAiRun.create.mock.calls[0][0].data.findings.create;
      expect(created[0].confidence).toBe("LOW");
    });

    it("marks the run PARTIAL when a batch fails but others succeed", async () => {
      // One item per batch, so the two candidates become two separate calls.
      batchSizeEnv = "1";
      service = new CatalogAiService(
        prisma as never,
        catalogService as never,
        nvidia as unknown as NvidiaNimClient,
        {
          get: (key: string) =>
            key === "CATALOG_AI_MAX_BATCH" ? "1" : undefined,
        } as unknown as ConfigService,
      );
      const error = Object.assign(new Error("HTTP 500"), {});
      nvidia.completeJson.mockRejectedValueOnce(error).mockResolvedValueOnce({
        data: {
          items: [
            {
              albumId: "album-2",
              year: 2005,
              confidence: "HIGH",
              reasoning: "y",
            },
          ],
        },
        usage: { promptTokens: 1, completionTokens: 1 },
        latencyMs: 1,
      });

      await service.runTask("ALBUM_YEAR", ACTOR_ID, { limit: 2 });

      const data = prisma.catalogAiRun.create.mock.calls[0][0].data;
      expect(data.status).toBe("PARTIAL");
      expect(data.error).toContain("HTTP 500");
      expect(data.proposed).toBe(1);
    });
  });

  describe("TRACK_ALBUM_MATCH validation", () => {
    beforeEach(() => {
      prisma.track.findMany.mockResolvedValue([
        {
          id: "track-1",
          title: "Pista",
          artist: "Artista",
          album: "",
          durationMs: 210_000,
          artistId: "artist-1",
          artistRef: { id: "artist-1", name: "Artista" },
        },
      ]);
      prisma.album.findMany.mockResolvedValue([
        {
          id: "album-ok",
          title: "Disco",
          year: 1998,
          tracks: [{ title: "Otra", albumOrder: 1 }],
        },
      ]);
      prisma.catalogAiRun.create.mockResolvedValue({ id: "run-1" });
    });

    it("accepts an album that was offered as a candidate", async () => {
      nvidia.completeJson.mockResolvedValue({
        data: {
          items: [
            {
              trackId: "track-1",
              albumId: "album-ok",
              albumOrder: 2,
              confidence: "MEDIUM",
              reasoning: "r",
            },
          ],
        },
        usage: { promptTokens: 1, completionTokens: 1 },
        latencyMs: 1,
      });

      await service.runTask("TRACK_ALBUM_MATCH", ACTOR_ID);

      const created =
        prisma.catalogAiRun.create.mock.calls[0][0].data.findings.create;
      expect(created[0].proposedValue).toEqual({
        albumId: "album-ok",
        albumOrder: 2,
      });
    });

    it("rejects an album that was not offered", async () => {
      nvidia.completeJson.mockResolvedValue({
        data: {
          items: [
            {
              trackId: "track-1",
              albumId: "album-inventado",
              albumOrder: 2,
              confidence: "HIGH",
              reasoning: "r",
            },
          ],
        },
        usage: { promptTokens: 1, completionTokens: 1 },
        latencyMs: 1,
      });

      await service.runTask("TRACK_ALBUM_MATCH", ACTOR_ID);

      const created =
        prisma.catalogAiRun.create.mock.calls[0][0].data.findings.create;
      expect(created).toHaveLength(0);
    });
  });

  describe("applyFinding", () => {
    it("404s on an unknown finding", async () => {
      prisma.catalogAiFinding.findUnique.mockResolvedValue(null);
      await expect(
        service.applyFinding("nope", ACTOR_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("applies an album year through CatalogService", async () => {
      prisma.catalogAiFinding.findUnique.mockResolvedValue({
        id: "f1",
        status: CatalogAiFindingStatus.PROPOSED,
        entityId: "album-1",
        proposedValue: { year: 1998 },
        run: { id: "run-1", task: "ALBUM_YEAR" },
      });
      prisma.catalogAiFinding.update.mockResolvedValue({ id: "f1" });
      prisma.catalogAiFinding.groupBy.mockResolvedValue([]);
      prisma.catalogAiRun.update.mockResolvedValue({});

      await service.applyFinding("f1", ACTOR_ID);

      expect(catalogService.updateAlbum).toHaveBeenCalledWith("album-1", {
        year: 1998,
      });
      expect(prisma.catalogAiFinding.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "f1" },
          data: expect.objectContaining({ status: "APPLIED" }),
        }),
      );
    });

    it("refuses to apply the lyrics task, because the model never returns lyric text", async () => {
      prisma.catalogAiFinding.findUnique.mockResolvedValue({
        id: "f2",
        status: CatalogAiFindingStatus.PROPOSED,
        entityId: "track-1",
        proposedValue: { searchHint: "letra de X" },
        run: { id: "run-1", task: "MISSING_LYRICS" },
      });
      prisma.catalogAiFinding.update.mockResolvedValue({ id: "f2" });

      await expect(service.applyFinding("f2", ACTOR_ID)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      // The finding is marked FAILED with the reason instead of silently no-op.
      expect(prisma.catalogAiFinding.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "FAILED" }),
        }),
      );
    });

    it("refuses to apply an already applied finding", async () => {
      prisma.catalogAiFinding.findUnique.mockResolvedValue({
        id: "f3",
        status: CatalogAiFindingStatus.APPLIED,
        run: { id: "run-1", task: "ALBUM_YEAR" },
      });

      await expect(service.applyFinding("f3", ACTOR_ID)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe("report", () => {
    it("counts every category without touching the model", async () => {
      prisma.album.count.mockResolvedValue(3);
      prisma.track.count.mockResolvedValue(7);
      prisma.artist.count.mockResolvedValue(2);

      const report = await service.report();

      expect(report.counts).toEqual({
        ALBUM_YEAR: 3,
        TRACK_ALBUM_MATCH: 7,
        MISSING_LYRICS: 7,
        MISSING_ARTIST_IMAGE: 2,
      });
      expect(nvidia.completeJson).not.toHaveBeenCalled();
    });
  });
});
