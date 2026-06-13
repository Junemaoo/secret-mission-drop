import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Settings } from "lucide-react";
import {
  verifyDevPassword,
  devSeedMissions,
  devClearAll,
} from "@/lib/missions.functions";

export function DevTools() {
  const [open, setOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = useServerFn(verifyDevPassword);
  const seed = useServerFn(devSeedMissions);
  const clear = useServerFn(devClearAll);
  const qc = useQueryClient();

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await verify({ data: { password } });
    setLoading(false);
    if (res.ok) {
      setUnlocked(true);
      toast.success("已解锁开发工具");
    } else {
      toast.error("密码错误");
    }
  }

  async function handleSeed() {
    setLoading(true);
    try {
      await seed({ data: { password } });
      qc.invalidateQueries({ queryKey: ["home-status"] });
      toast.success("已生成 12 条测试任务");
    } catch (e) {
      toast.error("生成失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    if (!confirm("确认清空所有任务和玩家数据？")) return;
    setLoading(true);
    try {
      await clear({ data: { password } });
      qc.invalidateQueries({ queryKey: ["home-status"] });
      toast.success("已清空所有数据");
    } catch (e) {
      toast.error("清空失败");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        aria-label="开发工具"
        onClick={() => setOpen(true)}
        className="fixed bottom-3 right-3 z-50 rounded-full bg-muted/60 p-2 text-muted-foreground/60 backdrop-blur transition hover:bg-muted hover:text-foreground"
      >
        <Settings className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-3 right-3 z-50 w-72 rounded-2xl border border-border bg-card p-4 envelope-shadow">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-serif text-sm">Dev Tools</div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setUnlocked(false);
            setPassword("");
          }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          关闭
        </button>
      </div>

      {!unlocked ? (
        <form onSubmit={handleUnlock} className="space-y-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="开发密码"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            解锁
          </button>
        </form>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleSeed}
            className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            生成12个测试任务
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleClear}
            className="w-full rounded-lg border border-destructive bg-background px-3 py-2 text-sm font-medium text-destructive disabled:opacity-50"
          >
            清空所有数据
          </button>
          <p className="pt-1 text-[10px] text-muted-foreground">
            仅开发用。正式发布前请清除 DEV_TOOLS_PASSWORD。
          </p>
        </div>
      )}
    </div>
  );
}
