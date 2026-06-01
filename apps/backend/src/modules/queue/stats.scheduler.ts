import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

import { STATS_QUEUE, STATS_JOBS } from "./queue.constants";

@Injectable()
export class StatsScheduler {
  private readonly logger = new Logger(StatsScheduler.name);

  constructor(@InjectQueue(STATS_QUEUE) private readonly queue: Queue) {}

  @Cron("0 30 0 * * *")
  async enqueueDaily(): Promise<void> {
    await this.queue.add(STATS_JOBS.AGGREGATE_DAILY, {});
    this.logger.log("Daily stats job enqueued");
  }

  @Cron(CronExpression.EVERY_WEEK)
  async enqueueWeekly(): Promise<void> {
    await this.queue.add(STATS_JOBS.AGGREGATE_WEEKLY, {});
    this.logger.log("Weekly stats job enqueued");
  }

  @Cron("0 0 2 1 * *")
  async enqueueMonthly(): Promise<void> {
    await this.queue.add(STATS_JOBS.AGGREGATE_MONTHLY, {});
    this.logger.log("Monthly stats job enqueued");
  }
}
