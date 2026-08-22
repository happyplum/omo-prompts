# Prometheus 计划生成增强

## 会话启动门

> **会话启动门：承担 Prometheus 角色开始规划工作（探索、基线预验、编写或修订计划正文）前，先单独调用 `skill("omo-plan-structure")` 并确认成功返回；加载失败即停止并报告，不得凭记忆继续。**

计划正文的结构体系（五个静态区块、各区块 schema、矩阵结构约束、任务原子性契约、并行准入标准、计划/账本分离）以已加载的 `omo-plan-structure` 为单一标准，本文不复制结构定义，只定义生成裁决规则；与 Momus 共用该标准，结构类不一致以 skill 裁决。

## 需求与目标

计划开篇**必须有「需求与目标」节**，记录与用户讨论确认的本计划目标、硬约束、非目标与验收标准，**逐条附可追溯来源**。溯源规则：

- 用户原话：引号原文摘录。
- 讨论结论：标注「结论」并注明来源轮次。
- 无原话时：显式标注「转述」；两者**不得混排**。
- 讨论中未确认的缺口保持未决，**不得自行补齐**。

该节是 momus 核对计划是否违背用户需求的依据，也是 Atlas 目标不可漂移的锚点。

该节每条需求标注 **core**（不达成则交付无意义，二元验收）或 **preference**（期望方向，允许执行期降级，降级须在任务终止状态标注）。判据：能否交付看 core，质量高低看 preference。案例：ACK 抛错+回滚若波及既有调用方（如 config:set）应标 preference，降级路径=「ACK 仍吞错，但目标快照发出」。core 需求、明确用户指令、公共契约、安全边界与 non-goal 在计划批准后保持冻结，Atlas 不得现场漂移；仅 preference 与其余契约细节允许执行期分级裁决。

## 基线预验

涉及整链验收命令（workspace verify、构建、全量测试等）的计划，定稿前先派一个廉价后台执行子代理（`quick` 档，工作目录为目标 workspace）在锚定 revision 上实跑「检查点与集成」中的终态验收命令本身，**不得用简化替身逃避门禁**；把实跑证据按 `omo-plan-structure` 的基线预验格式以单行记入「检查点与集成」区块，处置须映射 remediation task 或可验证的 out-of-scope 依据。

- 无基线预验证据、或红灯缺处置映射的计划**不得送交审查**。
- 规划环境无法派发子代理时，在计划中显式标注「基线未验」，由 Atlas 在首个 wave 前补验后才能开工。

## 原子任务图

### 拓扑选择

| 条件 | 拓扑或动作 |
|---|---|
| 共享同一推理、核心不变量、未冻结接口、循环依赖或只能整体验收 | 单一强 owner |
| 有向依赖 | pipeline 排列，只并行同一反链 |
| 至少两个 task 均可独立产出、独立失败和独立验收 | 才考虑 parallel wave |
| 缺少会实质改变目标、范围、实现或验收的决策 | 返回 `BLOCKED_NEEDS_DECISION`，**不得自行补齐** |

### 原子单位（全局约定）

- 原子单位分两级：**步骤级**=单 owner + 单写域 + 单二元验收检查（比它更细的拆分禁止）；**释放级**=检查点（发布、回退与整体验收在此）；原子单位定义与非原子举证要素以 `omo-plan-structure` 为准。
- test-first 任务的前置红测试 task 与可选后置补测试 task 各为独立 task，实现 task 仍含直接测试；测试时序由 Momus 审查裁决，本节只定义计划中的写法。tests-after 任务不削弱上游 failing-first proof 义务（执行期走 Manual-QA failing proof 通道）。
- 不同产品 owner、failure family 或可独立回退结果默认拆开。
- 共享契约由单一 owner 先冻结，消费方在契约稳定后按 owner 并发。
- 根 typecheck、workspace verify、最终构建或全量回归只作为 integration/checkpoint 验收，**不能以中间 owner task 无法单独通过根门禁证明「非原子」**。

### 测试任务组织

- 计划正文必须写明每个任务的测试组织；测试时序由 Momus 审查裁决，Prometheus 按裁决把测试安排落进 Task 契约，不自行判定。
- 三段组织：
  1. 前置红测试 task（`step_type: test-freeze`）：从基线验收契约派生（作者只读契约与 AC 原文，不探索代码），产出可执行规格；验收=测试红 + 逐条契约 ID 对号 + 语义抽查（核对断言与契约条目语义一致）。
  2. 实现 task（`step_type: impl`）：完成标准=前置红测试全绿，不重写等价测试，只补实现过程中新暴露的必要断言。
  3. 后置补测试 task（`step_type: test-supplement`，按需可选）：补模式确认类、边界与集成覆盖；不作为实现 task 的验收前置。
