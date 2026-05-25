import { Test, TestingModule } from "@nestjs/testing";

import { ConfigsService } from "./configs.service";
import { PrismaService } from "@/prisma/prisma.service";

describe("ConfigsService.resolveForTrack (priority)", () => {
  let service: ConfigsService;
  let findMany: jest.Mock;

  beforeEach(async () => {
    findMany = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigsService,
        {
          provide: PrismaService,
          useValue: { eQConfig: { findMany } },
        },
      ],
    }).compile();
    service = module.get(ConfigsService);
  });

  it("returns TRACK config when present (highest priority of the three)", async () => {
    findMany.mockResolvedValue([
      { scopeType: "GLOBAL", id: "g1" },
      { scopeType: "PLAYLIST", id: "p1" },
      { scopeType: "TRACK", id: "t1" },
    ]);
    const result = await service.resolveForTrack("u1", "track1", "pl1");
    expect(result?.id).toBe("t1");
  });

  it("falls back to PLAYLIST when no TRACK config", async () => {
    findMany.mockResolvedValue([
      { scopeType: "GLOBAL", id: "g1" },
      { scopeType: "PLAYLIST", id: "p1" },
    ]);
    const result = await service.resolveForTrack("u1", "track1", "pl1");
    expect(result?.id).toBe("p1");
  });

  it("falls back to GLOBAL when no TRACK/PLAYLIST", async () => {
    findMany.mockResolvedValue([{ scopeType: "GLOBAL", id: "g1" }]);
    const result = await service.resolveForTrack("u1", "track1");
    expect(result?.id).toBe("g1");
  });

  it("returns null when nothing matches", async () => {
    findMany.mockResolvedValue([]);
    const result = await service.resolveForTrack("u1", "track1");
    expect(result).toBeNull();
  });
});
