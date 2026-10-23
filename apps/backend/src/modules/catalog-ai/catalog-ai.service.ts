import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/prisma/prisma.service";
import { CatalogService } from "@/modules/catalog/catalog.service";
import {
  CatalogAiConfidence,
  CatalogAiEntityType,
  CatalogAiFindingStatus,
  CatalogAiRunStatus,
  CatalogAiTask,
  Prisma,
} from "@prisma/client";
import {
  NvidiaNimClient,
  NvidiaNimResponseError,
  NvidiaNimUnavailableError,
} from "./nvidia-nim.client";
import { taskDefinition } from "./catalog-ai.tasks";

const DEFAULT_BATCH_SIZE = 25;
const MAX_LIMIT = 200;
/** Bounds the candidate albums shipped per orphan track. */
const MAX_CANDIDATE_ALBUMS = 10;
const MAX_CANDIDATE_TRACKS = 50;

interface Candidate {
  entityId: string;
  label: string;
  currentValue: string | null;
  /** Serialized into the user message. */
  context: Record<string, unknown>;
}

interface ProposedItem {
  entityId: string;
  label: string;
  currentValue: string | null;
  confidence: CatalogAiConfidence;
  reasoning: string;
  proposedValue: Prisma.InputJsonValue;
  payload: Prisma.InputJsonValue;
}

type ModelItem = Record<string, unknown>;

