CREATE TABLE public.app_state (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_state TO anon, authenticated;
GRANT ALL ON public.app_state TO service_role;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no direct anon access" ON public.app_state FOR SELECT TO anon, authenticated USING (false);
INSERT INTO public.app_state(key, value) VALUES ('party_started', 'false'::jsonb);