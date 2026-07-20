# oh-my-opencode 提示词集

oh-my-opencode 的本地 prompt 仓库。这里维护角色增强 prompt 文本，负责定义规划端、执行端与中小任务端的提示词边界。

## 安装

将本目录放置于 OpenCode 配置根目录下的 `prompts/`（例如 `~/.config/opencode/prompts/`）。当前维护需要本地增强的角色，以及全局 `AGENTS.md` 的可提交源文件：

- `prometheus.md` → 大型任务的探索与规划增强
- `atlas.md` → 大型任务的可靠执行增强
- `sisyphus.md` → 小团队 Leader 的规划、调度与验收增强
- `hephaestus.md` → 单目标自主深度编码增强
- `multimodal-looker.md` → 观察、推断与歧义分离
- `runtime/AGENTS.md` → 全局治理规则的可提交源文件
- `scripts/sync-agents.ps1` → 将 `runtime/AGENTS.md` 同步到运行时 `../AGENTS.md`

## 设计定位

- `prompts/` 是本地角色增强面，维护角色边界、职责分工、入口门禁和 handoff 契约；同时维护全局 `AGENTS.md` 的可提交源文件。
- 通用治理、task 契约和可复用规范由 `../skills/`、运行时 skills 与 `runtime/AGENTS.md` 承载；`../AGENTS.md` 是由同步脚本生成的运行时副本。
- `oh-my-openagent.jsonc` 只使用 `file://` 形式的 `prompt_append`；每个 agent 的追加内容放在同名 Markdown 文件中，便于独立回顾、审查和 Git 记录。

## 全局 AGENTS 同步

修改全局治理规则时，先编辑 `runtime/AGENTS.md`，再运行同步脚本生成 OpenCode 实际加载的 `../AGENTS.md`：

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-agents.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-agents.ps1 -Check
```

同步脚本使用逐字复制，不添加 header、不创建 symlink；`-Check` 使用 SHA256 校验源文件与运行时文件完全一致。运行中的 OpenCode 会话已加载旧 instruction，规则变更后需要重启会话才会完整生效。

## 文件列表

| 文件 | 作用 |
|------|------|
| `prometheus.md` | 强化中大型任务的精细规划、依赖、验证与 Atlas handoff |
| `atlas.md` | 强化 execution-only 边界、计划缺口停止、证据核验与 commit-governance |
| `sisyphus.md` | 强化小团队 Leader 的经济路由、调度、上下文控制与验收 |
| `hephaestus.md` | 强化单目标自主深度实现；不接管多任务协调 |
| `multimodal-looker.md` | 分离媒体中的可观察事实、推断和歧义 |
| `runtime/AGENTS.md` | 全局治理规则的可提交源文件 |
| `scripts/sync-agents.ps1` | 生成并校验运行时 `../AGENTS.md` |

## 边界

- 不在本仓库复制 `skills/` 中的完整治理规则；那是上层同级 `../skills/` 的职责。
- `runtime/AGENTS.md` 是全局治理规则的维护源；`../AGENTS.md` 只作为 OpenCode 运行时加载副本存在，不直接提交到本仓库。
- 本地 `prompt_append` 只使用 `file://` 引用；需要本地稳定增强的 agent 才配置对应 Markdown 文件，未配置的 agent 直接使用 OMO base prompt。
- 文件型 `prompt_append` 用于稳定的角色专属行为；文件不因此成为 skills 或上游 base prompt 的替代品。
- 不以 agent 覆盖率或 skill 数量作为添加 prompt 的理由；只有经审查确认的本地行为差异才新增文件。
- 若 prompt 边界变化影响根配置事实、执行模型或长期治理结论，需同步 `../oh-my-openagent.jsonc`、`runtime/AGENTS.md` 中受影响的事实与相关 durable memory，并重新生成 `../AGENTS.md`；未受影响的载体不机械更新。
