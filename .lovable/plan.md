## 计划

### 1. 设置开发工具密码
- 添加运行时 secret `DEV_TOOLS_PASSWORD`，供 `src/lib/missions.functions.ts` 中的 `checkDevPassword` 读取。
- 用户指定的密码：`woshiyigemima`

### 2. 删除首页红色蜂蜡印章
- 从 `src/routes/index.tsx` 中：
  - 删除 `import { WaxSeal } from "@/components/WaxSeal";`
  - 删除 `EnvelopeCard` 内部的 `<WaxSeal label="MB" />` 元素（含外层 absolute 定位 div）

这两项修改彼此独立，可直接执行。