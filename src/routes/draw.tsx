import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { drawMissions } from "@/lib/missions.functions";
import { EnvelopeCard } from "@/components/EnvelopeCard";
import { WaxSeal } from "@/components/WaxSeal";

export const Route = createFileRoute("/draw")({
  head: () => ({
    meta: [
      { title: "派对抽取 · Mission Box" },
      { name: "description", content: "在 mjm 23 岁生日派对现场，输入你的昵称随机抽取两个秘密任务。" },
    ],
  }),
  component: DrawPage,
});

type DrawnMission = {
  id: string;
  sender_name: string;
  sender_city: string;
  task_text: string;
  optional_message: string | null;
};

function DrawPage() {
  const draw = useServerFn(drawMissions);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ player: string; missions: DrawnMission[] } | null>(null);

  async function onDraw(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("请填写昵称");
      return;
    }
    setLoading(true);
    try {
      const res = await draw({ data: { player_name: trimmed } });
      if (res.ok) {
        setResult({ player: res.player_name, missions: res.missions });
      } else if (res.error === "already_drawn") {
        toast.error("你已经抽取过任务啦，请不要重复抽取。");
      } else if (res.error === "not_ready") {
        toast.error("Mission Box 尚未封存满 12 个任务");
      } else if (res.error === "insufficient") {
        toast.error("任务数量不足");
      }
    } catch (e) {
      toast.error("抽取失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        {!result && (
          <div className="mb-6">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← 返回首页
            </Link>
          </div>
        )}

        {!result ? (
          <>
            <header className="text-center">
              <p className="font-serif text-xs uppercase tracking-[0.3em] text-primary/80">
                Draw Your Mission
              </p>
              <h1 className="mt-2 font-serif text-3xl">抽取你的秘密任务</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                每人只能抽一次 · 每次抽取 2 个任务
              </p>
            </header>

            <div className="relative mt-10">
              <EnvelopeCard className="pt-10">
                <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2">
                  <WaxSeal label="?" size={64} />
                </div>

                <form onSubmit={onDraw} className="space-y-5">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium">填写你的昵称</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={40}
                      required
                      placeholder="例如：mjm 的好朋友 XX"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-ring"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground envelope-shadow transition active:translate-y-px disabled:opacity-50"
                  >
                    {loading ? "正在抽取…" : "抽取我的任务 ✦"}
                  </button>
                </form>
              </EnvelopeCard>
            </div>
          </>
        ) : (
          <ResultView
            player={result.player}
            missions={result.missions}
            onDone={() => navigate({ to: "/" })}
          />
        )}
      </div>
    </main>
  );
}

function ResultView({
  player,
  missions,
  onDone,
}: {
  player: string;
  missions: DrawnMission[];
  onDone: () => void;
}) {
  return (
    <div className="space-y-6">
      <header className="text-center">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-primary/80">
          Your Missions
        </p>
        <h1 className="mt-2 font-serif text-2xl">
          Hello 你好呀，<span className="italic text-primary">{player}</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">以下是你抽取的两个任务：</p>
      </header>

      <div className="space-y-5">
        {missions.map((m, i) => (
          <EnvelopeCard key={m.id} tilt={i === 0 ? -1 : 1} className="pt-8">
            <div className="pointer-events-none absolute -top-4 right-5">
              <WaxSeal label={`#${i + 1}`} size={48} />
            </div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              任务 {i + 1}
            </p>
            <p className="mt-3 font-serif text-base leading-relaxed">
              我是来自{" "}
              <span className="rounded bg-accent/40 px-1.5 py-0.5 font-medium text-accent-foreground">
                {m.sender_city}
              </span>{" "}
              的{" "}
              <span className="rounded bg-accent/40 px-1.5 py-0.5 font-medium text-accent-foreground">
                {m.sender_name}
              </span>
            </p>
            <p className="mt-3 font-serif text-lg leading-relaxed text-foreground">
              我设计的秘密任务是：
              <br />
              <span className="text-primary">{m.task_text}</span>
            </p>
            {m.optional_message && (
              <p className="mt-3 text-sm italic text-muted-foreground">
                "{m.optional_message}"
              </p>
            )}
          </EnvelopeCard>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-accent/20 p-4 text-sm">
        <p className="font-serif text-base text-foreground">祝你玩得开心！</p>
        <ul className="mt-2 space-y-1.5 text-muted-foreground">
          <li>· 请现在拍照保存至你的手机相册。</li>
          <li>· 不要让其他人看到 / 知道你的任务。</li>
          <li>· 请尝试在聚会结束前在不被猜到的条件下完成。</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="w-full rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground envelope-shadow transition active:translate-y-px"
      >
        我已完成拍照 ✦
      </button>
    </div>
  );
}
