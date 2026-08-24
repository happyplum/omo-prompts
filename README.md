# oh-my-openagent 提示词集

oh-my-openagent 的本地 prompt 仓库。这里维护角色增强 prompt 文本，负责定义规划端、执行端与中小任务端的提示词边界。

## 安装

将本目录放置于 OpenCode 配置根目录下的 `prompts/`（例如 `~/.config/opencode/prompts/`）。当前维护需要本地增强的角色，以及全局 `AGENTS.md` 的可提交源文件：

- `prometheus.md` → 大型任务的探索与规划增强
- `atlas.md` → 大型任务的可靠执行增强
- `sisyphus.md` → 小团队 Leader 的蜂群滑动并发、经济路由与排水点验收增强
- `hephaestus.md` → 单目标自主深度编码增强
- `momus.md` → 证据驱动、原子化与并行路线校验、可收敛复审的计划审核
- `oracle.md` → 按需只读的架构与调试顾问
- `metis.md` → 预规划意图与执行期边界分析
- `DECISIONS.md` → 用户长期需求、当前决策与已废弃方向
- `runtime/AGENTS.md` → 全局治理规则的可提交源文件
- `scripts/sync-agents.ps1` → 将 `runtime/AGENTS.md` 同步到运行时 `../AGENTS.md`

## 设计定位

- `prompts/` 是本地角色增强面，维护角色边界、职责分工、入口门禁和 handoff 契约；同时维护全局 `AGENTS.md` 的可提交源文件。
- [`DECISIONS.md`](DECISIONS.md) 是用户长期需求与本仓决策的权威入口；修改角色行为前先核对其中的 `active` / `superseded` 状态，避免回退到已废弃方向。skills 仓的 skill 行为决策由该仓自己的 DECISIONS.md 独立承载。
- 通用治理、task 契约和可复用规范由 `../skills/`、运行时 skills 与 `runtime/AGENTS.md` 承载；`../AGENTS.md` 是由同步脚本生成的运行时副本。
- `~/.omo/omo.jsonc` 只使用 `file://` 形式的 `prompt_append`；每个 agent 的追加内容放在同名 Markdown 文件中，便于独立回顾、审查和 Git 记录。

### 有界并行边界（索引）

并发权威规则由 shared skills（`omo-adaptive-execution`）承载，按路径分两种节奏：

- **计划路径（Atlas/矩阵）——预算波次制**：默认最低成本单一 owner；独立产出/失败/验收 + 写入互斥 + 环境隔离 + 接口冻结 + 真实关键路径收益才进 parallel wave；有向依赖用 pipeline，共享核心不变量、未冻结接口、循环依赖或整体验收用 single-owner。Wave 是派发 epoch 而非验证屏障；并发预算口径（运行中写入 worker + 已完成未验收产物，**默认 3**、**隔离充分时可至 4**、计划 `concurrency_budget` 为**计划路径唯一覆盖入口**）与验收/reviewer 细则见 `atlas.md`。
- **日常路径（Sisyphus）——蜂群滑动并发**：互不依赖、写域不重叠的 ready 任务按依赖就绪集单批爆发（后台派发），单个完成即释放额度滑动补位（运行中 + 未验收 ≤ 6），验收集中在排水点、高风险即验，细则见 `sisyphus.md`；写域互斥、命名依赖串行、共享推理不拆为两路径共用硬边界。
- `INTEGRATE` 是本地状态；`integration task` 由唯一 integration owner 在 integration workspace 中执行，完成后进入官方 `Final Wave`——二者共同构成唯一全局收敛阶段，但不是同一对象。

### 技术债

- `tech-debt`：上下文压缩的 100K token 水位目标无可观察的 token 信号，压缩时机依赖代理自估，属平台层缺口。
- `tech-debt`：`vcs: none` 计划下 `ACCEPTED(revision)` 没有可靠的 revision 来源，版本 CAS 静默失效，只能以产物路径加 mtime 近似。

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
| `prometheus.md` | 在上游计划契约内补充需求溯源、owner/failure-family 原子化证据、三类执行拓扑、计划分级（轻量/完整）、路由字段、验收 checkpoint 与 workspace lane 契约；计划审查由用户手动触发（不审 / 单审 Momus / 双审 Oracle→Momus） |
| `atlas.md` | 在上游逐 delegation 验证与 checkbox 更新之上，补充 execution-only 边界（含无计划新需求处置与角色劫持防护）、节点统一召回验收（wave 末/检查点/依赖门/终态排水）、契约三级裁决、账本与 CAS、工作区与集成裁决 |
| `sisyphus.md` | 强化小团队 Leader 的蜂群滑动并发（依赖就绪集单批爆发 + 滑动补位、运行中+未验收 ≤6、排水点统一验收）、经济路由与上下文控制 |
| `hephaestus.md` | 强化单目标自主深度实现；不接管多任务协调 |
| `momus.md` | 在官方 Reference Validation、Executability、Critical Blockers、QA Scenario Executability 四类审查内，使用原子化、拓扑、工作区和上下文胶囊作为证据判据；不新增 blocker 类别或本地复审上限 |
| `oracle.md` | 按需提供阶段适配的架构与研究方案，抑制细枝末节和投机性安全冗余 |
| `metis.md` | 规划前以有界头脑风暴分析意图；执行期在冻结契约内生成最小执行图 |
| `DECISIONS.md` | 记录用户长期需求、兼容原则、可观察验收和已废弃决策，防止 prompt 行为回退 |
| `runtime/AGENTS.md` | 全局治理规则的可提交源文件 |
| `scripts/sync-agents.ps1` | 生成并校验运行时 `../AGENTS.md` |

