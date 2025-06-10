
import React from 'react';
import { useUserPresence } from '@/hooks/useUserPresence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface OnlineUsersProps {
  currentRoomId?: string;
}

const OnlineUsers = ({ currentRoomId }: OnlineUsersProps) => {
  const { presenceData, isLoading } = useUserPresence();

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  };

  const onlineUsers = presenceData.filter(presence => presence.isOnline);
  const usersInRoom = currentRoomId 
    ? onlineUsers.filter(presence => presence.currentRoomId === currentRoomId)
    : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Online brukere</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Online brukere
          <Badge variant="secondary">{onlineUsers.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {currentRoomId && usersInRoom.length > 0 && (
            <>
              <div>
                <h4 className="text-sm font-medium mb-2">I denne chatten</h4>
                <div className="space-y-2">
                  {usersInRoom.map((presence) => (
                    <div key={presence.id} className="flex items-center gap-2">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(presence.userProfile?.firstName, presence.userProfile?.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <span className="text-sm">
                        {presence.userProfile?.firstName} {presence.userProfile?.lastName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <hr />
            </>
          )}
          
          <div>
            <h4 className="text-sm font-medium mb-2">Alle online</h4>
            <div className="space-y-2">
              {onlineUsers.map((presence) => (
                <div key={presence.id} className="flex items-center gap-2">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(presence.userProfile?.firstName, presence.userProfile?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      presence.currentRoomId === currentRoomId ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                  </div>
                  <span className="text-sm">
                    {presence.userProfile?.firstName} {presence.userProfile?.lastName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {onlineUsers.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Ingen online brukere</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OnlineUsers;
