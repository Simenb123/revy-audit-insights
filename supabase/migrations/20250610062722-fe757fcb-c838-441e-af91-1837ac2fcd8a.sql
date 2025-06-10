
-- Create chat rooms table for different communication scopes
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_type communication_type NOT NULL,
  reference_id UUID NOT NULL, -- team_id, department_id, or firm_id
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for chat messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'file', 'announcement'
  parent_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- For file attachments, reactions, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user presence table for online status
CREATE TABLE public.user_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  current_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_chat_rooms_reference ON public.chat_rooms(reference_id, room_type);
CREATE INDEX idx_messages_room ON public.messages(room_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_user_presence_user ON public.user_presence(user_id);

-- Enable RLS on new tables
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat rooms
CREATE POLICY "Users can view relevant chat rooms" ON public.chat_rooms
  FOR SELECT USING (
    (room_type = 'team' AND reference_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND is_active = true
    )) OR
    (room_type = 'department' AND reference_id = public.get_user_department(auth.uid())) OR
    (room_type = 'firm' AND reference_id = public.get_user_firm(auth.uid()))
  );

-- Create RLS policies for messages
CREATE POLICY "Users can view messages in accessible rooms" ON public.messages
  FOR SELECT USING (
    room_id IN (
      SELECT id FROM public.chat_rooms WHERE
      (room_type = 'team' AND reference_id IN (
        SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND is_active = true
      )) OR
      (room_type = 'department' AND reference_id = public.get_user_department(auth.uid())) OR
      (room_type = 'firm' AND reference_id = public.get_user_firm(auth.uid()))
    )
  );

-- Users can insert messages in rooms they have access to
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    room_id IN (
      SELECT id FROM public.chat_rooms WHERE
      (room_type = 'team' AND reference_id IN (
        SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND is_active = true
      )) OR
      (room_type = 'department' AND reference_id = public.get_user_department(auth.uid())) OR
      (room_type = 'firm' AND reference_id = public.get_user_firm(auth.uid()))
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can edit their own messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

-- RLS policies for user presence
CREATE POLICY "Users can view presence of users in same firm" ON public.user_presence
  FOR SELECT USING (
    user_id IN (
      SELECT p.id FROM public.profiles p WHERE p.audit_firm_id = public.get_user_firm(auth.uid())
    )
  );

CREATE POLICY "Users can update their own presence" ON public.user_presence
  FOR ALL USING (user_id = auth.uid());

-- Enable realtime for messages and presence
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.user_presence REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;

-- Add triggers for updated_at
CREATE TRIGGER set_chat_rooms_updated_at BEFORE UPDATE ON public.chat_rooms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_user_presence_updated_at BEFORE UPDATE ON public.user_presence
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Function to automatically create chat rooms for teams
CREATE OR REPLACE FUNCTION public.create_team_chat_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chat_rooms (room_type, reference_id, name, description)
  VALUES ('team', NEW.id, NEW.name || ' - Team Chat', 'Automatisk opprettet team-chat for ' || NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create chat room when team is created
CREATE TRIGGER create_team_chat_room_trigger
  AFTER INSERT ON public.client_teams
  FOR EACH ROW EXECUTE FUNCTION public.create_team_chat_room();
