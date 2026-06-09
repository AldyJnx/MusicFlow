import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { QuotaService } from "./quota.service";
import { StripeService } from "./stripe.service";

@Module({
  controllers: [BillingController],
  providers: [QuotaService, StripeService],
  exports: [QuotaService, StripeService],
})
export class BillingModule {}
