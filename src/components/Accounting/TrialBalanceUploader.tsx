import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import UploadZone from "@/components/DataUpload/UploadZone";
import ColumnMappingInterface, {
  StandardField,
} from "@/components/DataUpload/ColumnMappingInterface";

interface TrialBalanceUploaderProps {
  clientId: string;
}

interface TrialBalanceRow {
  account_number: string;
  account_name?: string;
  period_end_date: string;
  opening_balance?: number;
  debit_turnover?: number;
  credit_turnover?: number;
  closing_balance?: number;
}

const TrialBalanceUploader = ({ clientId }: TrialBalanceUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    processed: number;
    errors: string[];
  } | null>(null);
  const [hasChartOfAccounts, setHasChartOfAccounts] = useState<boolean | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<{
    headers: string[];
    data: Record<string, string>[];
  } | null>(null);
  const [showMapping, setShowMapping] = useState(false);
  const [fileName, setFileName] = useState("");
  const [createdAccountsCount, setCreatedAccountsCount] = useState(0);

  const tbFields: StandardField[] = [
    {
      key: "account_number",
      label: "Kontonummer",
      required: true,
      description: "Kontonummer",
    },
    {
      key: "period_end_date",
      label: "Periode",
      required: true,
      description: "Periode (dd.mm.yyyy eller yyyy-mm-dd)",
    },
    {
      key: "opening_balance",
      label: "Inngående saldo",
      required: false,
      description: "Saldo ved periodens start",
    },
    {
      key: "debit_turnover",
      label: "Debet omsetning",
      required: false,
      description: "Debet omsetning i perioden",
    },
    {
      key: "credit_turnover",
      label: "Kredit omsetning",
      required: false,
      description: "Kredit omsetning i perioden",
    },
    {
      key: "closing_balance",
      label: "Utgående saldo",
      required: false,
      description: "Saldo ved periodens slutt",
    },
  ];

  // Check if client has chart of accounts when component loads
  React.useEffect(() => {
    const checkChartOfAccounts = async () => {
      console.log("Checking if client has chart of accounts...");
      const { data: accounts, error } = await supabase
        .from("client_chart_of_accounts")
        .select("id")
        .eq("client_id", clientId)
        .eq("is_active", true)
        .limit(1);

      if (error) {
        console.error("Error checking chart of accounts:", error);
        return;
      }

      const hasAccounts = accounts && accounts.length > 0;
      console.log("Client has chart of accounts:", hasAccounts);
      setHasChartOfAccounts(hasAccounts);
    };

    if (clientId) {
      checkChartOfAccounts();
    }
  }, [clientId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    console.log("File selected:", selectedFile?.name, selectedFile?.size);
    if (selectedFile) {
      if (selectedFile.name.toLowerCase().endsWith(".csv")) {
        handleCSVFile(selectedFile);
      } else {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setUploadResult(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      if (dropped.name.toLowerCase().endsWith(".csv")) {
        handleCSVFile(dropped);
      } else {
        setFile(dropped);
        setFileName(dropped.name);
        setUploadResult(null);
      }
    }
  };

  const handleMappingComplete = async (mapping: Record<string, string>) => {
    if (!parsedData || !file) return;
    const balances = transformCSVData(parsedData.data, mapping);
    setShowMapping(false);
    await uploadWithAccountCreation(balances, file);
  };

  const handleMappingCancel = () => {
    setShowMapping(false);
    setParsedData(null);
    setFile(null);
    setFileName("");
  };

  const processExcelFile = async (file: File): Promise<TrialBalanceRow[]> => {
    console.log("Processing Excel file:", file.name);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          console.log("File reader loaded successfully");
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          console.log("Workbook loaded, sheets:", workbook.SheetNames);

          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          console.log("Excel data parsed, rows:", jsonData.length);
          console.log("First few rows:", jsonData.slice(0, 3));

          const balances: TrialBalanceRow[] = jsonData
            .map((row: any, index) => {
              console.log(`Processing row ${index}:`, row);
              return {
                account_number:
                  row["Kontonummer"]?.toString() ||
                  row["account_number"]?.toString() ||
                  "",
                account_name:
                  row["Kontonavn"] ||
                  row["account_name"] ||
                  row["Account name"] ||
                  "",
                period_end_date: row["Periode"] || row["period_end_date"] || "",
                opening_balance:
                  parseFloat(
                    row["Inngående saldo"] || row["opening_balance"] || "0",
                  ) || 0,
                debit_turnover:
                  parseFloat(
                    row["Debet omsetning"] || row["debit_turnover"] || "0",
                  ) || 0,
                credit_turnover:
                  parseFloat(
                    row["Kredit omsetning"] || row["credit_turnover"] || "0",
                  ) || 0,
                closing_balance:
                  parseFloat(
                    row["Utgående saldo"] || row["closing_balance"] || "0",
                  ) || 0,
              };
            })
            .filter((bal) => {
              const isValid = bal.account_number && bal.period_end_date;
              console.log(`Row valid: ${isValid}`, bal);
              return isValid;
            });

          console.log("Processed balances:", balances.length);
          resolve(balances);
        } catch (error) {
          console.error("Error processing Excel file:", error);
          reject(error);
        }
      };

      reader.onerror = () => {
        console.error("FileReader error:", reader.error);
        reject(new Error("Kunne ikke lese filen"));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const parseCSVFile = async (
    file: File,
  ): Promise<{ headers: string[]; data: Record<string, string>[] }> => {
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map((f) => f.replace(/^"|"$/g, ""));
    };

    const headers = parseCSVLine(lines[0]);
    const data = lines.slice(1).map((line) => {
      const values = parseCSVLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      return row;
    });

    return { headers, data };
  };

  const determineAccountType = (
    accountNumber: string,
  ): "asset" | "liability" | "equity" | "revenue" | "expense" => {
    const first = accountNumber.charAt(0);
    switch (first) {
      case "1":
        return "asset";
      case "2":
        return "liability";
      case "3":
        return "equity";
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
        return "revenue";
      case "9":
        return "expense";
      default:
        return "asset";
    }
  };

  const generateAccountName = (accountNumber: string): string => {
    const firstDigit = accountNumber.charAt(0);
    const baseNames: Record<string, string> = {
      "1": "Eiendeler",
      "2": "Gjeld",
      "3": "Egenkapital",
      "4": "Salgsinntekt",
      "5": "Annen inntekt",
      "6": "Varekostnad",
      "7": "L\u00f8nnskostnad",
      "8": "Annen kostnad",
      "9": "Finanskostnad",
    };
    const baseName = baseNames[firstDigit] || "Ukjent konto";
    return `${baseName} ${accountNumber}`;
  };

  const parseAmount = (amountStr: string): number => {
    if (!amountStr || amountStr.trim() === "") return 0;
    const clean = amountStr
      .replace(/\s/g, "")
      .replace(/,/g, ".")
      .replace(/[^\d.-]/g, "");
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const createAccountsFromBalances = async (
    balances: TrialBalanceRow[],
  ): Promise<number> => {
    const uniqueMap = new Map<string, string | undefined>();
    balances.forEach((b) => {
      if (!uniqueMap.has(b.account_number)) {
        uniqueMap.set(b.account_number, b.account_name);
      } else if (!uniqueMap.get(b.account_number) && b.account_name) {
        uniqueMap.set(b.account_number, b.account_name);
      }
    });
    const accountNumbers = [...uniqueMap.keys()];
    if (accountNumbers.length === 0) return 0;

    const { data: existing, error: fetchError } = await supabase
      .from("client_chart_of_accounts")
      .select("account_number")
      .eq("client_id", clientId)
      .in("account_number", accountNumbers);

    if (fetchError) {
      throw new Error(`Kunne ikke hente eksisterende kontoer: ${fetchError.message}`);
    }

    const existingSet = new Set(existing?.map((a) => a.account_number) || []);

    const accountsToInsert = accountNumbers
      .filter((num) => !existingSet.has(num))
      .map((num) => ({
        client_id: clientId,
        account_number: num,
        account_name: uniqueMap.get(num) || generateAccountName(num),
        account_type: determineAccountType(num),
        is_active: true,
      }));

    if (accountsToInsert.length === 0) return 0;

    const { error: insertError } = await supabase
      .from("client_chart_of_accounts")
      .insert(accountsToInsert);

    if (insertError) {
      throw new Error(`Kunne ikke opprette kontoer: ${insertError.message}`);
    }

    queryClient.invalidateQueries({ queryKey: ["chart-of-accounts", clientId] });
    return accountsToInsert.length;
  };

  const transformCSVData = (
    data: Record<string, string>[],
    mapping: Record<string, string>,
  ): TrialBalanceRow[] => {
    return data
      .map((row) => {
        const tb: TrialBalanceRow = { account_number: "", period_end_date: "" };
        Object.entries(mapping).forEach(([col, field]) => {
          const value = row[col];
          if (field === "account_number") {
            tb.account_number = value?.toString() || "";
          } else if (field === "account_name") {
            tb.account_name = value?.toString() || "";
          } else if (field === "period_end_date") {
            if (value) {
              if (value.includes(".")) {
                const [d, m, y] = value.split(".");
                const date = new Date(
                  parseInt(y),
                  parseInt(m) - 1,
                  parseInt(d),
                );
                if (!isNaN(date.getTime())) {
                  tb.period_end_date = date.toISOString().split("T")[0];
                }
              } else {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                  tb.period_end_date = date.toISOString().split("T")[0];
                }
              }
            }
          } else if (field === "opening_balance") {
            tb.opening_balance = parseAmount(value);
          } else if (field === "debit_turnover") {
            tb.debit_turnover = parseAmount(value);
          } else if (field === "credit_turnover") {
            tb.credit_turnover = parseAmount(value);
          } else if (field === "closing_balance") {
            tb.closing_balance = parseAmount(value);
          }
        });
        return tb;
      })
      .filter((tb) => tb.account_number && tb.period_end_date);
  };

  const handleCSVFile = async (csvFile: File) => {
    setFile(csvFile);
    setFileName(csvFile.name);
    setUploadResult(null);
    const parsed = await parseCSVFile(csvFile);
    setParsedData(parsed);
    setShowMapping(true);
  };

  const uploadWithAccountCreation = async (
    balances: TrialBalanceRow[],
    srcFile: File,
  ) => {
    let created = 0;
    if (hasChartOfAccounts === false) {
      try {
        created = await createAccountsFromBalances(balances);
        if (created > 0) {
          toast({
            title: "Kontoer opprettet",
            description: `${created} nye kontoer ble automatisk opprettet`,
          });
        }
        setHasChartOfAccounts(true);
      } catch (error: any) {
        toast({
          title: "Feil ved opprettelse av kontoer",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
    }
    setCreatedAccountsCount(created);
    await uploadTrialBalance(balances, srcFile);
  };

  const uploadTrialBalance = async (
    balances: TrialBalanceRow[],
    srcFile: File,
  ) => {
    if (!srcFile || !clientId) {
      console.error("Missing file or clientId:", { file: !!srcFile, clientId });
      return;
    }

    console.log("Starting upload for client:", clientId);
    setIsUploading(true);
    setProgress(0);

    try {
      // Check authentication first
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) {
        console.error("Auth error:", authError);
        throw new Error(`Autentiseringsfeil: ${authError.message}`);
      }
      if (!user) {
        console.error("No authenticated user");
        throw new Error("Du må være logget inn for å laste opp data");
      }
      console.log("User authenticated:", user.id);

      setProgress(25);

      // Get client accounts for validation
      console.log("Fetching client accounts for validation...");
      const { data: clientAccounts, error: accountsError } = await supabase
        .from("client_chart_of_accounts")
        .select("id, account_number")
        .eq("client_id", clientId);

      if (accountsError) {
        console.error("Error fetching client accounts:", accountsError);
        throw new Error(
          `Feil ved henting av kontoplan: ${accountsError.message}`,
        );
      }

      console.log("Client accounts fetched:", clientAccounts?.length || 0);

      // Check if no accounts exist
      if (!clientAccounts || clientAccounts.length === 0) {
        throw new Error(
          "Ingen kontoplan funnet for denne klienten. Du må laste opp kontoplan før du kan laste opp saldobalanse.",
        );
      }

      const accountMap = new Map(
        clientAccounts.map((acc) => [acc.account_number, acc.id]),
      );

      // Create upload batch record
      console.log("Creating upload batch...");
      const { data: batch, error: batchError } = await supabase
        .from("upload_batches")
        .insert({
          client_id: clientId,
          user_id: user.id,
          batch_type: "trial_balance",
          file_name: srcFile.name,
          file_size: srcFile.size,
          total_records: balances.length,
          status: "processing",
        })
        .select()
        .single();

      if (batchError) {
        console.error("Batch creation error:", batchError);
        throw new Error(`Feil ved opprettelse av batch: ${batchError.message}`);
      }
      console.log("Batch created:", batch.id);
      setProgress(50);

      // Process balances
      const errors: string[] = [];
      const balancesToInsert = balances
        .map((bal, index) => {
          const clientAccountId = accountMap.get(bal.account_number);
          if (!clientAccountId) {
            const error = `Konto ${bal.account_number} ikke funnet i kontoplan`;
            console.warn(error);
            errors.push(error);
            return null;
          }

          try {
            const periodDate = new Date(bal.period_end_date);
            if (isNaN(periodDate.getTime())) {
              const error = `Ugyldig dato for konto ${bal.account_number}: ${bal.period_end_date}`;
              console.warn(error);
              errors.push(error);
              return null;
            }

            return {
              client_id: clientId,
              client_account_id: clientAccountId,
              period_end_date: periodDate.toISOString().split("T")[0],
              period_year: periodDate.getFullYear(),
              opening_balance: bal.opening_balance || 0,
              debit_turnover: bal.debit_turnover || 0,
              credit_turnover: bal.credit_turnover || 0,
              closing_balance: bal.closing_balance || 0,
              upload_batch_id: batch.id,
            };
          } catch (error) {
            const errorMsg = `Feil ved prosessering av rad ${index + 1}: ${error}`;
            console.error(errorMsg);
            errors.push(errorMsg);
            return null;
          }
        })
        .filter(Boolean);

      console.log("Balances to insert:", balancesToInsert.length);
      setProgress(75);

      let processed = 0;
      if (balancesToInsert.length > 0) {
        console.log("Inserting trial balances...");
        const { data: insertedBalances, error: insertError } = await supabase
          .from("trial_balances")
          .upsert(balancesToInsert, {
            onConflict: "client_id,client_account_id,period_end_date",
            ignoreDuplicates: false,
          })
          .select();

        if (insertError) {
          console.error("Insert error:", insertError);
          errors.push(`Insert error: ${insertError.message}`);
        } else {
          processed = insertedBalances?.length || 0;
          console.log("Successfully inserted:", processed);
        }
      }

      // Update batch status
      console.log("Updating batch status...");
      await supabase
        .from("upload_batches")
        .update({
          status: processed > 0 ? "completed" : "failed",
          processed_records: processed,
          error_records: errors.length,
          error_log: errors.join("\n"),
          completed_at: new Date().toISOString(),
        })
        .eq("id", batch.id);

      setProgress(100);

      setUploadResult({
        success: processed > 0,
        message: `${processed} saldobalanser ble lastet opp`,
        processed,
        errors: errors.slice(0, 10),
      });

      toast({
        title:
          processed > 0 ? "Saldobalanse lastet opp" : "Feil ved opplasting",
        description: `${processed} saldobalanser ble importert${errors.length > 0 ? ` (${errors.length} feil)` : ""}`,
        variant: processed > 0 ? "default" : "destructive",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadResult({
        success: false,
        message: error.message || "Det oppstod en feil under opplastingen",
        processed: 0,
        errors: [error.message],
      });

      toast({
        title: "Feil ved opplasting",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };


  if (showMapping && parsedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Kolonnemapping - {fileName}
          </CardTitle>
          <CardDescription>
            Koble kolonnene i CSV-filen til feltene som kreves for import
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ColumnMappingInterface
            fileColumns={parsedData.headers}
            sampleData={parsedData.data}
            onMappingComplete={handleMappingComplete}
            onCancel={handleMappingCancel}
            fields={tbFields}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Last opp saldobalanse
        </CardTitle>
        <CardDescription>
          Last opp saldobalanse fra CSV eller Excel. CSV krever kolonnemapping.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasChartOfAccounts === false && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <Info className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Ingen kontoplan funnet</h4>
              <p className="text-sm text-amber-700 mt-1">
                Kontoer blir opprettet automatisk fra filen.
              </p>
            </div>
          </div>
        )}
        <UploadZone
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileSelect={handleFileSelect}
        />

        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <Button
            onClick={async () => {
              if (!file) return;
              const balances = await processExcelFile(file);
              await uploadWithAccountCreation(balances, file);
            }}
            disabled={!file || isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? "Laster opp..." : "Last opp"}
          </Button>
        </div>

        {file && (
          <div className="text-sm text-muted-foreground">
            Valgt fil: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </div>
        )}

        {isUploading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">
              Prosesserer saldobalanse... {progress}%
            </p>
          </div>
        )}

        {uploadResult && (
          <div
            className={`p-4 rounded-lg border ${
              uploadResult.success
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {uploadResult.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{uploadResult.message}</span>
            </div>
            {uploadResult.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium">Feil som oppstod:</p>
                <ul className="mt-1 list-disc list-inside text-sm">
                  {uploadResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {createdAccountsCount > 0 && (
              <p className="text-sm mt-2">
                {createdAccountsCount} nye kontoer ble opprettet fra filen.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrialBalanceUploader;
