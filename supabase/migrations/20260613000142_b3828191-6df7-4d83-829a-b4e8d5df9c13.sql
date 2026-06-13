
-- missions table
CREATE TABLE public.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name text NOT NULL,
  sender_city text NOT NULL,
  sender_name_norm text NOT NULL,
  sender_city_norm text NOT NULL,
  task_text text NOT NULL,
  optional_message text,
  is_drawn boolean NOT NULL DEFAULT false,
  drawn_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT missions_unique_sender UNIQUE (sender_name_norm, sender_city_norm)
);

GRANT SELECT ON public.missions TO anon;
GRANT SELECT ON public.missions TO authenticated;
GRANT ALL ON public.missions TO service_role;

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- Public can only see counts/aggregates via SELECT on count; we restrict columns at app level by only using server fns.
-- To prevent leaking task contents to anon, deny direct row select via policy that returns no rows.
CREATE POLICY "no direct anon select rows" ON public.missions
  FOR SELECT TO anon, authenticated
  USING (false);

-- service_role bypasses RLS, so server functions can read everything.

-- players table
CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  player_name_norm text NOT NULL UNIQUE,
  has_drawn boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.players TO anon;
GRANT SELECT ON public.players TO authenticated;
GRANT ALL ON public.players TO service_role;

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no direct anon select players" ON public.players
  FOR SELECT TO anon, authenticated
  USING (false);

-- A SECURITY DEFINER function to expose only the mission count to the public
CREATE OR REPLACE FUNCTION public.get_mission_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int FROM public.missions;
$$;

GRANT EXECUTE ON FUNCTION public.get_mission_count() TO anon, authenticated;

-- Atomic draw function: marks 2 random undrawn missions for the player, upserts player as drawn
CREATE OR REPLACE FUNCTION public.draw_missions_for_player(
  p_player_name text,
  p_player_name_norm text
)
RETURNS TABLE (
  id uuid,
  sender_name text,
  sender_city text,
  task_text text,
  optional_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_remaining int;
  v_existing_player public.players;
  v_ids uuid[];
BEGIN
  SELECT count(*) INTO v_total FROM public.missions;
  IF v_total < 12 THEN
    RAISE EXCEPTION 'not_ready';
  END IF;

  SELECT * INTO v_existing_player FROM public.players WHERE player_name_norm = p_player_name_norm;
  IF v_existing_player.id IS NOT NULL AND v_existing_player.has_drawn THEN
    RAISE EXCEPTION 'already_drawn';
  END IF;

  SELECT count(*) INTO v_remaining FROM public.missions WHERE is_drawn = false;
  IF v_remaining < 2 THEN
    RAISE EXCEPTION 'insufficient';
  END IF;

  -- Pick 2 random undrawn missions with row lock
  SELECT array_agg(m.id) INTO v_ids FROM (
    SELECT id FROM public.missions
    WHERE is_drawn = false
    ORDER BY random()
    LIMIT 2
    FOR UPDATE SKIP LOCKED
  ) m;

  IF v_ids IS NULL OR array_length(v_ids, 1) < 2 THEN
    RAISE EXCEPTION 'insufficient';
  END IF;

  UPDATE public.missions
  SET is_drawn = true, drawn_by = p_player_name
  WHERE id = ANY(v_ids);

  INSERT INTO public.players (player_name, player_name_norm, has_drawn)
  VALUES (p_player_name, p_player_name_norm, true)
  ON CONFLICT (player_name_norm) DO UPDATE SET has_drawn = true, player_name = EXCLUDED.player_name;

  RETURN QUERY
  SELECT m.id, m.sender_name, m.sender_city, m.task_text, m.optional_message
  FROM public.missions m
  WHERE m.id = ANY(v_ids);
END;
$$;

-- Only callable via server (service_role). Don't grant to anon/authenticated.
REVOKE ALL ON FUNCTION public.draw_missions_for_player(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.draw_missions_for_player(text, text) TO service_role;
