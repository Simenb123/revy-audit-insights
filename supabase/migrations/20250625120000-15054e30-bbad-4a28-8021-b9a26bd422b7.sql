-- Create table for edge function logs
CREATE TABLE public.edge_function_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    level text NOT NULL,
    session_id text,
    message text NOT NULL,
    data jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.edge_function_logs ENABLE ROW LEVEL SECURITY;

-- Allow system inserts
CREATE POLICY "System can insert edge function logs" ON public.edge_function_logs
    FOR INSERT WITH CHECK (true);

CREATE INDEX idx_edge_function_logs_created_at ON public.edge_function_logs(created_at DESC);
