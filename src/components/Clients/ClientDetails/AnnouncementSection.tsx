
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { ArrowUpRight } from 'lucide-react';

interface Announcement {
  id: string;
  announcement_id: string;
  client_id: string;
  org_number: string;
  announcement_date: string;
  title: string;
  type: string;
  normalized_type: string;
  details_url: string;
  kid: string;
  created_at: string;
}

interface AnnouncementSectionProps {
  announcements: Announcement[];
}

const getBadgeColor = (type: string): string => {
  switch (type) {
    case 'konkurs':
      return 'bg-red-500 text-white';
    case 'fusjon':
      return 'bg-blue-500 text-white';
    case 'kapital':
      return 'bg-green-500 text-white';
    case 'vedtekt':
      return 'bg-amber-500 text-white';
    case 'stiftelse':
      return 'bg-purple-500 text-white';
    default:
      return 'bg-gray-200 text-gray-800';
  }
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, 'dd. MMM yyyy', { locale: nb });
  } catch (error) {
    return dateString;
  }
};

const AnnouncementSection: React.FC<AnnouncementSectionProps> = ({ announcements }) => {
  if (!announcements || announcements.length === 0) {
    return null;
  }

  // Sort announcements by date, newest first
  const sortedAnnouncements = [...announcements].sort(
    (a, b) => new Date(b.announcement_date).getTime() - new Date(a.announcement_date).getTime()
  );

  // Take only the 5 most recent announcements
  const recentAnnouncements = sortedAnnouncements.slice(0, 5);

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle>Siste kunngjøringer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentAnnouncements.map((announcement) => (
            <div key={announcement.announcement_id} className="flex justify-between items-start border-b pb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`${getBadgeColor(announcement.normalized_type)}`}>
                    {announcement.normalized_type.charAt(0).toUpperCase() + announcement.normalized_type.slice(1)}
                  </Badge>
                  <span className="text-sm text-gray-500">{formatDate(announcement.announcement_date)}</span>
                </div>
                <p className="text-sm font-medium">{announcement.title}</p>
                <p className="text-xs text-gray-500">{announcement.type}</p>
              </div>
              {announcement.details_url && (
                <a 
                  href={announcement.details_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 ml-2"
                  aria-label="Se detaljer"
                >
                  <ArrowUpRight size={16} />
                </a>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnnouncementSection;
