# 用户需求与决策

本文件记录会持续影响本仓库 prompt、skill 路由和验收方式的用户决策。
它只保存本地增量偏好与已废弃方向，不复制上游完整规则。
纯维护规范（写作标准、提交流程、结构约定）不记录于此，直接维护在
README 的「维护规范」节。
上游行为事实以 README 中的固定兼容基线为准。

## 决策优先级

1. 最新明确用户决策。
2. 当前固定版本的上游角色契约与 skill 契约。
3. 本文件中仍为 `active` 的本地补强。
4. Agent 推断。

本地补强不得声明覆盖上游。发现冲突时，保留上游行为并调整或删除
本地条款。若用户希望改变上游默认动作，先确认这是新的长期决策，
再更新本文件及兼容基线，不在 prompt 中写通用优先级覆盖。

## 当前有效决策

### D-001 只做兼容补强

- 状态：`active`
- 决策：`prompt_append` 只补充上游未覆盖的本地稳定约束；不重述上游，
  不声明本地优先，不替换上游工作流。
- 验收：全仓无“冲突时以本文件为准”“覆盖上游”等优先级声明；
  兼容审查发现冲突时修改本地。

### D-002 Atlas 按序加载执行 skills

- 状态：`active`
- 决策：Atlas 会话开始先加载 `omo-adaptive-execution`，成功后再加载
  `omo-atlas-execution-constraints`；此前不读取计划、不操作文件、不派发。
- 验收：会话工具记录能证明两次 skill 调用按序成功。

### D-003 按 owner 与 failure family 原子化

- 状态：`active`
- 决策：task 优先按产品 owner、failure family 和独立发布、回退、验收
  边界拆分；共享契约由单一 owner 冻结后，独立消费者并发。
- 验收：非原子合并有具体共享不变量或不可分割验收证据；根全量门禁
  只放在 integration 或 checkpoint。

### D-004 普通有界实现使用 Luna-max

- 状态：`active`
- 决策：机械局部改动优先 `quick`；模式已知、范围有界的产品实现优先
  `unspecified-low`，本机将其映射为 Luna-max；高价路由需证据。
- 验收：高价 task 含 `WHY_NOT_LOWER_COST`；普通有界 task 不因跨文件
  或测试数量自动提级。

### D-005 独立 ready task 后台并发

- 状态：`active`
- 决策：相互独立且写入隔离的 ready task 默认后台并发；前台串行需要
  真实的立即依赖。
- 验收：前台 task 含 `WHY_NOT_PARALLEL`；不把独立 remediation 全部
  同步执行。

### D-006 按比例验证

- 状态：`active`
- 决策：从最小能证伪目标行为的检查开始；workspace 全量测试或 build
  仅在集成、发布、影响不可界定或定向检查提示扩大时运行。
- 验收：局部 task 有定向证据；同一 revision 不重复等价全量门禁。

### D-007 不额外泛化 Oracle

- 状态：`active`
- 决策：本地不额外把 Oracle 用作通用 QA、代码质量检查或“为了完整
  再看一遍”；只有上游流程要求，或普通证据仍无法裁决结构决策时调用。
- 验收：Oracle 委托写明唯一架构、安全、并发或迁移决策；普通 review
  使用最低足够 reviewer。

### D-011 独立 ready 任务预算内同回合并发派发

- 状态：`active`
- 决策：每个 dispatch wave 开始时，按并发预算在同一回合 fan-out 独立 ready task；已派发的独立任务互不阻塞；任何 delegation 返回后完成该 task 的逐 task 验收与 checkbox 更新，才能补位派发新任务；依赖该产物的 task 仅在其 ACCEPTED 后可派发。单轮派发量 = min(ready set, 并发预算)。上游逐 task 验收节奏不变（S-002 边界不破）。
- 验收：scorecard 显示后台派发率 >0；不存在「验证未完成即阻塞无依赖 ready task」的串行门；canary 执行初始预算 2。

