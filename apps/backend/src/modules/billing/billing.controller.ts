import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import { QuotaService } from "./quota.service";
import { StripeService } from "./stripe.service";

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
    private readonly stripeService: StripeService,
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

  @Post("checkout")
  @ApiOperation({
    summary: "Create a Stripe Checkout session for the premium upgrade",
  })
  @ApiResponse({ status: 201, description: "Returns the hosted checkout URL" })
  @ApiResponse({ status: 503, description: "Stripe not configured" })
  async createCheckout(@CurrentUser() user: AuthUser) {
    return this.stripeService.createCheckoutSession(user.id);
  }

  @Public()
  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Stripe webhook receiver (signature verified)" })
  async webhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("stripe-signature") signature?: string,
  ) {
    // The raw body is captured by main.ts so signature verification sees
    // the unmodified payload. JSON-encoded fallback is for tests/dev.
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
    return this.stripeService.handleWebhook(raw, signature);
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