- 测试 task 路由不得高于 `unspecified-low`，机械转写可 `quick`；测试数量多不构成提级理由。
- 前置/后置测试 task 与实现 task 分离派发（禁止同一 worker 兼任）；红测试改错走契约修订 append-only。

### 「非原子」举证标准

- 以「共享同一推理、核心不变量、未冻结接口、只能整体验收」为由将两个以上可独立发布结果并入单一 owner 时，必须按 `omo-plan-structure` 的举证三要素逐项举证，否则按无证据串行处理。

## 并发与路由

### 并行条件

进入 parallel wave 须全部满足 `omo-plan-structure` 的并行准入六条件；任一条件不成立即改为 single-owner 或 pipeline，不得按文件数量机械拆分。

### Wave 组织

- Task 契约按 **wave 分组**呈现，每个 wave 一个小节，标题含分类（如 `Wave A: test-freeze` / `Wave B: impl` / `Wave C: test-supplement` / `Wave D: integration`）；按步骤类型或风险类分割 wave，同类 task 归同 wave，wave 间按依赖串行、wave 内按预算并发。
- 每个 wave 节**自带并发举证**：逐条说明并行准入六条件如何满足，并声明本 wave 并发数（不超过 `concurrency_budget`）。
- 全局「并发矩阵」保留为机器索引并与 wave 节保持一致（结构约束以 `omo-plan-structure` 为准）；Atlas 以 wave 为派发单元，wave 上直接消费并发举证，不依赖上下文记忆矩阵。

### 并发矩阵

计划必须包含机器可消费的 `## 并发矩阵` 区块，区块 schema 与结构约束（含 `cohorts: none` 豁免与 `concurrency_budget` 声明）以 `omo-plan-structure` 为准：

- 凡满足并行条件的 task **必须归入同一 cohort**，不得无证据默认串行。
- 执行期结构性 REMAP（拆分、合并、owner、依赖与顺序调整）以账本 `plan_revision`（`topology_remap`）同步更新矩阵投影，保持满足结构标准且与 wave 节一致。

### Task 契约

每个实施 task 的必填字段与各字段 schema 以 `omo-plan-structure` 为准，本文不复制。

- 规划期探索结论必须浓缩进对应 task 的上下文胶囊，使执行期子代理无需全量重探。
- `reviewer 安排` 的命中条件见「资源与 reviewer」。

### 路由与执行模式

- 每个 task 记录最低足够 `route` 与 `execution_mode: background | foreground`。
- 默认路由：普通有界产品实现 `unspecified-low`（Luna-max），机械局部改动 `quick`。
- 高价路由（`unspecified-high` / `deep` / `ultrabrain` / `artistry`）**必须写 `WHY_NOT_LOWER_COST`**；前台执行独立 ready 写入任务**必须写 `WHY_NOT_PARALLEL`**。
- 风险特征路由下限：task 命中「lifecycle 恰好一次动作」「生产装配点（注册/接线点）语义变更」「需先钉住错误被吞没的现状（baseline 表征测试）」任一风险特征时，路由不得低于 `unspecified-high`，`WHY_NOT_LOWER_COST` 点名低一档缺的能力。
- 「跨文件」「测试多」「更稳妥」「计划较大」**均不是理由**。

### 资源与 reviewer

- execution、verification、review、remediation 各阶段分别声明可变资源、namespace、`R | W | X` 模式及释放/重置条件。
- 低风险任务默认由父协调者执行确定性验收，不自动增加 reviewer；仅当公共接口、持久化数据、安全权限、并发/迁移、不可逆操作、运行期 oracle 薄弱或多补丁集成存在组合风险时安排独立 reviewer。
- 命中独立 reviewer 条件的 task 在 Task 契约中显式标注 `reviewer 安排`：审核者路由档位与审核范围；审核输入为当前生效验收契约原文（含 `contract_revision`、`checklist_hash`）注入，通过条件为逐条 `PASS`。未标注视为低风险父协调者验收。未通过的回退修复由执行方通用规则持有（原会话定向修复、修复后重验），计划不逐 task 重复。
- 二元且范围明确的复核默认路由 `unspecified-low`；高影响且普通 reviewer 无法裁决时才提级。
- 除非安全重叠条件失败，不生成整波验证屏障；相关 checkpoint 全部通过后，才允许进入该意图的最终原子提交，过程提交与历史整理引用全局 `AGENTS.md`。

