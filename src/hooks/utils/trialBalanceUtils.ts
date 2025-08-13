// Utility helpers for trial balance data processing and lookups
// Keep types generic to avoid tight coupling; callers can cast as needed

export function pickLatestVersionRows<T extends { client_id?: string; created_at?: string }>(rows: T[], clientKey: keyof T | 'client_id' = 'client_id'): T[] {
  if (!rows || rows.length === 0) return [];
  const latestByClient = new Map<string, string>();
  for (const row of rows) {
    const cid = String((row as any)[clientKey]);
    const created = (row as any).created_at as string | undefined;
    if (!cid || !created) continue;
    const prev = latestByClient.get(cid);
    if (!prev || new Date(created) > new Date(prev)) {
      latestByClient.set(cid, created);
    }
  }
  return rows.filter(r => latestByClient.get(String((r as any)[clientKey])) === (r as any).created_at);
}

export function buildStandardLookups(standardAccounts: any[]) {
  const stdByNumber = new Map<string, any>();
  standardAccounts?.forEach(sa => {
    if (sa?.standard_number) stdByNumber.set(sa.standard_number, sa);
  });
  return stdByNumber;
}

export function buildMappingLookup(mappingsData: any[], stdByNumber: Map<string, any>) {
  const mappingLookup = new Map<string, any>();
  mappingsData?.forEach(m => {
    const sa = stdByNumber.get(m.statement_line_number);
    if (!sa) return;
    mappingLookup.set(`${m.client_id}|${m.account_number}`, {
      standard_account_id: sa.id,
      standard_number: sa.standard_number,
      standard_name: sa.standard_name,
      standard_category: sa.category,
      standard_account_type: sa.account_type,
      standard_analysis_group: sa.analysis_group,
    });
  });
  return mappingLookup;
}

export function buildClassificationLookup(classificationsData: any[], standardAccounts: any[], mappingLookup: Map<string, any>) {
  const classificationLookup = new Map<string, any>();
  classificationsData?.forEach(c => {
    const key = `${c.client_id}|${c.account_number}`;
    if (mappingLookup.has(key)) return;
    const sa = standardAccounts?.find(s => s.standard_name === c.new_category);
    if (!sa) return;
    classificationLookup.set(key, {
      standard_account_id: sa.id,
      standard_number: sa.standard_number,
      standard_name: sa.standard_name,
      standard_category: sa.category,
      standard_account_type: sa.account_type,
      standard_analysis_group: sa.analysis_group,
    });
  });
  return classificationLookup;
}

export function buildPrevYearMap(prevRows: any[]) {
  const latestPrevByClient = new Map<string, string>();
  prevRows?.forEach((r: any) => {
    const cid = r.client_id as string;
    const created = r.created_at as string;
    const prev = latestPrevByClient.get(cid);
    if (!prev || new Date(created) > new Date(prev)) latestPrevByClient.set(cid, created);
  });
  const prevMap = new Map<string, number>(); // key: client_id|accNo
  prevRows?.forEach((r: any) => {
    if (latestPrevByClient.get(r.client_id) !== r.created_at) return;
    const accNo = r?.client_chart_of_accounts?.account_number as string;
    if (accNo) prevMap.set(`${r.client_id}|${accNo}`, r.closing_balance || 0);
  });
  return prevMap;
}
