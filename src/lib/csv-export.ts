export function generateCsv(rows: Record<string, unknown>[], filename: string): { csv: string; filename: string } {
  if (rows.length === 0) {
    return { csv: "", filename };
  }

  const headers = Object.keys(rows[0]);
  const csvRows: string[] = [headers.join(",")];

  for (const row of rows) {
    const values = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    csvRows.push(values.join(","));
  }

  return { csv: csvRows.join("\n"), filename };
}
