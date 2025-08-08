import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserGroups } from '@/hooks/useUserGroups';

const FN_URL = 'https://fxelhfwaoizqyecikscu.supabase.co/functions/v1/group-messages';

type ReceiverType = 'team' | 'department' | 'firm';

type Message = {
  id: string;
  sender_id: string;
  receiver_type: ReceiverType;
  receiver_id: string;
  content: string;
  created_at: string;
};

export default function GroupChatSidebar() {
  const { data: profile } = useUserProfile();
  const { teamIds, departmentId, firmId } = useUserGroups();

  const [receiverType, setReceiverType] = useState<ReceiverType>('firm');
  const [receiverId, setReceiverId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  // Determine default receiver id based on selection
  useEffect(() => {
    if (receiverType === 'firm') setReceiverId(firmId || undefined);
    if (receiverType === 'department') setReceiverId(departmentId || undefined);
    if (receiverType === 'team') setReceiverId(teamIds?.[0] || undefined);
  }, [receiverType, teamIds, departmentId, firmId]);

  const ready = useMemo(() => !!profile?.id && !!receiverType && !!receiverId, [profile?.id, receiverType, receiverId]);

  // Fetch latest messages
  useEffect(() => {
    if (!ready) return;
    let aborted = false;

    (async () => {
      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes.session?.access_token;
      const url = new URL(FN_URL);
      url.searchParams.set('receiver_type', receiverType);
      url.searchParams.set('receiver_id', receiverId!);
      url.searchParams.set('limit', '50');

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json: { messages: Message[] } = await res
        .json()
        .catch(() => ({ messages: [] as Message[] }));
      if (!aborted) setMessages((json.messages || []).reverse()); // oldest first
    })();

    return () => { aborted = true; };
  }, [ready, receiverType, receiverId]);

  // WebSocket realtime
  useEffect(() => {
    (async () => {
      if (!ready) return;
      // Close existing
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes.session?.access_token;
      const wsUrl = `wss://fxelhfwaoizqyecikscu.supabase.co/functions/v1/group-messages?token=${encodeURIComponent(
        token || ''
      )}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          if (payload?.type === 'message') {
            const m = payload.data as Message;
            if (m.receiver_type === receiverType && m.receiver_id === receiverId) {
              setMessages((prev) => [...prev, m]);
            }
          }
        } catch {}
      };

      ws.onopen = () => {
        // No-op; server sends 'ready'
      };
      ws.onerror = () => {};

      return () => {
        ws.close();
      };
    })();
  }, [ready]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !ready) return;

    await supabase.functions.invoke('group-messages', {
      body: { receiver_type: receiverType, receiver_id: receiverId, content },
    });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-2 border-b">
        <Select value={receiverType} onValueChange={(v: ReceiverType) => setReceiverType(v)}>
          <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="Velg gruppe" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="firm">Firma</SelectItem>
            <SelectItem value="department">Avdeling</SelectItem>
            {teamIds?.length ? <SelectItem value="team">Team</SelectItem> : null}
          </SelectContent>
        </Select>

        {receiverType === 'team' && teamIds?.length > 1 && (
          <Select value={receiverId} onValueChange={(v) => setReceiverId(v)}>
            <SelectTrigger className="h-8 w-[160px]"><SelectValue placeholder="Velg team" /></SelectTrigger>
            <SelectContent>
              {teamIds.map((id) => (
                <SelectItem key={id} value={id}>{id.slice(0, 8)}…</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {messages.map((m) => (
            <div key={m.id} className="text-sm">
              <span className="text-muted-foreground">{m.sender_id.slice(0, 6)}:</span>{' '}
              <span>{m.content}</span>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-2 border-t flex items-center gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Skriv en melding…"
          className="min-h-[44px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button size="sm" onClick={handleSend} disabled={!ready || !input.trim()}>Send</Button>
      </div>
    </div>
  );
}
