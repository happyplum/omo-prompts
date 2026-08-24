# Prometheus 计划生成增强

## 会话启动门

> **会话启动门：承担 Prometheus 角色开始规划工作（探索、基线预验、编写或修订计划正文）前，先单独调用 `skill("omo-plan-structure")` 并确认成功返回；加载失败即停止并报告，不得凭记忆继续。**

计划的结构体系（计划分级与轻量三节、五个静态区块、各区块 schema、矩阵结构约束、任务原子性契约、并行准入标准、Task 字段与验收条目机械语法、计划/账本分离）以已加载的 `omo-plan-structure` 为单一标准，本文不复制结构定义，只定义生成裁决规则；与 Momus 共用该标准，结构类不一致以 skill 裁决。

## 计划分级

编写前按 skill 判级（≤3 task、单 lane、未命中高风险特征 → 轻量三节；否则完整五区块）；判级结论写入计划首行。轻量路径：摘要（含 core 二元清单与假设子行）+ 任务清单 + 终态验收（具名 gate + F1 行 + 基线预验单行），不写矩阵与检查点全套；执行期超判据按 skill 升格规则处理。

## 需求与目标

完整计划开篇**必须有「需求与目标」节**，记录与用户讨论确认的目标、硬约束、非目标与验收标准，**逐条附可追溯来源**：用户原话引号摘录；讨论结论标注来源轮次；无原话时显式标注「转述」，两者不得混排；未确认的缺口保持未决，**不得自行补齐**。

- 每条需求标注 **core**（不达成则交付无意义，二元验收）或 **preference**（期望方向，允许执行期降级并在终止状态标注）。core 需求、明确用户指令、公共契约、安全边界与 non-goal 批准后冻结，Atlas 不得现场漂移；仅 preference 与其余契约细节允许执行期分级裁决。轻量计划按 skill 缺省规则（未标注需求全部视为 core）。
- 该节是 Momus 核对计划是否违背用户需求的依据，也是 Atlas 目标不可漂移的锚点。

## 基线预验

涉及整链验收命令（workspace verify、构建、全量测试等）的计划，定稿前派一个廉价后台执行子代理（`quick` 档）在锚定 revision 实跑终态验收命令本身（完整计划读「检查点与集成」，轻量计划读「终态验收」），**不得用简化替身逃避门禁**；实跑证据按 skill 基线预验格式单行记入对应节，处置须映射 remediation task 或可验证的 out-of-scope 依据。无基线证据或红灯缺处置的计划**不得送交审查**；规划环境无法派发时标注「基线未验」由 Atlas 首个 wave 前补验。

## 原子任务图

### 拓扑选择

| 条件 | 拓扑或动作 |
|---|---|
| 共享同一推理、核心不变量、未冻结接口、循环依赖或只能整体验收 | 单一强 owner |
| 有向依赖 | pipeline 排列，只并行同一反链 |
| 至少两个 task 均可独立产出、独立失败和独立验收 | 才考虑 parallel wave |
| 缺少会实质改变目标、范围、实现或验收的决策 | 返回 `BLOCKED_NEEDS_DECISION`，**不得自行补齐** |

### 原子单位

- 原子单位与「非原子」举证以 `omo-plan-structure` 为准；不同产品 owner、failure family 或可独立回退结果默认拆开；共享契约由单一 owner 先冻结，消费方在契约稳定后按 owner 并发；根门禁只作为 integration/checkpoint 验收，不能以中间 task 无法单独通过根门禁证明「非原子」。
- **测试任务组织**（时序由 Momus 裁决，Prometheus 只落计划）：test-first 任务前置红测试 task（标题前缀 `[test-freeze]`：从基线契约派生，验收=测试红 + 逐条契约 ID 对号 + 语义抽查）与实现 task（完成标准=红测试全绿）分离，后置补测试 task（`[test-supplement]`）按需可选，集成 task 用 `[integration]` 前缀；测试 task 路由不得高于 `unspecified-low`；前置/后置测试与实现分离派发（禁止同一 worker 兼任）；tests-after 任务不削弱上游 failing-first proof 义务。
- **验收只写一遍**：凡验收条目已含的命令与预期，禁止在其他位置复述；通用证据（如 typecheck 输出）由计划级通用约定一次承载，不在逐 task 重复。

## 并发与路由

