# Optimized Analysis System

This document describes the backend-first analysis system that performs comprehensive transaction analysis using server-side SQL aggregations for maximum performance.

## Overview

The `optimized_analysis` RPC function provides fast, comprehensive analysis of client accounting data by performing all calculations on the database server. This eliminates the need to transfer large datasets to the client and provides sub-second response times even for datasets with millions of transactions.

## Database Function

### Function Signature

```sql
public.optimized_analysis(
  p_client_id UUID,
  p_dataset_id UUID DEFAULT NULL
) RETURNS JSON
```

### Parameters

- `p_client_id` (required): UUID of the client whose data to analyze
- `p_dataset_id` (optional): Specific dataset version to analyze. If not provided, uses the active dataset version.

### Return Structure

```json
{
  "total_transactions": 15420,
  "date_range": {
    "start": "2023-01-01",
    "end": "2023-12-31"
  },
  "monthly_summary": [
    {
      "month": "2023-01",
      "debit": 125000.50,
      "credit": 118000.25,
      "net": 7000.25
    }
  ],
  "account_distribution": [
    {
      "account": "1920 - Bank Account",
      "amount": 450000.75,
      "count": 1250
    }
  ],
  "top_accounts": [
    {
      "account": "3000 - Revenue",
      "net": -980000.00
    }
  ],
  "data_quality_flags": [
    {
      "code": "MISSING_ACCOUNT",
      "severity": "high",
      "count": 15,
      "sampleIds": ["uuid1", "uuid2"]
    }
  ],
  "trial_balance_crosscheck": {
    "balanced": true,
    "diff": 0.02
  },
  "metadata": {
    "client_id": "uuid",
    "dataset_id": "uuid", 
    "generated_at": "2024-01-15T10:30:00Z"
  }
}
```

## Performance Optimizations

### Database Indexes

The following indexes are automatically created to optimize query performance:

```sql
-- Core performance indexes
CREATE INDEX idx_glt_client_version_date 
ON general_ledger_transactions (client_id, version_id, transaction_date);

CREATE INDEX idx_glt_client_version_account 
ON general_ledger_transactions (client_id, version_id, client_account_id);

CREATE INDEX idx_glt_amounts 
ON general_ledger_transactions (client_id, version_id, debit_amount, credit_amount);

CREATE INDEX idx_accounting_versions_client_active 
ON accounting_data_versions (client_id, is_active, created_at DESC);
```

### SQL Optimizations

- Uses `WITH` clauses (CTEs) for complex aggregations
- Leverages `COALESCE` for null-safe calculations
- Implements `LIMIT` clauses to prevent excessive data transfer
- Uses `json_agg` for efficient JSON construction
- Applies proper filtering with compound indexes

## TypeScript Integration

### Basic Usage

```typescript
import { useOptimizedAnalysis } from '@/hooks/useOptimizedAnalysis';

function ClientAnalysisDashboard({ clientId }: { clientId: string }) {
  const { data: analysis, isLoading, error } = useOptimizedAnalysis({
    clientId,
    // datasetId: 'specific-version' // Optional
  });

  if (isLoading) return <div>Running analysis...</div>;
  if (error) return <div>Analysis failed: {error.message}</div>;
  if (!analysis) return null;

  return (
    <div className="analysis-dashboard">
      <h2>Financial Analysis</h2>
      
      <div className="overview-cards">
        <Card>
          <CardHeader>Transaction Count</CardHeader>
          <CardContent>{analysis.total_transactions.toLocaleString()}</CardContent>
        </Card>
        
        <Card>
          <CardHeader>Date Range</CardHeader>
          <CardContent>
            {analysis.date_range.start} - {analysis.date_range.end}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>Trial Balance</CardHeader>
          <CardContent>
            {analysis.trial_balance_crosscheck.balanced ? 
              '✅ Balanced' : 
              `❌ Out of balance by ${analysis.trial_balance_crosscheck.diff}`
            }
          </CardContent>
        </Card>
      </div>

      <DataQualitySection flags={analysis.data_quality_flags} />
      <MonthlySummaryChart data={analysis.monthly_summary} />
      <AccountDistributionTable data={analysis.account_distribution} />
    </div>
  );
}
```

### Advanced Usage with Metrics

```typescript
import { useOptimizedAnalysis, useAnalysisMetrics } from '@/hooks/useOptimizedAnalysis';

function AdvancedAnalytics({ clientId }: { clientId: string }) {
  const { data: analysis } = useOptimizedAnalysis({ clientId });
  const metrics = useAnalysisMetrics(analysis);

  if (!metrics) return null;

  return (
    <div className="advanced-metrics">
      <h3>Key Performance Indicators</h3>
      
      <div className="kpi-grid">
        <KPICard 
          title="Data Quality Score"
          value={`${metrics.qualityScore}%`}
          trend={metrics.qualityScore > 90 ? 'positive' : 'negative'}
        />
        
        <KPICard 
          title="Monthly Volatility"
          value={metrics.volatility.toFixed(2)}
          description="Standard deviation of monthly net amounts"
        />
        
        <KPICard 
          title="Average Volume"
          value={`$${metrics.averageMonthlyVolume.toLocaleString()}`}
          description="Average monthly transaction volume"
        />
        
        <KPICard 
          title="High Severity Issues"
          value={metrics.highSeverityCount}
          alert={metrics.highSeverityCount > 0}
        />
      </div>
    </div>
  );
}
```

### Batch Processing

