import { ReengagementScheduler } from "./reengagement.scheduler";

describe("ReengagementScheduler", () => {
  it("queues each pending inactivity cycle with a deterministic job id", async () => {
    const lastActiveAt = new Date("2026-08-10T12:00:00.000Z");
    const queue = { add: jest.fn().mockResolvedValue(undefined) };
    const prisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([
          { id: "user-1", lastActiveAt },
          { id: "user-2", lastActiveAt: null },
        ]),
      },
    };
    const scheduler = new ReengagementScheduler(
      queue as never,
      prisma as never,
    );

    await scheduler.enqueueInactiveUsers();

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ reengagementNotifiedAt: null }),
      }),
    );
    expect(queue.add).toHaveBeenNthCalledWith(
      1,
      "reengagement",
      { userId: "user-1" },
      expect.objectContaining({
        jobId: `reengagement-user-1-${lastActiveAt.getTime()}`,
      }),
    );
    expect(queue.add).toHaveBeenNthCalledWith(
      2,
      "reengagement",
      { userId: "user-2" },
      expect.objectContaining({ jobId: "reengagement-user-2-0" }),
    );
  });
});
