
-- Create a table for debug logs
CREATE TABLE public.debug_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  level TEXT NOT NULL DEFAULT 'DEBUG',
  component TEXT NOT NULL,
  function_name TEXT,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own logs
ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own logs
CREATE POLICY "Users can view their own debug logs" 
  ON public.debug_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own logs
CREATE POLICY "Users can create their own debug logs" 
  ON public.debug_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create index for better performance on queries
CREATE INDEX idx_debug_logs_user_session ON public.debug_logs (user_id, session_id, timestamp DESC);
CREATE INDEX idx_debug_logs_timestamp ON public.debug_logs (timestamp DESC);
