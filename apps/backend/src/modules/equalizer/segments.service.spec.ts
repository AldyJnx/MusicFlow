import { BadRequestException } from "@nestjs/common";

import { SegmentsService } from "./segments.service";

describe("SegmentsService range validation", () => {
  const userId = "user-1";
  const createPayload = {
    trackId: "track-1",
    startMs: 10_000,
    endMs: 20_000,
    eqConfig: { bands: Array.from({ length: 10 }, () => 0) },
  };

  function createService(overlap: unknown = null) {
    const transaction = {
      eQConfig: { create: jest.fn().mockResolvedValue({ id: "config-1" }) },
      eQSegment: { create: jest.fn().mockResolvedValue({ id: "segment-1" }) },
    };
    const prisma = {
      track: { findFirst: jest.fn().mockResolvedValue({ durationMs: 60_000 }) },
      eQSegment: { findFirst: jest.fn().mockResolvedValue(overlap) },
      $transaction: jest.fn((callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    return { prisma, service: new SegmentsService(prisma as never) };
  }

  it("allows a non-overlapping segment after another segment", async () => {
    const { prisma, service } = createService();
    await expect(service.create(userId, createPayload)).resolves.toEqual({
      id: "segment-1",
    });
    expect(prisma.eQSegment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          startMs: { lt: 20_000 },
          endMs: { gt: 10_000 },
        }),
      }),
    );
  });

  it("rejects a genuinely intersecting segment", async () => {
    const { service } = createService({ id: "existing" });
    await expect(service.create(userId, createPayload)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("checks intersections when a segment is moved during editing", async () => {
    const prisma = {
      eQSegment: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: "segment-1",
            trackId: "track-1",
            userId,
            startMs: 0,
            endMs: 5_000,
            eqConfigId: "config-1",
            track: { durationMs: 60_000 },
          })
          .mockResolvedValueOnce({ id: "segment-2" }),
      },
      $transaction: jest.fn(),
    };
    const service = new SegmentsService(prisma as never);
    await expect(
      service.update("segment-1", userId, { startMs: 4_000, endMs: 8_000 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
