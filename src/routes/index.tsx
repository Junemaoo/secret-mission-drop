import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { getHomeStatus, startParty } from "@/lib/missions.functions";
import { EnvelopeCard } from "@/components/EnvelopeCard";
import { DevTools } from "@/components/DevTools";

const TOTAL = 12;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "mjm23岁生日特供之 秘密任务抽取箱" },
      {
        name: "description",
        content: "Mission Box — 为 mjm 的 23 岁生日准备的秘密任务抽取箱，由远方朋友提交任务，现场朋友随机抽取并秘密完成。",
      },
      { property: "og:title", content: "mjm23岁生日特供之 秘密任务抽取箱" },
      { property: "og:description", content: "封存属于你的秘密任务，6.19 在伦敦落到某人手中。" },
    ],
  }),
  component: HomePage,
});

const statusQuery = (fetcher: () => Promise<{ total: number; remaining: number; party_started: boolean }>) =>
  queryOptions({
    queryKey: ["home-status"],
    queryFn: fetcher,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });

function HomePage() {
  const fetchStatus = useServerFn(getHomeStatus);
  const beginParty = useServerFn(startParty);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(statusQuery(() => fetchStatus()));

  const total = data?.total ?? 0;
  const remaining = data?.remaining ?? 0;
  const partyStarted = data?.party_started ?? false;
  const ready = total >= TOTAL;
  const allDrawn = partyStarted && remaining === 0;

  const displayLabel = partyStarted ? "剩余待抽取任务" : "已收到任务";
  const displayValue = partyStarted ? remaining : total;

  async function handleEnterParty() {
    if (!partyStarted) {
      await beginParty();
      qc.invalidateQueries({ queryKey: ["home-status"] });
    }
    navigate({ to: "/draw" });
  }

  return (
    <main className="min-h-dvh px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <header className="text-center">
          <p className="font-serif text-sm uppercase tracking-[0.3em] text-primary/80">
            Mission Box
          </p>
          <h1 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
            mjm23岁生日特供
            <br />
            <span className="italic">之 秘密任务抽取箱</span>
          </h1>
        </header>

        <div className="relative mt-10">
          <EnvelopeCard className="pt-10">
            <div className="text-center">
              {allDrawn ? (
                <div className="space-y-3 py-4">
                  <p className="font-serif text-2xl text-primary">所有任务已被抽取完毕</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    请大家保存截图，
                    <br />
                    并在线下最终揭晓。
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {displayLabel}
                  </p>
                  <div className="mt-2 flex items-end justify-center gap-1 font-serif">
                    <span className="text-6xl text-primary">
                      {isLoading ? "·" : displayValue}
                    </span>
                    <span className="pb-2 text-2xl text-muted-foreground">/ {TOTAL}</span>
                  </div>

                  <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, (displayValue / TOTAL) * 100)}%` }}
                    />
                  </div>
                </>
              )}

              <div className="mt-7 space-y-3">
                {ready ? (
                  <div
                    aria-disabled
                    className="block w-full cursor-not-allowed rounded-xl border-2 border-dashed border-border bg-muted/50 px-5 py-3 text-center font-medium text-muted-foreground"
                  >
                    任务已封存
                  </div>
                ) : (
                  <Link
                    to="/submit"
                    className="block w-full rounded-xl bg-primary px-5 py-3 text-center font-medium text-primary-foreground envelope-shadow transition active:translate-y-px"
                  >
                    提交任务
                  </Link>
                )}

                {ready && !allDrawn ? (
                  <button
                    type="button"
                    onClick={handleEnterParty}
                    className="block w-full rounded-xl border-2 border-primary bg-accent px-5 py-3 text-center font-medium text-accent-foreground transition active:translate-y-px"
                  >
                    {partyStarted ? "继续抽取我的任务 ✦" : "进入派对 ✦ 抽取我的任务"}
                  </button>
                ) : !ready ? (
                  <div
                    aria-disabled
                    className="block w-full cursor-not-allowed rounded-xl border-2 border-dashed border-border bg-muted/50 px-5 py-3 text-center font-medium text-muted-foreground"
                  >
                    进入派对（尚未开启）
                  </div>
                ) : null}
              </div>
            </div>
          </EnvelopeCard>

          {ready ? (
            <p className="mt-5 text-center text-sm text-muted-foreground">
              任务已封存完成。
              <br />
              感谢所有远方朋友的参与。
              <br />
              请等待 6.19 生日当天开启派对。
            </p>
          ) : (
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Mission Box 尚未封存完成
              <br />
              当前已封存任务数：<span className="text-foreground">{total} / {TOTAL}</span>
            </p>
          )}
        </div>

        <footer className="mt-12 text-center text-xs text-muted-foreground/70">
          {"\n"}
        </footer>
      </div>

      <DevTools />
    </main>
  );
}
