
-- 1) Enum for grupper
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_receiver_type') THEN
    CREATE TYPE public.message_receiver_type AS ENUM ('team', 'department', 'firm');
  END IF;
END$$;

-- 2) Tabell: group_messages
CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id), -- referer til profiles, ikke auth.users
  receiver_type public.message_receiver_type NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Indekser
CREATE INDEX IF NOT EXISTS idx_group_messages_receiver
  ON public.group_messages (receiver_type, receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_group_messages_sender
  ON public.group_messages (sender_id, created_at DESC);

-- 4) RLS
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- SELECT: se egne sendte eller meldinger i grupper du tilhører
CREATE POLICY IF NOT EXISTS group_messages_select
ON public.group_messages
FOR SELECT
USING (
  sender_id = auth.uid()
  OR (
    receiver_type = 'team'
    AND receiver_id IN (SELECT team_id FROM public.get_user_team_ids(auth.uid()))
  )
  OR (
    receiver_type = 'department'
    AND receiver_id = public.get_user_department(auth.uid())
  )
  OR (
    receiver_type = 'firm'
    AND receiver_id = public.get_user_firm(auth.uid())
  )
);

-- INSERT: må være avsender selv og skrive til gruppe man tilhører
CREATE POLICY IF NOT EXISTS group_messages_insert
ON public.group_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND (
    (receiver_type = 'team' AND receiver_id IN (SELECT team_id FROM public.get_user_team_ids(auth.uid())))
    OR (receiver_type = 'department' AND receiver_id = public.get_user_department(auth.uid()))
    OR (receiver_type = 'firm' AND receiver_id = public.get_user_firm(auth.uid()))
  )
);

-- UPDATE: begrens til å oppdatere (f.eks. is_read) for grupper man tilhører eller egne sendte
CREATE POLICY IF NOT EXISTS group_messages_update
ON public.group_messages
FOR UPDATE
USING (
  sender_id = auth.uid()
  OR (
    receiver_type = 'team'
    AND receiver_id IN (SELECT team_id FROM public.get_user_team_ids(auth.uid()))
  )
  OR (
    receiver_type = 'department'
    AND receiver_id = public.get_user_department(auth.uid())
  )
  OR (
    receiver_type = 'firm'
    AND receiver_id = public.get_user_firm(auth.uid())
  )
)
WITH CHECK (
  sender_id = auth.uid()
  OR (
    receiver_type = 'team'
    AND receiver_id IN (SELECT team_id FROM public.get_user_team_ids(auth.uid()))
  )
  OR (
    receiver_type = 'department'
    AND receiver_id = public.get_user_department(auth.uid())
  )
  OR (
    receiver_type = 'firm'
    AND receiver_id = public.get_user_firm(auth.uid())
  )
);

-- (valgfritt) Sletting: tillat avsender å slette egen melding
CREATE POLICY IF NOT EXISTS group_messages_delete_own
ON public.group_messages
FOR DELETE
USING (sender_id = auth.uid());

-- 5) Validerings-trigger: kun is_read kan endres ved UPDATE
CREATE OR REPLACE FUNCTION public.group_messages_restrict_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.receiver_type IS DISTINCT FROM OLD.receiver_type
     OR NEW.receiver_id IS DISTINCT FROM OLD.receiver_id
     OR NEW.content IS DISTINCT FROM OLD.content
  THEN
    RAISE EXCEPTION 'Only is_read can be updated on group_messages';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_group_messages_restrict_update ON public.group_messages;
CREATE TRIGGER trg_group_messages_restrict_update
BEFORE UPDATE ON public.group_messages
FOR EACH ROW
EXECUTE FUNCTION public.group_messages_restrict_update();

-- 6) Realtime: replika-identitet og publikasjon
ALTER TABLE public.group_messages REPLICA IDENTITY FULL;
DO $$
BEGIN
  -- Legg tabellen til supabase_realtime publikasjonen dersom den ikke allerede er der
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'group_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
  END IF;
END$$;
