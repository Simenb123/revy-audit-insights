"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { validateXlsxFile } from '@/utils/secureXlsx';
import { fetchNaeringsMapFromDB } from '@/services/naering';

// ------------------------------ Utilities ------------------------------

// NA-spesifikke hjelpefunksjoner
function normalizeCode(s: any): string {
  return String(s ?? "").trim().replace(/\s+/g, "").replace(/,/g, ".");
}

function stripNonDigitsDotDash(s: string): string {
  return s.replace(/[^0-9.\-]/g, "");
}

function longestPrefixMatch(konto: string, codes: string[]): string | null {
  const k = stripNonDigitsDotDash(normalizeCode(konto));
  let best: string | null = null, bestLen = -1;
  for (const code of codes) {
    const c = stripNonDigitsDotDash(normalizeCode(code));
    if (c && (k === c || k.startsWith(c)) && c.length > bestLen) { 
      best = code; 
      bestLen = c.length; 
    }
  }
  return best;
}

// Utvidet matcher for 'konto' – dekker flere varianter/språk
const KONTO_REGEX = /^(konto(?:nr|nummer)?\.?)$|konto\s*[-.]?\s*nr\.?|^account(?:\s*number)?$|^num(ber)?$/i;

// ResBalRef matcher for NAKonto-kolonne  
const RESBAL_REGEX = /^(resbalref)$|^res\s*bal\s*ref$|^na[-_\s]*konto(nr|nummer)?$|^næringsspesifikasjon$/i;

// Regnskapslinjer matchers for sammenslåing
const RESULTAT_REGEX = /^resultatregnskap$/i;
const BALANSE_REGEX = /^balanse$/i;

function detectHeaderRow(sheet: XLSX.WorkSheet, maxScan = 10): number | null {
  const mat: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: "",
    blankrows: true,
  });
  const limit = Math.min(mat.length, maxScan);
  for (let i = 0; i < limit; i++) {
    const row = mat[i] || [];
    if (row.some((c: any) => KONTO_REGEX.test(String(c)) || RESBAL_REGEX.test(String(c)))) return i + 1; // 1-basert
  }
  return null;
}

function guessKontoHeader(headers: string[]): string | null {
  const idx = headers.findIndex((h) => KONTO_REGEX.test(String(h)));
  if (idx >= 0) return headers[idx];
  // fallback: første header som inneholder "konto"
  const idx2 = headers.findIndex((h) => String(h).toLowerCase().includes("konto"));
  return idx2 >= 0 ? headers[idx2] : null;
}

function guessResBalHeader(headers: string[]): string | null {
  const idx = headers.findIndex((h) => RESBAL_REGEX.test(String(h)));
  return idx >= 0 ? headers[idx] : null;
}

function guessResultatRegnskapHeader(headers: string[]): string | null {
  const idx = headers.findIndex((h) => RESULTAT_REGEX.test(String(h)));
  return idx >= 0 ? headers[idx] : null;
}

function guessBalanseHeader(headers: string[]): string | null {
  const idx = headers.findIndex((h) => BALANSE_REGEX.test(String(h)));
  return idx >= 0 ? headers[idx] : null;
}

async function parseNaeringsExcel(file: File): Promise<Map<string, string>> {
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const mat: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" });
  const m = new Map<string, string>();
  for (const r of mat) {
    const kode = String(r[0] ?? "").trim();
    const navn = String(r[1] ?? "").trim();
    if (kode && navn) m.set(kode, navn);
  }
  return m;
}

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

