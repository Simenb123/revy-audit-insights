-- aktiver RLS hvis det mangler
ALTER TABLE public.revy_chat_messages ENABLE ROW LEVEL SECURITY;

-- brukeren må eie chat-sesjonen for å kunne lage melding
CREATE POLICY session_owner_ins ON public.revy_chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.revy_chat_sessions s
      WHERE s.id = session_id
        AND s.user_id = auth.uid()
    )
  );

-- valgfritt: alle kan lese meldinger i sine egne sesjoner
CREATE POLICY session_owner_sel ON public.revy_chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.revy_chat_sessions s
      WHERE s.id = session_id
        AND s.user_id = auth.uid()
    )
  );
