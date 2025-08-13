import React from 'react';

interface Props {
  aggregatedDisplay: string | null | undefined;
  fallbackValue: string;
}

export function KpiBenchmarkSummary({ aggregatedDisplay, fallbackValue }: Props) {
  return (
    <div className="text-2xl font-bold">{aggregatedDisplay ?? fallbackValue}</div>
  );
}
