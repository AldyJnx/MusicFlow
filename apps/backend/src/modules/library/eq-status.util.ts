import { EQScopeType } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

export interface TrackEqStatus {
  /** The caller has an active track-level EQ config for this track. */
  hasCustomEq: boolean;
  /** How many EQ segments the caller defined on this track. */
  eqSegmentCount: number;
}

/**
 * Batch-attach the caller's EQ state to a page of tracks so list views can
 * paint an "EQ status" column without one round-trip per row.
 */
export async function attachEqStatus<T extends { id: string }>(
  prisma: PrismaService,
  userId: string,
  tracks: T[],
): Promise<(T & TrackEqStatus)[]> {
  if (tracks.length === 0) return [];
  const ids = tracks.map((t) => t.id);

  const [configs, segments] = await Promise.all([
    prisma.eQConfig.findMany({
      where: {
        userId,
        scopeType: EQScopeType.TRACK,
        scopeId: { in: ids },
        isActive: true,
      },
      select: { scopeId: true },
    }),
    prisma.eQSegment.groupBy({
      by: ["trackId"],
      where: { userId, trackId: { in: ids } },
      _count: { _all: true },
    }),
  ]);

  const withEq = new Set(configs.map((c) => c.scopeId));
  const segmentsByTrack = new Map(
    segments.map((s) => [s.trackId, s._count._all]),
  );

  return tracks.map((t) => ({
    ...t,
    hasCustomEq: withEq.has(t.id),
    eqSegmentCount: segmentsByTrack.get(t.id) ?? 0,
  }));
}
