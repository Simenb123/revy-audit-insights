// Web Worker for processing large files without blocking UI
importScripts('https://unpkg.com/papaparse@5.4.1/papaparse.min.js');

let currentParser = null;
let isPaused = false;

self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'PARSE_FILE':
      parseFile(data);
      break;
    case 'PAUSE':
      pauseParsing();
      break;
    case 'RESUME':
      resumeParsing();
      break;
    case 'CANCEL':
      cancelParsing();
      break;
  }
};

function parseFile(data) {
  const { file, options } = data;
  
  self.postMessage({ type: 'PARSE_START' });
  
  let rowCount = 0;
  let buffer = [];
  const BATCH_SIZE = 10000; // Increased batch size
  
  // Check if file is Excel or CSV
  const fileName = file.name.toLowerCase();
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
  
  if (isExcel) {
    // For Excel files, we need to use a different approach since we can't import XLSX in worker easily
    self.postMessage({ 
      type: 'ERROR', 
      error: 'Excel files need to be processed on main thread. Please convert to CSV or use the fallback method.' 
    });
    return;
  }
  
  // Parse CSV with Papa Parse
  currentParser = Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    chunk: function(results, parser) {
      if (isPaused) {
        parser.pause();
        return;
      }
      
      const rows = results.data;
      
      for (const row of rows) {
        rowCount++;
        
        // Normalize row data
        const normalizedRow = {
          orgnr: String(
            row.orgnr || row.Orgnr || row.organisasjonsnummer || row.Organisasjonsnummer || row.org_nr || ''
          ).trim(),
          selskap: String(
            row.navn || row.selskapsnavn || row.company_name || row.Selskap || ''
          ).trim(),
          aksjeklasse: String(
            row.aksjeklasse || row.Aksjeklasse || row.share_class || ''
          ).trim() || null,
          navn_aksjonaer: String(
            row.aksjonaer || row.eier || row.holder || row.navn_aksjonaer || 
            row['Navn aksjonÃ¦r'] || row['Navn aksjonær'] || ''
          ).trim(),
          fodselsar_orgnr: String(
            row.eier_orgnr || row.holder_orgnr || row.fodselsar_orgnr || 
            row['FÃ¸dselsÃ¥r/orgnr'] || row['Fødselsår/orgnr'] || ''
          ).trim() || null,
          landkode: String(
            row.landkode || row.Landkode || row.country_code || ''
          ).trim() || null,
          antall_aksjer: String(
            row.aksjer || row.shares || row.antall_aksjer || 
            row['Antall aksjer'] || '0'
          ).trim(),
          antall_aksjer_selskap: String(
            row.antall_aksjer_selskap || row.total_shares || 
            row['Antall aksjer selskap'] || ''
          ).trim() || null
        };
        
        buffer.push(normalizedRow);
        
        // Send batch when buffer is full
        if (buffer.length >= BATCH_SIZE) {
          self.postMessage({
            type: 'BATCH_READY',
            batch: buffer,
            rowCount: rowCount
          });
          buffer = [];
        }
      }
      
      // Send progress update
      self.postMessage({
        type: 'PROGRESS',
        rowCount: rowCount
      });
    },
    complete: function() {
      // Send remaining buffer
      if (buffer.length > 0) {
        self.postMessage({
          type: 'BATCH_READY',
          batch: buffer,
          rowCount: rowCount
        });
      }
      
      self.postMessage({
        type: 'PARSE_COMPLETE',
        totalRows: rowCount
      });
    },
    error: function(error) {
      self.postMessage({
        type: 'ERROR',
        error: error.message
      });
    }
  });
}

function pauseParsing() {
  isPaused = true;
  if (currentParser) {
    currentParser.pause();
  }
  self.postMessage({ type: 'PAUSED' });
}

function resumeParsing() {
  isPaused = false;
  if (currentParser) {
    currentParser.resume();
  }
  self.postMessage({ type: 'RESUMED' });
}

function cancelParsing() {
  if (currentParser) {
    currentParser.abort();
  }
  currentParser = null;
  isPaused = false;
  self.postMessage({ type: 'CANCELLED' });
}