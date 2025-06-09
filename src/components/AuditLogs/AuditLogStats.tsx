
import React from 'react';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const AuditLogStats = () => {
  const { data: allLogs } = useAuditLogs();
  const { data: pendingLogs } = useAuditLogs({ isReviewed: false });
  const { data: reviewedLogs } = useAuditLogs({ isReviewed: true });

  const totalLogs = allLogs?.length || 0;
  const pendingCount = pendingLogs?.length || 0;
  const reviewedCount = reviewedLogs?.length || 0;
  const criticalActions = allLogs?.filter(log => log.actionType === 'delete').length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">{totalLogs}</h3>
            <p className="text-sm text-muted-foreground">Totale logger</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">{pendingCount}</h3>
            <p className="text-sm text-muted-foreground">Venter anmeldelse</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">{reviewedCount}</h3>
            <p className="text-sm text-muted-foreground">Anmeldt</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">{criticalActions}</h3>
            <p className="text-sm text-muted-foreground">Kritiske handlinger</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogStats;
