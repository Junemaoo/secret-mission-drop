import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { getMissionCount } from "@/lib/missions.functions";
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

const countQuery = (fetcher: () => Promise<{ count: number }>) =>
  queryOptions({
    queryKey: ["mission-count"],
    queryFn: fetcher,
    refetchOnWindowFocus: true,
  });

function HomePage() {
  const fetchCount = useServerFn(getMissionCount);
  const { data, isLoading } = useQuery(countQuery(() => fetchCount()));
  const count = data?.count ?? 0;
  const ready = count >= TOTAL;

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
          <p className="mt-3 text-sm text-muted-foreground">
            {"\n"}
          </p>
        </header>

        <div className="relative mt-10">
          <EnvelopeCard className="pt-10">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                已收到任务
              </p>
              <div className="mt-2 flex items-end justify-center gap-1 font-serif">
                <span className="text-6xl text-primary">
                  {isLoading ? "·" : count}
                </span>
                <span className="pb-2 text-2xl text-muted-foreground">/ {TOTAL}</span>
              </div>

              <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, (count / TOTAL) * 100)}%` }}
                />
              </div>

              <div className="mt-7 space-y-3">
                <Link
                  to="/submit"
                  className="block w-full rounded-xl bg-primary px-5 py-3 text-center font-medium text-primary-foreground envelope-shadow transition active:translate-y-px"
                >
                  提交任务
                </Link>

                {ready ? (
                  <Link
                    to="/draw"
                    className="block w-full rounded-xl border-2 border-primary bg-accent px-5 py-3 text-center font-medium text-accent-foreground transition active:translate-y-px"
                  >
                    进入派对 ✦ 抽取我的任务
                  </Link>
                ) : (
                  <div
                    aria-disabled
                    className="block w-full cursor-not-allowed rounded-xl border-2 border-dashed border-border bg-muted/50 px-5 py-3 text-center font-medium text-muted-foreground"
                  >
                    进入派对（尚未开启）
                  </div>
                )}
              </div>
            </div>
          </EnvelopeCard>

          {!ready && (
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Mission Box 尚未封存完成
              <br />
              当前已封存任务数：<span className="text-foreground">{count} / {TOTAL}</span>
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
