import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

type MemoryEntry = { value: string; expiresAt: number };

@Injectable()
export class RecommendationCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RecommendationCacheService.name);
  private readonly memory = new Map<string, MemoryEntry>();
  private readonly redis?: Redis;

  constructor(config: ConfigService) {
    const url = config.get<string>("REDIS_URL");
    if (url && config.get<string>("NODE_ENV") !== "test") {
      this.redis = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      this.redis.on("error", () => undefined);
    }
  }

  async get<T>(userId: string, limit: number): Promise<T | null> {
    const key = this.key(userId, limit);
    try {
      if (this.redis) {
        if (this.redis.status === "wait") await this.redis.connect();
        const value = await this.redis.get(key);
        return value ? (JSON.parse(value) as T) : null;
      }
    } catch {
      this.logger.warn("Redis unavailable; recommendation cache is in memory");
    }

    const entry = this.memory.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  async set<T>(userId: string, limit: number, value: T): Promise<void> {
    const key = this.key(userId, limit);
    const serialized = JSON.stringify(value);
    try {
      if (this.redis) {
        if (this.redis.status === "wait") await this.redis.connect();
        await this.redis.set(key, serialized, "EX", 600);
        return;
      }
    } catch {
      // The in-memory fallback keeps the endpoint responsive during Redis outages.
    }
    this.memory.set(key, {
      value: serialized,
      expiresAt: Date.now() + 600_000,
    });
  }

  async invalidate(userId: string): Promise<void> {
    const keys = Array.from({ length: 20 }, (_, i) => this.key(userId, i + 1));
    keys.forEach((key) => this.memory.delete(key));
    try {
      if (this.redis) {
        if (this.redis.status === "wait") await this.redis.connect();
        await this.redis.del(...keys);
      }
    } catch {
      // Cache invalidation is best-effort and must not block user actions.
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis?.status === "ready") await this.redis.quit();
  }

  private key(userId: string, limit: number): string {
    return `recommendations:home:${userId}:${limit}`;
  }
}
