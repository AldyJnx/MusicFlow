// Generador de diagramas BPMN 2.0 para MusicFlow (importables en Bizagi Modeler).
// Un archivo por modulo (Auth / Cliente / Admin). Cada PAGINA se dibuja dentro de
// su propio POOL (marco con el nombre del proceso), y los pools se apilan
// verticalmente para que no se solapen. Los flujos reflejan las vistas reales
// del codigo (apps/web/src).
//
//   node docs/diagramas/generar-bpmn.mjs
//
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = dirname(fileURLToPath(import.meta.url));

// --- Geometria -------------------------------------------------------------
const COL_W = 215;
const ROW_H = 150;
const ORIGIN_X = 250;   // x del centro de la columna 0 (contenido)
const POOL_X = 130;     // x izquierdo del pool (deja sitio a la cabecera)
const POOL_PAD_R = 110; // aire a la derecha dentro del pool
const POOL_GAP = 55;    // separacion entre pools apilados
const SIZE = {
  start: { w: 36, h: 36 },
  end: { w: 36, h: 36 },
  task: { w: 170, h: 74 },
  gw: { w: 50, h: 50 },
};

function bounds(node, yBase) {
  const cx = ORIGIN_X + node.col * COL_W;
  const cy = yBase + node.row * ROW_H;
  const s = SIZE[node.type];
  return { x: Math.round(cx - s.w / 2), y: Math.round(cy - s.h / 2), w: s.w, h: s.h, cx, cy };
}

// Enrutado ortogonal: hacia adelante con codo; hacia atras (bucles) por debajo.
function route(a, b, yBase) {
  const A = bounds(a, yBase), B = bounds(b, yBase);
  const pts = [];
  if (B.cx > A.cx) {
    const sx = A.x + A.w, sy = A.cy, tx = B.x, ty = B.cy;
    if (sy === ty) pts.push([sx, sy], [tx, ty]);
    else {
      const midX = Math.round((sx + tx) / 2);
      pts.push([sx, sy], [midX, sy], [midX, ty], [tx, ty]);
    }
  } else if (B.cx === A.cx) {
    if (B.cy > A.cy) pts.push([A.cx, A.y + A.h], [B.cx, B.y]);
    else pts.push([A.cx, A.y], [B.cx, B.y + B.h]);
  } else {
    const yOff = Math.max(A.cy, B.cy) + 96;
    pts.push([A.cx, A.y + A.h], [A.cx, yOff], [B.cx, yOff], [B.cx, B.y + B.h]);
  }
  return pts;
}

