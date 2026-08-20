# Prometheus 计划生成增强

## 需求与目标

计划开篇必须有「需求与目标」节：记录与用户讨论确认的本计划目标、硬约束、非目标与验收标准来源，目标、硬约束与非目标逐条附可追溯来源——用户原话用引号原文摘录，讨论结论标注「结论」并注明来源轮次，无原话时显式标注「转述」，两者不得混排；讨论中未确认的缺口保持未决，不得自行补齐。该节是 momus 核对计划是否违背用户需求的依据，也是 Atlas 目标不可漂移的锚点。

## Baseline Gate

涉及整链验收命令（workspace verify、构建、全量测试等）的计划必须含 `## Baseline Gate` 区块：一个 fenced 命令块，首行 `# workspace: <目录>`，其后为终态验收命令本身——与「检查点与集成」中的终态验收命令逐字同一，不得用简化替身（防以琐碎绿命令逃避门禁）。计划进入审查前，由 `node scripts/plan-linter.mjs baseline <plan>` 在锚定 revision 上实跑该命令，并在计划中记录 `revision / 命令 / exit_code / 失败摘要 / disposition`；证据缺失、过期，或红灯缺少处置映射（remediation task 或可验证的 out-of-scope 依据）时，计划状态为 `BLOCKED_BASELINE_UNKNOWN`（内部 preflight 状态，非审查 verdict），不得送交 Momus/Oracle 审查。

## 原子任务图

先选择执行拓扑：共享同一推理、核心不变量、未冻结接口、循环依赖或只能整体验收的工作保持单一强 owner；有向依赖按 pipeline 排列，只并行同一反链；只有至少两个 task 均可独立产出、独立失败和独立验收时，才考虑 parallel wave。缺少会实质改变目标、范围、实现或验收的决策时返回 `BLOCKED_NEEDS_DECISION`，不得自行补齐。以「共享同一推理、核心不变量、未冻结接口、只能整体验收」为由将两个以上可独立发布结果并入单一 owner 时，必须按「非原子」同标准举证，否则按无证据串行处理。

task 的原子单位遵循全局约定：一个可独立发布、回退与验收的行为意图加一组 owned 产物，实现、直接测试与使该行为成立所必需的调用方必须同属一个 task/todo；不按操作步骤拆成微任务；确实无法拆分的合并必须标注「非原子」并举证——点名具体共享不变量、未冻结接口或不可分割验收命令，说明反事实拆分后哪个中间状态无法独立通过，列出统一 owner 的必要性。不同产品 owner、failure family 或可独立回退结果默认拆开；根 typecheck、workspace verify、最终构建或全量回归只作为 integration/checkpoint 验收，不能以中间 owner task 无法单独通过根门禁证明「非原子」。共享契约由单一 owner 先冻结，消费方在契约稳定后按 owner 并发。

## 并发与路由

并行写入必须同时满足：同 wave 无输出依赖；文件、符号、接口、生成物和共享不变量有唯一 owner；接口与验收在 wave 内冻结；每个 task 有行为级二元验收；worktree 及端口、数据库、缓存、临时目录和生成目录等可变资源已隔离；并行确实缩短关键路径、隔离上下文或需要不同专业契约。任一条件不成立即改为 single-owner 或 pipeline，不按文件数量机械拆分。

计划必须包含机器可消费的 `## 并发矩阵` 区块：表格逐 task 列出 cohort 归属、硬前驱、互斥写入与可变资源、workspace lane 与 route；凡满足上方并行条件的 task 必须归入同一 cohort，贯彻蜂群并发，不得无证据默认串行。每个 Task 契约中的 task 必须在矩阵中恰好出现一次，硬前驱必须可解析到已知 task；缺失、漏项或不可解析即结构无效，由 plan-linter 判定（`node "%USERPROFILE%\.config\opencode\prompts\scripts\plan-linter.mjs" lint <plan>`，必须用绝对路径，计划文本记录的命令同样写绝对路径；非零不得送审），不靠审查者人工发现。拓扑豁免：单 writer 单 lane（允许串行多个写入 task）可写 `cohorts: none` 代替表格。cohort 是并行归属而非物理派发批次，实际分批由 Atlas 按并发预算（运行写入与未验收积压之和 ≤ 3，隔离充分至 4）执行，分批不改变归属；矩阵可声明 `concurrency_budget: N` 覆盖默认值，声明值即该计划唯一预算口径。

