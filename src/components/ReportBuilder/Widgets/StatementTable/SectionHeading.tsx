import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';

export function SectionHeading({ title, colSpan = 2, rowIndex }: { title: string; colSpan?: number; rowIndex?: number }) {
  return (
    <TableRow role="row" aria-rowindex={rowIndex} className="print:break-inside-avoid">
      <TableCell
        role="gridcell"
        colSpan={colSpan}
        aria-colindex={1}
        aria-colspan={colSpan}
        className="text-[11px] uppercase tracking-wide text-muted-foreground bg-background sticky top-[var(--table-section-offset,2.25rem)] z-10 border-t border-border py-1.5"
      >
        {title}
      </TableCell>
    </TableRow>
  );
}

export default SectionHeading;
