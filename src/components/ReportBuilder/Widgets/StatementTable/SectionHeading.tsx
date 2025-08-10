import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';

export function SectionHeading({ title, colSpan = 2, rowIndex }: { title: string; colSpan?: number; rowIndex?: number }) {
  return (
    <TableRow role="row" aria-rowindex={rowIndex} className="print:break-inside-avoid">
      <TableCell role="gridcell" colSpan={colSpan} aria-colindex={1} aria-colspan={colSpan} className="font-medium text-muted-foreground">{title}</TableCell>
    </TableRow>
  );
}

export default SectionHeading;
