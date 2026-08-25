import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Queue } from "bullmq";
import { PrismaService } from "@/prisma/prisma.service";
import { NOTIFICATIONS_JOBS, NOTIFICATIONS_QUEUE } from "./queue.constants";

@Injectable()
export class ReengagementScheduler {
  private readonly logger = new Logger(ReengagementScheduler.name);

  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async enqueueInactiveUsers(): Promise<void> {
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        notificationConsent: true,
        lastActiveAt: { lte: cutoff },
        reengagementNotifiedAt: null,
        devices: { some: { isActive: true, fcmToken: { not: null } } },
      },
      select: {
        id: true,
        lastActiveAt: true,
      },
      take: 1000,
    });

    let queued = 0;
    for (const user of users) {
      const cycle = user.lastActiveAt?.getTime() ?? 0;
      await this.queue.add(
        NOTIFICATIONS_JOBS.REENGAGEMENT,
        { userId: user.id },
        { jobId: `reengagement-${user.id}-${cycle}`, removeOnComplete: 1000 },
      );
      queued += 1;
    }
    if (queued > 0)
      this.logger.log(`Queued ${queued} reengagement notifications`);
  }
}
