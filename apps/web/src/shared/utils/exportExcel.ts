type ExportColumn<T> = {
  label: string;
  value: (row: T) => string | number | boolean | null | undefined;
};

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Creates a SpreadsheetML workbook which Microsoft Excel opens directly. */
export function exportExcel<T>(
  fileName: string,
  columns: ExportColumn<T>[],
  rows: T[],
) {
  const cells = (values: unknown[]) =>
    values
      .map(
        (value) =>
          `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`,
      )
      .join("");
  const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Datos"><Table><Row>${cells(columns.map((column) => column.label))}</Row>${rows.map((row) => `<Row>${cells(columns.map((column) => column.value(row)))}</Row>`).join("")}</Table></Worksheet></Workbook>`;
  const blob = new Blob([xml], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${fileName}.xls`;
  anchor.click();
  URL.revokeObjectURL(url);
}
