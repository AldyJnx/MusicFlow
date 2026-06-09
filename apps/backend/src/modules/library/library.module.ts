import { Module } from "@nestjs/common";
import { TracksController } from "./tracks.controller";
import { PlaylistsController } from "./playlists.controller";
import { LibrarySavesController } from "./library-saves.controller";
import { TracksService } from "./tracks.service";
import { PlaylistsService } from "./playlists.service";
import { LibrarySavesService } from "./library-saves.service";
import { BillingModule } from "../billing/billing.module";

@Module({
  imports: [BillingModule],
  controllers: [TracksController, PlaylistsController, LibrarySavesController],
  providers: [TracksService, PlaylistsService, LibrarySavesService],
  exports: [TracksService, PlaylistsService, LibrarySavesService],
})
export class LibraryModule {}
