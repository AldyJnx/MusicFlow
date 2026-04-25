import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

// Core modules
import { PrismaModule } from './prisma/prisma.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { LibraryModule } from './modules/library/library.module';
import { EqualizerModule } from './modules/equalizer/equalizer.module';
import { AiAgentModule } from './modules/ai-agent/ai-agent.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SyncModule } from './modules/sync/sync.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.THROTTLE_TTL || '60') * 1000,
      limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
    }]),

    // Database
    PrismaModule,

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
})
export class AppModule {}
