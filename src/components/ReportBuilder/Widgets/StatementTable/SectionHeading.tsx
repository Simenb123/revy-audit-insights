import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';

export function SectionHeading({ title }: { title: string }) {
  return (
    <TableRow>
      <TableCell colSpan={6} className="font-medium text-muted-foreground">{title}</TableCell>
    </TableRow>
  );
}

export default SectionHeading;
