import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useMessages } from '@/hooks/useMessages';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserProfile } from '@/hooks/useUserProfile';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';

export default function SimpleChatPanel() {
  const { data: profile } = useUserProfile();
  const { data: chatRooms, isLoading: roomsLoading } = useChatRooms();
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [inputValue, setInputValue] = useState('');

  const { messages, isLoading: messagesLoading, sendMessage, isSending } = useMessages(selectedRoomId);

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedRoomId) return;
    await sendMessage({
      roomId: selectedRoomId,
      content: inputValue.trim()
    });
    setInputValue('');
  };

  if (roomsLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Laster chat-rom...</div>;
  }

  if (!chatRooms || chatRooms.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">Ingen chat-rom tilgjengelig</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Velg chat-rom" />
          </SelectTrigger>
          <SelectContent>
            {chatRooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedRoomId ? (
        <>
          <ScrollArea className="flex-1 p-4">
            {messagesLoading ? (
              <div className="text-sm text-muted-foreground">Laster meldinger...</div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-muted-foreground">Ingen meldinger ennå</div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.senderId === profile?.id ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        msg.senderId === profile?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="text-xs font-medium mb-1">
                        {msg.senderProfile?.firstName} {msg.senderProfile?.lastName}
                      </div>
                      <div className="text-sm">{msg.content}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {formatDistanceToNow(new Date(msg.createdAt), {
                          addSuffix: true,
                          locale: nb,
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="p-2 border-t flex gap-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Skriv en melding..."
              className="resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button onClick={handleSend} disabled={isSending || !inputValue.trim()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          Velg et chat-rom for å starte
        </div>
      )}
    </div>
  );
}
