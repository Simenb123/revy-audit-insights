
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Client } from "@/types/revio";
import AccountingYearHeader from "@/components/AccountingYearHeader";

interface ClientBreadcrumbProps {
  client: Client;
}

const ClientBreadcrumb = ({ client }: ClientBreadcrumbProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/klienter">Klienter</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{client.company_name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <AccountingYearHeader 
          clientId={client.id} 
          variant="compact"
          showSelector={true}
        />
      </div>
    </div>
  );
};

export default ClientBreadcrumb;
