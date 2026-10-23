import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { AICostsReport, AiUsageOrigin, AiUsageScope } from "../api/admin";

const PURPOSE_TRANSLATIONS: Record<string, string> = {
  GLOBAL: "Sugerencias Globales (Home)",
  PLAYLIST: "Generación de Playlists",
  TRACK: "Recomendaciones de Canciones",
  SEGMENT: "Segmentos de Canciones",
};

const SCOPE_TRANSLATIONS: Record<AiUsageScope, string> = {
  all: "Usuarios y Administración",
  user: "Usuarios",
  admin: "Administración",
};

const ORIGIN_TRANSLATIONS: Record<AiUsageOrigin, string> = {
  USERS: "Consumo de Usuarios",
  ADMINS: "Consumo de Administración",
};

const MONTH_NAMES = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];

export async function generateAiReportPdf(
  report: AICostsReport,
): Promise<Blob> {
  let templateBuffer: ArrayBuffer | null = null;
  try {
    const res = await fetch("/templates/report-template.pdf");
    if (res.ok) {
      templateBuffer = await res.arrayBuffer();
    }
  } catch {
    // If fetch is unavailable, fallback will be used
  }

  let doc: PDFDocument;
  if (templateBuffer) {
    doc = await PDFDocument.load(templateBuffer);
  } else {
    doc = await PDFDocument.create();
    for (let i = 0; i < 7; i++) {
      doc.addPage([595.5, 842.25]);
    }
  }

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  const pages = doc.getPages();
  const cPrimary = rgb(0, 0.38, 0.88); // #0060df
  const cBanner = rgb(0.01, 0.2, 0.45); // #023473
  const cWhite = rgb(1, 1, 1);
  const cMuted = rgb(0.45, 0.52, 0.65);
  const cLightBg = rgb(0.96, 0.98, 1);
  const cSuccess = rgb(0.05, 0.65, 0.4);

  function drawCard(
    page: (typeof pages)[0],
    x: number,
    y: number,
    w: number,
    h: number,
    bg: ReturnType<typeof rgb>,
    textMain: string,
    textSub: string,
    subColor = cWhite,
  ) {
    page.drawRectangle({ x, y, width: w, height: h, color: bg });
    page.drawText(textMain, {
      x: x + 12,
      y: y + h - 38,
      size: textMain.length > 10 ? 15 : 20,
      font: fontBold,
      color: cWhite,
    });
    page.drawText(textSub, {
      x: x + 12,
      y: y + 16,
      size: 8.5,
      font: fontBold,
      color: subColor,
    });
  }

  const now = new Date();
  const monthName = MONTH_NAMES[now.getMonth()] || "SEPTIEMBRE";
  const yearName = now.getFullYear().toString();
  const totalTokens = report.totals.tokensInput + report.totals.tokensOutput;
  // The report always states which consumer it covers, because the end-user
  // assistant and the NVIDIA catalog runs are not comparable consumptions.
  const scope: AiUsageScope = report.scope ?? "all";
  const scopeLabel = SCOPE_TRANSLATIONS[scope];
  const originTranslation = (origin?: AiUsageOrigin) =>
    origin ? ORIGIN_TRANSLATIONS[origin] : "Consumo mixto";
  const sourceSummary = report.sources
    ? `Usuarios: ${report.sources.user.requests} peticiones · ${(
        report.sources.user.tokensInput + report.sources.user.tokensOutput
      ).toLocaleString(
        "es-PE",
      )} tokens    |    Administración: ${report.sources.admin.requests} peticiones · ${(
        report.sources.admin.tokensInput + report.sources.admin.tokensOutput
      ).toLocaleString("es-PE")} tokens`
    : "";

  // --- PÁGINA 1: PORTADA ---
  if (pages[0]) {
    pages[0].drawRectangle({
      x: 150,
      y: 120,
      width: 280,
      height: 130,
      color: cWhite,
    });
    pages[0].drawText(monthName.split("").join(" "), {
      x: 175,
      y: 200,
      size: 20,
      font: fontBold,
      color: cPrimary,
    });
    pages[0].drawText(yearName.split("").join(" "), {
      x: 175,
      y: 165,
      size: 20,
      font: fontBold,
      color: cPrimary,
    });
  }

  // --- PÁGINA 2: ÍNDICE ---
  if (pages[1]) {
    pages[1].drawRectangle({
      x: 180,
      y: 100,
      width: 390,
      height: 520,
      color: cWhite,
    });
    pages[1].drawText("Actividad y volumen de peticiones IA.", {
      x: 195,
      y: 512,
      size: 14,
      font: fontBold,
      color: cPrimary,
    });
    pages[1].drawText("Métricas consolidadas y rendimiento.", {
      x: 195,
      y: 395,
      size: 14,
      font: fontBold,
      color: cPrimary,
    });
    pages[1].drawText("Consumo y distribución por modelo.", {
      x: 195,
      y: 278,
      size: 14,
      font: fontBold,
      color: cPrimary,
    });
    pages[1].drawText("Eficacia y aceptación de sugerencias.", {
      x: 195,
      y: 160,
      size: 14,
      font: fontBold,
      color: cPrimary,
    });
  }

  // --- PÁGINA 3 (01): ACTIVIDAD DIARIA ---
  if (pages[2]) {
    pages[2].drawRectangle({
      x: 45,
      y: 560,
      width: 320,
      height: 230,
      color: cWhite,
    });
    pages[2].drawText("Actividad de", {
      x: 50,
      y: 720,
      size: 36,
      font: fontBold,
      color: cPrimary,
    });
    pages[2].drawText("peticiones IA", {
      x: 50,
      y: 675,
      size: 36,
      font: fontBold,
      color: cPrimary,
    });

    pages[2].drawRectangle({
      x: 0,
      y: 465,
      width: 595.5,
      height: 90,
      color: cBanner,
    });
    pages[2].drawText(
      `En el gráfico podemos observar el histórico de solicitudes IA, tokens procesados`,
      { x: 50, y: 520, size: 10.5, font: fontRegular, color: cWhite },
    );
    pages[2].drawText(
      `y la evolución diaria de ${scopeLabel} en los últimos ${report.days} días de actividad en MusicFlow.`,
      { x: 50, y: 502, size: 10.5, font: fontRegular, color: cWhite },
    );

    pages[2].drawRectangle({
      x: 0,
      y: 0,
      width: 595.5,
      height: 465,
      color: cWhite,
    });

    const chartX = 50;
    const chartY = 175;
    const chartW = 495;
    const chartH = 240;
    pages[2].drawRectangle({
      x: chartX,
      y: chartY,
      width: chartW,
      height: chartH,
      color: cLightBg,
    });
    pages[2].drawLine({
      start: { x: chartX, y: chartY + 32 },
      end: { x: chartX + chartW, y: chartY + 32 },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.95),
    });

    const rawPoints = report.activity?.day ?? [];
    const points = rawPoints.length > 0 ? rawPoints.slice(-10) : [];
    const maxReq = Math.max(1, ...points.map((p) => p.requests));
    const slotW = points.length > 0 ? (chartW - 40) / points.length : chartW;

    if (points.length === 0) {
      pages[2].drawText(
        "Sin peticiones registradas en el período seleccionado.",
        {
          x: chartX + 100,
          y: chartY + 115,
          size: 12,
          font: fontRegular,
          color: cMuted,
        },
      );
    } else {
      points.forEach((pt, i) => {
        const barX = chartX + 25 + i * slotW;
        const barH = (pt.requests / maxReq) * 150;
        const parsed = new Date(pt.date);
        const dateLabel = Number.isNaN(parsed.getTime())
          ? pt.date.slice(5, 10)
          : `${parsed.getDate().toString().padStart(2, "0")}/${(
              parsed.getMonth() + 1
            )
              .toString()
              .padStart(2, "0")}`;

        pages[2].drawRectangle({
          x: barX,
          y: chartY + 32,
          width: Math.min(38, slotW * 0.6),
          height: Math.max(4, barH),
          color: cPrimary,
        });
        pages[2].drawText(pt.requests.toString(), {
          x: barX + 8,
          y: chartY + 38 + barH,
          size: 10,
          font: fontBold,
          color: cPrimary,
        });
        pages[2].drawText(dateLabel, {
          x: barX + 2,
          y: chartY + 15,
          size: 8.5,
          font: fontRegular,
          color: cMuted,
        });
      });
    }

    const bCardW = 150;
    const bCardY = 60;
    const bCardH = 80;
    drawCard(
      pages[2],
      50,
      bCardY,
      bCardW,
      bCardH,
      cPrimary,
      report.totals.requests.toLocaleString("es-PE"),
      "SOLICITUDES TOTALES",
      rgb(0.8, 0.9, 1),
    );
    drawCard(
      pages[2],
      222,
      bCardY,
      bCardW,
      bCardH,
      cPrimary,
      report.totals.tokensInput.toLocaleString("es-PE"),
      "TOKENS ENTRADA",
      rgb(0.8, 0.9, 1),
    );
    drawCard(
      pages[2],
      395,
      bCardY,
      bCardW,
      bCardH,
      cPrimary,
      report.totals.tokensOutput.toLocaleString("es-PE"),
      "TOKENS SALIDA",
      rgb(0.8, 0.9, 1),
    );
  }

  // --- PÁGINA 4 (02): MÉTRICAS CONSOLIDADAS ---
  if (pages[3]) {
    pages[3].drawRectangle({
      x: 45,
      y: 530,
      width: 500,
      height: 75,
      color: cWhite,
    });
    pages[3].drawText("Métricas consolidadas", {
      x: 50,
      y: 550,
      size: 34,
      font: fontBold,
      color: cPrimary,
    });

    pages[3].drawRectangle({
      x: 0,
      y: 440,
      width: 595.5,
      height: 100,
      color: cBanner,
    });
    pages[3].drawText(
      "Podemos observar las métricas clave obtenidas de las solicitudes IA en el presente periodo.",
      { x: 50, y: 505, size: 10.5, font: fontRegular, color: cWhite },
    );
    pages[3].drawText(
      "Presentamos el valor total generado de consumo para evaluar el rendimiento general.",
      { x: 50, y: 487, size: 10.5, font: fontRegular, color: cWhite },
    );
    pages[3].drawText(
      "Todos los registros contemplan modelos Haiku y NVIDIA configurados.",
      { x: 50, y: 462, size: 9.5, font: fontRegular, color: rgb(0.7, 0.85, 1) },
    );
    pages[3].drawText(`Métricas correspondientes a ${scopeLabel}.`, {
      x: 345,
      y: 462,
      size: 9.5,
      font: fontRegular,
      color: rgb(0.7, 0.85, 1),
    });

    pages[3].drawRectangle({
      x: 0,
      y: 0,
      width: 595.5,
      height: 440,
      color: cWhite,
    });

    const cW = 115;
    const cY = 280;
    const cH = 115;
    drawCard(
      pages[3],
      45,
      cY,
      cW,
      cH,
      cPrimary,
      report.totals.requests.toLocaleString("es-PE"),
      "SOLICITUDES",
      rgb(0.8, 0.9, 1),
    );
    drawCard(
      pages[3],
      175,
      cY,
      cW,
      cH,
      cPrimary,
      totalTokens.toLocaleString("es-PE"),
      "TOKENS TOTALES",
      rgb(0.8, 0.9, 1),
    );
    drawCard(
      pages[3],
      305,
      cY,
      cW,
      cH,
      cPrimary,
      `$${report.totals.costUsd.toFixed(4)}`,
      "COSTO USD",
      rgb(0.8, 0.9, 1),
    );
    drawCard(
      pages[3],
      435,
      cY,
      cW,
      cH,
      cPrimary,
      `${report.totals.avgLatencyMs} ms`,
      "LATENCIA PROM.",
      rgb(0.8, 0.9, 1),
    );

    const tX = 45;
    const tY = 110;
    const tW = 505;
    const tH = 135;
    pages[3].drawRectangle({
      x: tX,
      y: tY,
      width: tW,
      height: tH,
      color: cPrimary,
    });
    pages[3].drawText("Total Inversión Estimada", {
      x: tX + 165,
      y: tY + tH - 32,
      size: 16,
      font: fontBold,
      color: cWhite,
    });
    pages[3].drawText(`$${report.totals.costUsd.toFixed(4)} USD`, {
      x: tX + 150,
      y: tY + 55,
      size: 34,
      font: fontBold,
      color: cWhite,
    });
    pages[3].drawText(
      `${totalTokens.toLocaleString("es-PE")} tokens totales consumidos en el periodo`,
      {
        x: tX + 125,
        y: tY + 25,
        size: 10.5,
        font: fontRegular,
        color: rgb(0.85, 0.92, 1),
      },
    );
    if (sourceSummary) {
      pages[3].drawText("Desglose por consumidor", {
        x: 50,
        y: 92,
        size: 11,
        font: fontBold,
        color: cPrimary,
      });
      pages[3].drawText(sourceSummary, {
        x: 50,
        y: 74,
        size: 9.5,
        font: fontRegular,
        color: cMuted,
      });
    }
  }

  // --- PÁGINA 5 (03): CONSUMO POR MODELO ---
  if (pages[4]) {
    pages[4].drawRectangle({
      x: 45,
      y: 560,
      width: 320,
      height: 230,
      color: cWhite,
    });
    pages[4].drawText("Consumo por", {
      x: 50,
      y: 720,
      size: 36,
      font: fontBold,
      color: cPrimary,
    });
    pages[4].drawText("modelo de IA", {
      x: 50,
      y: 675,
      size: 36,
      font: fontBold,
      color: cPrimary,
    });

    pages[4].drawRectangle({
      x: 0,
      y: 470,
      width: 595.5,
      height: 85,
      color: cBanner,
    });
    pages[4].drawText(
      "Presentamos la distribución de uso, volumen de tokens y costo por cada modelo de IA.",
      { x: 50, y: 520, size: 10.5, font: fontRegular, color: cWhite },
    );
    pages[4].drawText(
      `Desglose consolidado de ${scopeLabel}: Claude Haiku (usuarios) y NVIDIA (admin).`,
      { x: 50, y: 500, size: 9.5, font: fontRegular, color: rgb(0.7, 0.85, 1) },
    );

    pages[4].drawRectangle({
      x: 0,
      y: 0,
      width: 595.5,
      height: 470,
      color: cWhite,
    });

    if (report.byModel.length === 0) {
      pages[4].drawText("Sin consumo de modelos en el período seleccionado.", {
        x: 140,
        y: 280,
        size: 12,
        font: fontRegular,
        color: cMuted,
      });
    } else {
      report.byModel.slice(0, 4).forEach((m, idx) => {
        const mY = 330 - idx * 105;
        const pct =
          report.totals.requests > 0
            ? Math.round((m.requests / report.totals.requests) * 100)
            : 0;
        const mTokens = m.tokensInput + m.tokensOutput;

        pages[4].drawRectangle({
          x: 50,
          y: mY,
          width: 495,
          height: 95,
          color: cLightBg,
        });
        pages[4].drawRectangle({
          x: 50,
          y: mY,
          width: 6,
          height: 95,
          color: cPrimary,
        });
        pages[4].drawText(m.model, {
          x: 70,
          y: mY + 65,
          size: 14,
          font: fontBold,
          color: cPrimary,
        });
        pages[4].drawText(
          `${originTranslation(m.origin)} · ${m.requests} solicitudes procesadas (${pct}% del total)`,
          {
            x: 70,
            y: mY + 42,
            size: 11,
            font: fontRegular,
            color: rgb(0.2, 0.3, 0.5),
          },
        );
        pages[4].drawText(
          `Tokens: ${mTokens.toLocaleString("es-PE")} (${m.tokensInput.toLocaleString("es-PE")} ent. / ${m.tokensOutput.toLocaleString("es-PE")} sal.)`,
          {
            x: 70,
            y: mY + 22,
            size: 10,
            font: fontRegular,
            color: cMuted,
          },
        );
        pages[4].drawText(`$${m.costUsd.toFixed(4)} USD`, {
          x: 405,
          y: mY + 45,
          size: 16,
          font: fontBold,
          color: cPrimary,
        });
      });
    }
  }

  // --- PÁGINA 6 (04): EFICACIA Y ACEPTACIÓN ---
  if (pages[5]) {
    pages[5].drawRectangle({
      x: 45,
      y: 530,
      width: 500,
      height: 75,
      color: cWhite,
    });
    pages[5].drawText("Eficacia y aceptación", {
      x: 50,
      y: 550,
      size: 34,
      font: fontBold,
      color: cPrimary,
    });

    pages[5].drawRectangle({
      x: 0,
      y: 470,
      width: 595.5,
      height: 75,
      color: cBanner,
    });
    pages[5].drawText(
      "Presentamos los porcentajes obtenidos de peticiones cumplidas y su finalidad.",
      { x: 50, y: 518, size: 10.5, font: fontRegular, color: cWhite },
    );
    pages[5].drawText(
      "Mide la utilidad directa de las recomendaciones para los oyentes de MusicFlow.",
      { x: 50, y: 498, size: 9.5, font: fontRegular, color: rgb(0.7, 0.85, 1) },
    );

    pages[5].drawRectangle({
      x: 0,
      y: 0,
      width: 595.5,
      height: 470,
      color: cWhite,
    });

    const dayPoints = report.activity?.day ?? [];
    const fulfilled = dayPoints.reduce((acc, p) => acc + (p.fulfilled || 0), 0);
    const unfulfilled = dayPoints.reduce(
      (acc, p) => acc + (p.unfulfilled || 0),
      0,
    );
    const sum = fulfilled + unfulfilled;
    const rate = sum > 0 ? Math.round((fulfilled / sum) * 100) : 100;

    pages[5].drawRectangle({
      x: 50,
      y: 310,
      width: 495,
      height: 130,
      color: cLightBg,
    });
    pages[5].drawText("Tasa de Respuestas Cumplidas", {
      x: 75,
      y: 405,
      size: 15,
      font: fontBold,
      color: cPrimary,
    });
    pages[5].drawText(`${rate}% Satisfactorio`, {
      x: 75,
      y: 365,
      size: 28,
      font: fontBold,
      color: cSuccess,
    });
    pages[5].drawText(
      `${fulfilled} peticiones aceptadas y aplicadas con éxito en el catálogo y biblioteca.`,
      {
        x: 75,
        y: 335,
        size: 10.5,
        font: fontRegular,
        color: cMuted,
      },
    );

    pages[5].drawText("Distribución por Finalidad de Uso", {
      x: 50,
      y: 260,
      size: 14,
      font: fontBold,
      color: cPrimary,
    });

    const purposes =
      report.byPurpose.length > 0
        ? report.byPurpose.slice(0, 4)
        : [
            { purpose: "GLOBAL" as const, requests: 0, users: 0 },
            { purpose: "PLAYLIST" as const, requests: 0, users: 0 },
            { purpose: "TRACK" as const, requests: 0, users: 0 },
          ];

    purposes.forEach((p, idx) => {
      const pY = 180 - idx * 58;
      const label = PURPOSE_TRANSLATIONS[p.purpose] || p.purpose;
      pages[5].drawRectangle({
        x: 50,
        y: pY,
        width: 495,
        height: 46,
        color: cLightBg,
      });
      pages[5].drawRectangle({
        x: 50,
        y: pY,
        width: 4,
        height: 46,
        color: cPrimary,
      });
      pages[5].drawText(label, {
        x: 65,
        y: pY + 26,
        size: 11,
        font: fontBold,
        color: cPrimary,
      });
      pages[5].drawText(`${p.requests} solicitudes · ${p.users} usuarios`, {
        x: 65,
        y: pY + 10,
        size: 9.5,
        font: fontRegular,
        color: cMuted,
      });
    });
  }

  const pdfBytes = await doc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
}
