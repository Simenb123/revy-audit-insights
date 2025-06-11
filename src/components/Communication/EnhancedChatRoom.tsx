
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Reply, 
  Edit3, 
  Trash2,
  Video,
  Phone,
  Search,
  Pin,
  Star
} from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { formatDate } from '@/lib/formatters';

interface EnhancedMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  type: 'text' | 'file' | 'system' | 'reaction';
  parentMessageId?: string;
  isEdited?: boolean;
  reactions?: { emoji: string; users: string[]; }[];
  isPinned?: boolean;
  isStarred?: boolean;
}

interface EnhancedChatRoomProps {
  roomId: string;
  roomName: string;
  isPrivate?: boolean;
  participants?: string[];
}

const EnhancedChatRoom = ({ 
  roomId, 
  roomName, 
  isPrivate = false, 
  participants = [] 
}: EnhancedChatRoomProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { messages, sendMessage, isSending } = useMessages(roomId);
  
  const [enhancedMessages] = useState<EnhancedMessage[]>([
    {
      id: '1',
      content: 'Hei alle sammen! Har alle fått tilgang til de nye revisjonsdokumentene?',
      senderId: 'user1',
      senderName: 'Sarah Berg',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'text',
      reactions: [
        { emoji: '👍', users: ['user2', 'user3'] },
        { emoji: '✅', users: ['user2'] }
      ]
    },
    {
      id: '2',
      content: 'Ja, jeg har gått gjennom dem. Ser bra ut så langt!',
      senderId: 'user2',
      senderName: 'Erik Nordahl',
      timestamp: new Date(Date.now() - 3300000).toISOString(),
      type: 'text',
      parentMessageId: '1'
    },
    {
      id: '3',
      content: 'Møtet i morgen er flyttet til 14:00 i stedet for 13:00',
      senderId: 'system',
      senderName: 'System',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      type: 'system',
      isPinned: true
    },
    {
      id: '4',
      content: 'Perfekt! Takk for beskjeden. Jeg noterer meg det.',
      senderId: 'user3',
      senderName: 'Lisa Hansen',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      type: 'text',
      isStarred: true
    }
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [enhancedMessages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || isSending) return;

    if (editingMessage) {
      // Rediger eksisterende melding
      setEditingMessage(null);
    } else {
      // Send ny melding
      sendMessage({
        roomId,
        content: newMessage,
        parentMessageId: replyingTo || undefined
      });
    }

    setNewMessage('');
    setReplyingTo(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const addReaction = (messageId: string, emoji: string) => {
    // Implementer reaksjonsfunksjonalitet
    console.log(`Adding ${emoji} to message ${messageId}`);
  };

  const pinMessage = (messageId: string) => {
    // Implementer pin-funksjonalitet
    console.log(`Pinning message ${messageId}`);
  };

  const starMessage = (messageId: string) => {
    // Implementer stjernemarkering
    console.log(`Starring message ${messageId}`);
  };

  const getMessageSender = (senderId: string) => {
    const message = enhancedMessages.find(m => m.senderId === senderId);
    return message?.senderName || 'Ukjent bruker';
  };

  const filteredMessages = enhancedMessages.filter(message =>
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.senderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pinnedMessages = enhancedMessages.filter(m => m.isPinned);

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Chat header */}
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span>{roomName}</span>
              {isPrivate && <Badge variant="secondary">Privat</Badge>}
            </div>
            <Badge variant="outline">{participants.length + 1} deltakere</Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowParticipants(!showParticipants)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Søkefelt */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Søk i meldinger..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Festede meldinger */}
        {pinnedMessages.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Pin className="h-4 w-4" />
              Festede meldinger
            </h4>
            {pinnedMessages.map((message) => (
              <div key={message.id} className="bg-muted p-2 rounded text-sm">
                <span className="font-medium">{message.senderName}:</span> {message.content}
              </div>
            ))}
          </div>
        )}
      </CardHeader>

      {/* Meldingsområde */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.map((message) => (
          <div key={message.id} className="group">
            {message.parentMessageId && (
              <div className="ml-4 mb-1 text-xs text-muted-foreground border-l-2 border-muted pl-2">
                Svar til: {enhancedMessages.find(m => m.id === message.parentMessageId)?.content.substring(0, 50)}...
              </div>
            )}
            
            <div className={`flex gap-3 ${message.type === 'system' ? 'justify-center' : ''}`}>
              {message.type !== 'system' && (
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {message.senderName.charAt(0).toUpperCase()}
                </div>
              )}
              
              <div className={`flex-1 ${message.type === 'system' ? 'text-center' : ''}`}>
                {message.type !== 'system' && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{message.senderName}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(message.timestamp)}
                    </span>
                    {message.isEdited && (
                      <Badge variant="outline" className="text-xs">redigert</Badge>
                    )}
                    {message.isPinned && <Pin className="h-3 w-3 text-muted-foreground" />}
                    {message.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                  </div>
                )}
                
                <div className={`${
                  message.type === 'system' 
                    ? 'bg-muted text-muted-foreground text-sm p-2 rounded inline-block' 
                    : 'text-sm'
                }`}>
                  {message.content}
                </div>
                
                {/* Reaksjoner */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {message.reactions.map((reaction, index) => (
                      <button
                        key={index}
                        className="bg-muted hover:bg-muted/80 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                        onClick={() => addReaction(message.id, reaction.emoji)}
                      >
                        {reaction.emoji} {reaction.users.length}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Meldingshandlinger */}
                {message.type !== 'system' && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setReplyingTo(message.id)}
                    >
                      <Reply className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => addReaction(message.id, '👍')}
                    >
                      <Smile className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => starMessage(message.id)}
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => pinMessage(message.id)}
                    >
                      <Pin className="h-3 w-3" />
                    </Button>
                    {message.senderId === 'current_user' && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingMessage(message.id)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Svar-indikator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-muted border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Svarer til: {enhancedMessages.find(m => m.id === replyingTo)?.content.substring(0, 50)}...
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setReplyingTo(null)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Meldingsinput */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleFileUpload}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Input
            placeholder={editingMessage ? "Rediger melding..." : "Skriv en melding..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              // Håndter filopplasting
              console.log('Files selected:', e.target.files);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatRoom;
