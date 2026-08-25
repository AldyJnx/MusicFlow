import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { QuotaService } from "./quota.service";

interface AuthUser {
  id: string;
  isPremium: boolean;
}

@ApiTags("billing")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("billing")
export class BillingController {
  constructor(
    private readonly quotaService: QuotaService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("quota")
  @ApiOperation({
    summary: "Get current quota usage across uploads, AI requests, and presets",
  })
  async getQuota(@CurrentUser() user: AuthUser) {
    const [uploads, ai, presets] = await Promise.all([
      this.quotaService.getUploadQuota(user),
      this.quotaService.getAiQuota(user),
      this.quotaService.getCustomPresetQuota(user),
    ]);
    return {
      isPremium: user.isPremium,
      uploads: serializeQuota(uploads),
      aiRequests: serializeQuota(ai),
      customPresets: serializeQuota(presets),
    };
  }

  @Post("simulate-upgrade")
  @ApiOperation({
    summary: "[DEV] Flip the current user to premium without a real charge",
    description:
      "Simulated checkout path for demos and showcases. Sets is_premium=true on the authenticated user and returns the fresh isPremium flag. Do not expose this in production.",
  })
  @ApiResponse({ status: 200, description: "User upgraded to premium" })
  @HttpCode(HttpStatus.OK)
  async simulateUpgrade(@CurrentUser() user: AuthUser) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isPremium: true },
    });
    return { isPremium: true };
  }
}

function serializeQuota(q: {
  used: number;
  limit: number;
  remaining: number;
  resetAt?: Date;
}) {
  return {
    used: q.used,
    limit: Number.isFinite(q.limit) ? q.limit : null,
    remaining: Number.isFinite(q.remaining) ? q.remaining : null,
    resetAt: q.resetAt?.toISOString(),
  };
}
