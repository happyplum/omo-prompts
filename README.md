# oh-my-opencode 提示词集

oh-my-opencode 的本地 prompt 仓库。这里维护主代理使用的角色增强 prompt 文本，负责定义规划端、执行端与中小任务端的提示词边界。

## 安装

将本目录放置于 OpenCode 配置根目录下的 `prompts/`（例如 `~/.config/opencode/prompts/`）。当前只维护需要本地增强的角色：

- `prometheus.md` → 大型任务的探索与规划增强
- `atlas.md` → 大型任务的可靠执行增强
- `sisyphus.md` → 小团队 Leader 的规划、调度与验收增强
- `hephaestus.md` → 单目标自主深度编码增强
- `multimodal-looker.md` → 观察、推断与歧义分离

## 设计定位

- `prompts/` 是主代理的角色增强面，只维护角色边界、职责分工、入口门禁和 handoff 契约。
- 通用治理、task 契约和可复用规范由 `../skills/`、运行时 skills 与 `../AGENTS.md` 承载；prompt 仅保留无法由这些权威源替代的角色专属行为。
- `oh-my-openagent.jsonc` 只使用 `file://` 形式的 `prompt_append`；每个 agent 的追加内容放在同名 Markdown 文件中，便于独立回顾、审查和 Git 记录。

## 文件列表

| 文件 | 作用 |
|------|------|
| `prometheus.md` | 强化中大型任务的精细规划、依赖、验证与 Atlas handoff |
| `atlas.md` | 强化 execution-only 边界、计划缺口停止、证据核验与 commit-governance |
| `sisyphus.md` | 强化小团队 Leader 的经济路由、调度、上下文控制与验收 |
| `hephaestus.md` | 强化单一目标的自主探索、实现、验证与 QA；不接管多任务协调 |
| `multimodal-looker.md` | 分离媒体中的可观察事实、推断和歧义 |

## 边界

- 不在本仓库复制 `skills/` 中的完整治理规则；那是上层同级 `../skills/` 的职责。
- 本地 `prompt_append` 只使用 `file://` 引用；需要本地稳定增强的 agent 才配置对应 Markdown 文件，未配置的 agent 直接使用 OMO base prompt。
- 文件型 `prompt_append` 用于稳定的角色专属行为；文件不因此成为 skills 或上游 base prompt 的替代品。
- 不以 agent 覆盖率或 skill 数量作为添加 prompt 的理由；只有经审查确认的本地行为差异才新增文件。
- 若 prompt 边界变化影响根配置事实、执行模型或长期治理结论，需同步 `../oh-my-openagent.jsonc`、`../AGENTS.md` 中受影响的事实与相关 durable memory；未受影响的载体不机械更新。
