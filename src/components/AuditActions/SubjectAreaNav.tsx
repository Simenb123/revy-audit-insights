
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SUBJECT_AREA_LABELS, AuditSubjectArea } from '@/types/audit-actions';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Package, 
  CreditCard, 
  Building, 
  Hammer, 
  FileText, 
  Receipt, 
  PieChart,
  MoreHorizontal,
  LucideIcon
} from 'lucide-react';

interface SubjectAreaNavProps {
  selectedArea: AuditSubjectArea | null;
  onAreaSelect: (area: AuditSubjectArea) => void;
  actionCounts?: Record<AuditSubjectArea, number>;
}

const AREA_ICONS: Record<AuditSubjectArea, LucideIcon> = {
  sales: DollarSign,
  payroll: Users,
  operating_expenses: TrendingUp,
  inventory: Package,
  finance: CreditCard,
  banking: Building,
  fixed_assets: Hammer,
  receivables: FileText,
  payables: Receipt,
  equity: PieChart,
  other: MoreHorizontal
};

const AREA_COLORS: Record<AuditSubjectArea, string> = {
  sales: 'bg-green-100 border-green-300 hover:bg-green-200',
  payroll: 'bg-purple-100 border-purple-300 hover:bg-purple-200',
  operating_expenses: 'bg-orange-100 border-orange-300 hover:bg-orange-200',
  inventory: 'bg-red-100 border-red-300 hover:bg-red-200',
  finance: 'bg-blue-100 border-blue-300 hover:bg-blue-200',
  banking: 'bg-indigo-100 border-indigo-300 hover:bg-indigo-200',
  fixed_assets: 'bg-gray-100 border-gray-300 hover:bg-gray-200',
  receivables: 'bg-teal-100 border-teal-300 hover:bg-teal-200',
  payables: 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200',
  equity: 'bg-pink-100 border-pink-300 hover:bg-pink-200',
  other: 'bg-slate-100 border-slate-300 hover:bg-slate-200'
};

const SubjectAreaNav = ({ selectedArea, onAreaSelect, actionCounts }: SubjectAreaNavProps) => {
  const areas = Object.keys(SUBJECT_AREA_LABELS) as AuditSubjectArea[];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
      {areas.map((area) => {
        const Icon = AREA_ICONS[area];
        const isSelected = selectedArea === area;
        const count = actionCounts?.[area] || 0;

        return (
          <Card
            key={area}
            className={`cursor-pointer transition-all duration-200 border-2 ${
              isSelected 
                ? 'ring-2 ring-revio-500 border-revio-500' 
                : AREA_COLORS[area]
            }`}
            onClick={() => onAreaSelect(area)}
          >
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center space-y-2">
                <Icon 
                  size={24} 
                  className={isSelected ? 'text-revio-600' : 'text-gray-600'} 
                />
                <div className="text-sm font-medium text-gray-900">
                  {SUBJECT_AREA_LABELS[area]}
                </div>
                {count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {count}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SubjectAreaNav;
