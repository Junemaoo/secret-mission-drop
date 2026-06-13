CREATE OR REPLACE FUNCTION public.draw_missions_for_player(p_player_name text, p_player_name_norm text)
 RETURNS TABLE(id uuid, sender_name text, sender_city text, task_text text, optional_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  SELECT * INTO v_existing_player FROM public.players WHERE players.player_name_norm = p_player_name_norm;
  IF v_existing_player.id IS NOT NULL AND v_existing_player.has_drawn THEN
    RAISE EXCEPTION 'already_drawn';
  END IF;

  SELECT count(*) INTO v_remaining FROM public.missions WHERE public.missions.is_drawn = false;
  IF v_remaining < 2 THEN
    RAISE EXCEPTION 'insufficient';
  END IF;

  SELECT array_agg(mm.id) INTO v_ids FROM (
    SELECT m2.id FROM public.missions m2
    WHERE m2.is_drawn = false
    ORDER BY random()
    LIMIT 2
    FOR UPDATE SKIP LOCKED
  ) mm;

  IF v_ids IS NULL OR array_length(v_ids, 1) < 2 THEN
    RAISE EXCEPTION 'insufficient';
  END IF;

  UPDATE public.missions AS m
  SET is_drawn = true, drawn_by = p_player_name
  WHERE m.id = ANY(v_ids);

  INSERT INTO public.players (player_name, player_name_norm, has_drawn)
  VALUES (p_player_name, p_player_name_norm, true)
  ON CONFLICT (player_name_norm) DO UPDATE SET has_drawn = true, player_name = EXCLUDED.player_name;

  RETURN QUERY
  SELECT m.id, m.sender_name, m.sender_city, m.task_text, m.optional_message
  FROM public.missions m
  WHERE m.id = ANY(v_ids);
END;
$function$;