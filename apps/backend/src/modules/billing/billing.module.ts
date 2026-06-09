import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { QuotaService } from "./quota.service";

@Module({
  controllers: [BillingController],
  providers: [QuotaService],
  exports: [QuotaService],
})
export class BillingModule {}
