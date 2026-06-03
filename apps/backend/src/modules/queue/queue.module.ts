import { Module, Global } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { ScheduleModule } from "@nestjs/schedule";

import { AnalyticsModule } from "../analytics/analytics.module";
import { StatsProcessor } from "./stats.processor";
import { StatsScheduler } from "./stats.scheduler";
import { STATS_QUEUE } from "./queue.constants";

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
            // BullMQ requirement; also avoids noisy reconnect loops on managed Redis.
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: STATS_QUEUE }),
    AnalyticsModule,
  ],
  providers: [StatsProcessor, StatsScheduler],
  exports: [BullModule],
})
export class QueueModule {}
