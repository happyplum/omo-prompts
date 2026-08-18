# oh-my-openagent 提示词集

oh-my-openagent 的本地 prompt 仓库。这里维护角色增强 prompt 文本，负责定义规划端、执行端与中小任务端的提示词边界。

## 安装

将本目录放置于 OpenCode 配置根目录下的 `prompts/`（例如 `~/.config/opencode/prompts/`）。当前维护需要本地增强的角色，以及全局 `AGENTS.md` 的可提交源文件：

- `prometheus.md` → 大型任务的探索与规划增强
- `atlas.md` → 大型任务的可靠执行增强
- `sisyphus.md` → 小团队 Leader 的规划、调度与验收增强
- `hephaestus.md` → 单目标自主深度编码增强
- `multimodal-looker.md` → 观察、推断与歧义分离
- `momus.md` → 证据驱动、原子化与并行路线校验、可收敛复审的计划审核
- `oracle.md` → 按需只读的架构与调试顾问
- `metis.md` → 预规划意图与执行期边界分析
- `runtime/AGENTS.md` → 全局治理规则的可提交源文件
- `scripts/sync-agents.ps1` → 将 `runtime/AGENTS.md` 同步到运行时 `../AGENTS.md`

## 设计定位

- `prompts/` 是本地角色增强面，维护角色边界、职责分工、入口门禁和 handoff 契约；同时维护全局 `AGENTS.md` 的可提交源文件。
- 通用治理、task 契约和可复用规范由 `../skills/`、运行时 skills 与 `runtime/AGENTS.md` 承载；`../AGENTS.md` 是由同步脚本生成的运行时副本。
- `~/.omo/omo.jsonc` 只使用 `file://` 形式的 `prompt_append`；每个 agent 的追加内容放在同名 Markdown 文件中，便于独立回顾、审查和 Git 记录。

### 有界蜂群边界

- 默认使用最低成本且胜任的单一 owner；只有任务能独立产出、失败和验收，写入互斥、环境隔离、接口冻结且存在真实关键路径收益时，才进入 parallel wave。
- 有向依赖使用 pipeline；共享核心不变量、未冻结接口、循环依赖或整体验收使用 single-owner。高耦合工作可并行只读调查，但保持单一设计、写入和集成 owner。
- 环境或所有权检查可否决计划中的并行授权；冻结任务契约高于 reviewer 的扩展建议；可执行行为证据高于子代理自述；父协调者的集成裁决最高。
- 普通低风险任务由父协调者运行确定性验收，不自动增加 reviewer；独立 reviewer 只用于公共/数据/权限/并发/迁移/不可逆边界、运行期 oracle 薄弱或多补丁组合风险。
- Wave 是派发 epoch 而非验证屏障：当前只有计划已静态证明 workspace、所有权和各阶段资源 namespace 与所有活动 task 互斥的 task，才可在另一 task 验证期间滚动启动；反事实独立性只作规划说明，不单独授予派发权。并发预算口径为运行中写入 worker 与已完成未验收产物之和（3/4 上限），与父级单槽验收构成有意背压。
- `INTEGRATE` 是本地状态；`integration task` 由唯一 `integration owner` 在 `integration workspace` 中执行，完成后进入官方 `Final Wave`。二者共同构成唯一全局收敛阶段，但不是同一对象。
- Atlas 压缩上下文时优先结晶过时和已闭合 task 的过程记录，持续保留用户目标、核心准则、冻结契约、活动依赖、剩余预算、未闭合 blocker 与待消费证据。

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
| `prometheus.md` | 强化三类执行拓扑、并行许可门、集成 task、验收 checkpoint 与 workspace lane 契约 |
| `atlas.md` | 强化 execution-only 边界、蜂群并行派发、触发式验收节奏、父级行为验收、preflight、工作路径传递、环境修复分离、压缩保留运行准则、集成裁决与有界终态 |
| `sisyphus.md` | 强化小团队 Leader 的经济路由、调度、上下文控制与验收 |
| `hephaestus.md` | 强化单目标自主深度实现；不接管多任务协调 |
| `multimodal-looker.md` | 分离媒体中的可观察事实、推断和歧义 |
| `momus.md` | 审核计划拓扑、原子化拆分、并行路线、所有权、环境和验收；blocker 以可执行修订粒度输出 |
| `oracle.md` | 按需提供阶段适配的架构与研究方案，抑制细枝末节和投机性安全冗余 |
| `metis.md` | 规划前以有界头脑风暴分析意图；执行期在冻结契约内生成最小执行图 |
| `runtime/AGENTS.md` | 全局治理规则的可提交源文件 |
| `scripts/sync-agents.ps1` | 生成并校验运行时 `../AGENTS.md` |

## 边界

- 不在本仓库复制 `skills/` 中的完整治理规则；那是上层同级 `../skills/` 的职责。
- `runtime/AGENTS.md` 是全局治理规则的维护源；`../AGENTS.md` 只作为 OpenCode 运行时加载副本存在，不直接提交到本仓库。
- 本地 `prompt_append` 只使用 `file://` 引用；需要本地稳定增强的 agent 才配置对应 Markdown 文件，未配置的 agent 直接使用 OMO base prompt。
- 文件型 `prompt_append` 用于稳定的角色专属行为；文件不因此成为 skills 或上游 base prompt 的替代品。
- 不以 agent 覆盖率或 skill 数量作为添加 prompt 的理由；只有经审查确认的本地行为差异才新增文件。
- 若 prompt 边界变化影响根配置事实、执行模型或长期治理结论，需同步 `~/.omo/omo.jsonc`、`runtime/AGENTS.md` 中受影响的事实与相关 durable memory，并重新生成 `../AGENTS.md`；未受影响的载体不机械更新。

## 上游兼容基线

本地 append 已对照以下固定版本审查：

- Oh My OpenAgent：`code-yeongyu/oh-my-openagent@e0f90f92393a6a5f973a86d393477e4e7d86ad36`
- OpenCode：`anomalyco/opencode@550d1ffd24718454925c4636e937878f0274de48`

当前 `~/.omo/omo.jsonc` 启用 `auto_update`。上游更新后需重新核对 Prometheus/Atlas/Momus 基础 prompt、`ulw-plan`、category 路由和 `/stop-continuation`；兼容基线未更新前，不假定本地 append 仍与新契约一致。