### D-012 冻结验收契约与复审分级

- 状态：`active`
- 决策：实施 task 携带冻结 acceptance_contract（条目含稳定 ID、二元条件、证据与证据作用域）；executor、reviewer 与验收 oracle 注入同一份原文。首次复审与高风险门禁（公共接口、并发、迁移、安全）永远 INITIAL 全量；低风险增量复审仅在前置 INITIAL 全绿后启用。PASS carry-over 在证据作用域工具化（文件清单/diff 求交由脚本计算）前默认关闭。契约修订 append-only。审查产生的注（含 Oracle `handoff-to-momus`）由计划修订者处置：被采纳的注落到具体 acceptance_contract 条目或检查点断言，未落位视为审查未闭环；丢弃的注记录一句理由。
- 验收：REJECT 的不变量必须已在冻结清单或触发契约修订；不存在由模型手算作用域交集产生的 PASS 携带。

### D-013 计划可执行性前置门

- 状态：`active`
- 决策：计划定稿前由规划侧派廉价执行子代理实跑终态验收命令做基线预验，证据（命令/退出码/失败摘要/disposition）单行记入「检查点与集成」，不设专用模板区块；规划侧无法派发时标注「基线未验」交 Atlas 首个 wave 前补验。并发矩阵存在性、形状与可消费性仍由 plan-linter 脚本 lint 子命令机械校验，linter 非零时 momus 以官方 [REJECT] 类别阻断。拓扑分层：单 writer 单 lane 的计划可写 `cohorts: none`；存在两个可同时 ready 的 write task、跨 lane、共享可变资源或高风险门禁时矩阵强制完整。
- 验收：基线证据由子代理/Atlas 实跑输出产生，不由模型自报；wave 1 前 Atlas 无条件补验。（2026-08-20 修订：原「Baseline Gate 模板区块+工具四字段+命令同一性机械检查」轻量化为子代理预验，用户裁决避免通用模板负担。）

### D-014 计划与执行账本物理分离

- 状态：`active`
- 决策：计划文档只含静态契约区块；checkbox、回执、尝试次数、review 结论等动态状态写入独立 append-only 执行账本（条目带 revision 锚），会话恢复 = 重放尾部，禁止原地编辑。主上下文只保留活动 cohort 的紧凑索引。
- 验收：计划文件在执行期不因状态更新而膨胀；崩溃续走能从账本尾部重建状态。

### D-015 治理改动必须可证伪

- 状态：`active`
- 决策：影响执行行为的治理改动（prompt、路由、门禁）落地时必须附带 scorecard 度量项与至少一个 canary 执行对照；分析会话标注 prompt 文件 hash 以支持归因。
- 验收：改动前后各有可比较的同口径指标；无度量的治理改动不进入「已验证」状态。

### D-016 不可拆重任务路由下限

- 状态：`active`
- 决策：不可再拆且需要跨 package 推理、多 lane 汇合诊断或多门禁族根因裁决的 task 不得低于 `unspecified-high`；纯确定性汇合与固定命令执行可保持 low/quick；计划外 remediate lane 同此 REMAP 标准，不得把不同 owner 的失败捆成同步任务包。
- 验收：派发记录中重任务无低价路由；remediate lane 按 failure family 拆分。

### D-017 落地双审修正包

- 状态：`active`
- 决策：C1-C6 落地后经 Oracle 一致性验收与 Metis 盲区复扫的修正——并发预算单一来源（矩阵可声明 `concurrency_budget` 覆盖默认 3/4，atlas/prometheus/执行 skill 三方对齐，canary 预算以计划字段承接）；`cohorts: none` 按单 writer 单 lane 判定（允许串行多 task，不按 task 数）；「checkbox 更新」指向账本 append 事件、计划正文只读；红 baseline 例外放行 disposition 唯一映射的 remediation task；计划修订记录迁入账本（正文严格五区块）；DELTA 复审补 `CARRIED` 状态与资格证据字段。
- 验收：三方预算措辞一致；旧格式计划在 linter v2 下 fail-closed；DELTA 模式存在合法完整 PASS 路径。

