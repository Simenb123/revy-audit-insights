
import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Client, Announcement } from '@/types/revio';
import { format, subDays } from 'date-fns';
import { nb } from 'date-fns/locale';

interface AnnouncementIndicatorProps {
  client: Client;
}

const AnnouncementIndicator: React.FC<AnnouncementIndicatorProps> = ({ client }) => {
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        // In a real implementation, we would fetch from Supabase here
        // For now, we'll assume no announcements until the table is created
        setRecentAnnouncements([]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        setLoading(false);
      }
    };

    if (client?.id) {
      fetchAnnouncements();
    }
  }, [client]);

  if (loading || recentAnnouncements.length === 0) return null;

  const oneWeekAgo = subDays(new Date(), 7);
  
  // Check if there are any announcements from the last 7 days
  const hasRecentAnnouncement = recentAnnouncements.some(
    announcement => new Date(announcement.announcement_date) >= oneWeekAgo
  );

  if (!hasRecentAnnouncement) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="cursor-help">
          <Bell size={16} className="text-red-500" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[320px] p-0">
          <div className="p-3 space-y-2">
            <h4 className="font-medium">Nye kunngjøringer</h4>
            <ul className="space-y-2 text-sm">
              {recentAnnouncements.slice(0, 3).map(announcement => (
                <li key={announcement.announcement_id} className="border-b pb-1 last:border-0">
                  <div className="font-medium">{announcement.title}</div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(announcement.announcement_date), 'dd. MMM yyyy', { locale: nb })}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AnnouncementIndicator;
