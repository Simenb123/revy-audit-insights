
-- Create revy_chat_sessions table to store conversation threads
CREATE TABLE public.revy_chat_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    title TEXT,
    context TEXT
);

COMMENT ON TABLE public.revy_chat_sessions IS 'Stores individual conversation sessions with the Revy AI assistant.';
COMMENT ON COLUMN public.revy_chat_sessions.title IS 'Optional title for the chat session, can be auto-generated.';
COMMENT ON COLUMN public.revy_chat_sessions.context IS 'The application context when the session was created (e.g., client-detail).';


-- Enable RLS for chat_sessions
ALTER TABLE public.revy_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see, create, update, and delete their own chat sessions
CREATE POLICY "Users can manage their own revy chat sessions"
ON public.revy_chat_sessions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create revy_chat_messages table to store individual messages
CREATE TABLE public.revy_chat_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.revy_chat_sessions(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'revy')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.revy_chat_messages IS 'Stores individual messages within a Revy AI chat session.';
COMMENT ON COLUMN public.revy_chat_messages.sender IS 'Indicates if the message is from the "user" or the "revy" assistant.';


-- Enable RLS for revy_chat_messages
ALTER TABLE public.revy_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage messages in sessions they own
CREATE POLICY "Users can manage messages in their own revy chat sessions"
ON public.revy_chat_messages
FOR ALL
USING (
    (
        SELECT rcs.user_id
        FROM public.revy_chat_sessions rcs
        WHERE rcs.id = session_id
    ) = auth.uid()
)
WITH CHECK (
    (
        SELECT rcs.user_id
        FROM public.revy_chat_sessions rcs
        WHERE rcs.id = session_id
    ) = auth.uid()
);

-- Add trigger to update `updated_at` on `revy_chat_sessions` when a new message is added
CREATE OR REPLACE FUNCTION public.update_revy_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.revy_chat_sessions
    SET updated_at = now()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_revy_message_update_session_timestamp
AFTER INSERT ON public.revy_chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_revy_session_updated_at();

-- Enable real-time for new tables
ALTER TABLE public.revy_chat_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.revy_chat_messages REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.revy_chat_sessions, public.revy_chat_messages;

