import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class LibrarySavesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add a track to the user's "Liked Songs". The track must be visible to the
   * caller — i.e. owned by them OR part of the public catalog. Trying to save
   * a track that isn't visible returns a 404 to avoid leaking IDs.
   *
   * Saving an owned track is a no-op (owners are implicitly saved) but we
   * still return success so the UI doesn't need a special case.
   */
  async save(userId: string, trackId: string) {
    const track = await this.prisma.track.findFirst({
      where: { id: trackId, OR: [{ userId }, { isCatalog: true }] },
      select: { id: true, userId: true, isCatalog: true },
    });

    if (!track) {
      throw new NotFoundException("Track not found");
    }

    if (track.userId === userId) {
      return { trackId, savedAt: new Date(), implicit: true };
    }

    try {
      const row = await this.prisma.userLibrarySave.create({
        data: { userId, trackId },
      });
      return { trackId: row.trackId, savedAt: row.savedAt, implicit: false };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        // Already saved — idempotent.
        const existing = await this.prisma.userLibrarySave.findUnique({
          where: { userId_trackId: { userId, trackId } },
        });
        return {
          trackId,
          savedAt: existing?.savedAt ?? new Date(),
          implicit: false,
        };
      }
      throw err;
    }
  }

  /**
   * Remove from "Liked Songs". For owned tracks this is a no-op — the user
   * can only stop owning a track by deleting it, which is a separate flow.
   */
  async unsave(userId: string, trackId: string): Promise<void> {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      select: { userId: true },
    });
    if (track?.userId === userId) {
      throw new ConflictException({
        message: "Cannot unsave a track you own. Delete it instead.",
        code: "OWNED_TRACK",
      });
    }
    await this.prisma.userLibrarySave.deleteMany({
      where: { userId, trackId },
    });
  }

  /**
   * List the user's saved tracks (their own uploads + explicit saves), most
   * recently added first. Implicit saves use the track's createdAt as the
   * ordering anchor.
   */
  async listSavedTracks(
    userId: string,
    params?: { skip?: number; take?: number; search?: string },
  ) {
    const rawSkip = params?.skip;
    const rawTake = params?.take;
    const skip = Number.isFinite(rawSkip) ? (rawSkip as number) : 0;
    const take = Number.isFinite(rawTake) ? (rawTake as number) : 50;
    const search = params?.search;

    const searchFilter: Prisma.TrackWhereInput | undefined = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { artist: { contains: search, mode: "insensitive" } },
            { album: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined;

    const where: Prisma.TrackWhereInput = {
      AND: [
        {
          OR: [{ userId }, { librarySaves: { some: { userId } } }],
        },
        ...(searchFilter ? [searchFilter] : []),
      ],
    };

    const [tracks, total] = await Promise.all([
      this.prisma.track.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.track.count({ where }),
    ]);

    return { tracks, total, skip, take };
  }

  /**
   * Bulk lookup so the client can paint heart icons for a list of tracks in
   * a single round-trip. Returns the subset of `trackIds` the user has saved
   * (explicitly or by ownership).
   */
  async getSavedTrackIds(
    userId: string,
    trackIds: string[],
  ): Promise<string[]> {
    if (trackIds.length === 0) return [];
    const [explicit, owned] = await Promise.all([
      this.prisma.userLibrarySave.findMany({
        where: { userId, trackId: { in: trackIds } },
        select: { trackId: true },
      }),
      this.prisma.track.findMany({
        where: { userId, id: { in: trackIds } },
        select: { id: true },
      }),
    ]);
    const out = new Set<string>();
    explicit.forEach((r) => out.add(r.trackId));
    owned.forEach((r) => out.add(r.id));
    return [...out];
  }
}
