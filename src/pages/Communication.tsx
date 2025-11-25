
import React, { useEffect, useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useChatRooms } from '@/hooks/useChatRooms';
import CommunicationStatus from '@/components/Communication/CommunicationStatus';
import OnlineUsers from '@/components/Communication/OnlineUsers';
import ChatRoom from '@/components/Communication/ChatRoom';
import ChatRoomList from '@/components/Communication/ChatRoomList';
import EmptyState from '@/components/Communication/EmptyState';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';
import { usePageTitle } from '@/components/Layout/PageTitleContext';

const Communication = () => {
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: chatRooms = [], isLoading: roomsLoading } = useChatRooms();
  const { setPageTitle } = usePageTitle();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle('Kommunikasjon');
  }, [setPageTitle]);

  useEffect(() => {
    if (chatRooms.length > 0 && !activeRoomId) {
      setActiveRoomId(chatRooms[0].id);
    }
  }, [chatRooms, activeRoomId]);

  if (profileLoading || roomsLoading) {
    return (
      <StandardPageLayout className="w-full space-y-[var(--content-gap)]">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      className="w-full"
      header={
        <div className="flex justify-end items-center">
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Tilbake
            </Button>
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div>
          <ChatRoomList
            chatRooms={chatRooms}
            activeRoomId={activeRoomId}
            onRoomSelect={setActiveRoomId}
          />
        </div>

        <div className="lg:col-span-2">
          {chatRooms.length === 0 ? (
            <EmptyState />
          ) : activeRoomId ? (
            <ChatRoom 
              roomId={activeRoomId}
              roomName={chatRooms.find(r => r.id === activeRoomId)?.name || 'Chat'}
            />
          ) : null}
        </div>

        <div className="space-y-4">
          <CommunicationStatus />
          <OnlineUsers />
        </div>
      </div>
    </StandardPageLayout>
  );
};

export default Communication;
