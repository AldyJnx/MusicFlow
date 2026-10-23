import { Module } from "@nestjs/common";
import { CatalogAiController } from "./catalog-ai.controller";
import { CatalogAiService } from "./catalog-ai.service";
import { NvidiaNimClient } from "./nvidia-nim.client";
import { CatalogModule } from "../catalog/catalog.module";

@Module({
  imports: [CatalogModule],
  controllers: [CatalogAiController],
  providers: [CatalogAiService, NvidiaNimClient],
  exports: [CatalogAiService],
})
export class CatalogAiModule {}
