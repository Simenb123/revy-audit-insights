"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { validateXlsxFile } from '@/utils/secureXlsx';

// ------------------------------ Utilities ------------------------------

function sanitizeSheetName(name: string): string {
  // Excel sheet name limits: no :\\/?*[] and max 31 chars
  const cleaned = name.replace(/[\\\/:\?\*\[\]]/g, " ").trim();
  return cleaned.slice(0, 31) || "Sheet";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

function readWorkbook(data: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(data, { type: "array" });
}

function sheetToRows(sheet: XLSX.WorkSheet, headerRow = 1): { columns: string[]; rows: Record<string, any>[] } {
  const mat: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: "",
    blankrows: false,
  });
  const idx = Math.max(1, headerRow) - 1;
  const head = (mat[idx] || []).map((h: any, i: number) => {
    const v = (h ?? "").toString().trim();
    return v || `Kolonne_${i + 1}`;
  }) as string[];
  const rows = mat.slice(idx + 1)
    .filter((r) => (r || []).some((c) => `${c}`.trim() !== ""))
    .map((r) => {
      const o: Record<string, any> = {};
      head.forEach((h, i) => (o[h] = r[i] ?? ""));
      return o;
    });
  return { columns: head, rows };
}

function unionColumns(colGroups: string[][], firstCols: string[] = []): string[] {
  const set = new Set<string>(firstCols);
  for (const cols of colGroups) for (const c of cols) set.add(c);
  return Array.from(set);
}

function jsonToSheetWithHeader(rows: Record<string, any>[], columns: string[]): XLSX.WorkSheet {
  // Ensure header order is respected
  const data = rows.map((r) => {
    const out: Record<string, any> = {};
    columns.forEach((c) => (out[c] = r[c] ?? ""));
    return out;
  });
  return XLSX.utils.json_to_sheet(data, { header: columns });
}

