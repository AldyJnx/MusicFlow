import { Module } from '@nestjs/common';
import { TracksController } from './tracks.controller';
import { PlaylistsController } from './playlists.controller';
import { TracksService } from './tracks.service';
import { PlaylistsService } from './playlists.service';

@Module({
  controllers: [TracksController, PlaylistsController],
  providers: [TracksService, PlaylistsService],
  exports: [TracksService, PlaylistsService],
})
export class LibraryModule {}
