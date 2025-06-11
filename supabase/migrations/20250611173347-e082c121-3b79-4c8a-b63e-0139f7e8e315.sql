
-- Create table for tracking AI usage and costs
CREATE TABLE public.ai_usage_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id text,
    model text NOT NULL,
    prompt_tokens integer NOT NULL DEFAULT 0,
    completion_tokens integer NOT NULL DEFAULT 0,
    total_tokens integer NOT NULL DEFAULT 0,
    estimated_cost_usd numeric(10,6) NOT NULL DEFAULT 0,
    request_type text NOT NULL DEFAULT 'chat',
    context_type text,
    client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
    response_time_ms integer,
    error_message text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own AI usage" ON public.ai_usage_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert AI usage logs" ON public.ai_usage_logs
    FOR INSERT WITH CHECK (true);

-- Admins can view all usage for cost monitoring
CREATE POLICY "Admins can view all AI usage" ON public.ai_usage_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND user_role = 'admin'
        )
    );

-- Create indexes for performance
CREATE INDEX idx_ai_usage_logs_user_id_created_at ON public.ai_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_usage_logs_model ON public.ai_usage_logs(model);

-- Create function to calculate AI costs
CREATE OR REPLACE FUNCTION public.calculate_ai_cost(
    model_name text,
    prompt_tokens integer,
    completion_tokens integer
) RETURNS numeric AS $$
DECLARE
    prompt_cost_per_1k numeric;
    completion_cost_per_1k numeric;
    total_cost numeric;
BEGIN
    -- OpenAI pricing as of 2024 (per 1K tokens)
    CASE model_name
        WHEN 'gpt-4o-mini' THEN
            prompt_cost_per_1k := 0.00015;
            completion_cost_per_1k := 0.0006;
        WHEN 'gpt-4o' THEN
            prompt_cost_per_1k := 0.005;
            completion_cost_per_1k := 0.015;
        WHEN 'gpt-4' THEN
            prompt_cost_per_1k := 0.03;
            completion_cost_per_1k := 0.06;
        ELSE
            -- Default to gpt-4o-mini pricing
            prompt_cost_per_1k := 0.00015;
            completion_cost_per_1k := 0.0006;
    END CASE;
    
    total_cost := (prompt_tokens * prompt_cost_per_1k / 1000.0) + 
                  (completion_tokens * completion_cost_per_1k / 1000.0);
    
    RETURN total_cost;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
