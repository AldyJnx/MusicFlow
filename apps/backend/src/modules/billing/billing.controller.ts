import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
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
  constructor(private readonly quotaService: QuotaService) {}

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
