import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Read at call time so `.env` loaded by Nest `ConfigModule` is visible (not at module load). */
function getCategoryCsvPathFromEnv(): string {
  return process.env.CATEGORY_FOR_PLACES_CSV_PATH ?? '';
}

export interface PlaceCategoryCsvRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i];

    if (ch === '"') {
      if (inQuotes && content[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && content[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += ch;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function normalizeText(input: string): string {
  return input.replace(/^"+|"+$/g, '').trim();
}

export function readPlaceCategoryCsvRows(
  csvRelativePath = getCategoryCsvPathFromEnv(),
): PlaceCategoryCsvRow[] {
  if (!csvRelativePath) return [];
  const absPath = resolve(process.cwd(), csvRelativePath);
  const raw = readFileSync(absPath, 'utf-8').replace(/^\uFEFF/, '');
  const parsed = parseCsv(raw);

  if (parsed.length <= 1) return [];
  const [header, ...lines] = parsed;
  const columns = header.map((h) => normalizeText(h));

  return lines
    .filter((line) => line.some((v) => normalizeText(v) !== ''))
    .map((line) => {
      const rec: Record<string, string> = {};
      columns.forEach((name, idx) => {
        rec[name] = normalizeText(line[idx] ?? '');
      });

      return {
        id: rec.id ?? '',
        name: rec.name ?? '',
        created_at: rec.created_at ?? '',
        updated_at: rec.updated_at ?? '',
      };
    });
}
