import { Module, Global } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { ScheduleModule } from "@nestjs/schedule";

import { AnalyticsModule } from "../analytics/analytics.module";
import { StatsProcessor } from "./stats.processor";
import { StatsScheduler } from "./stats.scheduler";
import { STATS_QUEUE } from "./queue.constants";
import { NOTIFICATIONS_QUEUE } from "./queue.constants";
import { NotificationsModule } from "../notifications/notifications.module";
import { ReengagementScheduler } from "./reengagement.scheduler";
import { ReengagementProcessor } from "./reengagement.processor";

@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>("REDIS_URL") ?? "redis://localhost:6379";
        const parsed = new URL(url);
        const isTls = parsed.protocol === "rediss:";
        return {
          connection: {
            host: parsed.hostname,
            port: Number(parsed.port || 6379),
            username: parsed.username || undefined,
            password: parsed.password || undefined,
            // Upstash and other managed Redis providers require TLS (rediss://).
            ...(isTls ? { tls: { servername: parsed.hostname } } : {}),
            // BullMQ requires this to manage retries itself.
            maxRetriesPerRequest: null,
            // Redis readiness probing was the dominant local startup cost
            // (roughly 8.5 seconds). BullMQ reconnects in the background if
            // Redis is temporarily unavailable, so the API can expose health
            // endpoints instead of blocking every route registration.
            enableReadyCheck: false,
            connectTimeout: 1_500,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: STATS_QUEUE }),
    BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
    AnalyticsModule,
    NotificationsModule,
  ],
  providers: [
    StatsProcessor,
    StatsScheduler,
    ReengagementProcessor,
    ReengagementScheduler,
  ],
  exports: [BullModule],
})
export class QueueModule {}
