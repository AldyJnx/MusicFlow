import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";

// Core modules
import { HealthController } from "./health/health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { StorageModule } from "./modules/storage/storage.module";
import { QueueModule } from "./modules/queue/queue.module";
import { MailModule } from "./modules/mail/mail.module";

// Feature modules
import { AuthModule } from "./modules/auth/auth.module";
import { LibraryModule } from "./modules/library/library.module";
import { EqualizerModule } from "./modules/equalizer/equalizer.module";
import { AiAgentModule } from "./modules/ai-agent/ai-agent.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { SyncModule } from "./modules/sync/sync.module";
import { PreferencesModule } from "./modules/preferences/preferences.module";
import { AdminModule } from "./modules/admin/admin.module";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", ".env.local"],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || "60") * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || "100"),
      },
    ]),

    // Database
    PrismaModule,

    // Storage (S3/MinIO)
    StorageModule,

    // Background jobs (BullMQ + Redis)
    QueueModule,

    // Email
    MailModule,

    // Features
    AuthModule,
    LibraryModule,
    EqualizerModule,
    AiAgentModule,
    AnalyticsModule,
    SyncModule,
    PreferencesModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
