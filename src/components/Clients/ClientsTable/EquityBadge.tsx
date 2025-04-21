
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Bitcoin } from "lucide-react";

interface EquityBadgeProps {
  equityCapital?: number | null;
  shareCapital?: number | null;
}

const format = (n?: number | null) =>
  n != null && n > 0
    ? n.toLocaleString("nb-NO")
    : "—";

const EquityBadge: React.FC<EquityBadgeProps> = ({ equityCapital, shareCapital }) => {
  const [showInfo, setShowInfo] = useState(false);

  // Render kun hvis minst én kapitalverdi > 0
  const hasEquityCapital = equityCapital !== undefined && equityCapital !== null && equityCapital > 0;
  const hasShareCapital = shareCapital !== undefined && shareCapital !== null && shareCapital > 0;
  if (!hasEquityCapital && !hasShareCapital) return null;

  // Tekst for badge
  const badgeText = hasEquityCapital && hasShareCapital
    ? "NOK"
    : hasEquityCapital
      ? format(equityCapital)
      : hasShareCapital
        ? format(shareCapital)
        : null;

  return (
    <span
      className="relative ml-1"
      onMouseEnter={() => setShowInfo(true)}
      onMouseLeave={() => setShowInfo(false)}
      tabIndex={0}
      onFocus={() => setShowInfo(true)}
      onBlur={() => setShowInfo(false)}
      aria-label="kapital-informasjon"
    >
      <Badge variant="secondary" className="cursor-help flex gap-1 items-center p-1 px-2" title="Vis kapital">
        <Bitcoin size={14} className="inline" /> 
        {badgeText}
      </Badge>
      {showInfo && (
        <div className="absolute z-20 left-1/2 transform -translate-x-1/2 mt-2 bg-white text-sm border rounded shadow p-2 min-w-[180px] dark:bg-gray-900 dark:text-white">
          <div>
            <span className="font-medium">Egenkapital:</span> <span>{format(equityCapital)}</span>
          </div>
          <div>
            <span className="font-medium">Aksjekapital:</span> <span>{format(shareCapital)}</span>
          </div>
        </div>
      )}
    </span>
  );
};

export default EquityBadge;

