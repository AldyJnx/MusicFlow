import { Global, Module } from "@nestjs/common";
import { RecommendationCacheService } from "./recommendation-cache.service";
import { RecommendationsController } from "./recommendations.controller";
import { RecommendationsService } from "./recommendations.service";

@Global()
@Module({
  controllers: [RecommendationsController],
  providers: [RecommendationCacheService, RecommendationsService],
  exports: [RecommendationCacheService, RecommendationsService],
})
export class RecommendationsModule {}
