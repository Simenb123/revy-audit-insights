
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Announcement } from "@/types/revio";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface AnnouncementsListProps {
  announcements: Announcement[];
}

const AnnouncementsList = ({ announcements }: AnnouncementsListProps) => {
  // Formatér annonsenes dato for visning
  const processedAnnouncements = announcements.map(announcement => ({
    ...announcement,
    displayDate: format(new Date(announcement.date), 'dd. MMM yyyy', { locale: nb }),
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Nye kunngjøringer</CardTitle>
          <CardDescription>Fra Brønnøysundregistrene</CardDescription>
        </div>
        <Bell size={18} className="text-muted-foreground" />
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-0">
          {processedAnnouncements.slice(0, 5).map(announcement => (
            <div 
              key={announcement.id} 
              className={`py-3 px-6 border-b last:border-b-0 ${!announcement.isRead ? 'bg-muted/50' : ''}`}
            >
              <div className="text-sm font-medium flex justify-between">
                <span>{announcement.title}</span>
                <span className="text-xs text-muted-foreground">{announcement.displayDate}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{announcement.type}</div>
              <a
                href={announcement.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-blue-600 hover:underline mt-1"
              >
                Se detaljer
              </a>
            </div>
          ))}
        </div>
        <div className="pt-4 px-6">
          <Button variant="outline" className="w-full">Se alle kunngjøringer</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnnouncementsList;
