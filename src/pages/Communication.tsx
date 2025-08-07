
import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useChatRooms } from '@/hooks/useChatRooms';
import CommunicationStatus from '@/components/Communication/CommunicationStatus';
import OnlineUsers from '@/components/Communication/OnlineUsers';
import ChatRoom from '@/components/Communication/ChatRoom';
import EmptyState from '@/components/Communication/EmptyState';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Communication = () => {
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: chatRooms = [], isLoading: roomsLoading } = useChatRooms();

  if (profileLoading || roomsLoading) {
    return (
      <div className="space-y-[var(--content-gap)] w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-[var(--content-gap)] w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Kommunikasjon</h1>
          <p className="text-muted-foreground mt-1">
            Samarbeid og kommuniser med teamet ditt
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tilbake
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {chatRooms.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {chatRooms.map((room) => (
                <ChatRoom key={room.id} roomId={room.id} roomName={room.name} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <CommunicationStatus />
          <OnlineUsers />
        </div>
      </div>
    </div>
  );
};

export default Communication;
