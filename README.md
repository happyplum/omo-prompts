# oh-my-openagent 提示词集

`oh-my-openagent`（OMO）的本地角色增强 prompt 仓库，负责定义规划端、执行端、审查端与日常协调端的角色边界，并维护全局 `runtime/AGENTS.md` 的唯一源文件。

## 目录与文件职责

将本仓库放置于 OpenCode 配置根目录下的 `prompts/`（即 `~/.config/opencode/prompts/`）：

| 文件 | 角色定位与核心职责 |
|---|---|
| `prometheus.md` | **大型任务规划**：需求溯源（`core` / `preference`）、轻量/完整计划分级、基线预验、三类执行拓扑、路由初标、显式目的核对入口（`metis`）；写完默认不自动送审，只给用户三选项（直接执行 / Momus 单审 / Oracle→Momus 双审） |
| `atlas.md` | **大型计划纯编排执行**：对齐上游 `boulder.json`、全量详细 todos、`ledger.jsonl` 账本与 `DoneClaim → AdversarialVerify` 逐 task 验收；补充防角色劫持、Momus 三判定（`tdd` / `split` / `route`）消费、契约三级现场裁决、执行期再拆分、就绪集成组并发与分层验收（简单验收配合 `explore`，高风险派独立新会话跑五 gate） |
| `sisyphus.md` | **日常任务团队 Leader**：编排为主、已知局部小改自改为辅（视觉/前端一律派 `visual-engineering`）；默认前台成批并发、显式可选蜂群滑动（在途 ≤ 6，单个完成优先领取）、父级统一回归验收、5 条计划触发门槛与 5 级按比例验证 |
| `hephaestus.md` | **单目标自主深度实现**：围绕单一明确边界目标自主完成探索、实现、验证与 QA，不越界接管多任务协调 |
| `momus.md` | **计划审核**：严格在官方四类范围内输出 `[OKAY]` / `[REJECT]`（每次最多详列 3 个实质 blocker，清零才放行），并随 verdict 附带逐 task 的 `tdd` / `split` / `route` 三项执行判定直通 Atlas |
| `oracle.md` | **资深架构师纯职**：制定与当前目标匹配的架构方案、关键技术细节与盲点分析，不做逐行代码挑刺，不把无证据的理论假设变成过度安全冗余 |
| `metis.md` | **意图分析与目的差异核对**：梳理未敲定意图并针对关键歧义提问（不限题数、重要在前）；显式触发目的差异分析（目的着重点 / 描述清晰度 / 符合度）时仅按附带原话与原文证据出报告，缺材料直接 fail-closed 退回清单 |
| `DECISIONS.md` | 记录用户长期需求、演进裁决（`D-001` ~ `D-056`）与已废弃方向（`S-001` ~ `S-005`），防止角色行为回退 |
| `runtime/AGENTS.md` | 全局执行规范的可提交维护源 |
| `scripts/sync-agents.ps1` | 将 `runtime/AGENTS.md` 同步到 `../AGENTS.md` 并用 SHA256 校验一致性 |

## 设计与协作边界

- **本地 `prompt_append` 定位**：`~/.omo/omo.jsonc` 通过 `file://` 引用本仓同名 Markdown 文件，只补充上游未覆盖且与上游兼容的稳定角色行为，不声明「本地优先」或替换上游主流程。
- **派发方持有协议，响应方只管判断标准**：跨角色调度协议（审查轮次、会话续用、委托模板、移交规则）只写在派发方（计划审查 → `omo-plan-review` skill，计划执行 → `atlas.md`，日常协调 → `sisyphus.md`）；响应方角色（`oracle.md`、`metis.md`、`momus.md`）只写自身判断标准，不写「被谁在什么阶段调用」的分支语句。
- **角色文件自包含、说直白工程话**：角色 prompt 正文不引用 `DECISIONS.md` 编号（`D-0xx`），不写空洞免责声明或生造黑话，直接写可执行的判断规则与边界。
- **与 `../skills/` 分工**：跨角色复用的计划结构 schema（`omo-plan-structure`）、审查循环协议（`omo-plan-review`）、自适应执行路由（`omo-adaptive-execution`）和 Atlas 执行约束（`omo-atlas-execution-constraints`）维护在 `~/.config/opencode/skills/`，本仓角色 prompt 通过会话启动门加载消费，不重复抄写大段 schema。

### 双路径并发节奏速览

