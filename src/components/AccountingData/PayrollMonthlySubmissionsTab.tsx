import { Card } from '@/components/ui/card';
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';
import { formatCurrency } from '@/lib/utils';
import { PayrollMonthlySubmission } from '@/hooks/usePayrollDetailedData';

interface PayrollMonthlySubmissionsTabProps {
  submissions: PayrollMonthlySubmission[];
}

export function PayrollMonthlySubmissionsTab({ submissions }: PayrollMonthlySubmissionsTabProps) {
  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Ingen månedlige innsendinger funnet</p>
      </div>
    );
  }

  const getMonthName = (month: number) => {
    const months = [
      'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[month - 1] || `Måned ${month}`;
  };

  const payrollColumns: StandardDataTableColumn<PayrollMonthlySubmission>[] = [
    {
      key: 'period',
      header: 'Periode',
      accessor: (submission) => `${submission.period_year}-${String(submission.period_month).padStart(2, '0')}`,
      sortable: true,
      searchable: true,
      format: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'period_year',
      header: 'År',
      accessor: 'period_year',
      sortable: true,
      align: 'center'
    },
    {
      key: 'month_name',
      header: 'Måned',
      accessor: (submission) => getMonthName(submission.period_month),
      sortable: true,
      searchable: true
    },
    {
      key: 'employee_count',
      header: 'Antall ansatte',
      accessor: (submission) => submission.summary_data?.count || submission.submission_data?.antallInntektsmottakere || 0,
      sortable: true,
      align: 'right'
    },
    {
      key: 'arbeidsgiveravgift',
      header: 'Arbeidsgiveravgift',
      accessor: (submission) => submission.summary_data?.arbeidsgiveravgift || submission.submission_data?.mottattAvgiftOgTrekkTotalt?.sumArbeidsgiveravgift || 0,
      sortable: true,
      align: 'right',
      format: (value) => formatCurrency(value)
    },
    {
      key: 'forskuddstrekk',
      header: 'Forskuddstrekk',
      accessor: (submission) => submission.summary_data?.forskuddstrekk || Math.abs(submission.submission_data?.mottattAvgiftOgTrekkTotalt?.sumForskuddstrekk || 0),
      sortable: true,
      align: 'right',
      format: (value) => formatCurrency(value)
    },
    {
      key: 'details',
      header: 'Detaljer',
      accessor: () => '',
      format: (_, submission) => (
        <div className="text-xs text-muted-foreground">
          <div>Status: {submission.submission_data?.status}</div>
          {submission.submission_data?.kildesystem && (
            <div>System: {submission.submission_data.kildesystem}</div>
          )}
        </div>
      )
    }
  ];

  const totalEmployees = submissions.reduce((sum, s) => sum + (s.summary_data?.count || s.submission_data?.antallInntektsmottakere || 0), 0);
  const totalArbeidsgiveravgift = submissions.reduce((sum, s) => sum + (s.summary_data?.arbeidsgiveravgift || s.submission_data?.mottattAvgiftOgTrekkTotalt?.sumArbeidsgiveravgift || 0), 0);
  const totalForskuddstrekk = submissions.reduce((sum, s) => sum + (s.summary_data?.forskuddstrekk || Math.abs(s.submission_data?.mottattAvgiftOgTrekkTotalt?.sumForskuddstrekk || 0)), 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Månedlige innsendinger</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Oversikt over alle månedlige lønnsrapporter i denne A07-filen
        </p>
      </div>

      <StandardDataTable
        title="Lønnsrapporter"
        description="Månedlige A07-rapporter"
        data={submissions}
        columns={payrollColumns}
        tableName="payroll-monthly-submissions"
        exportFileName="lonnsrapporter"
        emptyMessage="Ingen månedlige innsendinger funnet"
      />

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Total perioder</h4>
          <p className="text-2xl font-bold">{submissions.length}</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Total ansatte</h4>
          <p className="text-2xl font-bold">{totalEmployees}</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Total arbeidsgiveravgift</h4>
          <p className="text-2xl font-bold">{formatCurrency(totalArbeidsgiveravgift)}</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Total forskuddstrekk</h4>
          <p className="text-2xl font-bold">{formatCurrency(totalForskuddstrekk)}</p>
        </Card>
      </div>
    </div>
  );
}