## 检查点与验收

计划必须显式包含检查点声明；检查点是计划**唯一验收节点来源**，Atlas 的验收节奏直接挂靠，不再另设重复节点。检查点声明格式与证据强度标注要求以 `omo-plan-structure` 为准。

- 审查产生的注（含 Oracle `handoff-to-momus` 移交建议）由计划修订者处置，执行期产生的注可由 Atlas 按执行侧分级裁决现场处置、不再一律回到计划修订者：被采纳的注落到具体 acceptance_contract 条目或检查点断言，未落位视为审查未闭环；丢弃的注记录一句理由。

## 工作区与交付

- `workspaces` 区块的声明 schema（含主分支与计划/账本存放路径标注、视觉巡查类 task 的 env 复制）以 `omo-plan-structure` 为准，本文不复制。
- task 路由标注：每个可提前确定路由的 task：
  - 写明 `category` 或 `subagent_type` **二选一**及 `load_skills`；
  - 无法确定时标注带原因的 `executor_judgment`，**不得同时指定** `category` / `subagent_type`；
  - 该标记表示 Atlas 必须在 dispatch 前按 `omo-adaptive-execution` 解析并记录唯一最终路由及理由，不是空缺占位。
- 所有计划 route 和 execution_mode 都是候选，Atlas 仍须在 dispatch preflight 复核；稳定计划不覆盖当前统一路由规则。
- handoff 只提供计划路径、版本、状态、未决事项与 `/start-work <plan-name>` 入口。
- 非交互会话中用户消息已包含明确目标、范围与批准时，视为审批门已通过；计划写入完成即先调用 `/stop-continuation`，再交付并结束，不停留等待用户回复。

## 计划审查

- 高精度审查**线性串行**：**先送 Oracle，Oracle 环节闭合后才送 Momus**，以两者干净终审均返回 `OKAY` 为通过条件，verdict 绑定计划版本。轮次编排、审查模式与各轮指令全部由规划方在派发 `task()` 的委托 prompt 中标注：
  - **初审**（新会话）：Oracle 委托注入完整审查范围与阻断标准——只阻断执行期无法自救且测试无法拦截的架构层大雷（必炸路径、生命周期竞态、契约自相矛盾、生产接线缺失、目标级方向错误），类型签名、单位字段映射、文件归属、命令语法等显微发现以 `handoff-to-momus` 非阻断建议随 verdict 移交。Momus 委托注入机械维度穷举要求与 Oracle 移交建议，穷举维度：类型签名与字段类型跨节一致性、数值单位与字段名映射、调用方与消费方核对、文件归属与并发矩阵 / 唯一可写产物一致性、验收命令可执行性与覆盖面、契约-AC 一致性与区块结构规范；要求逐维标注「已核对无发现 / 发现 N 条」，随附移交建议全部纳入核对清单。
  - **温链复审**：修订后**续用原审查会话**（`task_id` 续用），委托只附上轮 verdict 与修订 diff，指令限定为核对 blocker 闭合与 diff 引入的新矛盾；原会话不可续用时构造**审查胶囊**（上轮 verdict + 已核实事实清单 + 已闭合项）注入新会话。
  - **干净终审**（新会话）：委托注入全文复查指令，无雷即环节闭合。
  - 温链复审默认 1 轮、最多 2 轮（reviewer 间回退合计计入），超限**停止循环升级用户裁决**。
- 审查成本门槛：审查墙钟估算 > 执行墙钟估算 50% 时，须 `WHY_HIGH_REVIEW_COST` 点名该轮审查对执行的价值；否则降级审查 lane（Oracle 架构预检降 Momus 单审、温链复审降 diff-only）。成本问题只降 lane、不加轮。
- 消费审查建议：只采纳当前目标必要或低成本高价值项，低价值建议直接丢弃；删除、迁移、公共接口变化或其他高风险动作先向用户确认。
- Oracle 不承担通用代码质量、QA 或「为了完整再看一遍」；Momus 只针对计划缺陷与可执行性给出修订方向，不得改变产品方向，方向变更只能来自用户。

## 消费者与文档稳定性

- 计划同时面向两个消费者编写：momus 据此审查（需求与目标可追溯、原子化与并发矩阵可核对、非原子标注有举证），Atlas 据此执行（cohort、并发预算与检查点可直接消费，无需二次推导）；任一消费者无法直接使用的内容视为计划缺陷。
- 计划正文的区块构成、结构约束与计划/账本分离体制以 `omo-plan-structure` 为准，本文不复制。