两路径通用硬边界：**写域互斥、命名依赖串行、共享同一推理链/接口不硬拆**；执行与结果收取细则以 `omo-adaptive-execution`「task 执行方式」为单一来源：

- **计划路径（Prometheus → Atlas）**：预算波次制。每波前盘点就绪集，在并发预算内（运行中写入 worker + 已完成未勾选 task，**默认 3、隔离充分至 4、计划 `concurrency_budget` 为唯一覆盖入口**）同回合前台成组并发派发；逐 task 验证通过即勾选。
- **日常路径（Sisyphus）**：默认前台按就绪集成批派发并直接收取；仅明确选用滑动策略时才设 `run_in_background=true`（在途上限 **运行中 + 未验收 ≤ 6**）。
- **后台结果优先领取（D-050）**：在显式滑动后台模式下，收到单个真实完成通知后下一回合立即优先领取并验证，验证通过即释放额度补位，不等整批或整波跑完。

## 全局 `AGENTS.md` 同步方式

先编辑 `runtime/AGENTS.md`，再运行同步脚本更新 OpenCode 加载的 `../AGENTS.md` 并核对（本机 `~/.omo/agent/AGENTS.md` 与 `../AGENTS.md` 共用 NTFS HardLink）：

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-agents.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-agents.ps1 -Check
```

Codex 的 `~/.codex/AGENTS.md` 与 Pi 的 `~/.pi/agent/AGENTS.md` 在公共条款变更时按需同步公共底座，并保留各自专属的多代理/蜂群规则。

## 上游兼容基线与已裁决相抵点

- **对齐基线**：`code-yeongyu/oh-my-openagent` **5.0.0-beta.24**（`/start-work` 已更名为 `/ulw-execute`，账本路径为 `.omo/ulw-execute/ledger.jsonl`）；OpenCode `anomalyco/opencode@5501ffd2`。
- **已裁决相抵点（D-033，核对上游更新时作为合法豁免依据）**：
  1. **计划存放与生成**：计划统一存放在上游识别的 `.omo/plans/`（D-036），但不走上游 `ulw-plan` scaffold（结构由 `omo-plan-structure` 约束）。
  2. **送审触发权收归用户（D-035）**：上游 UNCLEAR 自动送审、`high accuracy` 修饰词强制送审及交付二选一问句均不执行，统一由计划写完后的用户三选项触发。
  3. **task 默认前台成批（D-049/D-050）**：普通委托显式 `run_in_background=false` 同回合成组并发，仅显式滑动策略才用后台且单个完成优先领取；Atlas 防劫持条款阻断上游无计划自动 bootstrap（D-029）。
  4. **基线预验（D-009）**：规划期派 `quick` 子代理实跑终态验收命令，作为对上游 `ulw-plan` 只读白名单的有意豁免。
  5. **按比例验证与分层验收（D-006/D-045）**：替代上游每次委托全套 `lsp_diagnostics + build + test` 与逐文件亲读——简单验收由 Atlas 亲跑验收命令 + `explore` 只读核查事实，高风险任务派新会话独立验证子代理跑五 gate 全套，最终裁决始终归父级。

### 上游基础 Prompt 探查顺序

核对上游基础 prompt 时，先读 `~/.omo/omo.jsonc` 确认各角色当前绑定的模型，再到 `~/.cache/opencode/packages/oh-my-openagent@beta/node_modules/oh-my-openagent/dist/` 下匹配对应模型专属变体（不以 default 版冒充运行时实际变体）：

| 角色 | 当前绑定模型 | 上游变体来源 | 镜像核对契约 |
|---|---|---|---|
| `momus` | `openai/gpt-5.6-sol` | `momus-gpt-5-6.d.ts`（备用 `momus.d.ts`） | — |
| `prometheus` | `zhipuai-coding-plan/glm-5.3` | `dist/index.js` 提取 consultant / planner 两变体 | `ulw-plan` |
| `atlas` | `openai/gpt-5.6-terra` | `dist/index.js` 提取 default / gemini / glm 三变体 | `ulw-execute` |
| `oracle` | `openai/gpt-5.6-sol` | `dist/index.js` 提取单一正文 | — |
| `sisyphus` | `zhipuai-coding-plan/glm-5.3` | `dist/index.js` 提取 role / identity / 动态组装块 | `ulw-execute` |
| `metis` | `zhipuai-coding-plan/glm-5.3` | `metis-k27.md` 基线快照 | — |
