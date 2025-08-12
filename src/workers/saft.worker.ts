/// <reference lib="webworker" />

import { parseSaftFile, type SaftResult } from '@/utils/saftParser';
import { createZipFromParsed } from '@/utils/saftImport';

export interface SaftWorkerRequest {
  file: File;
}

export interface SaftWorkerResponse {
  parsed: SaftResult;
  zip: Blob;
  error?: string;
}

self.onmessage = async (e: MessageEvent<SaftWorkerRequest>) => {
  try {
    const parsed = await parseSaftFile(e.data.file);
    const zip = await createZipFromParsed(parsed);
    const response: SaftWorkerResponse = { parsed, zip };
    (self as unknown as DedicatedWorkerGlobalScope).postMessage(response);
  } catch (err: any) {
    const response: SaftWorkerResponse = {
      parsed: {
        header: null,
        company: null,
        bank_accounts: [],
        accounts: [],
        customers: [],
        suppliers: [],
        tax_table: [],
        analysis_types: [],
        journals: [],
        transactions: [],
        analysis_lines: [],
      },
      zip: new Blob(),
      error: err?.message || 'Unknown error'
    };
    (self as unknown as DedicatedWorkerGlobalScope).postMessage(response);
  }
};

export {};
