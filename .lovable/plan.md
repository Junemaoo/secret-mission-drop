# mjm23岁生日特供之 秘密任务抽取箱

移动优先的网页应用：远方朋友提前提交秘密任务，现场玩家当天随机抽取并线下完成。

## 技术栈

- TanStack Start + Tailwind
- Lovable Cloud（Supabase）持久化 + 数据库层唯一约束
- 抽取逻辑放在 server function，使用 service role 原子操作

## 数据库（migration）

**missions**
- `id` uuid PK
- `sender_name` text not null（原始展示用）
- `sender_city` text not null（原始展示用）
- `sender_name_norm` text not null — `lower(trim(sender_name))`
- `sender_city_norm` text not null — `lower(trim(sender_city))`
- `task_text` text not null
- `optional_message` text
- `is_drawn` boolean default false
- `drawn_by` text
- `created_at` timestamptz default now()
- **UNIQUE (sender_name_norm, sender_city_norm)** — 数据库层防重复提交

**players**
- `id` uuid PK
- `player_name` text not null（原始展示用）
- `player_name_norm` text not null **UNIQUE**
- `has_drawn` boolean default false
- `created_at` timestamptz default now()

RLS 启用；所有写操作通过 server function + `supabaseAdmin` 执行；前端只读 mission 计数。GRANT 按规范写齐。

## 归一化规则（前后端一致）

`normalize(s) = s.trim().replace(/\s+/g, " ").toLowerCase()`

- 提交：`sender_name_norm` / `sender_city_norm` 入库前归一化；展示字段保留原始 trim 后值
- 抽取：`player_name_norm` 用于唯一判断；展示沿用原始 trim 值
- 同样的 normalize 函数在 server function 中调用（不依赖前端）

## Server Functions（`src/lib/missions.functions.ts`）

1. `getMissionCount()`
2. `submitMission({ sender_name, sender_city, task_text, optional_message? })`
   - Zod 校验 + trim + 长度限制
   - 已达 12 条 → `error: "full"`
   - 唯一冲突 → `error: "duplicate"`
3. `drawMissions({ player_name })`
   - 归一化后校验
   - count != 12 → `error: "not_ready"`
   - 已存在且 `has_drawn=true` → `error: "already_drawn"`
   - 原子选取 2 条 `is_drawn=false` 任务并标记 + upsert players
   - 剩余 < 2 → `error: "insufficient"`
4. `devSeedMissions()` — 生成 12 条假数据（需校验开发口令，见下）
5. `devClearAll()` — 清空两张表（需校验开发口令）

### 开发口令保护

- 新增 secret：`DEV_TOOLS_PASSWORD`（通过 add_secret 让用户设置）
- `devSeedMissions` / `devClearAll` 的 input 包含 `password` 字段，在 handler 内对比 `process.env.DEV_TOOLS_PASSWORD`，不匹配返回 401
- 前端首页底部放一个不显眼的小入口（如页脚一个小齿轮图标），点击弹出密码输入框；通过后才显示「生成12个测试任务」「清空所有数据」按钮
- 密码会话只存于内存（useState），刷新即失效；正式发布前可移除该入口或直接清空 secret 即失效

## 路由

- `/` 首页
- `/submit` 提交任务页
- `/draw` 派对抽取页

## 页面实现

### `/` 首页
- 顶部小标题 "Mission Box"
- 主标题 "mjm23岁生日特供之 秘密任务抽取箱"
- 中央信封/礼盒卡片显示 `X / 12`
- 「提交任务」「进入派对」按钮
- count < 12 时「进入派对」disabled + 提示 `Mission Box 尚未封存完成 / 当前已封存任务数：X / 12`
- 页脚小齿轮 → 开发口令 → 显示 Dev Tools

### `/submit`
- 字段：城市、昵称、任务（必填），可选留言
- 「封存任务」
- 成功 → 成功卡片 + 文案 + 返回首页
- 错误对应提示（duplicate / full）

### `/draw`
- 昵称输入 + 「抽取我的任务」
- 成功 → 两张任务卡片（信封打开效果）+ Hello 文案 + 拍照提示
- 「我已完成拍照」回首页
- 错误：already_drawn / insufficient / not_ready

## 设计

风格：Birthday / Warm / Playful / Secret Mission Box
- 暖奶油底 #FFF6E5、酒红 #B23A48、金色封蜡 #D4A24C、墨绿 #2F5D50
- 标题衬线（Fraunces / Instrument Serif），正文 Manrope
- 信封、封蜡印章、虚线撕边、纸质感
- 移动优先；最大宽度 420px 居中；色板/字体写入 `src/styles.css` 作为语义 token

## 文件清单

- supabase migration
- `src/lib/missions.functions.ts`、`src/lib/normalize.ts`
- `src/routes/index.tsx`（替换 placeholder）
- `src/routes/submit.tsx`
- `src/routes/draw.tsx`
- `src/components/EnvelopeCard.tsx`、`WaxSeal.tsx`、`DevTools.tsx`
- 更新 `src/styles.css`
- secret `DEV_TOOLS_PASSWORD`

## 不包含

登录、Reveal 页、排行榜、积分、分享、支付、用户系统、社交。

---

确认后顺序：启用 Lovable Cloud → 建表 → 请求 `DEV_TOOLS_PASSWORD` → 实现 server functions 与页面。
