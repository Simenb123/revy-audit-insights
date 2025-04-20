
import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";
import { ClientRole } from "@/types/revio";

interface BoardAccordionProps {
  roles: ClientRole[];
}

const BoardAccordion: React.FC<BoardAccordionProps> = ({ roles }) => {
  if (!roles || roles.length === 0) return null;
  // Sort: CEO, Chair, MEM, SIGNATORY
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
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="board">
        <AccordionTrigger>Styresammensetning</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            {Object.entries(grouped).map(([type, rs]) => (
              rs.map(role => (
                <div className="flex flex-col md:flex-row md:justify-between md:items-center p-2 bg-muted rounded" key={role.id}>
                  <div>
                    <span className="font-medium">{role.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {type === "CEO" ? "Daglig leder" : type === "CHAIR" ? "Styreleder" : type === "SIGNATORY" ? "Signaturberettiget" : "Styremedlem"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {role.fromDate && `Fra: ${formatDate(role.fromDate)}`}
                    {role.toDate && ` til: ${formatDate(role.toDate)}`}
                  </div>
                </div>
              ))
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default BoardAccordion;
