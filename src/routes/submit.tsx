import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { submitMission } from "@/lib/missions.functions";
import { EnvelopeCard } from "@/components/EnvelopeCard";
import { WaxSeal } from "@/components/WaxSeal";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "提交秘密任务 · Mission Box" },
      { name: "description", content: "为 mjm 的生日设计一个秘密任务，封存后将由现场朋友随机抽取并完成。" },
    ],
  }),
  component: SubmitPage,
});

function SubmitPage() {
  const submit = useServerFn(submitMission);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    sender_city: "",
    sender_name: "",
    task_text: "",
  });

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const city = form.sender_city.trim();
    const name = form.sender_name.trim();
    const task = form.task_text.trim();
    if (!city || !name || !task) {
      toast.error("请把三个字段都填写完整");
      return;
    }
    setLoading(true);
    try {
      const res = await submit({
        data: { sender_city: city, sender_name: name, task_text: task },
      });
      if (res.ok) {
        setDone(true);
      } else if (res.error === "duplicate") {
        toast.error("你已经成功封存过任务啦，请不要重复提交。");
      } else if (res.error === "full") {
        toast.error("Mission Box 已封存满 12 个任务，感谢参与！");
      }
    } catch (e) {
      toast.error("提交失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← 返回首页
          </Link>
        </div>

        <header className="text-center">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-primary/80">
            Seal Your Mission
          </p>
          <h1 className="mt-2 font-serif text-3xl">封存你的秘密任务</h1>
        </header>

        <div className="relative mt-10">
          <EnvelopeCard className="pt-10">
            <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2">
              <WaxSeal label="✉" size={64} />
            </div>

            {done ? (
              <div className="space-y-5 py-3 text-center">
                <p className="font-serif text-xl">任务已封存 ✦</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  感谢你的参与，任务已成功封存。
                  <br />
                  它将在 6.19 mjm 生日当天随机落到伦敦某个人手中。
                  <br />
                  请不要与 mjm 提前透露任何任务有关信息。
                </p>
                <Link
                  to="/"
                  className="inline-block rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground"
                >
                  回到首页
                </Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <Field label="我现所在的城市">
                  <input
                    type="text"
                    value={form.sender_city}
                    onChange={(e) => update("sender_city", e.target.value)}
                    maxLength={40}
                    required
                    placeholder="例如：伦敦 / 上海 / 纽约"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-ring"
                  />
                </Field>

                <Field label="我的名字 / 昵称 / 缩写">
                  <input
                    type="text"
                    value={form.sender_name}
                    onChange={(e) => update("sender_name", e.target.value)}
                    maxLength={40}
                    required
                    placeholder="例如：小A"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-ring"
                  />
                </Field>

                <Field label="我设计的秘密任务">
                  <textarea
                    value={form.task_text}
                    onChange={(e) => update("task_text", e.target.value)}
                    maxLength={500}
                    required
                    rows={4}
                    placeholder="例如：与3个不同的人击一次掌。"
                    className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-ring"
                  />
                  <p className="mt-1 text-right text-xs text-muted-foreground">
                    {form.task_text.length}/500
                  </p>
                </Field>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground envelope-shadow transition active:translate-y-px disabled:opacity-50"
                >
                  {loading ? "封存中…" : "封存任务 ✦"}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  提交后将无法查看或修改。每位贡献者仅可提交一次。
                </p>
              </form>
            )}
          </EnvelopeCard>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
