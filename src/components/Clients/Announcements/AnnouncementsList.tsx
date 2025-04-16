
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Announcement } from "@/types/revio";

interface AnnouncementsListProps {
  announcements: Announcement[];
}

const AnnouncementsList = ({ announcements }: AnnouncementsListProps) => {
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
          {announcements.slice(0, 5).map(announcement => (
            <div 
              key={announcement.id} 
              className={`py-3 px-6 border-b last:border-b-0 ${!announcement.isRead ? 'bg-muted/50' : ''}`}
            >
              <div className="text-sm font-medium flex justify-between">
                <span>{announcement.clientName}</span>
                <span className="text-xs text-muted-foreground">{announcement.date}</span>
              </div>
              <div className="text-sm mt-1">{announcement.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{announcement.description}</div>
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