### D-018 提示词与脚本解耦；机械校验仅显式触发

- 状态：`active`
- 决策：prompt 文件不引用脚本路径、命令行或工具名；计划阶段不得自动运行任何校验脚本（规划成本失控教训：机械门槛一律不进 prometheus/momus 的送审链）。计划的结构修复与规范化唯一入口是显式调用 `/repair-plan` command；机械检查（若有）在该 command 流程内按其自身 schema 执行。
- 验收：grep prompts 正文无 `plan-linter|\.mjs|lint` 命令行或工具名；prometheus/momus 送审链零脚本前置。

### D-019 高精度审查线性串行

- 状态：`active`
- 决策：高精度审查按 Oracle → Momus 线性串行送审（用户裁决顺序），不并行派发双审；Oracle 返回 `OKAY` 前不送 Momus——架构与方向层裁决先闭合，再做结构可执行性审。任一 reviewer 触发修订即产生新版本、既有 verdict 失效，回到 Oracle 重审；最终通过 = 两份 `OKAY` 绑定同一计划版本。仅约束本地双审门的送审顺序，不改变上游各 reviewer 的职责与复审轮次（S-003 边界不变）。
- 验收：送审记录中 Momus 委托不早于 Oracle `OKAY`；修订后不存在沿用旧版本 verdict 的通过。

### D-020 计划审查分工与收敛三段式

- 状态：`active`
- 决策：计划审查双 reviewer 分工收敛（mitm 计划 5 轮 Oracle 循环 $12/41min 教训：无收敛条件+每轮全新会话重扫+显微架构同权重）——Oracle 只阻断架构层大雷（执行期无法自救且测试无法拦截级），显微级发现以 `handoff-to-momus` 非阻断建议移交；Momus 承接机械维度穷举（类型/单位/字段映射/调用方/文件归属/命令可执行性/契约-AC 一致性，完整审查委托逐维标注不允许遗漏）。每个 reviewer 环节内部三段式收敛：初审（干净上下文新会话）→ 修订后温链复审（续用原会话，只核闭合与 diff 新矛盾；不可续用时注入审查胶囊）→ 干净终审（新会话一次性复查，无雷即闭合）。温链复审默认 1 轮、最多 2 轮，超限停止循环升级用户裁决；reviewer 间仍线性 Oracle→Momus（D-019），跨 reviewer 回退合计计入温链上限。落点分工见 README「维护规范」。
- 验收：送审记录无超上限审查循环；温链轮复审不重读全文（input 显著低于初审）；Oracle 显微发现以 handoff 建议出现在 Momus 核对清单。

### D-021 测试任务组织与路由

- 状态：`active`
- 决策：测试时序由 Momus 在计划审查时裁决，Prometheus 不自行判定，只把裁决落进计划正文（测试组织写在 Task 契约里）。判据——测试是「定义行为」还是「确认行为」。四问：①不读实现能否写测试 ②失败是否静默 ③是否语义变更/修复 ④是否仅模式复制。命中前三任一 → test-first；仅模式复制 → tests-after；其余默认 tests-after。
  - 挂载通道：test-first 裁决以官方 QA Scenario Executability 类表达——命中的 task 计划中无前置红测试 task 时，其 QA 场景无法满足上游 failing-first proof，报 blocker 并要求拆出；tests-after 裁决为非阻断建议。
  - 三段组织：前置红测试 task（验收=测试红 + 逐条契约 ID 对号 + 语义抽查）；实现 task（完成标准=前置红测试全绿）；后置补测试 task（按需可选，不作为实现验收前置）。
