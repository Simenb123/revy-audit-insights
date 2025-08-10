import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';

export function SectionHeading({ title, colSpan = 2 }: { title: string; colSpan?: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="font-medium text-muted-foreground">{title}</TableCell>
    </TableRow>
  );
}

export default SectionHeading;