```typescript
import { useBatchOptimizedAnalysis } from '@/hooks/useOptimizedAnalysis';

function MultiClientAnalysis({ clientIds }: { clientIds: string[] }) {
  const batchAnalysis = useBatchOptimizedAnalysis();

  const handleBatchAnalyze = async () => {
    const inputs = clientIds.map(clientId => ({ clientId }));
    
    try {
      const results = await batchAnalysis.mutateAsync(inputs);
      console.log('Batch analysis results:', results);
    } catch (error) {
      console.error('Batch analysis failed:', error);
    }
  };

  return (
    <button 
      onClick={handleBatchAnalyze}
      disabled={batchAnalysis.isPending}
      className="batch-analyze-btn"
    >
      {batchAnalysis.isPending ? 
        `Analyzing ${clientIds.length} clients...` :
        `Analyze ${clientIds.length} Clients`
      }
    </button>
  );
}
```

## Data Quality Flags

The system automatically detects common data quality issues:

| Code | Severity | Description |
|------|----------|-------------|
| `MISSING_ACCOUNT` | High | Transactions without valid account mappings |
| `ZERO_AMOUNT` | Low | Transactions with zero debit and credit amounts |
| `FUTURE_DATE` | Medium | Transactions dated in the future |

### Custom Quality Checks

You can extend the quality checks by modifying the RPC function:

```sql
-- Add custom quality check in the quality_checks CTE
UNION ALL

-- Unusual amounts (customize threshold as needed)
SELECT 
  'UNUSUAL_AMOUNT' as code,
  'med' as severity,
  COUNT(*) as flag_count,
  array_agg(glt.id::text) FILTER (WHERE ABS(COALESCE(glt.debit_amount, 0) + COALESCE(glt.credit_amount, 0)) > 1000000) as sample_ids
FROM public.general_ledger_transactions glt
WHERE glt.client_id = p_client_id 
  AND glt.version_id = v_version_id
  AND ABS(COALESCE(glt.debit_amount, 0) + COALESCE(glt.credit_amount, 0)) > 1000000
```

## Performance Characteristics

### Expected Performance

- **Small datasets** (< 10K transactions): < 100ms
- **Medium datasets** (10K - 100K transactions): 100ms - 500ms  
- **Large datasets** (100K - 1M+ transactions): 500ms - 2s

### Memory Usage

- Server-side processing eliminates client memory constraints
- Results are limited to prevent excessive response sizes:
  - Account distribution: Top 50 accounts
  - Top accounts: Top 20 by net amount
  - Sample IDs: Maximum 5 per quality flag

### Scaling Considerations

For very large datasets (> 10M transactions):

1. Consider partitioning by date ranges
2. Implement progressive analysis (analyze by month/quarter)
3. Use materialized views for frequently accessed aggregations
4. Add connection pooling for concurrent analysis requests

## Testing Examples

### Unit Test Example

```typescript
import { optimizedAnalysisService } from '@/services/optimizedAnalysisService';

describe('OptimizedAnalysisService', () => {
  it('should return complete analysis for valid client', async () => {
    const result = await optimizedAnalysisService.runAnalysis({
      clientId: 'test-client-uuid'
    });

    expect(result.total_transactions).toBeGreaterThan(0);
    expect(result.date_range.start).toBeDefined();
    expect(result.date_range.end).toBeDefined();
    expect(result.monthly_summary).toBeInstanceOf(Array);
    expect(result.trial_balance_crosscheck).toHaveProperty('balanced');
  });

  it('should calculate quality metrics correctly', () => {
    const mockResult = {
      data_quality_flags: [
        { code: 'MISSING_ACCOUNT', severity: 'high', count: 5 },
        { code: 'ZERO_AMOUNT', severity: 'low', count: 10 }
      ]
    };

    const metrics = optimizedAnalysisService.getDataQualitySummary(mockResult);
    
    expect(metrics.totalIssues).toBe(15);
    expect(metrics.highSeverityCount).toBe(5);
    expect(metrics.qualityScore).toBeLessThan(100);
  });
});
```

### Integration Test Example

```typescript
import { supabase } from '@/integrations/supabase/client';

describe('Optimized Analysis RPC', () => {
  it('should execute RPC function successfully', async () => {
    const { data, error } = await supabase.rpc('optimized_analysis', {
      p_client_id: 'test-client-uuid'
    });

    expect(error).toBeNull();
    expect(data).toHaveProperty('total_transactions');
    expect(data).toHaveProperty('metadata');
    expect(data.metadata.client_id).toBe('test-client-uuid');
  });
});
```

## Troubleshooting

### Common Issues

1. **"No active dataset found"**: Ensure the client has at least one active accounting data version
2. **Slow performance**: Check if recommended indexes are present and query plans
3. **Memory errors**: Reduce LIMIT clauses in account aggregations or implement pagination

### Debugging Queries

Enable query logging to troubleshoot performance:

```sql
-- Check if indexes are being used
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM optimized_analysis('client-uuid');

-- Monitor active queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

### Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const analysis = await optimizedAnalysisService.runAnalysis({ clientId });
} catch (error) {
  if (error.message.includes('No active dataset')) {
    // Handle missing dataset
    showErrorMessage('Please upload accounting data first');
  } else if (error.message.includes('permission denied')) {
    // Handle authorization error
    showErrorMessage('Access denied to client data');
  } else {
    // Handle unexpected errors  
    console.error('Analysis failed:', error);
    showErrorMessage('Analysis failed. Please try again.');
  }
}
```