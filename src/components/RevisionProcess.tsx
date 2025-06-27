import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AuditPhase } from '@/types/revio';

interface PhaseContent {
  title: string;
  description: string;
  checklistItems: string[];
}

interface RevisionProcessProps {
  clientId: string;
  initialPhase?: AuditPhase;
  progress: number;
  onProgressChange?: (value: number) => void;
}

const phases: { key: AuditPhase; label: string }[] = [
  { key: 'overview', label: 'Oversikt' },
  { key: 'engagement', label: 'Oppdragsvurdering' },
  { key: 'planning', label: 'Planlegging' },
  { key: 'execution', label: 'Utførelse' },
  { key: 'completion', label: 'Avslutning' }
];

const Checklist = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 mt-4">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-2">
        <Checkbox className="mt-0.5" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const fetchPhaseContent = async (
  clientId: string,
  phase: AuditPhase
): Promise<PhaseContent | null> => {
  const res = await fetch(`/api/clients/${clientId}/revision/phases/${phase}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load phase content');
  return res.json();
};

const RevisionProcess: React.FC<RevisionProcessProps> = ({
  clientId,
  initialPhase = 'overview',
  progress,
  onProgressChange
}) => {
  const [activePhase, setActivePhase] = useState<AuditPhase>(initialPhase);

  const { data, isLoading } = useQuery({
    queryKey: ['revisionPhase', clientId, activePhase],
    queryFn: () => fetchPhaseContent(clientId, activePhase),
    enabled: !!clientId && !!activePhase
  });

  const handlePhaseClick = (phase: AuditPhase) => {
    setActivePhase(phase);
    if (phase === 'completion' && onProgressChange) {
      onProgressChange(100);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {phases.map(({ key, label }) => (
          <Card
            key={key}
            onClick={() => handlePhaseClick(key)}
            className={`cursor-pointer ${
              activePhase === key ? 'border-blue-500' : 'hover:border-gray-300'
            }`}
          >
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 space-y-4" data-testid="phase-content">
        {isLoading && <p>Laster...</p>}
        {!isLoading && !data && (
          <p>Ingen informasjon registrert for denne fasen ennå.</p>
        )}
        {!isLoading && data && (
          <>
            <h2 className="text-xl font-bold">{data.title}</h2>
            <p>{data.description}</p>
            <Checklist items={data.checklistItems} />
          </>
        )}
      </div>
    </div>
  );
};

export default RevisionProcess;
