
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";

interface LogEntry {
  message: string;
  timestamp: string;
}

type AddLogFunction = (message: string) => void;

export const processOrgNumber = async (orgNumber: string, addLog: AddLogFunction) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      const errorMsg = 'No authenticated user found';
      console.error(errorMsg);
      addLog(errorMsg);
      return null;
    }
    
    addLog(`Fetching data for org number: ${orgNumber}`);
    addLog(`Using auth: User ID: ${session.user.id.substring(0, 8)}... with role: ${session.user.role}`);
    
    // First check if client with this org number already exists for the current user
    const { data: existingClients } = await supabase
      .from('clients')
      .select('id, name, org_number')
      .eq('org_number', orgNumber)
      .eq('user_id', session.user.id);
    
    if (existingClients && existingClients.length > 0) {
      const existingClient = existingClients[0];
      const msg = `Client "${existingClient.name}" with org number ${orgNumber} already exists (ID: ${existingClient.id})`;
      addLog(msg);
      return null;
    }
    
    const { data: response, error: invokeError } = await supabase.functions.invoke('brreg', {
      body: { query: orgNumber }
    });
    
    if (invokeError) {
      const errorMsg = `Error calling brreg function: ${invokeError.message}`;
      console.error(errorMsg);
      addLog(errorMsg);
      return null;
    }

    if (!response) {
      const errorMsg = `No response from brreg function for org number: ${orgNumber}`;
      console.error(errorMsg);
      addLog(errorMsg);
      return null;
    }

    addLog(`Brreg response received: ${JSON.stringify(response).substring(0, 150)}...`);

    // Fix: Check for the company data in response.basis instead of response._embedded?.enheter?.[0]
    if (!response.basis || !response.basis.organisasjonsnummer) {
      const errorMsg = `No company data found for org number: ${orgNumber}`;
      console.warn(errorMsg);
      addLog(errorMsg);
      return null;
    }

    const company = response.basis;
    addLog(`Found company: ${company.navn} with org number: ${company.organisasjonsnummer}`);
    
    addLog(`Attempting to insert client with org number: ${orgNumber} for user ID: ${session.user.id.substring(0, 8)}...`);
    
    const clientData = {
      name: company.navn,
      company_name: company.navn,
      org_number: company.organisasjonsnummer,
      phase: 'engagement' as const, // Use 'engagement' instead of 'overview' for database compatibility
      progress: 0,
      industry: company.naeringskode1?.beskrivelse || null,
      registration_date: company.registreringsdatoEnhetsregisteret?.split('T')[0] || null,
      user_id: session.user.id
    };
    
    addLog(`Client data to insert: ${JSON.stringify(clientData)}`);
    
    const { data: client, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        const errorMsg = `Client with org number ${orgNumber} already exists`;
        console.log(errorMsg);
        addLog(errorMsg);
        return null;
      }
      const errorMsg = `Error inserting client: ${error.message} (${error.code}) - Details: ${JSON.stringify(error.details || {})}`;
      console.error(errorMsg);
      addLog(errorMsg);
      throw error;
    }

    addLog(`Successfully inserted client with ID: ${client.id}`);
    return client;
  } catch (error) {
    const errorMsg = `Error processing org number ${orgNumber}: ${(error as Error).message}`;
    console.error(errorMsg);
    addLog(errorMsg);
    return null;
  }
};

export const processExcelFile = async (
  file: File,
  addLog: AddLogFunction,
  callbacks: {
    onProgress: (processed: number, total: number) => void;
    onSuccess: (successful: number, total: number, clients?: any[]) => void;
  }
) => {
  const { onProgress, onSuccess } = callbacks;
  
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError) {
    const errorMsg = `Auth error: ${authError.message} (${authError.name})`;
    addLog(errorMsg);
    throw new Error(errorMsg);
  }
  
  if (!session || !session.user) {
    const errorMsg = 'User is not authenticated. Please log in before importing.';
    addLog(errorMsg);
    throw new Error(errorMsg);
  }

  addLog(`Authenticated as user: ${session.user.id.substring(0, 8)}... (${session.user.email})`);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        addLog(`Excel file read successfully. Sheet name: ${workbook.SheetNames[0]}`);
        
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 'A' });
        addLog(`Raw data rows: ${jsonData.length}`);
        
        const rows: string[] = jsonData
          .map(row => {
            const value = (row as any).A?.toString().trim();
            return value;
          })
          .filter(Boolean);

        addLog(`Filtered rows: ${rows.length}`);
        addLog(`First 5 org numbers: ${rows.slice(0, 5).join(', ')}`);

        let successful = 0;
        const processedClients = [];
        
        for (let i = 0; i < rows.length; i++) {
          const orgNumber = rows[i];
          addLog(`Processing row ${i+1}: org number ${orgNumber}`);
          
          const result = await processOrgNumber(orgNumber, addLog);
          if (result) {
            successful++;
            addLog(`Successfully added client: ${result.name} (${result.id})`);
            processedClients.push(result);
          }
          
          onProgress(i + 1, rows.length);
        }

        onSuccess(successful, rows.length, processedClients);
        resolve({ successful, total: rows.length });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      addLog(`FileReader error: ${reader.error?.message || 'Unknown error'}`);
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};