- 边界：前置红测试是契约行为的可执行规格，实现 task 不重写等价测试，只补实现过程中新暴露的必要断言；语义抽查=核对断言与契约条目语义一致，不过则走契约修订或测试修复（append-only）；测试 task 路由不得高于 `unspecified-low`，与实现 task 分离派发（禁止同一 worker 兼任）；tests-after 不削弱 failing-first proof（走 Manual-QA 通道）。与上游 ulw-plan「Implementation + Test = ONE todo」的差异仅在于 test-first 命中时前置红测试 task，实现 task 仍含直接测试；上游更新后重新核对。
- 验收：test-first 任务测试先行、实现随后；tests-after 任务附判据依据。

### D-022 风险特征路由下限

- 状态：`active`
- 决策：除 D-016 外，task 命中以下任一风险特征时路由不得低于 `unspecified-high`，且 `WHY_NOT_LOWER_COST` 必须点名低一档缺的能力：lifecycle 恰好一次动作；生产装配点（注册/接线点）语义变更；需先钉住错误被吞没的现状（baseline 表征测试）。案例：scheduled-model-block T2（ACK 2s 超时吞错 → 抛错+回滚）。
- 验收：命中风险特征的 task 派发记录无低于 `unspecified-high` 的路由；`WHY_NOT_LOWER_COST` 点名具体能力缺口。

### D-023 计划成本效率

- 状态：`active`
- 决策：
  - lane 收敛：lane 数 ≤ 可独立验收/发布的 owner 数 + 唯一 integration lane，不得因文件多或任务多开 lane；机械任务共享 lane。每个 parallel wave 须附墙钟论证：串行和 vs max(并行)+启动税（新 worktree 的环境初始化与基线验证成本）×lane 数，启动税大于并行节省时并入现有 lane。
  - 审查成本门槛：审查墙钟估算 > 执行墙钟估算 50% 时，须 `WHY_HIGH_REVIEW_COST` 点名该轮审查对执行的价值；否则降级审查 lane（Oracle 架构预检降 Momus 单审、温链复审降 diff-only）。成本问题只降 lane、不加轮。
  - 证据强度与宣称一致：检查点断言须标注证据强度（集成实测/切片单测拼装/类型检查），不得宣称高于证据强度（切片单测拼装的链不得宣称 E2E；需要 E2E 须显式加入范围）。
- 验收：plan 的并行 wave 有墙钟论证；超门槛审查有 `WHY_HIGH_REVIEW_COST` 或已降级；检查点断言与证据强度一致。

## 已废弃决策

### S-001 本地优先级声明

- 状态：`superseded`
- 已废弃：在 prompt 中写“冲突时以本文件为准”或显式覆盖上游条款。
- 替代：D-001，只做兼容补强，冲突时调整本地。

### S-002 以批量验收替代上游最低节奏

- 状态：`superseded`
- 已废弃：用本地触发式批量验收替代上游逐 task 验收或 checkbox 节奏。
- 替代：保留上游最低验收节奏，本地 checkpoint 只增加更强 gate。

### S-003 固定 reviewer 流程

- 状态：`superseded`
- 已废弃：用本地固定 reviewer 顺序或并发方式替换上游审查流程。
- 替代：保留上游 reviewer 选择与流程；本地只过滤低价值建议，并保护
  用户决策边界。

### S-004 任意拆分实现与直接测试

- 状态：`superseded`
- 已废弃：仅凭说明理由，将实现与其直接测试拆成不同 task。
- 替代：实现、直接测试与必要调用方保持同一 task/todo，只遵循上游明确允许的例外。

## 维护流程

1. 修改角色 prompt 前，先读本文件和 README 的上游兼容基线。
2. 对新增约束核对上游：上游已有则不写；未定义且兼容时才本地补强。
3. 上游版本变化后重新核对所有 `active` 决策；冲突时先调整本地文件，
   再更新兼容基线。
4. 用户新增、修正或废弃长期偏好时同步本文件；不记录临时排障过程、
   一次性猜测或审查日志。
5. 行为、文件索引或运行方式变化时同步 README；全局治理变化按脚本
   同步 `runtime/AGENTS.md` 到运行时副本。
