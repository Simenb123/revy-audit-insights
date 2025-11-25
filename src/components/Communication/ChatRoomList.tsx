import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Building2, Users, UserCircle } from 'lucide-react';
import { ChatRoom } from '@/hooks/useChatRooms';

interface ChatRoomListProps {
  chatRooms: ChatRoom[];
  activeRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
}

const roomTypeConfig = {
  team: {
    icon: UserCircle,
    color: 'bg-blue-500',
    label: 'Team'
  },
  department: {
    icon: Users,
    color: 'bg-green-500',
    label: 'Avdeling'
  },
  firm: {
    icon: Building2,
    color: 'bg-purple-500',
    label: 'Firma'
  }
};

const ChatRoomList = ({ chatRooms, activeRoomId, onRoomSelect }: ChatRoomListProps) => {
  // Group rooms by type
  const groupedRooms = {
    firm: chatRooms.filter(r => r.roomType === 'firm'),
    department: chatRooms.filter(r => r.roomType === 'department'),
    team: chatRooms.filter(r => r.roomType === 'team')
  };

  const renderRoomGroup = (type: 'team' | 'department' | 'firm') => {
    const rooms = groupedRooms[type];
    if (rooms.length === 0) return null;

    const config = roomTypeConfig[type];
    const Icon = config.icon;

    return (
      <div key={type} className="space-y-2">
        <div className="flex items-center gap-2 px-2 py-1">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase">
            {config.label}
          </span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {rooms.length}
          </Badge>
        </div>
        {rooms.map((room) => (
          <Button
            key={room.id}
            variant={activeRoomId === room.id ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => onRoomSelect(room.id)}
          >
            <div className={`h-2 w-2 rounded-full ${config.color} mr-2`} />
            <div className="flex-1 text-left truncate">
              {room.name}
            </div>
          </Button>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Chat Rom
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {chatRooms.length > 0 ? (
          <>
            {renderRoomGroup('firm')}
            {renderRoomGroup('department')}
            {renderRoomGroup('team')}
          </>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Ingen chat rom tilgjengelig</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatRoomList;
