import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { StatsPeriod } from "@prisma/client";

import { AnalyticsService } from "../analytics/analytics.service";
import { PrismaService } from "@/prisma/prisma.service";
import { STATS_QUEUE, STATS_JOBS, StatsJobName } from "./queue.constants";

@Processor(STATS_QUEUE)
export class StatsProcessor extends WorkerHost {
  private readonly logger = new Logger(StatsProcessor.name);

  constructor(
    private readonly analytics: AnalyticsService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<unknown, unknown, StatsJobName>): Promise<void> {
    const period = this.periodFor(job.name);
    if (!period) {
      this.logger.warn(`Unknown job name: ${job.name}`);
      return;
    }

    const since = this.sinceFor(period);
    const userIds = await this.prisma.playHistory
      .findMany({
        where: { playedAt: { gte: since } },
        distinct: ["userId"],
        select: { userId: true },
      })
      .then((rows) => rows.map((r) => r.userId));

    this.logger.log(
      `Aggregating ${period} stats for ${userIds.length} active users`,
    );

    for (const userId of userIds) {
      await this.analytics.aggregateAndPersist(userId, period);
    }
  }

  private periodFor(jobName: StatsJobName): StatsPeriod | null {
    switch (jobName) {
      case STATS_JOBS.AGGREGATE_DAILY:
        return StatsPeriod.DAY;
      case STATS_JOBS.AGGREGATE_WEEKLY:
        return StatsPeriod.WEEK;
      case STATS_JOBS.AGGREGATE_MONTHLY:
        return StatsPeriod.MONTH;
      default:
        return null;
    }
  }

  private sinceFor(period: StatsPeriod): Date {
    const now = new Date();
    switch (period) {
      case StatsPeriod.DAY:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case StatsPeriod.WEEK:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case StatsPeriod.MONTH:
        return new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
      default:
        return new Date(0);
    }
  }
}
