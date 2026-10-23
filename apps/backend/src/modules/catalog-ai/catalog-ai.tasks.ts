import type { CatalogAiEntityType, CatalogAiTask } from "@prisma/client";
import type { JsonSchema } from "./nvidia-nim.client";

/**
 * Every task is a "read the catalog, suggest a fix" pass. The model never
 * writes: it returns candidates that the admin reviews, and applying one goes
 * through CatalogService so catalog invariants (album artwork propagation,
 * lyrics mirroring to R2, artist image validation) still hold.
 *
 * Prompts are in Latin American Spanish and the schema field descriptions are
 * too, so the reasoning shown to the admin reads consistently.
 */

const CONFIDENCE_ENUM = ["LOW", "MEDIUM", "HIGH"] as const;

const confidenceProperty = {
  type: "string",
  enum: [...CONFIDENCE_ENUM],
  description:
    "Nivel de confianza. Usa LOW cuando solo es una suposición y HIGH solo si estás seguro.",
} as const;

const reasoningProperty = {
  type: "string",
  description:
    "Explicación breve en español de por qué propones este valor. Máximo 240 caracteres.",
} as const;

function itemsSchema(itemProperties: Record<string, unknown>) {
  return {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: itemProperties,
          required: Object.keys(itemProperties),
          additionalProperties: false,
        },
      },
    },
    required: ["items"],
    additionalProperties: false,
  } satisfies JsonSchema;
}

export interface CatalogAiTaskDefinition {
  label: string;
  entityType: CatalogAiEntityType;
  schema: JsonSchema;
  system: string;
  maxTokens: number;
  /** Shown in the admin UI next to the run. */
  description: string;
}

const ALBUM_YEAR: CatalogAiTaskDefinition = {
  label: "Año de lanzamiento",
  entityType: "ALBUM",
  description: "Propone el año de lanzamiento de álbumes que no lo tienen.",
  maxTokens: 4_096,
  schema: itemsSchema({
    albumId: {
      type: "string",
      description:
        "ID exacto del álbum recibido en la entrada. No lo inventes.",
    },
    year: {
      type: "integer",
      minimum: 1950,
      maximum: 2026,
      description: "Año de lanzamiento del álbum.",
    },
    confidence: confidenceProperty,
    reasoning: reasoningProperty,
  }),
  system: [
    "Eres un bibliotecónomo musical que completa metadatos faltantes de un catálogo de música.",
    "Recibes álbumes que no tienen año de lanzamiento.",
    "Devuelve SOLO álbumes presentes en la entrada, con su ID exacto.",
    "Si no puedes determinar el año con una base razonable, OMITE el álbum; es preferible",
    "no proponer nada antes que inventar un dato.",
    "Un álbum en vivo o un greatest hits puede tener un año distinto al del estudio:",
    "usa el año de la edición concreta que se indica.",
    "Responde en español latinoamericano.",
  ].join(" "),
};

const TRACK_ALBUM_MATCH: CatalogAiTaskDefinition = {
  label: "Asignación de pista a álbum",
  entityType: "TRACK",
  description:
    "Propone a qué álbum pertenece una pista suelta, usando solo los álbumes reales del artista.",
  maxTokens: 6_144,
  schema: itemsSchema({
    trackId: {
      type: "string",
      description:
        "ID exacto de la pista recibida en la entrada. No lo inventes.",
    },
    albumId: {
      type: "string",
      description:
        "ID exacto de uno de los álbumes candidatos de la entrada. Si ninguno encaja, no devuelvas la pista.",
    },
    albumOrder: {
      type: "integer",
      minimum: 1,
      description:
        "Número de pista dentro del álbum (1 = primera). Deduce la posición contando las pistas ya conocidas; si no puedes deducirla con certeza, usa la posición más probable.",
    },
    confidence: confidenceProperty,
    reasoning: reasoningProperty,
  }),
  system: [
    "Eres un bibliotecónomo musical que organiza el catálogo de una app de streaming.",
    "Recibes pistas huérfanas (sin álbum asignado) y, para cada una, los álbumes ya",
    "existentes de ese mismo artista con las pistas que ya contienen.",
    "Asigna la pista SOLO a uno de los álbumes candidatos recibidos, nunca a un álbum",
    "inventado ni a un álbum de otro artista.",
    "Si ningún candidato encaja, OMITE la pista: aquí no se crean álbumes nuevos,",
    "solo se clasifican las que ya existen.",
    "Para deducir albumOrder, cuenta la posición respecto a las pistas ya conocidas del álbum.",
    "Responde en español latinoamericano.",
  ].join(" "),
};

