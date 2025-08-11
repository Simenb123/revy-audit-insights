import * as XLSX from 'xlsx';

export interface ParsedAllocationRow {
  orgNumber: string;
  employeeKey: string; // email | initials | uuid
  year?: number;
  hoursByMonth: Record<number, number>; // 1-12 -> hours
}

function normalizeHeader(h: unknown): string {
  return String(h || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(/-+/g, '')
    .replace(/[æå]/g, (m) => (m === 'æ' ? 'ae' : 'a'))
    .replace(/ø/g, 'o');
}

function detectMonthNumber(key: string): number | null {
  const map: Record<string, number> = {
    jan: 1, january: 1, januar: 1, m1: 1, '1': 1,
    feb: 2, february: 2, februar: 2, m2: 2, '2': 2,
    mar: 3, march: 3, mars: 3, m3: 3, '3': 3,
    apr: 4, april: 4, m4: 4, '4': 4,
    mai: 5, may: 5, m5: 5, '5': 5,
    jun: 6, juni: 6, june: 6, m6: 6, '6': 6,
    jul: 7, july: 7, juli: 7, m7: 7, '7': 7,
    aug: 8, august: 8, m8: 8, '8': 8,
    sep: 9, sept: 9, september: 9, m9: 9, '9': 9,
    okt: 10, october: 10, oktobe: 10, m10: 10, '10': 10,
    nov: 11, november: 11, m11: 11, '11': 11,
    des: 12, december: 12, desember: 12, m12: 12, '12': 12,
  };
  return map[key] ?? null;
}

export async function parseAllocationFile(file: File): Promise<ParsedAllocationRow[]> {
  const arrayBuf = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuf, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];

  // Header as first row
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (rows.length === 0) return [];

  const header = rows[0].map(normalizeHeader);

  // Detect key columns
  const orgIdx = header.findIndex((h) => ['orgnr', 'orgnumber', 'orgno', 'org', 'orgnummer', 'organisasjonsnummer'].includes(h));
  const empIdx = header.findIndex((h) => ['employee', 'ansatt', 'ansattid', 'initials', 'initialer', 'user', 'bruker', 'email'].includes(h));
  const yearIdx = header.findIndex((h) => ['year', 'aar', 'år'].includes(h));

  // Month columns
  const monthIdx: Record<number, number> = {};
  header.forEach((h, i) => {
    const m = detectMonthNumber(h);
    if (m && i !== orgIdx && i !== empIdx && i !== yearIdx) monthIdx[m] = i;
  });

  const parsed: ParsedAllocationRow[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const orgNumber = String(row[orgIdx] ?? '').trim();
    const employeeKey = String(row[empIdx] ?? '').trim();
    const yearValRaw = yearIdx >= 0 ? row[yearIdx] : undefined;
    const year = typeof yearValRaw === 'number' ? yearValRaw : Number(String(yearValRaw || '').replace(/[^0-9]/g, '')) || undefined;

    if (!orgNumber || !employeeKey) continue;

    const hoursByMonth: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) {
      const i = monthIdx[m];
      if (typeof i === 'number') {
        const vRaw = row[i];
        const num = typeof vRaw === 'number' ? vRaw : Number(String(vRaw).replace(',', '.'));
        if (!isNaN(num) && num !== 0) hoursByMonth[m] = num;
      }
    }

    // If no month columns, try a single 'hours' column
    if (Object.keys(hoursByMonth).length === 0) {
      const hoursIdx = header.findIndex((h) => ['hours', 'timer', 'budt', 'budsjett', 'allocation'].includes(h));
      const vRaw = hoursIdx >= 0 ? row[hoursIdx] : undefined;
      const num = typeof vRaw === 'number' ? vRaw : Number(String(vRaw || '').replace(',', '.'));
      if (!isNaN(num) && num > 0) hoursByMonth[0] = num; // 0 means annual
    }

    parsed.push({ orgNumber, employeeKey, year, hoursByMonth });
  }

  return parsed;
}