// --- Vistas reales (apps/web/src) ------------------------------------------
// type: start | task | gw | end ; col/row = posicion en la rejilla del pool.
const PAGES = [
  // ===================== MODULO AUTH =====================
  {
    module: "auth", id: "Login", name: "Login",
    nodes: [
      ["s", "start", "Abrir Login", 0, 1],
      ["m", "task", "Mostrar formulario de login", 1, 1],
      ["g", "gw", "Accion?", 2, 1],
      ["e2", "end", "Olvide contrasena -> Recuperar", 3, 0],
      ["t1", "task", "Ingresar email y contrasena", 3, 1],
      ["e3", "end", "Crear cuenta -> Registro", 3, 2],
      ["g2", "gw", "Credenciales validas?", 4, 1],
      ["err", "task", "Mostrar error", 4, 0],
      ["t2", "task", "Crear sesion (JWT access 15m / refresh 7d)", 5, 1],
      ["e1", "end", "Ir a Biblioteca", 6, 1],
    ],
    flows: [
      ["s", "m"], ["m", "g"],
      ["g", "e2", "Olvide contrasena"], ["g", "t1", "Iniciar sesion"], ["g", "e3", "Crear cuenta"],
      ["t1", "g2"], ["g2", "err", "No"], ["err", "t1"], ["g2", "t2", "Si"], ["t2", "e1"],
    ],
  },
  {
    module: "auth", id: "Register", name: "Registro",
    nodes: [
      ["s", "start", "Abrir Registro", 0, 1],
      ["t1", "task", "Completar usuario, email y contrasena", 1, 1],
      ["g", "gw", "Accion?", 2, 1],
      ["e2", "end", "Ya tengo cuenta -> Login", 2, 2],
      ["gv", "gw", "Datos validos? (usuario 3-30, pass >= 8, coinciden)", 3, 1],
      ["err", "task", "Mostrar error de validacion", 3, 0],
      ["t2", "task", "Crear cuenta (API)", 4, 1],
      ["t3", "task", "Iniciar sesion", 5, 1],
      ["e1", "end", "Ir a Biblioteca", 6, 1],
    ],
    flows: [
      ["s", "t1"], ["t1", "g"],
      ["g", "gv", "Registrarme"], ["g", "e2", "Ya tengo cuenta"],
      ["gv", "err", "No"], ["err", "t1"], ["gv", "t2", "Si"], ["t2", "t3"], ["t3", "e1"],
    ],
  },
  {
    module: "auth", id: "ForgotPassword", name: "Recuperar contrasena",
    nodes: [
      ["s", "start", "Abrir Recuperar contrasena", 0, 1],
      ["t1", "task", "Ingresar email", 1, 1],
      ["g", "gw", "Accion?", 2, 1],
      ["e2", "end", "Volver -> Login", 2, 2],
      ["t2", "task", "Enviar codigo de recuperacion", 3, 1],
      ["e1", "end", "Ir a Verificar codigo", 4, 1],
    ],
    flows: [
      ["s", "t1"], ["t1", "g"],
      ["g", "t2", "Enviar"], ["t2", "e1"], ["g", "e2", "Volver"],
    ],
  },
  {
    module: "auth", id: "VerifyCode", name: "Verificar codigo",
    nodes: [
      ["s", "start", "Abrir Verificar codigo", 0, 1],
      ["t1", "task", "Ingresar codigo de 6 digitos", 1, 1],
      ["g", "gw", "Accion?", 2, 1],
      ["t2", "task", "Reenviar codigo", 2, 0],
      ["e2", "end", "Volver -> Login", 2, 2],
      ["t3", "task", "Validar codigo", 3, 1],
      ["e1", "end", "Ir a Cambiar contrasena", 4, 1],
    ],
    flows: [
      ["s", "t1"], ["t1", "g"],
      ["g", "t3", "Verificar"], ["t3", "e1"],
      ["g", "t2", "Reenviar"], ["t2", "t1"], ["g", "e2", "Volver"],
    ],
  },
  {
    module: "auth", id: "ChangePassword", name: "Cambiar contrasena",
    nodes: [
      ["s", "start", "Abrir Cambiar contrasena", 0, 1],
      ["t1", "task", "Ingresar nueva contrasena y confirmar", 1, 1],
      ["g", "gw", "Contrasenas coinciden?", 2, 1],
      ["err", "task", "Mostrar error", 2, 0],
      ["t2", "task", "Restablecer contrasena", 3, 1],
      ["e1", "end", "Ir a Login", 4, 1],
    ],
    flows: [
      ["s", "t1"], ["t1", "g"],
      ["g", "err", "No"], ["err", "t1"], ["g", "t2", "Si"], ["t2", "e1"],
    ],
  },

  // ===================== MODULO CLIENTE =====================
  {
    module: "cliente", id: "Home", name: "Inicio",
    nodes: [
      ["s", "start", "Abrir Inicio", 0, 1],
      ["t1", "task", "Cargar destacados, recientes, mas escuchadas y artistas", 1, 1],
      ["g0", "gw", "Hay catalogo?", 2, 1],
      ["e0", "end", "Vacio -> importar en Biblioteca", 2, 0],
      ["t2", "task", "Mostrar Inicio (hero + carruseles)", 3, 1],
      ["g", "gw", "Accion?", 4, 1],
      ["t3", "task", "Guardar / agregar a cola", 4, 0],
      ["e1", "end", "Ver todo -> Biblioteca", 5, 0],
      ["e2", "end", "Abrir -> Artista", 5, 1],
      ["e3", "end", "Reproducir -> Now Playing", 5, 2],
    ],
    flows: [
      ["s", "t1"], ["t1", "g0"], ["g0", "e0", "No"], ["g0", "t2", "Si"], ["t2", "g"],
      ["g", "t3", "Guardar / Cola"], ["t3", "t2"],
      ["g", "e1", "Ver todo"], ["g", "e2", "Artista"], ["g", "e3", "Reproducir"],
    ],
  },
  {
    module: "cliente", id: "Library", name: "Biblioteca",
    nodes: [
      ["s", "start", "Abrir Biblioteca", 0, 1],
      ["t1", "task", "Cargar Catalogo / Mi biblioteca", 1, 1],
      ["t2", "task", "Mostrar lista (canciones, albumes, artistas)", 2, 1],
      ["g", "gw", "Accion?", 3, 1],
      ["b1", "task", "Buscar / filtrar genero / cambiar scope", 3, 0],
      ["imp", "task", "Importar (modal): subir pista", 4, 0],
      ["add", "task", "Guardar / a cola / a playlist", 4, 2],
      ["e1", "end", "Reproducir -> Now Playing", 5, 1],
      ["e2", "end", "Ir a Artista", 5, 2],
    ],
    flows: [
      ["s", "t1"], ["t1", "t2"], ["t2", "g"],
      ["g", "b1", "Buscar / Filtrar"], ["b1", "t2"],
      ["g", "imp", "Importar"], ["imp", "t2"],
      ["g", "add", "Guardar / Cola / Playlist"], ["add", "t2"],
      ["g", "e1", "Reproducir"], ["g", "e2", "Artista"],
    ],
  },
  {
    module: "cliente", id: "Artist", name: "Artista",
    nodes: [
      ["s", "start", "Abrir Artista", 0, 1],
      ["t1", "task", "Cargar tracks del artista", 1, 1],
      ["g0", "gw", "Tiene canciones?", 2, 1],
      ["e0", "end", "Estado vacio", 2, 0],
      ["t2", "task", "Mostrar artista (hero + lista)", 3, 1],
      ["g", "gw", "Accion?", 4, 1],
      ["t3", "task", "Guardar (favorito)", 4, 0],
      ["e1", "end", "Reproducir -> Now Playing", 5, 0],
      ["e2", "end", "Editar EQ (drawer) -> Ecualizador", 5, 1],
      ["e3", "end", "IA sugiere (Premium) -> AI Mixer", 5, 2],
    ],
    flows: [
      ["s", "t1"], ["t1", "g0"], ["g0", "e0", "No"], ["g0", "t2", "Si"], ["t2", "g"],
      ["g", "t3", "Guardar"], ["t3", "t2"],
      ["g", "e1", "Reproducir"], ["g", "e2", "EQ"], ["g", "e3", "IA"],
    ],
  },
  {
    module: "cliente", id: "Playlists", name: "Playlists",
    nodes: [
      ["s", "start", "Abrir Playlists", 0, 1],
      ["t1", "task", "Cargar playlists + Me gustan", 1, 1],
      ["t2", "task", "Mostrar grid de playlists", 2, 1],
      ["g", "gw", "Accion?", 3, 1],
      ["c", "task", "Crear playlist (modal)", 3, 0],
      ["ec", "task", "Editar EQ de playlist (modal)", 4, 0],
      ["d", "task", "Eliminar playlist (confirmar)", 3, 2],
      ["e1", "end", "Abrir -> Detalle de playlist", 4, 1],
      ["e2", "end", "Me gustan -> Biblioteca", 4, 2],
    ],
    flows: [
      ["s", "t1"], ["t1", "t2"], ["t2", "g"],
      ["g", "c", "Crear"], ["c", "t2"],
      ["g", "ec", "EQ playlist"], ["ec", "t2"],
      ["g", "d", "Eliminar"], ["d", "t2"],
      ["g", "e1", "Abrir"], ["g", "e2", "Me gustan"],
    ],
  },
  {
    module: "cliente", id: "PlaylistDetail", name: "Detalle de playlist",
    nodes: [
      ["s", "start", "Abrir Detalle de playlist", 0, 1],
      ["t1", "task", "Cargar playlist y tracks", 1, 1],
      ["g0", "gw", "Tiene tracks?", 2, 1],
      ["e0", "end", "Vacio -> Biblioteca", 2, 0],
      ["t2", "task", "Mostrar detalle (hero + lista)", 3, 1],
      ["g", "gw", "Accion?", 4, 1],
      ["t3", "task", "Reordenar / eliminar track", 4, 0],
      ["e1", "end", "Reproducir -> Now Playing", 5, 0],
      ["e2", "end", "EQ playlist (Premium) -> Ecualizador", 5, 1],
      ["e3", "end", "IA sugiere (Premium) -> AI Mixer", 5, 2],
    ],
    flows: [
      ["s", "t1"], ["t1", "g0"], ["g0", "e0", "No"], ["g0", "t2", "Si"], ["t2", "g"],
      ["g", "t3", "Editar tracks"], ["t3", "t2"],
      ["g", "e1", "Reproducir"], ["g", "e2", "EQ"], ["g", "e3", "IA"],
    ],
  },
  {
    module: "cliente", id: "NowPlaying", name: "Now Playing",
    nodes: [
      ["s", "start", "Abrir Now Playing", 0, 1],
      ["g0", "gw", "Hay pista en reproduccion?", 1, 1],
      ["e0", "end", "Vacio -> Biblioteca", 1, 2],
      ["t1", "task", "Mostrar reproductor expandido (caratula, onda)", 2, 1],
      ["g", "gw", "Accion?", 3, 1],
      ["t2", "task", "Play / Pause / Seek (EQ por segmento)", 3, 0],
      ["t3", "task", "Ver / editar cola", 4, 2],
      ["e1", "end", "Abrir Ecualizador", 4, 0],
      ["e2", "end", "Pedir IA -> AI Mixer", 4, 1],
    ],
    flows: [
      ["s", "g0"], ["g0", "e0", "No"], ["g0", "t1", "Si"], ["t1", "g"],
      ["g", "t2", "Reproduccion"], ["t2", "t1"],
      ["g", "t3", "Cola"], ["t3", "t1"],
      ["g", "e1", "Ecualizador"], ["g", "e2", "IA"],
    ],
  },
  {
    module: "cliente", id: "Equalizer", name: "Ecualizador",
    nodes: [
      ["s", "start", "Abrir Ecualizador", 0, 1],
      ["t1", "task", "Cargar config del scope (Global / Playlist / Track / Segment)", 1, 1],
      ["t2", "task", "Mostrar bandas, curva y presets", 2, 1],
      ["g", "gw", "Accion?", 3, 1],
      ["t3", "task", "Cambiar scope", 3, 0],
      ["t4", "task", "Ajustar bandas / efectos / reverb", 4, 0],
      ["t5", "task", "Aplicar preset / Reset", 4, 2],
      ["t6", "task", "Previsualizar en vivo y guardar config", 5, 1],
      ["e", "end", "Config guardada", 6, 1],
    ],
    flows: [
      ["s", "t1"], ["t1", "t2"], ["t2", "g"],
      ["g", "t3", "Cambiar scope"], ["t3", "t1"],
      ["g", "t4", "Ajustar"], ["t4", "t6"],
      ["g", "t5", "Preset / Reset"], ["t5", "t6"], ["t6", "t2"],
      ["g", "e", "Salir"],
    ],
  },
  {
    module: "cliente", id: "AiMixer", name: "AI Mixer (Agente IA)",
    nodes: [
      ["s", "start", "Abrir AI Mixer", 0, 1],
      ["g0", "gw", "Es Premium?", 1, 1],
      ["e0", "end", "Bloqueado -> Upsell", 1, 2],
      ["t1", "task", "Escribir prompt o elegir atajo", 2, 1],
      ["t2", "task", "Enviar al Agente IA (suggestEQ)", 3, 1],
      ["t3", "task", "Mostrar sugerencia (bandas, efectos, segmentos)", 4, 1],
      ["g", "gw", "Decision del usuario?", 5, 1],
      ["t4", "task", "Enviar feedback (positivo / negativo)", 5, 0],
      ["t5", "task", "Descartar sugerencia", 5, 2],
      ["t6", "task", "Aplicar EQ (acceptSuggestion por scope)", 6, 1],
      ["e", "end", "EQ de IA aplicado", 7, 1],
    ],
    flows: [
      ["s", "g0"], ["g0", "e0", "No"], ["g0", "t1", "Si"],
      ["t1", "t2"], ["t2", "t3"], ["t3", "g"],
      ["g", "t4", "Feedback"], ["t4", "t1"],
      ["g", "t5", "Descartar"], ["t5", "t1"],
      ["g", "t6", "Aplicar"], ["t6", "e"],
    ],
  },
  {
    module: "cliente", id: "Profile", name: "Perfil",
    nodes: [
      ["s", "start", "Abrir Perfil", 0, 1],
      ["t1", "task", "Cargar estadisticas de escucha y actividad", 1, 1],
      ["t2", "task", "Mostrar perfil (stats, top artistas, recientes)", 2, 1],
      ["g", "gw", "Accion?", 3, 1],
      ["t3", "task", "Reproducir track reciente", 3, 0],
      ["e1", "end", "Ver mi biblioteca -> Biblioteca", 4, 1],
    ],
    flows: [
      ["s", "t1"], ["t1", "t2"], ["t2", "g"],
      ["g", "t3", "Reproducir"], ["t3", "t2"], ["g", "e1", "Mi biblioteca"],
    ],
  },
  {
    module: "cliente", id: "Segments", name: "Segmentos",
    nodes: [
      ["s", "start", "Abrir Segmentos", 0, 1],
      ["g0", "gw", "Es Premium?", 1, 1],
      ["e0", "end", "Bloqueado -> Upsell", 1, 2],
      ["t1", "task", "Elegir track y cargar forma de onda", 2, 1],
      ["t2", "task", "Mostrar timeline de segmentos", 3, 1],
      ["g", "gw", "Accion?", 4, 1],
      ["t3", "task", "Detectar automatico (IA)", 4, 0],
      ["t4", "task", "Crear / editar segmento + asignar EQ", 5, 0],
      ["t5", "task", "Reproducir / previsualizar segmento", 4, 2],
      ["t6", "task", "Guardar y sincronizar", 5, 2],
      ["e", "end", "Segmentos guardados", 6, 2],
    ],
    flows: [
      ["s", "g0"], ["g0", "e0", "No"], ["g0", "t1", "Si"], ["t1", "t2"], ["t2", "g"],
      ["g", "t3", "Deteccion IA"], ["t3", "t2"],
      ["g", "t4", "Editar"], ["t4", "t2"],
      ["g", "t5", "Previsualizar"], ["t5", "t2"],
      ["g", "t6", "Guardar"], ["t6", "e"],
    ],
  },
  {
    module: "cliente", id: "Studio", name: "Studio",
    nodes: [
      ["s", "start", "Abrir Studio", 0, 1],
      ["t1", "task", "Mostrar hub de estudio (4 accesos)", 1, 1],
      ["g", "gw", "Accion?", 2, 1],
      ["e1", "end", "Ecualizador", 3, 0],
      ["e2", "end", "Segmentos (Premium)", 3, 1],
      ["e3", "end", "Agente IA (Premium)", 3, 2],
      ["e4", "end", "Preferencias -> Ajustes", 4, 1],
    ],
    flows: [
      ["s", "t1"], ["t1", "g"],
      ["g", "e1", "EQ"], ["g", "e2", "Segmentos"], ["g", "e3", "IA"], ["g", "e4", "Ajustes"],
    ],
  },
  {
    module: "cliente", id: "Settings", name: "Ajustes",
    nodes: [
      ["s", "start", "Abrir Ajustes", 0, 1],
      ["t1", "task", "Cargar preferencias", 1, 1],
      ["t2", "task", "Mostrar ajustes (idioma, tema, audio, reproduccion)", 2, 1],
      ["g", "gw", "Accion?", 3, 1],
      ["t3", "task", "Cambiar idioma / tema (en vivo)", 3, 0],
      ["t4", "task", "Audio: normalizar / crossfade / gapless", 4, 0],
      ["e", "end", "Guardar y salir", 4, 1],
    ],
    flows: [
      ["s", "t1"], ["t1", "t2"], ["t2", "g"],
      ["g", "t3", "Apariencia"], ["t3", "t2"],
      ["g", "t4", "Audio"], ["t4", "t2"], ["g", "e", "Salir"],
    ],
  },
  {
    module: "cliente", id: "Billing", name: "Facturacion",
    nodes: [
      ["s", "start", "Abrir Facturacion", 0, 1],
      ["t1", "task", "Cargar plan y cuotas (IA, subidas, presets)", 1, 1],
      ["t2", "task", "Mostrar plan y uso", 2, 1],
      ["g", "gw", "Es Premium?", 3, 1],
      ["e1", "end", "Premium: ver cuotas", 3, 0],
      ["t3", "task", "Mejorar a Premium", 4, 1],
      ["t4", "task", "Crear sesion de pago (Stripe)", 5, 1],
      ["e2", "end", "Ir a checkout (externo)", 6, 1],
    ],
    flows: [
      ["s", "t1"], ["t1", "t2"], ["t2", "g"],
      ["g", "e1", "Premium"], ["g", "t3", "Free: mejorar"], ["t3", "t4"], ["t4", "e2"],
    ],
  },

  // ===================== MODULO ADMIN =====================
  {
    module: "admin", id: "Dashboard", name: "Dashboard (Admin)",
    nodes: [
      ["s", "start", "Abrir Dashboard", 0, 1],
      ["t0", "task", "Verificar rol admin (guard)", 1, 1],
      ["t1", "task", "Cargar metricas (usuarios, IA, catalogo, actividad)", 2, 1],
      ["t2", "task", "Mostrar dashboard (KPIs + graficos)", 3, 1],
      ["g", "gw", "Accion?", 4, 1],
      ["t3", "task", "Refrescar (auto cada 15s)", 4, 0],
      ["e1", "end", "Ir a Usuarios", 5, 0],
      ["e2", "end", "Ir a Solicitudes IA", 5, 1],
      ["e3", "end", "Power user -> Detalle de usuario", 5, 2],
    ],
    flows: [
      ["s", "t0"], ["t0", "t1"], ["t1", "t2"], ["t2", "g"],
      ["g", "t3", "Refrescar"], ["t3", "t2"],
      ["g", "e1", "Usuarios"], ["g", "e2", "Solicitudes IA"], ["g", "e3", "Detalle usuario"],
    ],
  },
  {
    module: "admin", id: "Users", name: "Usuarios (Admin)",
    nodes: [
      ["s", "start", "Abrir Usuarios", 0, 1],
      ["t1", "task", "Cargar usuarios (paginado)", 1, 1],
      ["t2", "task", "Mostrar tabla de usuarios", 2, 1],
      ["g", "gw", "Accion?", 3, 1],
      ["t3", "task", "Buscar / paginar", 3, 0],
      ["t4", "task", "Cambiar rol (confirmar) / toggle Premium", 4, 0],
      ["t5", "task", "Desactivar usuario (confirmar)", 4, 2],
      ["e1", "end", "Ver detalle -> Detalle de usuario", 5, 1],
    ],
    flows: [
      ["s", "t1"], ["t1", "t2"], ["t2", "g"],
      ["g", "t3", "Buscar / Paginar"], ["t3", "t2"],
      ["g", "t4", "Rol / Premium"], ["t4", "t2"],
      ["g", "t5", "Desactivar"], ["t5", "t2"],
      ["g", "e1", "Ver detalle"],
    ],
  },
  {
    module: "admin", id: "UserDetail", name: "Detalle de usuario (Admin)",
    nodes: [
      ["s", "start", "Abrir Detalle de usuario", 0, 1],
      ["t1", "task", "Cargar detalle (uso, dispositivos, IA, plays)", 1, 1],
      ["t2", "task", "Mostrar detalle", 2, 1],
      ["g", "gw", "Accion?", 3, 1],
      ["t3", "task", "Cambiar rol / Premium", 3, 0],
      ["t4", "task", "Desactivar (confirmar)", 3, 2],
      ["e1", "end", "Volver a Usuarios", 4, 1],
    ],
    flows: [
      ["s", "t1"], ["t1", "t2"], ["t2", "g"],
      ["g", "t3", "Editar"], ["t3", "t2"],
      ["g", "t4", "Desactivar"], ["t4", "t2"],
      ["g", "e1", "Volver"],
    ],
  },
  {
    module: "admin", id: "AiRequests", name: "Solicitudes IA (Admin)",
    nodes: [
      ["s", "start", "Abrir Solicitudes IA", 0, 1],
      ["t1", "task", "Cargar feedback, costos y solicitudes", 1, 1],
      ["t2", "task", "Mostrar metricas y lista", 2, 1],
      ["g", "gw", "Accion?", 3, 1],
      ["t3", "task", "Filtrar (limite, feedback, busqueda)", 3, 0],
      ["t4", "task", "Ver detalle (modal: prompt / respuesta)", 4, 0],
      ["e1", "end", "Top usuario por costo -> Detalle de usuario", 4, 2],
      ["e2", "end", "Salir", 5, 1],
    ],
    flows: [
      ["s", "t1"], ["t1", "t2"], ["t2", "g"],
      ["g", "t3", "Filtrar"], ["t3", "t2"],
      ["g", "t4", "Ver detalle"], ["t4", "t2"],
      ["g", "e1", "Top usuario"], ["g", "e2", "Salir"],
    ],
  },
  {
    module: "admin", id: "EqPresets", name: "Presets de EQ (Admin)",
    nodes: [
      ["s", "start", "Abrir Presets de EQ", 0, 1],
      ["t1", "task", "Cargar presets globales", 1, 1],
      ["t2", "task", "Mostrar lista de presets", 2, 1],
      ["g", "gw", "Accion?", 3, 1],
      ["t3", "task", "Crear preset (nombre + bandas + efectos)", 3, 0],
      ["t4", "task", "Editar preset (sliders / reverb)", 4, 0],
      ["t6", "task", "Eliminar preset (confirmar)", 3, 2],
      ["t5", "task", "Guardar (si hay cambios)", 5, 1],
      ["e", "end", "Cambios guardados", 6, 1],
    ],
    flows: [
      ["s", "t1"], ["t1", "t2"], ["t2", "g"],
      ["g", "t3", "Crear"], ["t3", "t5"],
      ["g", "t4", "Editar"], ["t4", "t5"], ["t5", "e"],
      ["g", "t6", "Eliminar"], ["t6", "t2"],
    ],
  },
];

