# oh-my-opencode 提示词集

oh-my-opencode 的本地 prompt 仓库。这里维护主代理使用的角色增强 prompt 文本，负责定义规划端、执行端与中小任务端的提示词边界。

## 安装

将本目录放置于 OpenCode 配置根目录下的 `prompts/`（例如 `~/.config/opencode/prompts/`）。当前包含：

- `prometheus.md` → 大型任务的探索与规划增强
- `atlas.md` → 大型任务的可靠执行增强
- `sisyphus.md` → 中小型任务的独立执行增强

## 设计定位

- `prompts/` 是**主代理提示词面**：维护角色边界、职责分工与高层行为约束。
- 详细的治理规则、术语、硬门禁与可复用规范，仍由上层同级的 `../skills/` 提供。
- prompt 负责最小而稳定的角色增强；不在这里堆叠本应属于 skills 或 durable memory 的长篇治理细则。

## 文件列表

| 文件 | 作用 |
|------|------|
| `prometheus.md` | 强化大型任务的探索、提问、计划 authoring 与 execution-ready handoff |
| `atlas.md` | 强化大型任务执行、预加载链门禁、execution-only 边界与 stop-and-repair 行为 |
| `sisyphus.md` | 强化中小型任务执行、reviewed/imported plan 消费前规范化与 TODO 展开 |

## 边界

- 不在本仓库复制 `skills/` 中的完整治理规则；那是上层同级 `../skills/` 的职责。
- 不把 prompt 当作可替代 skill 的规范来源；prompt 负责角色增强，skill 负责规则沉淀。
- 若 prompt 边界变化影响根配置事实、执行模型或长期治理结论，需同步根 `README.md` 与相关 durable memory。