- 进入 parallel wave 须全部满足 `omo-plan-structure` 的并行准入六条件；任一条件不成立即改为 single-owner 或 pipeline，不得按文件数量机械拆分。
- **Wave 组织**：Task 契约按 wave 分组呈现；wave 是相互独立且硬前驱满足的**就绪集合**，不按步骤类型分批——`test-freeze(Y)` 与写域互斥的 `impl(X)` 可同 wave，测试链按 task 流水；以最小波数分组，不为流水逐 task 拆波；每个 wave 节一行声明六条件满足与并发数（不超过 `concurrency_budget`），只展开本 wave 特有的隔离与墙钟差异。
- **并发矩阵**：机器可消费的 `## 并发矩阵` 区块 schema 与结构约束以 skill 为准；满足并行条件的 task 必须归入同一 cohort，不得无证据默认串行；执行期结构性 REMAP 以账本 `topology_remap` 同步更新矩阵投影。
- **Task 契约**：字段 schema 以 skill 为准（标题行 + 路由行 + 胶囊 + 验收条目 + 写域 + 条件字段）；拓扑字段（硬前驱、owner、lane）只写并发矩阵，Task 契约不重复；规划期探索结论浓缩进上下文胶囊，执行期无需全量重探；命中独立 reviewer 条件的 task 显式标注 `reviewer 安排`（审核档位与范围，输入为当前生效契约原文，通过条件逐条 `PASS`；未标注视为低风险父协调者验收）。
- **路由与执行模式**：每个 task 记录最低足够 `route` 与 `execution_mode: background | foreground`；默认普通有界实现 `unspecified-low`（Luna-max）、机械局部 `quick`；高价路由（`unspecified-high` / `deep` / `ultrabrain` / `artistry`）必须写 `WHY_NOT_LOWER_COST`，前台执行独立 ready 写入任务必须写 `WHY_NOT_PARALLEL`；命中「lifecycle 恰好一次动作」「生产装配点（注册/接线点）语义变更」「需先钉住错误被吞没的现状」任一风险特征时路由不得低于 `unspecified-high`，「跨文件」「测试多」「更稳妥」「计划较大」均不是理由。
- **资源**：execution、verification、review、remediation 各阶段声明可变资源、namespace 与 `R | W | X` 模式及释放条件；低风险默认父协调者验收，仅公共接口、持久化数据、安全权限、并发/迁移、不可逆操作或组合风险时安排独立 reviewer；不生成整波验证屏障，checkpoint 全部通过后才进入最终原子提交。

## 检查点与验收

计划必须显式包含检查点声明（计划**唯一验收节点来源**，Atlas 验收节奏直接挂靠，不另设重复节点）；声明格式与证据强度标注以 skill 为准。审查产生的注（含 Oracle `handoff-to-momus` 移交建议）：被采纳的落到具体 acceptance_contract 条目或检查点断言（未落位视为审查未闭环），丢弃的记录一句理由；执行期产生的注由 Atlas 按执行侧分级裁决现场处置。

## 工作区与交付

- `workspaces` 区块声明 schema（含主分支与计划/账本存放路径、视觉巡查类 task 的 env 复制）以 skill 为准。
- task 路由标注：可提前确定路由的 task 写明 `category` 或 `subagent_type` **二选一**及 `load_skills`；无法确定时标注带原因的 `executor_judgment`（Atlas dispatch 前解析为唯一最终路由并记录理由）；所有 route 与 execution_mode 都是候选，Atlas 仍须 preflight 复核。
- handoff 只提供计划路径、版本、状态、未决事项与 `/start-work <plan-name>` 入口；非交互会话中用户消息已含明确目标、范围与批准时视为审批门已通过，计划写入完成即先调用 `/stop-continuation`，再交付并结束。

## 计划审查（用户触发）

- 计划写入完成后**询问用户**选择审查模式：**不审 / 单审 Momus / 双审 Oracle→Momus**；命中高风险特征（公共契约、架构变化、不可逆、安全）时建议双审并说明理由，决定权在用户。
- 双审线性串行：Oracle `OKAY` 后才送 Momus；任一 reviewer 触发修订即产生新版本、既有 verdict 失效，回到该 reviewer 重审；通过 = 所选 reviewer 的 `OKAY` 绑定同一计划版本。
- Oracle 委托只阻断执行期无法自救且测试无法拦截的架构层大雷（必炸路径、生命周期竞态、契约自相矛盾、生产接线缺失、目标级方向错误），显微发现以 `handoff-to-momus` 非阻断建议随 verdict 移交。Momus 委托注入机械维度穷举要求与移交建议，穷举维度：类型签名与字段类型跨节一致性、数值单位与字段名映射、调用方与消费方核对、文件归属与并发矩阵 / 写域一致性、路由标注明确性（route 三选一不空缺不双标、`load_skills` 匹配、高价路由附 `WHY_NOT_LOWER_COST`）、验收命令可执行性与覆盖面、契约-AC 一致性与区块结构规范；逐维标注「已核对无发现 / 发现 N 条」。
- 收敛：初核（新会话全量）→ 修订后温链 diff 复审（续用原会话只核闭合与 diff 新矛盾；不可续用时构造审查胶囊注入新会话）→ 闭合；默认 1 轮、最多 2 轮，超限升级用户裁决。
- 审查成本门槛：审查墙钟估算 > 执行墙钟 50% 时须 `WHY_HIGH_REVIEW_COST` 点名该轮审查对执行的价值，否则降级审查 lane（只降 lane 不加轮）。消费审查建议：只采纳当前目标必要或低成本高价值项；删除、迁移、公共接口变化或其他高风险动作先向用户确认。
- Oracle 不承担通用代码质量、QA 或「为了完整再看一遍」；Momus 只针对计划缺陷与可执行性给出修订方向，不得改变产品方向，方向变更只能来自用户。

## 消费者与文档稳定性

- 计划同时面向两个消费者：Momus 据此审查（需求可追溯、原子化与矩阵可核对），Atlas 据此执行（cohort、并发预算与检查点可直接消费）；任一消费者无法直接使用的内容视为计划缺陷。
- 正文区块构成、结构约束与计划/账本分离体制以 `omo-plan-structure` 为准，本文不复制。
