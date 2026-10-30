import { Module } from "@nestjs/common";
import { CatalogModule } from "@/modules/catalog/catalog.module";
import { LibraryModule } from "@/modules/library/library.module";
import {
  ArtistPortalAdminController,
  ArtistVerificationAdminController,
} from "./artist-portal-admin.controller";
import { ArtistPortalController } from "./artist-portal.controller";
import { ArtistPortalService } from "./artist-portal.service";

@Module({
  imports: [CatalogModule, LibraryModule],
  controllers: [
    ArtistPortalController,
    ArtistPortalAdminController,
    ArtistVerificationAdminController,
  ],
  providers: [ArtistPortalService],
})
export class ArtistPortalModule {}