function sheetToRows(sheet: XLSX.WorkSheet, headerRow = 1): { columns: string[]; rows: Record<string, any>[]; mergeInfo?: string } {
  const mat: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: "",
    // VIKTIG: ikke dropp tomme rader eller celler – dette bevarer riktig radnummer
    blankrows: true,
  });

  const idx = Math.max(1, headerRow) - 1;
  let head = (mat[idx] || []).map((h: any, i: number) => {
    const v = (h ?? "").toString().trim();
    return v || `Kolonne_${i + 1}`;
  }) as string[];

  // Detekter Resultatregnskap og Balanse kolonner
  const resultatCol = guessResultatRegnskapHeader(head);
  const balanseCol = guessBalanseHeader(head);
  let mergeInfo: string | undefined;

  let rows = mat
    .slice(idx + 1)
    // behold bare rader som har minst én ikke-tom verdi
    .filter((r) => (r || []).some((c) => `${c}`.trim() !== ""))
    .map((r) => {
      const o: Record<string, any> = {};
      head.forEach((h, i) => (o[h] = r[i] ?? ""));
      return o;
    });

  // Utfør sammenslåing hvis begge kolonner finnes
  if (resultatCol && balanseCol) {
    let mergedCount = 0;
    
    // Opprett ny regnskapslinje kolonne og fjern originale
    const newRows = rows.map(row => {
      const resultatValue = String(row[resultatCol] || "").trim();
      const balanseValue = String(row[balanseCol] || "").trim();
      
      // Velg ikke-tom verdi, prioriter Resultatregnskap
      let regnskapslinje = "";
      if (resultatValue) {
        regnskapslinje = resultatValue;
      } else if (balanseValue) {
        regnskapslinje = balanseValue;
      }
      
      if (regnskapslinje) mergedCount++;
      
      // Opprett ny rad uten originale kolonner, men med ny regnskapslinje
      const newRow = { ...row };
      delete newRow[resultatCol];
      delete newRow[balanseCol];
      newRow.regnskapslinje = regnskapslinje;
      
      return newRow;
    });
    
    // Oppdater kolonner - fjern originale og legg til regnskapslinje
    const newHead = head.filter(h => h !== resultatCol && h !== balanseCol);
    
    // Finn beste posisjon for regnskapslinje (etter konto-kolonne hvis den finnes)
    const kontoCol = guessKontoHeader(head);
    const kontoIndex = kontoCol ? newHead.indexOf(kontoCol) : -1;
    const insertIndex = kontoIndex >= 0 ? kontoIndex + 1 : 0;
    
    newHead.splice(insertIndex, 0, 'regnskapslinje');
    
    head = newHead;
    rows = newRows;
    mergeInfo = `Sammenslått ${resultatCol} og ${balanseCol} til regnskapslinje (${mergedCount} rader behandlet)`;
  }

  return { columns: head, rows, mergeInfo };
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

  // NA-spesifikasjon state
  const [sbFile, setSbFile] = useState<File | null>(null);
  const [naSource, setNaSource] = useState<"db" | "excel">("db");
  const [naFile, setNaFile] = useState<File | null>(null);
  const [sbHeaderRow, setSbHeaderRow] = useState(4);

  // Mass import state
  const [masseFiles, setMasseFiles] = useState<File[]>([]);
  const [masseOutputFormat, setMasseOutputFormat] = useState<"merged" | "separate">("merged");
  const [masseProcessing, setMasseProcessing] = useState(false);
  const [masseProgress, setMasseProgress] = useState({ current: 0, total: 0, info: "" });

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
  const fileInputSB = useRef<HTMLInputElement>(null);
  const fileInputNA = useRef<HTMLInputElement>(null);
  const fileInputMasse = useRef<HTMLInputElement>(null);

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
        const { columns, rows, mergeInfo } = sheetToRows(sh, headerRow);
        parsedCols.push(columns);
        const company = f.name.replace(/\.[^.]+$/i, "").replace(/^Kontoplan\s*/i, "").trim();
        rows.forEach((r) => {
          allRows.push(useFilenameAsCompany ? { Selskap: company, ...r } : r);
        });
        
        if (mergeInfo) {
          setStatus(prev => `${prev} ${f.name}: ${mergeInfo}`);
        }
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

  // ------------- Handler for NA-mapping -------------
  const handleMapNaerings = useCallback(async () => {
    if (!sbFile) {
      setErrors(prev => [...prev, "Mangler saldobalanse-fil"]);
      return;
    }

    setStatus("Prosesserer saldobalanse og NA-koder...");

    try {
      // 1) Les saldobalanse
      await validateXlsxFile(sbFile);
      const sbAb = await toArrayBuffer(sbFile);
      const sbWb = readWorkbook(sbAb);
      const sbWs = sbWb.Sheets[sbWb.SheetNames[0]];
      const { columns: sbColumns, rows: sbRows, mergeInfo } = sheetToRows(sbWs, sbHeaderRow);
      
      if (mergeInfo) {
        setStatus(prev => `${prev} ${mergeInfo}`);
      }

      // 2) Finn kolonner med auto-deteksjon og fallback
      let kontoCol = guessKontoHeader(sbColumns);
      let resBalCol = guessResBalHeader(sbColumns);

      // Hvis ikke funnet: scan topp-10 rader for korrekt header-rad og prøv igjen
      if (!kontoCol && !resBalCol) {
        const autoRow = detectHeaderRow(sbWs);
        if (autoRow && autoRow !== sbHeaderRow) {
          const { columns: autoColumns, rows: autoRowsNew, mergeInfo: autoMergeInfo } = sheetToRows(sbWs, autoRow);
          
          if (autoMergeInfo) {
            setStatus(prev => `${prev} ${autoMergeInfo}`);
          }
          kontoCol = guessKontoHeader(autoColumns);
          resBalCol = guessResBalHeader(autoColumns);
          if (kontoCol || resBalCol) {
            // Oppdater til den automatisk detekterte header-raden
            sbColumns.length = 0;
            sbColumns.push(...autoColumns);
            sbRows.length = 0;
            sbRows.push(...autoRowsNew);
            setStatus(`Auto-detekterte header på rad ${autoRow} (i stedet for ${sbHeaderRow})`);
          }
        }
      }

      if (!kontoCol && !resBalCol) {
        setErrors(prev => [...prev, `Kunne ikke finne verken konto- eller ResBalRef-kolonne i saldobalansen. Funnet kolonner: ${sbColumns.join(', ')}`]);
        return;
      }

      // Info om hvilken tilnærming som brukes
      if (resBalCol && kontoCol) {
        setStatus(prev => `${prev} - Bruker ResBalRef (${resBalCol}) som primær kilde, Konto (${kontoCol}) som fallback`);
      } else if (resBalCol) {
        setStatus(prev => `${prev} - Bruker ResBalRef (${resBalCol}) som NAKonto-kilde`);
      } else {
        setStatus(prev => `${prev} - Bruker prefiks-matching fra Konto (${kontoCol})`);
      }

      // 3) Hent NA-map (database eller Excel)
      let naMap: Map<string, string>;
      try {
        if (naSource === "db") {
          naMap = await fetchNaeringsMapFromDB();
          if (naMap.size === 0) {
            setErrors(prev => [...prev, "Ingen NA-koder funnet i database. Prøv å velge Excel-fil isteden."]);
            return;
          }
        } else {
          if (!naFile) {
            setErrors(prev => [...prev, "Mangler Naeringsspesifikasjon.xlsx fil"]);
            return;
          }
          await validateXlsxFile(naFile);
          naMap = await parseNaeringsExcel(naFile);
          if (naMap.size === 0) {
            setErrors(prev => [...prev, "Ingen NA-koder funnet i Excel-filen"]);
            return;
          }
        }
      } catch (e: any) {
        setErrors(prev => [...prev, `Feil ved henting av NA-koder: ${e?.message || e}`]);
        return;
      }

      // 4) ResBalRef-first mapping med fallback til prefiks-matching
      const naCodes = Array.from(naMap.keys()).sort((a, b) => normalizeCode(b).length - normalizeCode(a).length);
      let resBalMatches = 0;
      let prefixMatches = 0;
      let noMatches = 0;

      const enrichedRows = sbRows.map(row => {
        let matchedCode: string | null = null;
        let matchSource = "";

        // Prioriter ResBalRef hvis kolonne finnes
        if (resBalCol) {
          const resBalValue = normalizeCode(row[resBalCol]);
          if (resBalValue && naMap.has(resBalValue)) {
            matchedCode = resBalValue;
            matchSource = "ResBalRef";
            resBalMatches++;
          }
        }

        // Fallback til prefiks-matching fra Kontonr
        if (!matchedCode && kontoCol) {
          const kontoNr = row[kontoCol];
          matchedCode = longestPrefixMatch(kontoNr, naCodes);
          if (matchedCode) {
            matchSource = "Prefiks";
            prefixMatches++;
          }
        }

        if (!matchedCode) {
          noMatches++;
        }

        return {
          ...row,
          NAkonto: matchedCode || "",
          NAnavn: matchedCode ? (naMap.get(matchedCode) || "") : "",
          MatchKilde: matchSource || "Ingen"
        };
      });

      // 5) Lag rader uten match for kvalitetssikring
      const unmatchedRows = enrichedRows.filter(row => !row.NAkonto);

      // 6) Eksporter hovedfil
      const newColumns = [...sbColumns, "NAkonto", "NAnavn", "MatchKilde"];
      const ws = jsonToSheetWithHeader(enrichedRows, newColumns);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Saldobalanse med NA");
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const filename = `${sbFile.name.replace(/\.[^.]+$/i, "")} - med Naeringsspesifikasjon.xlsx`;
      downloadBlob(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);

      // 7) Eksporter "Uten NA" fil hvis det finnes umatchede rader
      if (unmatchedRows.length > 0) {
        const wsUnmatched = jsonToSheetWithHeader(unmatchedRows, newColumns);
        const wbUnmatched = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wbUnmatched, wsUnmatched, "Uten NA-match");
        const outUnmatched = XLSX.write(wbUnmatched, { bookType: "xlsx", type: "array" });
        const filenameUnmatched = `${sbFile.name.replace(/\.[^.]+$/i, "")} - Uten NA.xlsx`;
        downloadBlob(new Blob([outUnmatched], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filenameUnmatched);
      }

      const matchRate = ((enrichedRows.length - noMatches) / enrichedRows.length * 100).toFixed(1);
      setStatus(`Excel eksportert: ${enrichedRows.length} rader. Match-rate: ${matchRate}% (ResBalRef: ${resBalMatches}, Prefiks: ${prefixMatches}, Ingen: ${noMatches})`);
    } catch (e: any) {
      setErrors(prev => [...prev, `Feil ved NA-mapping: ${e?.message || e}`]);
    }
  }, [sbFile, naSource, naFile, sbHeaderRow]);

  // ------------- Mass Import Handler -------------
  const handleMasseNaeringsMapping = useCallback(async () => {
    if (!masseFiles.length) {
      setErrors(prev => [...prev, "Ingen filer valgt for masseimport"]);
      return;
    }

    setMasseProcessing(true);
    setMasseProgress({ current: 0, total: masseFiles.length, info: "" });
    setStatus("Starter masseimport av saldobalanse-filer...");

    try {
      // Hent NA-map én gang (database eller Excel)
      let naMap: Map<string, string>;
      try {
        if (naSource === "db") {
          naMap = await fetchNaeringsMapFromDB();
          if (naMap.size === 0) {
            setErrors(prev => [...prev, "Ingen NA-koder funnet i database. Prøv å velge Excel-fil isteden."]);
            return;
          }
        } else {
          if (!naFile) {
            setErrors(prev => [...prev, "Mangler Naeringsspesifikasjon.xlsx fil"]);
            return;
          }
          await validateXlsxFile(naFile);
          naMap = await parseNaeringsExcel(naFile);
          if (naMap.size === 0) {
            setErrors(prev => [...prev, "Ingen NA-koder funnet i Excel-filen"]);
            return;
          }
        }
      } catch (e: any) {
        setErrors(prev => [...prev, `Feil ved henting av NA-koder: ${e?.message || e}`]);
        return;
      }

      const naCodes = Array.from(naMap.keys()).sort((a, b) => normalizeCode(b).length - normalizeCode(a).length);
      const allEnrichedRows: Record<string, any>[] = [];
      const allUnmatchedRows: Record<string, any>[] = [];
      const separateFiles: Array<{ filename: string; rows: Record<string, any>[]; columns: string[]; unmatchedRows: Record<string, any>[] }> = [];
      let totalStats = { resBalMatches: 0, prefixMatches: 0, noMatches: 0, totalRows: 0 };

      // Prosesser hver fil
      for (let i = 0; i < masseFiles.length; i++) {
        const file = masseFiles[i];
        setMasseProgress({ current: i + 1, total: masseFiles.length, info: "" });
        setStatus(`Prosesserer fil ${i + 1}/${masseFiles.length}: ${file.name}`);

        try {
          await validateXlsxFile(file);
          const sbAb = await toArrayBuffer(file);
          const sbWb = readWorkbook(sbAb);
          const sbWs = sbWb.Sheets[sbWb.SheetNames[0]];
          let { columns: sbColumns, rows: sbRows, mergeInfo } = sheetToRows(sbWs, sbHeaderRow);
          
          if (mergeInfo) {
            setMasseProgress(prev => ({ ...prev, info: mergeInfo }));
          }

          // Auto-detekter kolonner for denne filen
          let kontoCol = guessKontoHeader(sbColumns);
          let resBalCol = guessResBalHeader(sbColumns);

          if (!kontoCol && !resBalCol) {
            const autoRow = detectHeaderRow(sbWs);
            if (autoRow && autoRow !== sbHeaderRow) {
            const { columns: autoColumns, rows: autoRowsNew, mergeInfo: autoMergeInfo } = sheetToRows(sbWs, autoRow);
            
            if (autoMergeInfo) {
              setMasseProgress(prev => ({ ...prev, info: autoMergeInfo }));
            }
              kontoCol = guessKontoHeader(autoColumns);
              resBalCol = guessResBalHeader(autoColumns);
              if (kontoCol || resBalCol) {
                sbColumns = autoColumns;
                sbRows = autoRowsNew;
              }
            }
          }

          if (!kontoCol && !resBalCol) {
            setErrors(prev => [...prev, `${file.name}: Kunne ikke finne verken konto- eller ResBalRef-kolonne`]);
            continue;
          }

          // Mapping samme logikk som enkeltfil
          let resBalMatches = 0, prefixMatches = 0, noMatches = 0;
          const enrichedRows = sbRows.map(row => {
            let matchedCode: string | null = null;
            let matchSource = "";

            if (resBalCol) {
              const resBalValue = normalizeCode(row[resBalCol]);
              if (resBalValue && naMap.has(resBalValue)) {
                matchedCode = resBalValue;
                matchSource = "ResBalRef";
                resBalMatches++;
              }
            }

            if (!matchedCode && kontoCol) {
              const kontoNr = row[kontoCol];
              matchedCode = longestPrefixMatch(kontoNr, naCodes);
              if (matchedCode) {
                matchSource = "Prefiks";
                prefixMatches++;
              }
            }

            if (!matchedCode) noMatches++;

            const company = file.name.replace(/\.[^.]+$/i, "").replace(/^Saldobalanse\s*/i, "").trim();
            return {
              Selskap: company,
              ...row,
              NAkonto: matchedCode || "",
              NAnavn: matchedCode ? (naMap.get(matchedCode) || "") : "",
              MatchKilde: matchSource || "Ingen"
            };
          });

          const unmatchedRows = enrichedRows.filter(row => !row.NAkonto);
          const newColumns = ["Selskap", ...sbColumns, "NAkonto", "NAnavn", "MatchKilde"];

          // Legg til i totaler
          totalStats.resBalMatches += resBalMatches;
          totalStats.prefixMatches += prefixMatches;
          totalStats.noMatches += noMatches;
          totalStats.totalRows += enrichedRows.length;

          if (masseOutputFormat === "merged") {
            allEnrichedRows.push(...enrichedRows);
            allUnmatchedRows.push(...unmatchedRows);
          } else {
            separateFiles.push({
              filename: `${file.name.replace(/\.[^.]+$/i, "")} - med Naeringsspesifikasjon.xlsx`,
              rows: enrichedRows,
              columns: newColumns,
              unmatchedRows
            });
          }

        } catch (e: any) {
          setErrors(prev => [...prev, `${file.name}: ${e?.message || e}`]);
        }
      }

      // Eksporter resultat
      if (masseOutputFormat === "merged") {
        // Én sammenslått fil
        const mergedColumns = ["Selskap", ...Array.from(new Set(allEnrichedRows.flatMap(row => Object.keys(row))))];
        const ws = jsonToSheetWithHeader(allEnrichedRows, mergedColumns);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Alle selskaper");
        const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        downloadBlob(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "Masseimport - Alle selskaper med NA.xlsx");

        // Sammenslått "Uten NA" fil
        if (allUnmatchedRows.length > 0) {
          const wsUnmatched = jsonToSheetWithHeader(allUnmatchedRows, mergedColumns);
          const wbUnmatched = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wbUnmatched, wsUnmatched, "Uten NA-match");
          const outUnmatched = XLSX.write(wbUnmatched, { bookType: "xlsx", type: "array" });
          downloadBlob(new Blob([outUnmatched], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "Masseimport - Uten NA.xlsx");
        }
      } else {
        // Separate filer
        for (const fileData of separateFiles) {
          const ws = jsonToSheetWithHeader(fileData.rows, fileData.columns);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Saldobalanse med NA");
          const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
          downloadBlob(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileData.filename);

          if (fileData.unmatchedRows.length > 0) {
            const wsUnmatched = jsonToSheetWithHeader(fileData.unmatchedRows, fileData.columns);
            const wbUnmatched = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wbUnmatched, wsUnmatched, "Uten NA-match");
            const outUnmatched = XLSX.write(wbUnmatched, { bookType: "xlsx", type: "array" });
            const filenameUnmatched = fileData.filename.replace(".xlsx", " - Uten NA.xlsx");
            downloadBlob(new Blob([outUnmatched], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filenameUnmatched);
          }
        }
      }

      const matchRate = ((totalStats.totalRows - totalStats.noMatches) / totalStats.totalRows * 100).toFixed(1);
      setStatus(`Masseimport fullført: ${masseFiles.length} filer, ${totalStats.totalRows} rader. Match-rate: ${matchRate}% (ResBalRef: ${totalStats.resBalMatches}, Prefiks: ${totalStats.prefixMatches}, Ingen: ${totalStats.noMatches})`);

    } catch (e: any) {
      setErrors(prev => [...prev, `Feil ved masseimport: ${e?.message || e}`]);
    } finally {
      setMasseProcessing(false);
      setMasseProgress({ current: 0, total: 0, info: "" });
    }
  }, [masseFiles, naSource, naFile, sbHeaderRow, masseOutputFormat]);

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
          <button 
            className="mt-2 text-xs underline" 
            onClick={() => setErrors([])}
          >
            Fjern feilmeldinger
          </button>
        </div>
      )}

      {/* NA-spesifikasjon kort */}
      <section className="mb-8 rounded-2xl border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-medium mb-3">Saldobalanse → legg til Næringsspesifikasjon</h2>
        <div className="mb-3 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <strong>Prioritering:</strong> Bruker ResBalRef-kolonne som hovedkilde for NAKonto når tilgjengelig. 
          Faller tilbake til prefiks-matching av Kontonr hvis ResBalRef mangler eller er tom.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Velg saldobalanse</label>
            <input 
              ref={fileInputSB} 
              className="hidden" 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={(e) => setSbFile(e.target.files?.[0] || null)} 
            />
            <button 
              className="w-full rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={() => fileInputSB.current?.click()}
            >
              {sbFile ? sbFile.name : "Velg saldobalanse (Alle utsigten...)"}
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Kilde for NA-koder</label>
            <select 
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={naSource}
              onChange={(e) => setNaSource(e.target.value as "db" | "excel")}
            >
              <option value="db">Fra database</option>
              <option value="excel">Fra Excel</option>
            </select>
          </div>
        </div>

        {naSource === "excel" && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Velg Naeringsspesifikasjon.xlsx</label>
            <input 
              ref={fileInputNA} 
              className="hidden" 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={(e) => setNaFile(e.target.files?.[0] || null)} 
            />
            <button 
              className="rounded-xl bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
              onClick={() => fileInputNA.current?.click()}
            >
              {naFile ? naFile.name : "Velg Naeringsspesifikasjon.xlsx"}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm flex items-center gap-2">
              Header-rad 
              <input 
                className="w-16 border rounded px-2 py-1" 
                type="number" 
                min={1} 
                value={sbHeaderRow} 
                onChange={(e) => setSbHeaderRow(Number(e.target.value) || 1)} 
              />
            </label>
          </div>
          <button 
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
            disabled={!sbFile || (naSource === "excel" && !naFile)}
            onClick={handleMapNaerings}
          >
            Lag ny Excel med NAkonto/NAnavn
          </button>
        </div>
      </section>

      {/* Mass Import NA-spesifikasjon kort */}
      <section className="mb-8 rounded-2xl border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-medium mb-3">Masseimport: Saldobalanse → Næringsspesifikasjon</h2>
        <div className="mb-3 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <strong>Batch-prosessering:</strong> Prosesser flere saldobalanse-filer samtidig med samme ResBalRef-first logikk. 
          Velg om du vil ha én sammenslått fil eller separate filer per selskap.
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Velg flere saldobalanse-filer</label>
            <input 
              ref={fileInputMasse} 
              className="hidden" 
              type="file" 
              multiple
              accept=".xlsx,.xls" 
              onChange={(e) => setMasseFiles(Array.from(e.target.files || []))} 
            />
            <button 
              className="w-full rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={() => fileInputMasse.current?.click()}
            >
              {masseFiles.length ? `${masseFiles.length} filer valgt` : "Velg flere saldobalanse-filer"}
            </button>
            {masseFiles.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground max-h-20 overflow-y-auto">
                {masseFiles.map((f, i) => (
                  <div key={i} className="truncate">{f.name}</div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Output-format</label>
            <select 
              className="w-full rounded-xl border px-3 py-2 text-sm mb-2"
              value={masseOutputFormat}
              onChange={(e) => setMasseOutputFormat(e.target.value as "merged" | "separate")}
            >
              <option value="merged">Én sammenslått fil</option>
              <option value="separate">Separate filer per selskap</option>
            </select>
            <div className="text-xs text-muted-foreground">
              {masseOutputFormat === "merged" 
                ? "Alle selskaper i én Excel-fil med Selskap-kolonne" 
                : "Én Excel-fil per opprinnelig fil"}
            </div>
          </div>
        </div>

        <div className="mb-4 text-sm text-muted-foreground">
          <strong>NA-kilde:</strong> Bruker samme innstilling som enkeltfil-prosessering ovenfor 
          ({naSource === "db" ? "database" : naFile ? naFile.name : "mangler Excel-fil"})
        </div>

        {masseProcessing && (
          <div className="mb-4 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Prosesserer...</span>
              <span>{masseProgress.current}/{masseProgress.total}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(masseProgress.current / Math.max(masseProgress.total, 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button 
            className="text-sm text-muted-foreground underline"
            onClick={() => setMasseFiles([])}
            disabled={masseProcessing}
          >
            Tøm filliste
          </button>
          <button 
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
            disabled={!masseFiles.length || masseProcessing || (naSource === "excel" && !naFile)}
            onClick={handleMasseNaeringsMapping}
          >
            {masseProcessing ? "Prosesserer..." : "Start masseimport"}
          </button>
        </div>
      </section>

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