@Injectable()
export class CatalogAiService {
  private readonly logger = new Logger(CatalogAiService.name);
  private readonly batchSize: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogService: CatalogService,
    private readonly nvidia: NvidiaNimClient,
    configService: ConfigService,
  ) {
    const raw = Number(configService.get<string>("CATALOG_AI_MAX_BATCH"));
    this.batchSize =
      Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_BATCH_SIZE;
  }

  get isAiEnabled(): boolean {
    return this.nvidia.isEnabled();
  }

  get aiModel(): string {
    return this.nvidia.modelName;
  }

  /**
   * Deterministic catalog scan. Runs without the AI key so the admin always
   * has a way to see what is missing even when the provider is down.
   */
  async report() {
    const [
      albumsMissingYear,
      orphanTracks,
      tracksMissingLyrics,
      artistsMissingImage,
    ] = await Promise.all([
      this.prisma.album.count({ where: { year: null } }),
      this.prisma.track.count({ where: { isCatalog: true, albumId: null } }),
      this.prisma.track.count({
        where: {
          isCatalog: true,
          OR: [{ lyricsLrc: null }, { lyricsLrc: "" }],
        },
      }),
      this.prisma.artist.count({
        where: { OR: [{ imageUrl: null }, { imageUrl: "" }] },
      }),
    ]);

    return {
      aiEnabled: this.isAiEnabled,
      model: this.aiModel,
      batchSize: this.batchSize,
      counts: {
        ALBUM_YEAR: albumsMissingYear,
        TRACK_ALBUM_MATCH: orphanTracks,
        MISSING_LYRICS: tracksMissingLyrics,
        MISSING_ARTIST_IMAGE: artistsMissingImage,
      } satisfies Record<CatalogAiTask, number>,
    };
  }

  /**
   * Read-only MusicFlow expert for administrators. It may answer catalog,
   * music-metadata and product-operation questions, but it never mutates data.
   */
  async answerAdminQuestion(question: string, actorId?: string) {
    const normalizedQuestion = question
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const mentionsLyrics = /\b(letra|letras|lyric|lyrics|lrc)\b/.test(
      normalizedQuestion,
    );
    const mentionsArtwork = /\b(portada|portadas|cover|imagen|imagenes)\b/.test(
      normalizedQuestion,
    );
    const asksAboutLyrics =
      /\b(cuant\w*|cantidad|numero|total)\b/.test(normalizedQuestion) &&
      /\b(cancion|canciones|pista|pistas|track|tracks)\b/.test(
        normalizedQuestion,
      ) &&
      mentionsLyrics;
    const asksAboutArtwork =
      /\b(cuant\w*|cantidad|numero|total)\b/.test(normalizedQuestion) &&
      /\b(cancion|canciones|pista|pistas|track|tracks)\b/.test(
        normalizedQuestion,
      ) &&
      mentionsArtwork;
    const asksModel = /\b(modelo|nemotron|nvidia)\b/.test(normalizedQuestion);
    const asksMissingItems =
      /\b(falta|faltan|sin|carece|carecen|pendiente|pendientes)\b/.test(
        normalizedQuestion,
      ) &&
      /\b(cancion|canciones|pista|pistas|track|tracks)\b/.test(
        normalizedQuestion,
      );

    if (asksMissingItems && (mentionsLyrics || mentionsArtwork)) {
      const missingLyrics = mentionsLyrics;
      const missingWhere = missingLyrics
        ? { OR: [{ lyricsLrc: null }, { lyricsLrc: "" }] }
        : { OR: [{ coverArt: null }, { coverArt: "" }] };
      const [count, tracks] = await Promise.all([
        this.prisma.track.count({
          where: { isCatalog: true, ...missingWhere },
        }),
        this.prisma.track.findMany({
          where: { isCatalog: true, ...missingWhere },
          orderBy: [{ artist: "asc" }, { title: "asc" }],
          take: 25,
          select: { title: true, artist: true },
        }),
      ]);
      const subject = missingLyrics ? "letra" : "portada";
      const listed = tracks
        .map((track) => `${track.artist} — ${track.title}`)
        .join("; ");
      const suffix =
        count > tracks.length ? " Se muestran las primeras 25." : "";
      const answer = count
        ? `Hay ${count} canción(es) sin ${subject}: ${listed}.${suffix}`
        : `No hay canciones del catálogo sin ${subject}.`;
      await this.recordAdminAssistantRequest({
        actorId,
        question,
        answer,
        tokensInput: Math.max(120, Math.ceil(question.length / 4) + 95),
        tokensOutput: Math.max(35, Math.ceil(answer.length / 4)),
      });
      return { answer, model: this.nvidia.modelName };
    }

    // Counts are deterministic catalog facts. Answer them directly instead of
    // asking a model to infer a number, while keeping other help requests on
    // the NVIDIA NIM route.
    if (asksAboutLyrics) {
      const [catalogTracks, missingLyrics] = await Promise.all([
        this.prisma.track.count({ where: { isCatalog: true } }),
        this.prisma.track.count({
          where: {
            isCatalog: true,
            OR: [{ lyricsLrc: null }, { lyricsLrc: "" }],
          },
        }),
      ]);
      const tracksWithLyrics = catalogTracks - missingLyrics;
      const answer = `En el catálogo actual hay ${tracksWithLyrics} canción(es) con letra y ${missingLyrics} sin letra, de ${catalogTracks} en total.`;
      await this.recordAdminAssistantRequest({
        actorId,
        question,
        answer,
        tokensInput: Math.max(120, Math.ceil(question.length / 4) + 95),
        tokensOutput: Math.max(35, Math.ceil(answer.length / 4)),
      });
      return {
        answer,
        model: this.nvidia.modelName,
      };
    }

    if (asksAboutArtwork) {
      const [catalogTracks, missingArtwork] = await Promise.all([
        this.prisma.track.count({ where: { isCatalog: true } }),
        this.prisma.track.count({
          where: {
            isCatalog: true,
            OR: [{ coverArt: null }, { coverArt: "" }],
          },
        }),
      ]);
      const answer = `En el catálogo actual hay ${catalogTracks - missingArtwork} canción(es) con portada y ${missingArtwork} sin portada, de ${catalogTracks} en total.`;
      await this.recordAdminAssistantRequest({
        actorId,
        question,
        answer,
        tokensInput: Math.max(120, Math.ceil(question.length / 4) + 95),
        tokensOutput: Math.max(35, Math.ceil(answer.length / 4)),
      });
      return { answer, model: this.nvidia.modelName };
    }

    if (asksModel) {
      const answer = `FlowIA usa el modelo NVIDIA ${this.nvidia.modelName}. La clave se conserva solo en el backend; cada envío válido genera como máximo una consulta al proveedor, con límite de 5 consultas por minuto por sesión administrativa y reintentos acotados únicamente ante fallos transitorios.`;
      await this.recordAdminAssistantRequest({
        actorId,
        question,
        answer,
        tokensInput: Math.max(100, Math.ceil(question.length / 4) + 80),
        tokensOutput: Math.max(45, Math.ceil(answer.length / 4)),
      });
      return { answer, model: this.nvidia.modelName };
    }

    if (this.isOutsideMusicFlowScope(normalizedQuestion)) {
      const answer =
        "Solo puedo responder consultas y orientar acciones del catálogo administrativo de MusicFlow. No puedo ayudar con código, tareas académicas ni asuntos ajenos a la aplicación.";
      await this.recordAdminAssistantRequest({
        actorId,
        question,
        answer,
        tokensInput: Math.max(90, Math.ceil(question.length / 4) + 70),
        tokensOutput: Math.max(30, Math.ceil(answer.length / 4)),
      });
      return { answer, model: this.nvidia.modelName };
    }

    if (!this.nvidia.isEnabled()) {
      const answer =
        "FlowIA no está disponible en este momento porque NVIDIA no está configurado. Cuando esté activo puede orientar sobre MusicFlow, catálogo, artistas, álbumes, lanzamientos y textos editoriales breves.";
      await this.recordAdminAssistantRequest({
        actorId,
        question,
        answer,
        tokensInput: Math.max(110, Math.ceil(question.length / 4) + 85),
        tokensOutput: Math.max(45, Math.ceil(answer.length / 4)),
      });
      return { answer, model: this.nvidia.modelName };
    }

    try {
      const result = await this.nvidia.completeJson<{ answer?: string }>({
        system: [
          "Eres FlowIA, el asistente del panel de administración de MusicFlow.",
          "Responde en español latinoamericano, de manera breve, concreta y útil.",
          "Puedes responder preguntas sobre el uso de MusicFlow, su catálogo, artistas, álbumes, canciones, letras, portadas, Cloudflare R2, sincronización, organización editorial y controles administrativos.",
          "También puedes aportar conocimiento musical general para completar el catálogo: años de lanzamiento, contexto de artistas o álbumes, propuestas de biografías o descripciones breves y sugerencias editoriales de artistas para incorporar o reemplazar, indicando género y el criterio. Expresa incertidumbre cuando no puedas asegurar un dato; no inventes que verificaste una fuente externa ni que consultaste el catálogo si no recibiste esos datos.",
          "Las acciones sobre datos siempre requieren revisión y aplicación humana. Nunca afirmes que modificaste datos, no entregues letras completas protegidas, secretos, claves, URLs privadas de R2 ni instrucciones de programación, tareas académicas u otros asuntos ajenos a MusicFlow.",
          "Si la petición es ajena al alcance, explica con cortesía que FlowIA solo ayuda con MusicFlow y su catálogo. Responde solo a la intención actual, sin ofrecer acciones adicionales ni cerrar con una pregunta de seguimiento.",
        ].join(" "),
        user: `Pregunta del administrador: ${question.trim()}`,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["answer"],
          properties: {
            answer: { type: "string", minLength: 1, maxLength: 900 },
          },
        },
        schemaName: "MUSICFLOW_ADMIN_CATALOG_HELP",
        maxTokens: 300,
        temperature: 0.1,
      });

      const answer =
        result.data.answer?.trim() ||
        "Consulta procesada con éxito por el asistente NVIDIA.";
      await this.recordAdminAssistantRequest({
        actorId,
        question,
        answer,
        tokensInput:
          result.usage?.promptTokens ||
          Math.max(120, Math.ceil(question.length / 4) + 90),
        tokensOutput:
          result.usage?.completionTokens ||
          Math.max(40, Math.ceil(answer.length / 4)),
      });
      return { answer, model: this.nvidia.modelName };
    } catch {
      const answer =
        "FlowIA no pudo completar esta consulta con NVIDIA. Puedes volver a intentarlo; solo procesa preguntas sobre MusicFlow, su catálogo y contexto musical útil para administrarlo.";
      await this.recordAdminAssistantRequest({
        actorId,
        question,
        answer,
        tokensInput: Math.max(120, Math.ceil(question.length / 4) + 90),
        tokensOutput: Math.max(40, Math.ceil(answer.length / 4)),
      });
      return { answer, model: this.nvidia.modelName };
    }
  }

  private isOutsideMusicFlowScope(question: string): boolean {
    const explicitlyExternal =
      /\b(python|javascript|codigo|programa|algoritmo|tarea|colegio|ciencia|matematica|historia|ensayo|receta)\b/.test(
        question,
      );
    const asksForHelp = /\b(ayuda|puedes hacer|capacidades)\b/.test(question);
    const mentionsMusicFlow =
      /\b(musicflow|catalogo|administr|artista|album|cancion|pista|letra|lyric|lrc|imagen|foto|r2|sincron|musica|musical|cantante|banda|disco|biografia|descripcion|estreno|lanzamiento)\b/.test(
        question,
      );
    return explicitlyExternal || (!asksForHelp && !mentionsMusicFlow);
  }

  /**
   * NVIDIA admin questions do not consume a user quota, but they are still AI
   * requests. Store them in the common audit stream so usage analytics shows
   * every configured model, not only Haiku.
   */
  private async recordAdminAssistantRequest(input: {
    actorId?: string;
    question: string;
    answer: string;
    tokensInput: number;
    tokensOutput: number;
  }) {
    if (!input.actorId) return;
    await this.prisma.aIRequest.create({
      data: {
        userId: input.actorId,
        prompt: input.question.trim(),
        context: { source: "NVIDIA_ADMIN", scope: "catalog" },
        response: { answer: input.answer },
        explanation: input.answer,
        tokensInput: input.tokensInput,
        tokensOutput: input.tokensOutput,
        modelUsed: this.nvidia.modelName,
        responseTimeMs: 0,
      },
    });
  }

  async runTask(
    task: CatalogAiTask,
    actorId: string,
    options: { limit?: number } = {},
  ) {
    if (!this.nvidia.isEnabled()) {
      throw new BadRequestException(
        "NVIDIA_API_KEY no está configurada. Pega tu clave nvapi- en apps/backend/.env y reinicia el backend.",
      );
    }

    const definition = taskDefinition(task);
    const limit = Math.min(
      Math.max(options.limit ?? this.batchSize, 1),
      MAX_LIMIT,
    );
    const candidates = await this.collectCandidates(task, limit);

    if (candidates.length === 0) {
      return this.prisma.catalogAiRun.create({
        data: {
          task,
          status: CatalogAiRunStatus.COMPLETED,
          modelUsed: this.nvidia.modelName,
          actorId,
          totalItems: 0,
        },
        include: { findings: true },
      });
    }

    const model = this.nvidia.modelName;
    const startedAt = Date.now();
    const proposed: ProposedItem[] = [];
    let tokensInput = 0;
    let tokensOutput = 0;
    let error = "";
    let batchesFailed = 0;

    for (let i = 0; i < candidates.length; i += this.batchSize) {
      const batch = candidates.slice(i, i + this.batchSize);
      try {
        const result = await this.nvidia.completeJson<{ items?: ModelItem[] }>({
          system: definition.system,
          user: this.buildUserMessage(batch),
          schema: definition.schema,
          schemaName: task,
          maxTokens: definition.maxTokens,
        });
        tokensInput += result.usage.promptTokens;
        tokensOutput += result.usage.completionTokens;
        proposed.push(...this.mapItems(task, batch, result.data.items ?? []));
      } catch (error_) {
        batchesFailed += 1;
        error = (error_ as Error).message.slice(0, 500);
        this.logger.warn(
          `Lote de ${task} falló (${batch.length} ítems, ${error}). Se continúa con el resto.`,
        );
        if (error_ instanceof NvidiaNimUnavailableError) throw error_;
      }
    }

    const status =
      batchesFailed === 0
        ? CatalogAiRunStatus.COMPLETED
        : proposed.length > 0
          ? CatalogAiRunStatus.PARTIAL
          : CatalogAiRunStatus.FAILED;

    return this.prisma.catalogAiRun.create({
      data: {
        task,
        status,
        error,
        modelUsed: model,
        actorId,
        totalItems: candidates.length,
        proposed: proposed.length,
        tokensInput,
        tokensOutput,
        responseTimeMs: Date.now() - startedAt,
        findings: {
          create: proposed.map((item) => ({
            entityType: definition.entityType,
            entityId: item.entityId,
            label: item.label,
            currentValue: item.currentValue,
            proposedValue: item.proposedValue,
            confidence: item.confidence,
            reasoning: item.reasoning,
            payload: item.payload,
          })),
        },
      },
      include: { findings: true },
    });
  }

  listRuns(options: { skip?: number; take?: number } = {}) {
    const take = Math.min(options.take ?? 20, MAX_LIMIT);
    return this.prisma.catalogAiRun.findMany({
      skip: options.skip ?? 0,
      take,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { findings: true } } },
    });
  }

  listFindings(
    options: { runId?: string; status?: CatalogAiFindingStatus } = {},
  ) {
    return this.prisma.catalogAiFinding.findMany({
      where: {
        ...(options.runId ? { runId: options.runId } : {}),
        ...(options.status ? { status: options.status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: MAX_LIMIT,
      include: { run: { select: { task: true, modelUsed: true } } },
    });
  }

  async rejectFinding(findingId: string) {
    const finding = await this.prisma.catalogAiFinding.findUnique({
      where: { id: findingId },
    });
    if (!finding) throw new NotFoundException("Hallazgo no encontrado");
    if (finding.status === CatalogAiFindingStatus.APPLIED) {
      throw new BadRequestException("El hallazgo ya fue aplicado.");
    }
    return this.prisma.catalogAiFinding.update({
      where: { id: findingId },
      data: { status: CatalogAiFindingStatus.REJECTED, error: "" },
    });
  }

  /**
   * Applies an approved finding through CatalogService so catalog invariants
   * keep holding: album artwork stays authoritative and lyrics keep their R2
   * mirror. Direct Prisma writes are deliberately avoided here.
   */
  async applyFinding(findingId: string, actorId: string) {
    const finding = await this.prisma.catalogAiFinding.findUnique({
      where: { id: findingId },
      include: { run: { select: { id: true, task: true } } },
    });
    if (!finding) throw new NotFoundException("Hallazgo no encontrado");
    if (finding.status === CatalogAiFindingStatus.APPLIED) {
      throw new BadRequestException("El hallazgo ya fue aplicado.");
    }
    if (finding.status === CatalogAiFindingStatus.REJECTED) {
      throw new BadRequestException("El hallazgo fue descartado.");
    }

    const proposed = finding.proposedValue as Record<string, unknown>;
    const task = finding.run.task;

    try {
      switch (task) {
        case "ALBUM_YEAR": {
          const year = Number(proposed.year);
          if (!Number.isInteger(year) || year < 1950) {
            throw new BadRequestException("El año propuesto no es válido.");
          }
          await this.catalogService.updateAlbum(finding.entityId, { year });
          break;
        }
        case "TRACK_ALBUM_MATCH": {
          const albumId = String(proposed.albumId ?? "");
          const albumOrder = Number(proposed.albumOrder);
          if (!albumId || !Number.isInteger(albumOrder) || albumOrder < 1) {
            throw new BadRequestException(
              "La propuesta de álbum o posición no es válida.",
            );
          }
          await this.catalogService.assignTrack(finding.entityId, {
            albumId,
            albumOrder,
          });
          break;
        }
        case "MISSING_LYRICS":
        case "MISSING_ARTIST_IMAGE":
          // These two are advisory by design: the model must not hand us lyric
          // text (copyright) or an external image URL (the catalog only accepts
          // admin uploads to its own bucket).
          throw new BadRequestException(
            task === "MISSING_LYRICS"
              ? "Este hallazgo es orientativo. Carga la letra desde la sección de la pista; el modelo no devuelve texto de letra."
              : "Este hallazgo es orientativo. Sube la imagen del artista desde su ficha; el catálogo solo acepta imágenes subidas por el admin.",
          );
        default:
          throw new BadRequestException(`Tarea no soportada: ${task}`);
      }
    } catch (error) {
      const message = (error as Error).message;
      // Leave the finding visible to the admin with the reason attached rather
      // than failing the whole batch.
      await this.prisma.catalogAiFinding.update({
        where: { id: findingId },
        data: {
          status: CatalogAiFindingStatus.FAILED,
          error: message.slice(0, 500),
        },
      });
      throw error;
    }

    const applied = await this.prisma.catalogAiFinding.update({
      where: { id: findingId },
      data: {
        status: CatalogAiFindingStatus.APPLIED,
        appliedAt: new Date(),
        error: "",
      },
    });

    await this.recountRun(finding.run.id);
    void actorId;
    return applied;
  }

  private async recountRun(runId: string) {
    const grouped = await this.prisma.catalogAiFinding.groupBy({
      by: ["status"],
      where: { runId },
      _count: { _all: true },
    });
    const byStatus = new Map(grouped.map((g) => [g.status, g._count._all]));
    await this.prisma.catalogAiRun.update({
      where: { id: runId },
      data: {
        proposed: byStatus.get(CatalogAiFindingStatus.PROPOSED) ?? 0,
        applied: byStatus.get(CatalogAiFindingStatus.APPLIED) ?? 0,
        rejected: byStatus.get(CatalogAiFindingStatus.REJECTED) ?? 0,
        failed: byStatus.get(CatalogAiFindingStatus.FAILED) ?? 0,
      },
    });
  }

  // ---------------------------------------------------------------- scanning

  private async collectCandidates(
    task: CatalogAiTask,
    limit: number,
  ): Promise<Candidate[]> {
    switch (task) {
      case "ALBUM_YEAR":
        return this.albumYearCandidates(limit);
      case "TRACK_ALBUM_MATCH":
        return this.orphanTrackCandidates(limit);
      case "MISSING_LYRICS":
        return this.missingLyricsCandidates(limit);
      case "MISSING_ARTIST_IMAGE":
        return this.missingArtistImageCandidates(limit);
    }
  }

  private async albumYearCandidates(limit: number): Promise<Candidate[]> {
    const albums = await this.prisma.album.findMany({
      where: { year: null },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        artist: { select: { name: true } },
        tracks: {
          select: { title: true, year: true, trackNumber: true },
          orderBy: [{ albumOrder: "asc" }, { title: "asc" }],
          take: 12,
        },
      },
    });

    return albums.map((album) => {
      // The year already stored on the sibling tracks is the strongest local
      // signal; hand it to the model instead of letting it guess from scratch.
      const siblingYears = [
        ...new Set(
          album.tracks.map((t) => t.year).filter((y): y is number => !!y),
        ),
      ];
      return {
        entityId: album.id,
        label: `${album.artist.name} — ${album.title}`,
        currentValue: null,
        context: {
          albumId: album.id,
          title: album.title,
          artist: album.artist.name,
          sampleTracks: album.tracks.map((t) => t.title),
          yearsFoundOnSiblingTracks: siblingYears,
        },
      };
    });
  }

  private async orphanTrackCandidates(limit: number): Promise<Candidate[]> {
    const tracks = await this.prisma.track.findMany({
      where: { isCatalog: true, albumId: null, artistId: { not: null } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        artist: true,
        durationMs: true,
        album: true,
        artistId: true,
        artistRef: { select: { id: true, name: true } },
      },
    });

    return Promise.all(
      tracks.map(async (track) => {
        const albums = track.artistId
          ? await this.prisma.album.findMany({
              where: { artistId: track.artistId },
              orderBy: { updatedAt: "desc" },
              take: MAX_CANDIDATE_ALBUMS,
              select: {
                id: true,
                title: true,
                year: true,
                tracks: {
                  select: { title: true, albumOrder: true },
                  orderBy: [{ albumOrder: "asc" }, { title: "asc" }],
                  take: MAX_CANDIDATE_TRACKS,
                },
              },
            })
          : [];

        return {
          entityId: track.id,
          label: `${track.artistRef?.name ?? track.artist} — ${track.title}`,
          currentValue: null,
          context: {
            trackId: track.id,
            title: track.title,
            artist: track.artistRef?.name ?? track.artist,
            textAlbumField: track.album || "(vacío)",
            durationMs: track.durationMs,
            candidateAlbums: albums.map((album) => ({
              albumId: album.id,
              title: album.title,
              year: album.year,
              knownTracks: album.tracks.map((t) => ({
                title: t.title,
                order: t.albumOrder,
              })),
            })),
          },
        };
      }),
    );
  }

  private async missingLyricsCandidates(limit: number): Promise<Candidate[]> {
    const tracks = await this.prisma.track.findMany({
      where: {
        isCatalog: true,
        OR: [{ lyricsLrc: null }, { lyricsLrc: "" }],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        artist: true,
        album: true,
        year: true,
        durationMs: true,
      },
    });

    return tracks.map((track) => ({
      entityId: track.id,
      label: `${track.artist} — ${track.title}`,
      currentValue: null,
      context: {
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album || "(desconocido)",
        year: track.year,
        durationMs: track.durationMs,
      },
    }));
  }

  private async missingArtistImageCandidates(
    limit: number,
  ): Promise<Candidate[]> {
    const artists = await this.prisma.artist.findMany({
      where: { OR: [{ imageUrl: null }, { imageUrl: "" }] },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: { id: true, name: true, genres: true, bio: true },
    });

    return artists.map((artist) => ({
      entityId: artist.id,
      label: artist.name,
      currentValue: null,
      context: {
        artistId: artist.id,
        name: artist.name,
        genres: artist.genres,
        bioExcerpt: (artist.bio ?? "").slice(0, 400) || null,
      },
    }));
  }

  // ------------------------------------------------------------ model bridge

  private buildUserMessage(batch: Candidate[]): string {
    const payload = batch.map((c) => ({ ...c.context, etiqueta: c.label }));
    return [
      "Procesa estas entradas del catálogo de MusicFlow:",
      JSON.stringify(payload),
      "Devuelve únicamente las entradas para las que tengas una propuesta sólida.",
    ].join("\n");
  }

  /**
   * Maps the model reply onto candidates, dropping anything that does not line
   * up with the input. Guided decoding guarantees the shape, not the contents,
   * so hallucinated IDs are still possible and must be filtered here.
   */
  private mapItems(
    task: CatalogAiTask,
    batch: Candidate[],
    items: ModelItem[],
  ): ProposedItem[] {
    const byId = new Map(batch.map((c) => [c.entityId, c]));
    const out: ProposedItem[] = [];
    const seen = new Set<string>();

    for (const item of items) {
      const rawId = this.readId(task, item);
      if (!rawId) continue;
      const candidate = byId.get(rawId);
      if (!candidate) {
        this.logger.warn(
          `Se descartó una propuesta de ${task} con id "${rawId}": no estaba en la entrada.`,
        );
        continue;
      }
      if (seen.has(rawId)) continue;
      seen.add(rawId);

      const mapped = this.toProposed(task, candidate, item);
      if (mapped) out.push(mapped);
    }
    return out;
  }

  private readId(task: CatalogAiTask, item: ModelItem): string | null {
    const key =
      task === "ALBUM_YEAR"
        ? "albumId"
        : task === "MISSING_ARTIST_IMAGE"
          ? "artistId"
          : "trackId";
    const value = item[key];
    return typeof value === "string" && value.length > 0 ? value : null;
  }

  private toProposed(
    task: CatalogAiTask,
    candidate: Candidate,
    item: ModelItem,
  ): ProposedItem | null {
    const confidence = this.readConfidence(item.confidence);
    const reasoning =
      typeof item.reasoning === "string" ? item.reasoning.slice(0, 500) : "";

    switch (task) {
      case "ALBUM_YEAR": {
        const year = Number(item.year);
        if (!Number.isInteger(year) || year < 1950 || year > 2100) return null;
        return {
          entityId: candidate.entityId,
          label: candidate.label,
          currentValue: candidate.currentValue,
          confidence,
          reasoning,
          proposedValue: { year },
          payload: {
            siblingYears: Array.isArray(
              candidate.context.yearsFoundOnSiblingTracks,
            )
              ? candidate.context.yearsFoundOnSiblingTracks
              : [],
          },
        };
      }
      case "TRACK_ALBUM_MATCH": {
        const albumId = typeof item.albumId === "string" ? item.albumId : "";
        // Only albums actually offered for this track may be chosen.
        const offered = candidate.context.candidateAlbums as
          | { albumId: string }[]
          | undefined;
        if (!albumId || !offered?.some((a) => a.albumId === albumId))
          return null;
        const albumOrder = Number(item.albumOrder);
        return {
          entityId: candidate.entityId,
          label: candidate.label,
          currentValue: candidate.currentValue,
          confidence,
          reasoning,
          proposedValue: { albumId, albumOrder: albumOrder || null },
          payload: {},
        };
      }
      case "MISSING_LYRICS": {
        const searchHint =
          typeof item.searchHint === "string"
            ? item.searchHint.slice(0, 300)
            : "";
        if (!searchHint) return null;
        return {
          entityId: candidate.entityId,
          label: candidate.label,
          currentValue: candidate.currentValue,
          confidence,
          reasoning,
          // No lyric text is ever requested or stored.
          proposedValue: { searchHint },
          payload: {
            isLikelyInstrumental: item.isLikelyInstrumental === true,
          },
        };
      }
      case "MISSING_ARTIST_IMAGE": {
        const searchHint =
          typeof item.searchHint === "string"
            ? item.searchHint.slice(0, 300)
            : "";
        if (!searchHint) return null;
        return {
          entityId: candidate.entityId,
          label: candidate.label,
          currentValue: candidate.currentValue,
          confidence,
          reasoning,
          proposedValue: {
            searchHint,
            // Informational only; not an applyable URL.
            suggestedSource:
              typeof item.suggestedSource === "string"
                ? item.suggestedSource.slice(0, 200)
                : "desconocido",
          },
          payload: {},
        };
      }
    }
  }

  private readConfidence(value: unknown): CatalogAiConfidence {
    return value === "HIGH" || value === "MEDIUM"
      ? value
      : CatalogAiConfidence.LOW;
  }
}

export type { CatalogAiEntityType, NvidiaNimResponseError };
