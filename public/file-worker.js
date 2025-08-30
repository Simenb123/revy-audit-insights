// Enhanced Web Worker for processing 1M+ rows efficiently
importScripts('https://unpkg.com/papaparse@5.4.1/papaparse.min.js');

let currentParser = null;
let isPaused = false;
let totalRowsProcessed = 0;
let failedRows = 0;
let memoryUsage = { current: 0, peak: 0 };

// Conservative batch sizing to avoid WORKER_LIMIT errors
function calculateOptimalBatchSize() {
  try {
    // Use much smaller batches to avoid Edge Function timeouts
    // Start with 2K rows, max 5K based on system performance
    const baseSize = 2000;
    const maxSize = 5000;
    
    // Scale based on available memory if possible
    if (performance.memory) {
      const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      if (memoryMB > 80) {
        return baseSize; // Use minimum if memory is high
      } else if (memoryMB > 50) {
        return Math.min(baseSize * 1.5, maxSize);
      }
    }
    
    return Math.min(baseSize * 2, maxSize);
  } catch (error) {
    console.warn('Could not calculate optimal batch size, using conservative default:', error);
    return 1000; // Very conservative default
  }
}

// Enhanced logging
function logMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}] ${message}`, data || '');
  
  self.postMessage({
    type: 'LOG',
    level,
    message,
    data,
    timestamp,
    memoryUsage: performance.memory ? {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
    } : null
  });
}

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
  
  logMessage('info', `Starting file processing: ${file.name} (${file.size} bytes)`);
  self.postMessage({ type: 'PARSE_START', fileName: file.name, fileSize: file.size });
  
  let rowCount = 0;
  let buffer = [];
  let batchCount = 0;
  const BATCH_SIZE = calculateOptimalBatchSize();
  
  logMessage('info', `Using dynamic batch size: ${BATCH_SIZE} rows`);
  
  // Reset counters
  totalRowsProcessed = 0;
  failedRows = 0;
  
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
  
  // Enhanced CSV parsing with better memory management
  currentParser = Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // Keep as strings for better control
    chunk: function(results, parser) {
      if (isPaused) {
        parser.pause();
        return;
      }
      
      const rows = results.data;
      let validRowsInChunk = 0;
      let errorRowsInChunk = 0;
      
      for (const row of rows) {
        try {
          rowCount++;
          
          // Enhanced data validation and normalization
          const normalizedRow = normalizeRowData(row);
          
          // Very lenient validation - allow 8-9 digit org numbers
          const orgnrLength = normalizedRow.orgnr.length;
          if (!normalizedRow.orgnr || (orgnrLength !== 8 && orgnrLength !== 9)) {
            errorRowsInChunk++;
            failedRows++;
            logMessage('warn', `Skipping row ${rowCount}: invalid orgnr '${normalizedRow.orgnr}' (${orgnrLength} digits)`);
            continue;
          }
          
          // Require either company name OR holder name (not both)
          if (!normalizedRow.selskap && !normalizedRow.navn_aksjonaer) {
            errorRowsInChunk++;
            failedRows++;
            logMessage('warn', `Skipping row ${rowCount}: missing both company and holder name for orgnr ${normalizedRow.orgnr}`);
            continue;
          }
          
          // Log warnings for missing data but don't skip
          if (!normalizedRow.antall_aksjer || normalizedRow.antall_aksjer === 0) {
            logMessage('warn', `Row ${rowCount}: Zero shares for ${normalizedRow.orgnr} - ${normalizedRow.selskap || normalizedRow.navn_aksjonaer}`);
          }
          
          buffer.push(normalizedRow);
          validRowsInChunk++;
          
          // Send batch when buffer is full
          if (buffer.length >= BATCH_SIZE) {
            batchCount++;
            const batchData = [...buffer]; // Clone to avoid memory issues
            buffer = []; // Clear buffer immediately
            
            // Force garbage collection hint
            if (typeof gc !== 'undefined') {
              gc();
            }
            
            logMessage('info', `Sending batch ${batchCount} with ${batchData.length} rows`);
            
            self.postMessage({
              type: 'BATCH_READY',
              batch: batchData,
              batchNumber: batchCount,
              rowCount: rowCount,
              validRows: validRowsInChunk,
              errorRows: errorRowsInChunk
            });
            
            validRowsInChunk = 0;
            errorRowsInChunk = 0;
          }
        } catch (error) {
          errorRowsInChunk++;
          failedRows++;
          logMessage('error', `Error processing row ${rowCount}:`, error.message);
        }
      }
      
      // Send progress update with more details
      self.postMessage({
        type: 'PROGRESS',
        rowCount: rowCount,
        validRows: rowCount - failedRows,
        errorRows: failedRows,
        memoryUsage: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0
      });
    },
    complete: function() {
      // Send remaining buffer
      if (buffer.length > 0) {
        batchCount++;
        logMessage('info', `Sending final batch ${batchCount} with ${buffer.length} rows`);
        
        self.postMessage({
          type: 'BATCH_READY',
          batch: buffer,
          batchNumber: batchCount,
          rowCount: rowCount,
          isFinalBatch: true
        });
      }
      
      logMessage('info', `Parsing completed: ${rowCount} total rows, ${rowCount - failedRows} valid, ${failedRows} errors`);
      
      self.postMessage({
        type: 'PARSE_COMPLETE',
        totalRows: rowCount,
        validRows: rowCount - failedRows,
        errorRows: failedRows,
        totalBatches: batchCount
      });
    },
    error: function(error) {
      logMessage('error', 'Parser error:', error.message);
      self.postMessage({
        type: 'ERROR',
        error: error.message,
        details: error
      });
    }
  });
}

// Enhanced data normalization with better validation
function normalizeRowData(row) {
  // Extract org number with more flexible handling
  let orgnr = String(
    row.orgnr || row.Orgnr || row.organisasjonsnummer || row.Organisasjonsnummer || 
    row.org_nr || row['org-nr'] || row.A || ''
  ).trim().replace(/\D/g, ''); // Remove non-digits
  
  // Pad 8-digit org numbers to 9 digits with leading zero
  if (orgnr.length === 8) {
    orgnr = '0' + orgnr;
  }
  
  return {
    orgnr: orgnr,
    
    selskap: String(
      row.navn || row.selskapsnavn || row.company_name || row.Selskap || 
      row.selskap || row.B || ''
    ).trim(),
    
    aksjeklasse: String(
      row.aksjeklasse || row.Aksjeklasse || row.share_class || 
      row.C || 'Ordinære'
    ).trim(),
    
    navn_aksjonaer: String(
      row.aksjonaer || row.eier || row.holder || row.navn_aksjonaer || 
      row['Navn aksjonÃ¦r'] || row['Navn aksjonær'] || row.eier_navn ||
      row.D || ''
    ).trim(),
    
    fodselsar_orgnr: String(
      row.eier_orgnr || row.holder_orgnr || row.fodselsar_orgnr || 
      row['FÃ¸dselsÃ¥r/orgnr'] || row['Fødselsår/orgnr'] || 
      row.E || ''
    ).trim(),
    
    landkode: String(
      row.landkode || row.Landkode || row.country_code || 
      row.F || row.G || 'NO'
    ).trim().toUpperCase(),
    
    antall_aksjer: parseInt(String(
      row.aksjer || row.shares || row.antall_aksjer || 
      row['Antall aksjer'] || row.andeler ||
      row.H || '0'
    ).replace(/[^\d]/g, '')) || 0,
    
    antall_aksjer_selskap: parseInt(String(
      row.antall_aksjer_selskap || row.total_shares || 
      row['Antall aksjer selskap'] || 
      row.I || '0'
    ).replace(/[^\d]/g, '')) || null
  };
}

function pauseParsing() {
  isPaused = true;
  if (currentParser) {
    currentParser.pause();
  }
  logMessage('info', 'Parsing paused');
  self.postMessage({ type: 'PAUSED' });
}

function resumeParsing() {
  isPaused = false;
  if (currentParser) {
    currentParser.resume();
  }
  logMessage('info', 'Parsing resumed');
  self.postMessage({ type: 'RESUMED' });
}

function cancelParsing() {
  if (currentParser) {
    currentParser.abort();
  }
  currentParser = null;
  isPaused = false;
  totalRowsProcessed = 0;
  failedRows = 0;
  logMessage('info', 'Parsing cancelled');
  self.postMessage({ type: 'CANCELLED' });
}