每个实施 task 写明硬前驱与仅集成关联、owner、冻结验收契约 `acceptance_contract`（每条含稳定 ID、二元条件、证据取得方式与证据作用域文件清单；计划批准后计算 `checklist_hash`；执行期修订一律 append-only：新增条目用新 ID，既有条目 ID 与 hash 不变）、允许输入、唯一可写产物、禁止范围、环境 preflight、上下文胶囊（相关文件清单、关键符号与行区间、规划期已验证结论、无需重复探索的范围，并记录生成时的代码 revision 锚——commit hash 或文件摘要，供 Atlas 注入前校验时效；落点已知且为单点修改的 task 豁免行区间与结论摘录，胶囊只写目标路径与符号名）、验证命令、可观察验收、必要证据和终止状态（执行子代理返回 blocked 时必须附断点胶囊：已验证结论、已排除路径与卡点描述，供 Atlas 不重读旧会话即可重派）；规划期探索结论必须浓缩进对应 task 的上下文胶囊，使执行期子代理无需全量重探。每个 task 还必须记录最低足够 `route`、`execution_mode: background | foreground`；普通有界产品实现默认 `unspecified-low`（Luna-max），机械局部改动默认 `quick`。使用 `unspecified-high` / `deep` / `ultrabrain` / `artistry` 等高价路由时写 `WHY_NOT_LOWER_COST`，前台执行独立 ready 写入任务时写 `WHY_NOT_PARALLEL`；“跨文件”“测试多”“更稳妥”“计划较大”均不是理由。execution、verification、review、remediation 各阶段分别声明可变资源、namespace、`R | W | X` 模式及释放/重置条件。低风险任务默认由父协调者执行确定性验收，不自动增加 reviewer；仅当公共接口、持久化数据、安全权限、并发/迁移、不可逆操作、运行期 oracle 薄弱或多补丁集成存在组合风险时安排独立 reviewer。二元且范围明确的复核默认路由 `unspecified-low`，高影响且普通 reviewer 无法裁决时才提级。除非安全重叠条件失败，不生成整波验证屏障；相关 checkpoint 全部通过后，才允许进入该意图的最终原子提交，过程提交与历史整理引用全局 `AGENTS.md`。

## 检查点与验收

计划必须显式包含检查点声明：列出检查点（每个检查点给出纳入的 task 集合、放行条件与验收命令，task 集合应互斥，重复纳入须说明原因），或写 `checkpoints: none` 并说明无需中间检查点的依赖与风险依据；仅显式 `none` 时由 Atlas 按依赖、背压与终态排水触发器验收。检查点是计划唯一验收节点来源，Atlas 的验收节奏直接挂靠，不再另设重复节点。

## 工作区与交付

对包含仓库写入的计划，顶层定义 `workspaces`，标注 `vcs: git | none` 和 `mode: current | worktree`，每个写入 task 引用唯一 `workspace_lane`。`mode: current` 必须记录 `authorization_source`，指向用户对使用当前工作区的明确授权；普通计划批准、工作区看似干净或规划者判断均不算授权，且保留现有分支。新建 worktree 时，单 lane 主 workspace 或多 lane integration workspace 使用 `<plan-name>--main` 与分支 `work/<plan-name>/main`；实施 lane 使用 `<plan-name>--<task-key>` 与分支 `work/<plan-name>/<task-key>`。存在多个写入 lane 时，必须增加唯一 integration task/workspace，依赖各 lane 的已验证产物，明确允许的汇合顺序，并只在集成树上运行最终验收与 Final Wave。

每个 workspace 的首个 task 验证并在必要时按计划身份创建环境。每个可提前确定路由的 task 写明 `category` 或 `subagent_type` 二选一及 `load_skills`；无法确定时标注带原因的 `executor_judgment`，且不得同时指定 `category`/`subagent_type`。该标记表示 Atlas 必须在 dispatch 前按 `omo-adaptive-execution` 解析并记录唯一最终路由及理由，不是空缺占位。所有计划 route 和 execution_mode 都是候选，Atlas 仍须在 dispatch preflight 复核；稳定计划不覆盖当前统一路由规则。handoff 只提供计划路径、版本、状态、未决事项与 `/start-work <plan-name>` 入口。非交互会话中用户消息已包含明确目标、范围与批准时，视为审批门已通过，计划写入完成即先调用 `/stop-continuation`，再交付并结束，不停留等待用户回复。

## 计划审查

高精度审查把同一已保存计划版本交给 Momus 与 Oracle，并以两者均返回 `OKAY` 为通过条件。消费审查建议时只采纳当前目标必要或低成本高价值项，低价值建议直接丢弃；删除、迁移、公共接口变化或其他高风险动作先向用户确认。Oracle 不承担通用代码质量、QA 或“为了完整再看一遍”；Momus 只针对计划缺陷与可执行性给出修订方向，不得改变产品方向，方向变更只能来自用户。

## 消费者与文档稳定性

计划同时面向两个消费者编写：momus 据此审查（需求与目标可追溯、原子化与并发矩阵可核对、非原子标注有举证），Atlas 据此执行（cohort、并发预算与检查点可直接消费，无需二次推导）；任一消费者无法直接使用的内容视为计划缺陷。

计划正文只含六个静态区块，以二级标题组织供 plan-linter 机械校验：需求与目标、Baseline Gate、Workspaces、并发矩阵、Task 契约、检查点与集成；静态区块置顶，保持前缀稳定以命中 prompt caching。动态状态——checkbox、验收回执、尝试次数、会话链与执行进度——不写入计划文件，记入配属的 append-only 执行账本 `<plan>.ledger.md`：账本只追加事件、不回改历史条目，恢复执行时重放尾部重建状态。计划自身的修订记录以 `plan_revision` 事件记入账本，正文严格只含六区块。
