import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { convertDataWithMapping } from '@/utils/fileProcessing';

interface UploadAccountRow {
  account_number: string;
  account_name: string;
  balance_current_year?: number;
  balance_last_year?: number;
  regnskapsnr?: string;
}

interface AutoMappingResult {
  mapped: number;
  failed: number;
  skipped: number;
}

export const useEnhancedTrialBalanceUpload = () => {
  return useMutation({
    mutationFn: async ({
      clientId,
      accounts,
      fileName,
      accountingYear,
      version
    }: {
      clientId: string;
      accounts: UploadAccountRow[];
      fileName: string;
      accountingYear: number;
      version: string;
    }) => {
      // Create upload batch
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data: batch, error: batchError } = await supabase
        .from('upload_batches')
        .insert({
          client_id: clientId,
          user_id: userId,
          batch_type: 'trial_balance',
          file_name: fileName,
          file_size: 0,
          total_records: accounts.length,
          status: 'processing'
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Step 1: Ensure chart of accounts exists
      const accountMapping = new Map<string, string>();
      let chartOfAccountsCreated = 0;

      for (const account of accounts) {
        const accountNumber = account.account_number?.toString();
        if (!accountNumber) continue;

        const { data: existingAccount } = await supabase
          .from('client_chart_of_accounts')
          .select('id')
          .eq('client_id', clientId)
          .eq('account_number', accountNumber)
          .maybeSingle();

        let accountId = existingAccount?.id;

        if (!existingAccount) {
          const { data: newAccount } = await supabase
            .from('client_chart_of_accounts')
            .insert({
              client_id: clientId,
              account_number: accountNumber,
              account_name: account.account_name || `Konto ${accountNumber}`,
              account_type: 'eiendeler' as const,
              is_active: true
            })
            .select('id')
            .single();

          accountId = newAccount?.id;
          chartOfAccountsCreated++;
        }

        if (accountId) {
          accountMapping.set(accountNumber, accountId);
        }
      }

      // Step 2: Auto-mapping using regnskapsnr if available
      const autoMappingResults: AutoMappingResult = { mapped: 0, failed: 0, skipped: 0 };
      
      for (const account of accounts) {
        const accountNumber = account.account_number?.toString();
        const regnskapsnr = account.regnskapsnr?.toString().trim();
        
        if (!accountNumber || !regnskapsnr) {
          autoMappingResults.skipped++;
          continue;
        }
        
        try {
          const { data: standardAccount } = await supabase
            .from('standard_accounts')
            .select('id, standard_number, standard_name')
            .eq('standard_number', regnskapsnr)
            .maybeSingle();
            
          if (standardAccount) {
            await supabase
              .from('trial_balance_mappings')
              .upsert({
                client_id: clientId,
                account_number: accountNumber,
                statement_line_number: standardAccount.standard_number
              }, {
                onConflict: 'client_id,account_number'
              });
              
            autoMappingResults.mapped++;
          } else {
            autoMappingResults.failed++;
          }
        } catch {
          autoMappingResults.failed++;
        }
      }

      // Step 3: Insert trial balance data
      let trialBalanceInserted = 0;
      
      for (const account of accounts) {
        const accountNumber = account.account_number?.toString();
        const accountId = accountMapping.get(accountNumber);
        
        if (!accountId) continue;
        
        const parseNumber = (value: any): number => {
          if (value === null || value === undefined || value === '') return 0;
          
          const str = value.toString().trim();
          if (!str) return 0;
          
          // Norwegian number format handling
          let cleanValue = str.replace(/\s+/g, '').replace(/[^\d,.-]/g, '');
          
          if (cleanValue.includes(',') && cleanValue.includes('.')) {
            const lastComma = cleanValue.lastIndexOf(',');
            const lastPeriod = cleanValue.lastIndexOf('.');
            
            if (lastComma > lastPeriod) {
              cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
            } else {
              cleanValue = cleanValue.replace(/,/g, '');
            }
          } else if (cleanValue.includes(',')) {
            const parts = cleanValue.split(',');
            if (parts.length === 2 && parts[1].length <= 2) {
              cleanValue = cleanValue.replace(',', '.');
            } else {
              cleanValue = cleanValue.replace(/,/g, '');
            }
          }
          
          const parsed = parseFloat(cleanValue);
          return isNaN(parsed) ? 0 : parsed;
        };

        const openingBalance = parseNumber(account.balance_last_year);
        const closingBalance = parseNumber(account.balance_current_year);

        await supabase
          .from('trial_balances')
          .upsert({
            client_id: clientId,
            client_account_id: accountId,
            opening_balance: openingBalance,
            closing_balance: closingBalance,
            debit_turnover: 0,
            credit_turnover: 0,
            period_start_date: `${accountingYear}-01-01`,
            period_end_date: `${accountingYear}-12-31`,
            period_year: accountingYear,
            version: version,
            upload_batch_id: batch.id
          }, {
            onConflict: 'client_id,client_account_id,period_start_date,period_end_date,version'
          });

        trialBalanceInserted++;
      }

      // Update batch status
      await supabase
        .from('upload_batches')
        .update({
          status: 'completed',
          processed_records: trialBalanceInserted,
          completed_at: new Date().toISOString()
        })
        .eq('id', batch.id);

      return {
        trialBalanceInserted,
        chartOfAccountsCreated,
        autoMappingResults,
        batchId: batch.id
      };
    },
    onSuccess: (result) => {
      let message = `${result.trialBalanceInserted} saldobalanse-poster og ${result.chartOfAccountsCreated} nye kontoer ble importert`;
      
      if (result.autoMappingResults.mapped > 0) {
        message += `. ${result.autoMappingResults.mapped} kontoer ble automatisk mappet`;
      }
      
      toast.success(message);
    },
    onError: (error) => {
      toast.error(`Upload feilet: ${error.message}`);
    }
  });
};