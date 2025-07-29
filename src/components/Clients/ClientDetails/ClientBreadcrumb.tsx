
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Client } from "@/types/revio";
import AccountingYearSelector from "@/components/AccountingYearSelector";

interface ClientBreadcrumbProps {
  client: Client;
}

const ClientBreadcrumb = ({ client }: ClientBreadcrumbProps) => {
  return (
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
      
      <AccountingYearSelector 
        clientId={client.id} 
        variant="minimal"
        showLabel={false}
      />
    </div>
  );
};

export default ClientBreadcrumb;
