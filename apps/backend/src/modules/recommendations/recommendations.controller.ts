import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RecommendationsService } from "./recommendations.service";

@ApiTags("recommendations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("recommendations")
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Get("home")
  @ApiOperation({
    summary: "Personalized and diverse recommendations for Home",
  })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 6 })
  home(@CurrentUser("id") userId: string, @Query("limit") limit?: number) {
    return this.recommendations.home(userId, limit);
  }
}
