
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Bitcoin } from "lucide-react";

interface EquityBadgeProps {
  equityCapital?: number | null;
  shareCapital?: number | null;
}

const format = (n?: number | null) =>
  n != null && n > 0
    ? new Intl.NumberFormat("nb-NO", {
        style: "currency",
        currency: "NOK",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";

const EquityBadge: React.FC<EquityBadgeProps> = ({ equityCapital, shareCapital }) => {
  const [showInfo, setShowInfo] = useState(false);

  // Show the badge only if at least one of equityCapital or shareCapital has a value
  if ((!equityCapital || equityCapital <= 0) && (!shareCapital || shareCapital <= 0)) return null;

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
        {equityCapital > 0 && shareCapital > 0 
          ? "NOK" 
          : equityCapital > 0 
            ? format(equityCapital).replace("kr", "").trim() 
            : format(shareCapital).replace("kr", "").trim()}
      </Badge>
      {showInfo && (
        <div className="absolute z-20 left-1/2 transform -translate-x-1/2 mt-2 bg-white text-sm border rounded shadow p-2 min-w-[180px] dark:bg-gray-900 dark:text-white">
          <div>
            <span className="font-medium">Egenkapital:</span> <span>{format(equityCapital)}</span>
          </div>
          <div>
            <span className="font-medium">Innskuddskapital:</span> <span>{format(shareCapital)}</span>
          </div>
        </div>
      )}
    </span>
  );
};

export default EquityBadge;
