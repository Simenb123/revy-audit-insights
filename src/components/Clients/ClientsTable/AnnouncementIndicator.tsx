
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AnnouncementIndicatorProps {
  clientId: string;
  orgNumber: string;
}

const AnnouncementIndicator: React.FC<AnnouncementIndicatorProps> = ({ clientId, orgNumber }) => {
  // Get announcements from the last 7 days
  const { data: recentAnnouncements, isLoading } = useQuery({
    queryKey: ['recent-announcements', clientId],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('client_id', clientId)
        .gte('announcement_date', sevenDaysAgo.toISOString())
        .order('announcement_date', { ascending: false });
        
      if (error) {
        console.error('Error fetching recent announcements:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!clientId
  });

  if (isLoading || !recentAnnouncements || recentAnnouncements.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="ml-2 cursor-help">
            <AlertCircle size={14} className="mr-1" />
            {recentAnnouncements.length}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{recentAnnouncements.length} ny(e) kunngjøring(er) siste 7 dager</p>
          <ul className="text-xs mt-1">
            {recentAnnouncements.slice(0, 3).map((announcement) => (
              <li key={announcement.announcement_id} className="truncate max-w-[200px]">
                • {announcement.title}
              </li>
            ))}
            {recentAnnouncements.length > 3 && (
              <li className="italic">...og {recentAnnouncements.length - 3} mer</li>
            )}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AnnouncementIndicator;
