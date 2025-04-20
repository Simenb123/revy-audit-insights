
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { AuditPhase } from '@/types/revio';

export const processOrgNumber = async (orgNumber: string, setDebug: (fn: (prev: string[]) => string[]) => void) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      const errorMsg = 'No authenticated user found';
      console.error(errorMsg);
      setDebug(prev => [...prev, errorMsg]);
      return null;
    }
    
    setDebug(prev => [...prev, `Fetching data for org number: ${orgNumber}`]);
    setDebug(prev => [...prev, `Using auth: User ID: ${session.user.id.substring(0, 8)}... with role: ${session.user.role}`]);
    
    const { data: response, error: invokeError } = await supabase.functions.invoke('brreg', {
      body: { query: orgNumber }
    });
    
    if (invokeError) {
      const errorMsg = `Error calling brreg function: ${invokeError.message}`;
      console.error(errorMsg);
      setDebug(prev => [...prev, errorMsg]);
      return null;
    }

    if (!response) {
      const errorMsg = `No response from brreg function for org number: ${orgNumber}`;
      console.error(errorMsg);
      setDebug(prev => [...prev, errorMsg]);
      return null;
    }

    setDebug(prev => [...prev, `Brreg response received: ${JSON.stringify(response).substring(0, 150)}...`]);

    if (!response._embedded?.enheter?.[0]) {
      const errorMsg = `No company data found for org number: ${orgNumber}`;
      console.warn(errorMsg);
      setDebug(prev => [...prev, errorMsg]);
      return null;
    }

    const company = response._embedded.enheter[0];
    setDebug(prev => [...prev, `Found company: ${company.navn} with org number: ${company.organisasjonsnummer}`]);
    
    setDebug(prev => [...prev, `Attempting to insert client with org number: ${orgNumber} for user ID: ${session.user.id.substring(0, 8)}...`]);
    
    const clientData = {
      name: company.navn,
      company_name: company.navn,
      org_number: company.organisasjonsnummer,
      phase: 'engagement' as AuditPhase,
      progress: 0,
      industry: company.naeringskode1?.beskrivelse || null,
      registration_date: company.registreringsdatoEnhetsregisteret?.split('T')[0] || null,
      user_id: session.user.id
    };
    
    setDebug(prev => [...prev, `Client data to insert: ${JSON.stringify(clientData)}`]);
    
    const { data: client, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        const errorMsg = `Client with org number ${orgNumber} already exists`;
        console.log(errorMsg);
        setDebug(prev => [...prev, errorMsg]);
        return null;
      }
      const errorMsg = `Error inserting client: ${error.message} (${error.code}) - Details: ${JSON.stringify(error.details || {})}`;
      console.error(errorMsg);
      setDebug(prev => [...prev, errorMsg]);
      throw error;
    }

    setDebug(prev => [...prev, `Successfully inserted client with ID: ${client.id}`]);
    return client;
  } catch (error) {
    const errorMsg = `Error processing org number ${orgNumber}: ${(error as Error).message}`;
    console.error(errorMsg);
    setDebug(prev => [...prev, errorMsg]);
    return null;
  }
};

export const processExcelFile = async (
  file: File,
  setDebug: (fn: (prev: string[]) => string[]) => void,
  callbacks: {
    onProgress: (processed: number, total: number) => void;
    onSuccess: (successful: number, total: number) => void;
  }
) => {
  const { onProgress, onSuccess } = callbacks;
  
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError) {
    const errorMsg = `Auth error: ${authError.message} (${authError.name})`;
    setDebug(prev => [...prev, errorMsg]);
    throw new Error(errorMsg);
  }
  
  if (!session || !session.user) {
    const errorMsg = 'User is not authenticated. Please log in before importing.';
    setDebug(prev => [...prev, errorMsg]);
    throw new Error(errorMsg);
  }

  setDebug(prev => [...prev, `Authenticated as user: ${session.user.id.substring(0, 8)}... (${session.user.email})`]);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        setDebug(prev => [...prev, `Excel file read successfully. Sheet name: ${workbook.SheetNames[0]}`]);
        
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 'A' });
        setDebug(prev => [...prev, `Raw data rows: ${jsonData.length}`]);
        
        const rows: string[] = jsonData
          .map(row => {
            const value = (row as any).A?.toString().trim();
            return value;
          })
          .filter(Boolean);

        setDebug(prev => [...prev, `Filtered rows: ${rows.length}`]);
        setDebug(prev => [...prev, `First 5 org numbers: ${rows.slice(0, 5).join(', ')}`]);

        let successful = 0;
        for (let i = 0; i < rows.length; i++) {
          const orgNumber = rows[i];
          setDebug(prev => [...prev, `Processing row ${i+1}: org number ${orgNumber}`]);
          
          const result = await processOrgNumber(orgNumber, setDebug);
          if (result) {
            successful++;
            setDebug(prev => [...prev, `Successfully added client: ${result.name} (${result.id})`]);
          }
          
          onProgress(i + 1, rows.length);
        }

        onSuccess(successful, rows.length);
        resolve({ successful, total: rows.length });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      setDebug(prev => [...prev, `FileReader error: ${reader.error?.message || 'Unknown error'}`]);
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};