## 维护规范

持续生效的仓库维护约定直接记录于此；[`DECISIONS.md`](DECISIONS.md) 只保存用户裁决记录。

### Prompt 写作

- 每份 Markdown 只有一个描述文件用途的 H1，其余章节保持递增层级（markdownlint MD025 / MD041 clean）。
- 角色 prompt 只保留必要的准则、参考、约束与防漂移规则；禁止写入元声明、免责声明、兼容性声明及「本节只补充」「上游规则继续有效」等无行为约束力的表述。
- **行为 prompt 自包含**：角色文件正文不引用 `DECISIONS.md` 编号或仓库内部记账；规则的约束力来自条文本身，消费 prompt 的模型不知道也不需要知道决策编号。溯源记录只存在于 `DECISIONS.md`。
- **派发方持有协议，角色 prompt 只承载判定标准**：跨角色协作协议（审查模式标注、轮次编排、会话续用策略、胶囊构造、阻断标准注入、移交规则、输出格式契约）只写在派发方的编排文件（计划审查→`prometheus.md`，执行验收→`atlas.md`，日常委托→`sisyphus.md`），派发时写进 `task()` 委托 prompt；响应方角色 prompt 不含模式协议、轮次词汇、调度逻辑或对其他文件的元声明，只保留自身判定标准与对委托所附内容的消费。同一规则禁止双份维护，发现重复时保留派发方、从响应方删除。自查口诀：这条行为是「我自己怎么判断」还是「别人怎么调度我」——后者移到派发方。

### 提交与生效

- prompt、skill 或运行时规则修改完成并验证后，按独立意图原子提交并推送；审查/讨论轮次进行中**不逐轮提交**，全部审查完毕（用户确认）后一次成型，避免过程修订噪音进入历史。
- 配置时文件（prompt、agent、skill、config）变更后完全退出并重启 OpenCode 才生效；仓库保持 clean 且与 upstream 同步，新会话读取到新版本。

## 边界

- 不在本仓库复制 `skills/` 中的完整治理规则；那是上层同级 `../skills/` 的职责。
- `runtime/AGENTS.md` 是全局治理规则的维护源；`../AGENTS.md` 只作为 OpenCode 运行时加载副本存在，不直接提交到本仓库。
- 本地 `prompt_append` 只使用 `file://` 引用；需要本地稳定增强的 agent 才配置对应 Markdown 文件，未配置的 agent 直接使用 OMO base prompt。
- 文件型 `prompt_append` 只补充上游未覆盖且与上游兼容的稳定角色行为；**不得声明本地优先或替换上游工作流**。发现冲突时调整或删除本地条款，并同步 [`DECISIONS.md`](DECISIONS.md)。
- 不以 agent 覆盖率或 skill 数量作为添加 prompt 的理由；**只有经审查确认的本地行为差异才新增文件**。
- 新增长期行为前先写入 `DECISIONS.md`；上游已定义的行为不在本地重复，已废弃决策**不得重新引入**。
- 若 prompt 边界变化影响根配置事实、执行模型或长期治理结论，需同步 `~/.omo/omo.jsonc`、`runtime/AGENTS.md` 中受影响的事实与相关 durable memory，并重新生成 `../AGENTS.md`；未受影响的载体不机械更新。

## 上游兼容基线

本地 append 已对照以下固定版本审查：

- Oh My OpenAgent：`code-yeongyu/oh-my-openagent@e676fef9`（5.0.0-beta.12）
- OpenCode：`anomalyco/opencode@550d1ffd24718454925c4636e937878f0274de48`

2026-08-20 核对：运行缓存曾滞留 `5.0.0-beta.7`（`auto_update` 未自动刷新缓存目录），已手动刷新至 `5.0.0-beta.12`，重启后生效（见「维护规范」）；上游行为核对一律以实装版本为准。

当前 `~/.omo/omo.jsonc` 启用 `auto_update`。上游更新后需重新核对 Prometheus/Atlas/Momus 基础 prompt、`ulw-plan`、category 路由和 `/stop-continuation`；兼容基线未更新前，不假定本地 append 仍与新契约一致。

### 上游提示词探查顺序

探查上游角色基础 prompt 时，**先匹配当前模型绑定对应的专属变体**，不要只看 default 版：

1. 先读 `~/.omo/omo.jsonc` 确定各 agent 当前绑定的模型；
2. 在 `~/.cache/opencode/packages/oh-my-openagent@beta/node_modules/oh-my-openagent/dist/agents/` 下按模型找专属变体（文件名含模型后缀，或 `createXAgent(model)` / `getXPrompt(model)` 按模型分流）；default 版只用于核对兼容性，不作为运行时行为基线；
3. 明文内嵌的变体（d.ts 中 `= "..."`）可直接提取；仅声明（`declare const ...: string`）或完全无 const 声明的变体在平台二进制内，本地无法提取，改以 `ulw-plan` / `start-work` skill 与 hook 契约为镜像核对。

已探明边界（2026-08-21）：

| 角色 | 当前绑定 | 明文提取 | 镜像核对 |
|---|---|---|---|
| momus | openai/gpt-5.6-sol | ✅ `momus-gpt-5-6.d.ts` | — |
| momus 备用 | Claude/其他 | ✅ `momus.d.ts`（default） | — |
| prometheus / atlas / metis / oracle / sisyphus | — | ❌ 二进制内 | `ulw-plan`、`start-work` skill + hooks |

模型绑定变化后，按新绑定重新探查明文变体，并在上表更新探明边界。
