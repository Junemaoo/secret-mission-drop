import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normalize } from "./normalize";

const submitInput = z.object({
  sender_name: z.string().trim().min(1).max(40),
  sender_city: z.string().trim().min(1).max(40),
  task_text: z.string().trim().min(1).max(500),
  optional_message: z.string().trim().max(500).optional(),
});

const drawInput = z.object({
  player_name: z.string().trim().min(1).max(40),
});

const devInput = z.object({
  password: z.string().min(1),
});

export const getMissionCount = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("missions")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return { count: count ?? 0 };
});

export const submitMission = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check capacity
    const { count } = await supabaseAdmin
      .from("missions")
      .select("*", { count: "exact", head: true });
    if ((count ?? 0) >= 12) {
      return { ok: false as const, error: "full" as const };
    }

    const sender_name = data.sender_name.trim();
    const sender_city = data.sender_city.trim();
    const sender_name_norm = normalize(sender_name);
    const sender_city_norm = normalize(sender_city);

    const { error } = await supabaseAdmin.from("missions").insert({
      sender_name,
      sender_city,
      sender_name_norm,
      sender_city_norm,
      task_text: data.task_text.trim(),
      optional_message: data.optional_message?.trim() || null,
    });

    if (error) {
      if (error.code === "23505") {
        return { ok: false as const, error: "duplicate" as const };
      }
      throw new Error(error.message);
    }

    return { ok: true as const };
  });

export const drawMissions = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => drawInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const player_name = data.player_name.trim();
    const player_name_norm = normalize(player_name);

    const { data: result, error } = await supabaseAdmin.rpc("draw_missions_for_player", {
      p_player_name: player_name,
      p_player_name_norm: player_name_norm,
    });

    if (error) {
      const msg = error.message || "";
      if (msg.includes("not_ready")) return { ok: false as const, error: "not_ready" as const };
      if (msg.includes("already_drawn")) return { ok: false as const, error: "already_drawn" as const };
      if (msg.includes("insufficient")) return { ok: false as const, error: "insufficient" as const };
      throw new Error(msg);
    }

    return {
      ok: true as const,
      player_name,
      missions: (result ?? []) as Array<{
        id: string;
        sender_name: string;
        sender_city: string;
        task_text: string;
        optional_message: string | null;
      }>,
    };
  });

// ---------- Dev tools (password protected) ----------

function checkDevPassword(password: string) {
  const expected = process.env.DEV_TOOLS_PASSWORD;
  if (!expected) throw new Error("dev_tools_disabled");
  if (password !== expected) throw new Error("bad_password");
}

export const verifyDevPassword = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => devInput.parse(data))
  .handler(async ({ data }) => {
    try {
      checkDevPassword(data.password);
      return { ok: true as const };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "bad_password";
      return { ok: false as const, error: msg };
    }
  });

const SAMPLE_TASKS = [
  { sender_name: "小A", sender_city: "北京", task_text: "找一个穿红色衣服的人合影" },
  { sender_name: "小B", sender_city: "上海", task_text: "用三种语言说生日快乐" },
  { sender_name: "小C", sender_city: "广州", task_text: "悄悄送mjm一杯她最喜欢的饮料" },
  { sender_name: "小D", sender_city: "深圳", task_text: "在现场表演一个10秒小才艺" },
  { sender_name: "小E", sender_city: "杭州", task_text: "用最浮夸的方式唱一句生日歌" },
  { sender_name: "小F", sender_city: "成都", task_text: "找到一个和你同月生日的人" },
  { sender_name: "小G", sender_city: "纽约", task_text: "假装是采访者采访mjm一个搞笑问题" },
  { sender_name: "小H", sender_city: "东京", task_text: "和3个不同的人各击一次掌" },
  { sender_name: "小I", sender_city: "巴黎", task_text: "用照片记录一个最有趣的瞬间" },
  { sender_name: "小J", sender_city: "悉尼", task_text: "悄悄给mjm写一张匿名小纸条" },
  { sender_name: "小K", sender_city: "柏林", task_text: "在不被发现的情况下学一次mjm的口头禅" },
  { sender_name: "小L", sender_city: "首尔", task_text: "向陌生人介绍今天是mjm的生日" },
];

export const devSeedMissions = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => devInput.parse(data))
  .handler(async ({ data }) => {
    checkDevPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("missions").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const rows = SAMPLE_TASKS.map((t) => ({
      sender_name: t.sender_name,
      sender_city: t.sender_city,
      sender_name_norm: normalize(t.sender_name),
      sender_city_norm: normalize(t.sender_city),
      task_text: t.task_text,
      optional_message: null,
    }));

    const { error } = await supabaseAdmin.from("missions").insert(rows);
    if (error) throw new Error(error.message);
    return { ok: true as const, inserted: rows.length };
  });

export const devClearAll = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => devInput.parse(data))
  .handler(async ({ data }) => {
    checkDevPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("missions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("players").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    return { ok: true as const };
  });
