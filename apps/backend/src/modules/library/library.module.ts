import { Module } from "@nestjs/common";
import { TracksController } from "./tracks.controller";
import { PlaylistsController } from "./playlists.controller";
import { TracksService } from "./tracks.service";
import { PlaylistsService } from "./playlists.service";
import { BillingModule } from "../billing/billing.module";

@Module({
  imports: [BillingModule],
  controllers: [TracksController, PlaylistsController],
  providers: [TracksService, PlaylistsService],
  exports: [TracksService, PlaylistsService],
})
export class LibraryModule {}