const MISSING_LYRICS: CatalogAiTaskDefinition = {
  label: "Búsqueda de letras faltantes",
  entityType: "TRACK",
  description:
    "Identifica pistas sin letra y da la pista de búsqueda para que el admin las localice.",
  maxTokens: 4_096,
  schema: itemsSchema({
    trackId: {
      type: "string",
      description:
        "ID exacto de la pista recibida en la entrada. No lo inventes.",
    },
    searchHint: {
      type: "string",
      description:
        "Consulta de búsqueda en español para que el admin encuentre la letra, con título, artista y álbum.",
    },
    isLikelyInstrumental: {
      type: "boolean",
      description:
        "true solo si la pista es un instrumental conocido (sin letra). En ese caso el admin no debe buscarla.",
    },
    confidence: confidenceProperty,
    reasoning: reasoningProperty,
  }),
  system: [
    "Eres un bibliotecónomo musical que ayuda a completar las letras faltantes de un catálogo.",
    "IMPORTANTE: NUNCA escribas ni copies el texto de la letra. Eso es material con derechos",
    "de autor: tu trabajo es indicar al administrador dónde buscarla.",
    "Recibes pistas sin letra. Para cada una devuelve una consulta de búsqueda precisa.",
    "Si reconoces la pista como un instrumental conocido, márcala con isLikelyInstrumental=true",
    "para que el administrador la marque como tal y no la busque.",
    "Devuelve SOLO pistas presentes en la entrada, con su ID exacto.",
    "Responde en español latinoamericano.",
  ].join(" "),
};

const MISSING_ARTIST_IMAGE: CatalogAiTaskDefinition = {
  label: "Imagen de artista faltante",
  entityType: "ARTIST",
  description:
    "Identifica artistas sin foto y sugiere la fuente oficial para que el admin la suba.",
  maxTokens: 4_096,
  schema: itemsSchema({
    artistId: {
      type: "string",
      description:
        "ID exacto del artista recibido en la entrada. No lo inventes.",
    },
    searchHint: {
      type: "string",
      description:
        "Consulta de búsqueda en español con el nombre del artista y el sello discográfico, para encontrar su foto oficial.",
    },
    suggestedSource: {
      type: "string",
      description:
        "Fuente sugerida donde conseguir una imagen oficial utilizable (sitio del artista, sello, discografía). Escribe 'desconocido' si no la tienes.",
    },
    confidence: confidenceProperty,
    reasoning: reasoningProperty,
  }),
  system: [
    "Eres un gestor de catálogo musical que busca fotos oficiales de artistas faltantes.",
    "IMPORTANTE: NUNCA devuelvas una URL de imagen. La plataforma solo acepta fotos subidas",
    "por el administrador a su propio bucket, así que tu trabajo es indicar DÓNDE encontrarla.",
    "Recibes artistas sin foto. Para cada uno devuelve una consulta de búsqueda precisa y la",
    "fuente oficial más probable de su imagen.",
    "Devuelve SOLO artistas presentes en la entrada, con su ID exacto.",
    "Responde en español latinoamericano.",
  ].join(" "),
};

const DEFINITIONS: Record<CatalogAiTask, CatalogAiTaskDefinition> = {
  ALBUM_YEAR: ALBUM_YEAR,
  TRACK_ALBUM_MATCH: TRACK_ALBUM_MATCH,
  MISSING_LYRICS: MISSING_LYRICS,
  MISSING_ARTIST_IMAGE: MISSING_ARTIST_IMAGE,
};

export function taskDefinition(task: CatalogAiTask): CatalogAiTaskDefinition {
  return DEFINITIONS[task];
}

export const CATALOG_AI_TASKS = Object.keys(DEFINITIONS) as CatalogAiTask[];