// Robust CSV/TSV stringifier (for copy-to-clipboard / debug)
function stringifyDelimited(rows: Record<string, any>[], columns: string[], delimiter: string): string {
  const needsQuote = (s: string) => /["\n\r\t,;]/.test(s) || s.includes(delimiter);
  const q = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return needsQuote(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const nl = "\r\n";
  const header = columns.map((c) => q(c)).join(delimiter);
  const body = rows.map((r) => columns.map((c) => q(r[c] ?? "")).join(delimiter)).join(nl);
  return body ? header + nl + body : header;
}

// ------------------------------ Main Page ------------------------------

export default function DataredigeringPage() {
  // Shared state
  const [headerRow, setHeaderRow] = useState(4);
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  // Tab 1: Filer → Tabell
  const [filesA, setFilesA] = useState<File[]>([]);
  const [columnsA, setColumnsA] = useState<string[]>([]);
  const [rowsA, setRowsA] = useState<Record<string, any>[]>([]);
  const [filterA, setFilterA] = useState("");
  const [useFilenameAsCompany, setUseFilenameAsCompany] = useState(true);

  // Tab 2: Filer → Én arbeidsbok (alle faner)
  const [filesB, setFilesB] = useState<File[]>([]);
  const [prefixSheetWithFilename, setPrefixSheetWithFilename] = useState(true);

  // Tab 3: Én arbeidsbok → flere filer (én fil per fane)
  const [fileC, setFileC] = useState<File | null>(null);
  const [sheetsC, setSheetsC] = useState<string[]>([]);

  // Tab 4: Tabell → én fil med faner per verdi i valgt kolonne
  const [groupCol, setGroupCol] = useState<string>("");

  const fileInputA = useRef<HTMLInputElement>(null);
  const fileInputB = useRef<HTMLInputElement>(null);
  const fileInputC = useRef<HTMLInputElement>(null);

  // ------------- Handlers (Tab 1) -------------
  const handleFilesToTable = useCallback(async (incoming: FileList | File[]) => {
    const picked = Array.from(incoming).filter((f) => /\.(xlsx|xls|csv)$/i.test(f.name));
    if (!picked.length) return;
    setFilesA((prev) => [...prev, ...picked]);
    setStatus(`Leser ${picked.length} fil(er) til tabell...`);

    const parsedCols: string[][] = [];
    const allRows: Record<string, any>[] = [];

    for (const f of picked) {
      try {
        // Use secure validation
        validateXlsxFile(f);
        
        const ab = await toArrayBuffer(f);
        const wb = readWorkbook(ab);
        const sh = wb.Sheets[wb.SheetNames[0]];
        const { columns, rows } = sheetToRows(sh, headerRow);
        parsedCols.push(columns);
        const company = f.name.replace(/\.[^.]+$/i, "").replace(/^Kontoplan\s*/i, "").trim();
        rows.forEach((r) => {
          allRows.push(useFilenameAsCompany ? { Selskap: company, ...r } : r);
        });
      } catch (e: any) {
        setErrors((prev) => [...prev, `${f.name}: ${e?.message || e}`]);
      }
    }

    const cols = unionColumns(parsedCols, useFilenameAsCompany ? ["Selskap"] : []);
    setColumnsA(cols);
    setRowsA((prev) => [...prev, ...allRows]);
    setStatus(`Tabell klar: +${allRows.length} rader.`);
  }, [headerRow, useFilenameAsCompany]);

  const filteredRowsA = useMemo(() => {
    if (!filterA.trim()) return rowsA;
    const q = filterA.toLowerCase();
    return rowsA.filter((r) => columnsA.some((c) => `${r[c] ?? ""}`.toLowerCase().includes(q)));
  }, [rowsA, filterA, columnsA]);

  function exportTableAsXLSX(rows: Record<string, any>[], cols: string[], name: string) {
    const ws = jsonToSheetWithHeader(rows, cols);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    downloadBlob(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), name);
  }

  function exportTableAsCSV(rows: Record<string, any>[], cols: string[], name: string) {
    const ws = jsonToSheetWithHeader(rows, cols);
    const csv = XLSX.utils.sheet_to_csv(ws);
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), name);
  }

  // ------------- Handlers (Tab 2) -------------
  const handleFilesToOneWorkbook = useCallback(async (incoming: FileList | File[]) => {
    const picked = Array.from(incoming).filter((f) => /\.(xlsx|xls|csv)$/i.test(f.name));
    if (!picked.length) return;
    setFilesB((prev) => [...prev, ...picked]);
    setStatus(`Leser ${picked.length} fil(er) til én arbeidsbok...`);

    const wbOut = XLSX.utils.book_new();
    const usedNames = new Set<string>();

    for (const f of picked) {
      try {
        validateXlsxFile(f);
        
        const ab = await toArrayBuffer(f);
        const wb = readWorkbook(ab);
        for (const sheetName of wb.SheetNames) {
          const sheet = wb.Sheets[sheetName];
          const nameBase = prefixSheetWithFilename ? `${f.name.replace(/\.[^.]+$/i, "")} - ${sheetName}` : sheetName;
          let name = sanitizeSheetName(nameBase);
          let i = 1;
          while (usedNames.has(name)) {
            name = sanitizeSheetName(`${nameBase} (${++i})`);
          }
          usedNames.add(name);
          XLSX.utils.book_append_sheet(wbOut, sheet, name);
        }
      } catch (e: any) {
        setErrors((prev) => [...prev, `${f.name}: ${e?.message || e}`]);
      }
    }

    const out = XLSX.write(wbOut, { bookType: "xlsx", type: "array" });
    downloadBlob(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `flettede_faner.xlsx`);
  }, [prefixSheetWithFilename]);

  // ------------- Handlers (Tab 3) -------------
  const handleWorkbookToFiles = useCallback(async (incoming: FileList | File[]) => {
    const [first] = Array.from(incoming).filter((f) => /\.(xlsx|xls)$/i.test(f.name));
    if (!first) return;
    setFileC(first);
    setSheetsC([]);
    setStatus(`Leser arbeidsbok for deling...`);

    try {
      validateXlsxFile(first);
      
      const ab = await toArrayBuffer(first);
      const wb = readWorkbook(ab);
      setSheetsC(wb.SheetNames);

      // Lag og vis individuelle nedlastinger
      for (const sn of wb.SheetNames) {
        const w = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(w, wb.Sheets[sn], sanitizeSheetName(sn));
        const out = XLSX.write(w, { bookType: "xlsx", type: "array" });
        downloadBlob(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${first.name.replace(/\.[^.]+$/i, "")}_${sanitizeSheetName(sn)}.xlsx`);
      }
    } catch (e: any) {
      setErrors((prev) => [...prev, `${first.name}: ${e?.message || e}`]);
    }
  }, []);

  // ------------- Handlers (Tab 4) -------------
  function splitTableIntoSheets() {
    if (!columnsA.length || !rowsA.length || !groupCol) return;
    const groups = new Map<string, Record<string, any>[]>();
    for (const r of rowsA) {
      const key = String(r[groupCol] ?? "(tom)");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }
    const wb = XLSX.utils.book_new();
    for (const [key, rs] of groups) {
      const ws = jsonToSheetWithHeader(rs, columnsA);
      XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(key));
    }
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    downloadBlob(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `tabell_til_faner_${groupCol}.xlsx`);
  }

  // ------------------------------ UI ------------------------------

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-semibold mb-2">Dataredigering</h1>
      <p className="text-sm text-muted-foreground mb-6">Praktiske Excel‑verktøy for å spare tid i revisjonsarbeidet.</p>

      {/* Status & feil */}
      {status && <div className="mb-3 text-sm text-muted-foreground">{status}</div>}
      {!!errors.length && (
        <div className="mb-4 rounded-xl border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <div className="font-semibold mb-1">Feilmeldinger</div>
          <ul className="list-disc pl-5 space-y-1">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tab 1: Filer → Tabell */}
      <section className="mb-8 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Filer → én tabell</h2>
          <div className="flex items-center gap-3 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={useFilenameAsCompany} onChange={(e)=>setUseFilenameAsCompany(e.target.checked)} /> Bruk filnavn som «Selskap»</label>
            <label className="flex items-center gap-2">Header‑rad <input className="w-16 border rounded px-2 py-1" type="number" min={1} value={headerRow} onChange={(e)=>setHeaderRow(Number(e.target.value)||1)} /></label>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input ref={fileInputA} className="hidden" multiple type="file" accept=".xlsx,.xls,.csv" onChange={(e)=> e.target.files && handleFilesToTable(e.target.files)} />
          <button className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90" onClick={()=>fileInputA.current?.click()}>Velg filer</button>
          <input value={filterA} onChange={(e)=>setFilterA(e.target.value)} placeholder="Filter i tabell..." className="rounded-xl border px-3 py-2 text-sm min-w-[220px]"/>
          <button className="rounded-xl bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50" disabled={!rowsA.length} onClick={()=>exportTableAsXLSX(filteredRowsA, columnsA, "sammenslaatt_tabell.xlsx")}>Eksporter Excel</button>
          <button className="rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50" disabled={!rowsA.length} onClick={()=>exportTableAsCSV(filteredRowsA, columnsA, "sammenslaatt_tabell.csv")}>Last ned CSV</button>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">Rader: {filteredRowsA.length} (totalt {rowsA.length})</div>
        <div className="mt-3 overflow-auto max-h-[45vh] rounded border">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr>{columnsA.map((c)=> <th key={c} className="px-3 py-2 text-left border-b">{c}</th>)}</tr>
            </thead>
            <tbody>
              {filteredRowsA.slice(0, 1000).map((r, i)=> (
                <tr key={i} className={i%2?"bg-muted/50":"bg-background"}>
                  {columnsA.map((c)=> <td key={c} className="px-3 py-1 border-b whitespace-pre">{r[c]}</td>)}
                </tr>
              ))}
              {!rowsA.length && (
                <tr><td className="px-3 py-6 text-center text-muted-foreground" colSpan={columnsA.length||1}>Ingen data enda – legg til filer.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tab 2: Filer → Én arbeidsbok (alle faner) */}
      <section className="mb-8 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Filer → én arbeidsbok (alle faner)</h2>
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={prefixSheetWithFilename} onChange={(e)=>setPrefixSheetWithFilename(e.target.checked)} /> Prefiks fane med filnavn</label>
        </div>
        <div className="mt-3 flex gap-2">
          <input ref={fileInputB} className="hidden" multiple type="file" accept=".xlsx,.xls,.csv" onChange={(e)=> e.target.files && handleFilesToOneWorkbook(e.target.files)} />
          <button className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90" onClick={()=>fileInputB.current?.click()}>Velg filer</button>
        </div>
      </section>

      {/* Tab 3: Én arbeidsbok → flere filer (én fil per fane) */}
      <section className="mb-8 rounded-2xl border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-medium">Én arbeidsbok → flere filer (én fil per fane)</h2>
        <div className="mt-3 flex gap-2">
          <input ref={fileInputC} className="hidden" type="file" accept=".xlsx,.xls" onChange={(e)=> e.target.files && handleWorkbookToFiles(e.target.files)} />
          <button className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90" onClick={()=>fileInputC.current?.click()}>Velg én arbeidsbok</button>
        </div>
        {fileC && (
          <div className="mt-3 text-sm text-muted-foreground">Valgt fil: {fileC.name}. Faner: {sheetsC.join(", ") || "(leser...)"}</div>
        )}
      </section>

      {/* Tab 4: Tabell → én fil med faner per verdi i kolonne */}
      <section className="mb-8 rounded-2xl border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-medium">Tabell → én fil med faner per verdi</h2>
        <div className="mt-3 flex items-center gap-3">
          <select className="rounded-xl border px-3 py-2 text-sm" value={groupCol} onChange={(e)=>setGroupCol(e.target.value)}>
            <option value="">Velg kolonne...</option>
            {columnsA.map((c)=> <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="rounded-xl bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50" disabled={!groupCol || !rowsA.length} onClick={splitTableIntoSheets}>Lag arbeidsbok</button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Basert på tabellen i første seksjon. Velg kolonnen som skal gruppere til én fane per unik verdi.</p>
      </section>
    </div>
  );
}