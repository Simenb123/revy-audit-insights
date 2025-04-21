import { Button } from "@/components/ui/button";
import ClientStatsCard from "./ClientStatsCard";
import { Client, Announcement } from "@/types/revio";

interface ClientStatsGridProps {
  clients: Client[];
  announcements: Announcement[];
}

const ClientStatsGrid = ({ clients, announcements }: ClientStatsGridProps) => {
  // Ny: Tell uleste
  const unreadCount = announcements.filter(a => !a.isRead).length;

  return (
    <div className="grid grid-cols-3 gap-6 mb-8">
      <ClientStatsCard
        title="Klienter under revisjon"
        description={`Totalt ${clients.length} klienter`}
        value={clients.length}
        footer={
          <div className="flex justify-between">
            <span>Aktive: {clients.filter(c => c.phase !== 'conclusion').length}</span>
            <span>Fullførte: {clients.filter(c => c.phase === 'conclusion').length}</span>
          </div>
        }
      />
      
      <ClientStatsCard
        title="Dokumenter til innsending"
        description="Oversikt over kommende frister"
        value={clients.reduce((acc, client) => 
          acc + client.documents.filter(doc => doc.status === 'pending').length, 0)}
        footer={
          <span>Neste frist: 15. mai 2025 (Aksjonærregisteroppgave)</span>
        }
      />
      
      <ClientStatsCard
        title="Nye kunngjøringer"
        description="Fra Brønnøysundregistrene"
        value={unreadCount}
        footer={
          <div className="flex justify-between">
            <span>Uleste: {unreadCount}</span>
            <Button variant="ghost" size="sm" className="p-0 h-auto text-revio-500 hover:text-revio-600 hover:bg-transparent">
              <span>Se alle</span>
            </Button>
          </div>
        }
      />
    </div>
  );
};

export default ClientStatsGrid;
