在官方原子化与 parallel-wave 契约之上，先选择执行拓扑：共享同一推理、核心不变量、未冻结接口、循环依赖或只能整体验收的工作保持单一强 owner；有向依赖按 pipeline 排列，只并行同一反链；只有至少两个 task 均可独立产出、独立失败和独立验收时，才考虑 parallel wave。缺少会实质改变目标、范围、实现或验收的决策时返回 `BLOCKED_NEEDS_DECISION`，不得自行补齐。

并行写入必须同时满足：同 wave 无输出依赖；文件、符号、接口、生成物和共享不变量有唯一 owner；接口与验收在 wave 内冻结；每个 task 有行为级二元验收；worktree 及端口、数据库、缓存、临时目录和生成目录等可变资源已隔离；并行确实缩短关键路径、隔离上下文或需要不同专业契约。任一条件不成立即改为 single-owner 或 pipeline，不按文件数量机械拆分。

每个实施 task 写明硬前驱与仅集成关联、owner、允许输入、唯一可写产物、禁止范围、环境 preflight、验证命令、可观察验收、必要证据和终止状态；execution、verification、review、remediation 各阶段分别声明可变资源、namespace、`R | W | X` 模式及释放/重置条件。低风险任务默认由父协调者执行确定性验收，不自动增加 reviewer；仅当公共接口、持久化数据、安全权限、并发/迁移、不可逆操作、运行期 oracle 薄弱或多补丁集成存在组合风险时安排独立 reviewer。二元且范围明确的复核可路由 `unspecified-low`，高影响判断才提级。除非安全重叠条件失败，不生成整波验证屏障；相关 checkpoint 全部通过后，才允许进入该意图的最终原子提交，过程提交与历史整理引用全局 `AGENTS.md`。

对包含仓库写入的计划，顶层定义 `workspaces`，标注 `vcs: git | none` 和 `mode: current | worktree`，每个写入 task 引用唯一 `workspace_lane`。`mode: current` 必须记录 `authorization_source`，指向用户对使用当前工作区的明确授权；普通计划批准、工作区看似干净或规划者判断均不算授权，且保留现有分支。新建 worktree 时，单 lane 主 workspace 或多 lane integration workspace 使用 `<plan-name>--main` 与分支 `work/<plan-name>/main`；实施 lane 使用 `<plan-name>--<task-key>` 与分支 `work/<plan-name>/<task-key>`。存在多个写入 lane 时，必须增加唯一 integration task/workspace，依赖各 lane 的已验证产物，明确允许的汇合顺序，并只在集成树上运行最终验收与 Final Wave。

每个 workspace 的首个 task 验证并在必要时按计划身份创建环境。每个可提前确定路由的 task 写明 `category` 或 `subagent_type` 二选一及 `load_skills`；无法确定时标注带原因的 `executor_judgment`，且不得同时指定 `category`/`subagent_type`。该标记表示 Atlas 必须在 dispatch 前按 `omo-adaptive-execution` 解析并记录唯一最终路由及理由，不是空缺占位。handoff 只提供计划路径、版本、状态、未决事项与 `/start-work <plan-name>` 入口。