// --- Emision de XML --------------------------------------------------------
const xmlEsc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const tag = (type) => ({ start: "startEvent", end: "endEvent", task: "task", gw: "exclusiveGateway" }[type]);

function buildPage(page, poolTop) {
  const pid = `Proc_${page.id}`;
  const partId = `Part_${page.id}`;
  const nid = (local) => `${page.id}_${local}`;
  const nodeList = page.nodes.map((n) => ({ id: n[0], type: n[1], name: n[2], col: n[3], row: n[4] }));
  const nodeMap = new Map(nodeList.map((n) => [n.id, n]));

  const incoming = new Map(), outgoing = new Map();
  const flows = page.flows.map((f, i) => {
    const fid = `${page.id}_f${i + 1}`;
    const [from, to, label] = f;
    (outgoing.get(from) || outgoing.set(from, []).get(from)).push(fid);
    (incoming.get(to) || incoming.set(to, []).get(to)).push(fid);
    return { fid, from, to, label };
  });

  // dimensiones del pool
  const rowsUsed = Math.max(...nodeList.map((n) => n.row));
  const maxCol = Math.max(...nodeList.map((n) => n.col));
  const contentYBase = poolTop + 70;
  const poolHeight = rowsUsed * ROW_H + 200;
  const poolWidth = ORIGIN_X + maxCol * COL_W + SIZE.task.w / 2 + POOL_PAD_R - POOL_X;

  // proceso
  let proc = `  <bpmn:process id="${pid}" name="${xmlEsc(page.name)}" isExecutable="false">\n`;
  for (const n of nodeList) {
    const t = tag(n.type);
    const ins = (incoming.get(n.id) || []).map((f) => `      <bpmn:incoming>${f}</bpmn:incoming>`).join("\n");
    const outs = (outgoing.get(n.id) || []).map((f) => `      <bpmn:outgoing>${f}</bpmn:outgoing>`).join("\n");
    const inner = [ins, outs].filter(Boolean).join("\n");
    proc += `    <bpmn:${t} id="${nid(n.id)}" name="${xmlEsc(n.name)}">\n${inner ? inner + "\n" : ""}    </bpmn:${t}>\n`;
  }
  for (const f of flows) {
    const nameAttr = f.label ? ` name="${xmlEsc(f.label)}"` : "";
    proc += `    <bpmn:sequenceFlow id="${f.fid}"${nameAttr} sourceRef="${nid(f.from)}" targetRef="${nid(f.to)}" />\n`;
  }
  proc += `  </bpmn:process>\n`;

  // participante (referencia para el pool)
  const participant = `    <bpmn:participant id="${partId}" name="${xmlEsc(page.name)}" processRef="${pid}" />\n`;

  // diagrama: pool + nodos + flechas
  let dia = `      <bpmndi:BPMNShape id="S_${partId}" bpmnElement="${partId}" isHorizontal="true">\n`;
  dia += `        <dc:Bounds x="${POOL_X}" y="${Math.round(poolTop)}" width="${Math.round(poolWidth)}" height="${Math.round(poolHeight)}" />\n`;
  dia += `      </bpmndi:BPMNShape>\n`;
  for (const n of nodeList) {
    const b = bounds(n, contentYBase);
    const labelled = n.type !== "task";
    dia += `      <bpmndi:BPMNShape id="S_${nid(n.id)}" bpmnElement="${nid(n.id)}"${n.type === "gw" ? ' isMarkerVisible="true"' : ""}>\n`;
    dia += `        <dc:Bounds x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" />\n`;
    if (labelled) {
      dia += `        <bpmndi:BPMNLabel><dc:Bounds x="${b.x - 40}" y="${b.y + b.h + 4}" width="${b.w + 80}" height="26" /></bpmndi:BPMNLabel>\n`;
    }
    dia += `      </bpmndi:BPMNShape>\n`;
  }
  for (const f of flows) {
    const pts = route(nodeMap.get(f.from), nodeMap.get(f.to), contentYBase);
    dia += `      <bpmndi:BPMNEdge id="E_${f.fid}" bpmnElement="${f.fid}">\n`;
    for (const [x, y] of pts) dia += `        <di:waypoint x="${Math.round(x)}" y="${Math.round(y)}" />\n`;
    if (f.label) {
      const mid = pts[Math.floor(pts.length / 2)] || pts[0];
      dia += `        <bpmndi:BPMNLabel><dc:Bounds x="${Math.round(mid[0]) + 4}" y="${Math.round(mid[1]) - 22}" width="100" height="18" /></bpmndi:BPMNLabel>\n`;
    }
    dia += `      </bpmndi:BPMNEdge>\n`;
  }

  return { proc, participant, dia, advance: poolHeight + POOL_GAP };
}

