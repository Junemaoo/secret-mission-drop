
-- Replace get_mission_count function with a safe view
DROP FUNCTION IF EXISTS public.get_mission_count();

CREATE OR REPLACE VIEW public.mission_count AS
SELECT count(*)::int AS count FROM public.missions;

-- Views inherit invoker's privileges by default in PG15+, but we want it to bypass RLS.
ALTER VIEW public.mission_count SET (security_invoker = false);

GRANT SELECT ON public.mission_count TO anon, authenticated;

-- Explicitly revoke draw function from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.draw_missions_for_player(text, text) FROM anon, authenticated, PUBLIC;
