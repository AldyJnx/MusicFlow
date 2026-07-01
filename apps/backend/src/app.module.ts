import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { existsSync } from "fs";
import { resolve } from "path";

// Core modules
import { HealthController } from "./health/health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { StorageModule } from "./modules/storage/storage.module";
import { QueueModule } from "./modules/queue/queue.module";
import { MailModule } from "./modules/mail/mail.module";

// Feature modules
import { AuthModule } from "./modules/auth/auth.module";
import { LibraryModule } from "./modules/library/library.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { EqualizerModule } from "./modules/equalizer/equalizer.module";
import { AiAgentModule } from "./modules/ai-agent/ai-agent.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { SyncModule } from "./modules/sync/sync.module";
import { PreferencesModule } from "./modules/preferences/preferences.module";
import { AdminModule } from "./modules/admin/admin.module";
import { BillingModule } from "./modules/billing/billing.module";

const envFilePath = [
  resolve(process.cwd(), "apps/backend/.env.local"),
  resolve(process.cwd(), "apps/backend/.env"),
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), ".env"),
].filter(existsSync);

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
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
    CatalogModule,
    EqualizerModule,
    AiAgentModule,
    AnalyticsModule,
    SyncModule,
    PreferencesModule,
    AdminModule,
    BillingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