function buildModule(moduleKey, title) {
  const pages = PAGES.filter((p) => p.module === moduleKey);
  let poolTop = 60;
  const built = [];
  for (const p of pages) {
    const b = buildPage(p, poolTop);
    built.push(b);
    poolTop += b.advance;
  }
  let xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"\n` +
    `                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"\n` +
    `                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"\n` +
    `                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"\n` +
    `                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n` +
    `                  id="Definitions_${moduleKey}" targetNamespace="http://musicflow.app/bpmn">\n`;
  xml += `  <bpmn:collaboration id="Collab_${moduleKey}" name="${xmlEsc(title)}">\n`;
  xml += built.map((b) => b.participant).join("");
  xml += `  </bpmn:collaboration>\n`;
  xml += built.map((b) => b.proc).join("");
  xml += `  <bpmndi:BPMNDiagram id="Diag_${moduleKey}" name="${xmlEsc(title)}">\n`;
  xml += `    <bpmndi:BPMNPlane id="Plane_${moduleKey}" bpmnElement="Collab_${moduleKey}">\n`;
  xml += built.map((b) => b.dia).join("");
  xml += `    </bpmndi:BPMNPlane>\n  </bpmndi:BPMNDiagram>\n`;
  xml += `</bpmn:definitions>\n`;
  return xml;
}

const MODULES = [
  ["auth", "MusicFlow - Modulo Auth"],
  ["cliente", "MusicFlow - Modulo Cliente"],
  ["admin", "MusicFlow - Modulo Admin"],
];

for (const [key, title] of MODULES) {
  const xml = buildModule(key, title);
  const file = join(OUT_DIR, `musicflow-${key}.bpmn`);
  writeFileSync(file, xml, "utf8");
  console.log(`OK  ${file}  (${PAGES.filter((p) => p.module === key).length} procesos)`);
}
