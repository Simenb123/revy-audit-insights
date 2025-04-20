import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";
import { ClientRole } from "@/types/revio";

interface BoardAccordionProps {
  roles: ClientRole[];
}

const roleLabels: Record<string, string> = {
  CEO: "Daglig leder",
  CHAIR: "Styreleder",
  SIGNATORY: "Signaturberettiget",
  MEMBER: "Styremedlem"
};

const BoardAccordion: React.FC<BoardAccordionProps> = ({ roles }) => {
  if (!roles || roles.length === 0) return null;

  const grouped = {
    CEO: [] as ClientRole[],
    CHAIR: [] as ClientRole[],
    MEMBER: [] as ClientRole[],
    SIGNATORY: [] as ClientRole[]
  };
  for (const role of roles) {
    if (role.roleType in grouped) {
      grouped[role.roleType as keyof typeof grouped].push(role);
    }
  }

  const rolePeriod = (from?: string, to?: string) => {
    if (!from && !to) return null;
    if (from && !to) return (
      <span className="text-xs text-muted-foreground ml-3">(fra: {formatDate(from)} – pågående)</span>
    );
    if (from && to) return (
      <span className="text-xs text-muted-foreground ml-3">(fra: {formatDate(from)} til: {formatDate(to)})</span>
    );
    if (!from && to) return (
      <span className="text-xs text-muted-foreground ml-3">(til: {formatDate(to)})</span>
    );
    return null;
  };

  const renderRole = (role: ClientRole, type: string) => (
    <div
      className="flex flex-col md:flex-row md:justify-between md:items-center p-2 bg-muted rounded"
      key={role.id}
    >
      <div>
        <span className="font-medium">
          {role.name && role.name.trim().length > 0 ? role.name : "—"}
        </span>
        <span className="ml-2 text-xs text-muted-foreground">
          {roleLabels[type] || type}
        </span>
        {rolePeriod(role.fromDate, role.toDate)}
      </div>
    </div>
  );

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="board">
        <AccordionTrigger>Styresammensetning</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            {Object.entries(grouped).map(([type, rs]) =>
              rs.map((role) => renderRole(role, type))
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default BoardAccordion;
