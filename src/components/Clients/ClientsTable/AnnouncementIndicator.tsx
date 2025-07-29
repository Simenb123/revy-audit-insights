import { logger } from '@/utils/logger';

import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
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
        // I en ekte implementasjon hentes fra Supabase
        setRecentAnnouncements([]);
        setLoading(false);
      } catch (error) {
        logger.error('Error fetching announcements:', error);
        setLoading(false);
      }
    };

    if (client?.id) {
      fetchAnnouncements();
    }
  }, [client]);

  if (loading || recentAnnouncements.length === 0) return null;

  const oneWeekAgo = subDays(new Date(), 7);
  // Sjekk om det finnes kunngjøringer siste uke
  const hasRecentAnnouncement = recentAnnouncements.some(
    announcement => new Date(announcement.date) >= oneWeekAgo
  );
  if (!hasRecentAnnouncement) return null;

  return (
      <Tooltip>
        <TooltipTrigger className="cursor-help">
          <Bell size={16} className="text-red-500" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[320px] p-0">
          <div className="p-3 space-y-2">
            <h4 className="font-medium">Nye kunngjøringer</h4>
            <ul className="space-y-2 text-sm">
              {recentAnnouncements.slice(0, 3).map(announcement => (
                <li key={announcement.id} className="border-b pb-1 last:border-0">
                  <div className="font-medium">{announcement.title}</div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(announcement.date), 'dd. MMM yyyy', { locale: nb })}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
  );
};

export default AnnouncementIndicator;
