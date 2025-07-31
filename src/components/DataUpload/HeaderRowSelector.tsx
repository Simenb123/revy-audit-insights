import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface HeaderRowSelectorProps {
  currentHeaderRowIndex: number;
  displayRows: Array<{
    index: number;
    content: string[];
    isHeader: boolean;
    isSkipped: boolean;
    isData: boolean;
  }>;
  showAllRows: boolean;
  onHeaderRowChange: (rowIndex: string) => void;
  onToggleRows: () => void;
  skippedRowsCount: number;
}

const HeaderRowSelector: React.FC<HeaderRowSelectorProps> = ({
  currentHeaderRowIndex,
  displayRows,
  showAllRows,
  onHeaderRowChange,
  onToggleRows,
  skippedRowsCount
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filinnhold og header-rad</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Header rad detektert på rad {currentHeaderRowIndex + 1}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleRows}
              className="text-xs flex items-center gap-1"
            >
              {showAllRows ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showAllRows ? 'Skjul' : 'Vis flere'} rader
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-amber-700">Velg header rad:</span>
            <Select value={currentHeaderRowIndex.toString()} onValueChange={onHeaderRowChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {displayRows.map((row, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    Rad {index + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {skippedRowsCount > 0 && (
              <span className="text-xs text-amber-600">
                {skippedRowsCount} rad(er) hoppes over
              </span>
            )}
          </div>
        </div>

        {/* Row preview */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse border border-border text-sm">
            <tbody>
              {displayRows.map((displayRow, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={`${
                    displayRow.isHeader 
                      ? 'bg-primary/10 border-2 border-primary' 
                      : displayRow.isSkipped 
                      ? 'bg-amber-50' 
                      : 'bg-background'
                  }`}
                >
                  <td className="border border-border p-2 text-xs font-medium bg-muted/30 min-w-[80px]">
                    Rad {displayRow.index + 1}
                    {displayRow.isHeader && <Badge className="ml-1 text-xs">Header</Badge>}
                    {displayRow.isSkipped && <Badge variant="outline" className="ml-1 text-xs">Hoppes over</Badge>}
                  </td>
                  {displayRow.content.slice(0, 8).map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-border p-2 min-w-[100px]">
                      {cell || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeaderRowSelector;