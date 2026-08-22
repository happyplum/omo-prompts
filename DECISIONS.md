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
- 决策：Atlas 承担角色开始执行协调前，先加载 `omo-adaptive-execution`，
  成功后再加载 `omo-atlas-execution-constraints`，此前不读取计划、
  不操作文件、不派发；启动门不以任何工具调用或计划读取为条件前置，
  与 Prometheus / Momus 的启动门同格式。
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
- 修订（2026-08-22，D-031）：验收节奏改为节点统一召回——预算内持续 fan-out 补位，验收集中在 wave 末/检查点/依赖解锁前/终态排水；预算上限（运行中+未验收）仍为强制背压。

### D-013 计划可执行性前置门

- 状态：`active`
- 决策：计划定稿前由规划侧派廉价执行子代理实跑终态验收命令做基线预验，证据（命令/退出码/失败摘要/disposition）单行记入「检查点与集成」，不设专用模板区块；规划侧无法派发时标注「基线未验」交 Atlas 首个 wave 前补验。并发矩阵存在性、形状与可消费性仍由 plan-linter 脚本 lint 子命令机械校验，linter 非零时 momus 以官方 [REJECT] 类别阻断。拓扑分层：单 writer 单 lane 的计划可写 `cohorts: none`；存在两个可同时 ready 的 write task、跨 lane、共享可变资源或高风险门禁时矩阵强制完整。
- 验收：基线证据由子代理/Atlas 实跑输出产生，不由模型自报；wave 1 前 Atlas 无条件补验。（2026-08-20 修订：原「Baseline Gate 模板区块+工具四字段+命令同一性机械检查」轻量化为子代理预验，用户裁决避免通用模板负担。）

### D-014 计划与执行账本物理分离

- 状态：`active`
- 决策：计划文档只含静态契约区块；checkbox、回执、尝试次数、review 结论等动态状态写入独立 append-only 执行账本（条目带 revision 锚），会话恢复 = 重放尾部，禁止原地编辑。主上下文只保留活动 cohort 的紧凑索引。
- 验收：计划文件在执行期不因状态更新而膨胀；崩溃续走能从账本尾部重建状态。
- 修订（2026-08-22，D-032）：task 行勾选状态随 `ACCEPTED` 投影为 `- [x]`（属计划正文当前生效投影），其余动态状态仍只在账本。

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
- 修订（2026-08-22，D-031）：双审不再默认执行——计划审查由用户手动触发，选择不审 / 单审 Momus / 双审 Oracle→Momus；选中双审时本条串行规则仍适用。

### D-020 计划审查分工与收敛三段式

- 状态：`active`
- 决策：计划审查双 reviewer 分工收敛（mitm 计划 5 轮 Oracle 循环 $12/41min 教训：无收敛条件+每轮全新会话重扫+显微架构同权重）——Oracle 只阻断架构层大雷（执行期无法自救且测试无法拦截级），显微级发现以 `handoff-to-momus` 非阻断建议移交；Momus 承接机械维度穷举（类型/单位/字段映射/调用方/文件归属/命令可执行性/契约-AC 一致性，完整审查委托逐维标注不允许遗漏）。每个 reviewer 环节内部三段式收敛：初审（干净上下文新会话）→ 修订后温链复审（续用原会话，只核闭合与 diff 新矛盾；不可续用时注入审查胶囊）→ 干净终审（新会话一次性复查，无雷即闭合）。温链复审默认 1 轮、最多 2 轮，超限停止循环升级用户裁决；reviewer 间仍线性 Oracle→Momus（D-019），跨 reviewer 回退合计计入温链上限。落点分工见 README「维护规范」。
- 验收：送审记录无超上限审查循环；温链轮复审不重读全文（input 显著低于初审）；Oracle 显微发现以 handoff 建议出现在 Momus 核对清单。
- 修订（2026-08-22，D-031）：三段式收敛压缩为初核全量 + 温链 diff 复审 + 闭合（干净终审并入闭合条件）；reviewer 分工与 handoff 机制保留。

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

### D-024 账本与代码索引锚定主目录

- 状态：`active`
- 决策：
  - 执行账本 `<plan>.ledger.md` 只保留在主目录（计划所在目录），不复制到 worktree；全部 append 统一写入主目录账本，worktree 内不产生账本副本。
  - 当前目录为 git worktree 时，禁用主目录的 codegraph 索引（不向 codegraph 工具传主目录 `projectPath`），改用 worktree 内 grep/read 或自建索引。
- 验收：worktree 内无账本副本；worktree 会话中不存在指向主目录的 codegraph 调用。

### D-025 验收契约初始基线与三级现场裁决

- 状态：`active`
- 决策：验收契约由「批准后永久冻结、变化即重新规划」改为「初始基线 + 执行期三级现场裁决」。实施 task 的 acceptance_contract 以 `contract_revision: 0` 为初始基线：稳定条目 `ID` 从不复用，语义替换以 `supersedes` 关系表达；executor、reviewer 与验收 oracle 仍注入同一份当前生效契约原文与 `checklist_hash`；契约修订保持 append-only。执行期变化按三级裁决——Tier 1 现场放行：Atlas 裁决并 append 账本 `plan_revision`，仅限可由证据当场证明语义保持的类别（同一行为意图的 scope 扩展、断言单调加强、测试证据补充、机械步骤、等价或更强的检查点命令替换、锚与元数据订正、既有 REMAP 权限内的路由调整）；Tier 2 由 Oracle 裁决：验收语义变化、preference 降级、影响契约的 task 拆分/合并，及任何无法证明为 Tier 1 的变化，先收集普通证据，仅客观上无法证明 Tier 1 时才必须咨询；疑似 Tier 3（core 需求、明确用户指令、公共契约、安全边界、non-goal）停止并问用户，Oracle 不得替代用户。结构性拆分/合并/owner/依赖/顺序调整仍属证据驱动 REMAP，不构成契约裁决；触及 task 清单或并发矩阵的结构性 REMAP 须先通过项目既定的机械结构校验。复审规则承接：首次复审与高风险门禁永远 INITIAL 全量，PASS 携带以证据作用域工具化为前提；Tier 2 / Tier 3 及高风险变化强制 INITIAL，Tier 1 仅在前置 INITIAL 存在、变更条目全部实际评估、未变更条目有工具化 `CARRIED` 时允许 DELTA；Oracle 回执只是修订前门禁，契约修订后须由新的独立验证者重新验收。`ACCEPTED` 绑定（`artifact_revision`、`contract_revision`、`checklist_hash`）三元组，任一变化即回 `COLLECTED`，契约修订同时使受影响 task 的检查点证据失效。计划正文承载当前生效投影，账本承载 append-only 历史；正文与账本头部摘要不一致即 fail-closed，停止派发、验收与恢复。执行期审查注由 Atlas 按三级裁决现场处置，不再一律回到计划修订者。
- 验收：本改动按 D-015 附证伪条件——3 个 canary（Tier 1 scope 扩展、Tier 2 语义变化、Tier 3 公共契约各一例）且分析会话记录 `prompt_rev`；scorecard 至少 4 项度量：自主裁决率、Tier 1 误判升级率、计划/账本摘要不一致次数、修订后再验收合规率。
- 修订（2026-08-22，D-031）：INITIAL/DELTA/CARRIED/NOT_EVALUATED 复审分级与 review packet 体系删除，复审统一为温链 diff-only；三级裁决、CAS 三元组、append-only 与 fail-closed 保留。

### D-026 计划标明主分支路径与巡查 env 复制

- 状态：`active`
- 决策：
  - `vcs: git` 的计划必须在 `workspaces` 标明主分支及计划文件、账本在
    主分支下的存放路径；worktree lane 自该主分支创建，计划与账本权威
    版本只保留在主工作区该路径，lane 内不建副本（补足 D-024 的定位标注）。
  - 含「启动服务进行手动视觉巡查或人工运行时验证」的 task，计划必须
    写明从主工作区复制项目相应 env 文件到目标 workspace（逐个列出
    文件名、源路径与目标路径），复制动作列入该 task 的 `环境 preflight`；
    计划只写路径不写机密值。
- 验收：git 计划的 `workspaces` 含主分支与主分支下计划/账本存放路径；
  视觉巡查类 task 的 `环境 preflight` 含 env 复制条目且正文无机密值。

### D-027 计划结构单一标准 skill 化

- 状态：`active`
- 决策：
  - 计划结构体系（五个静态区块、各区块 schema、并发矩阵结构约束含
    lane 上限、任务原子性契约、Task 契约字段、workspaces 声明含
    D-026 主分支与 env 复制、检查点声明与基线预验证据格式、
    计划/账本分离）迁入 skills 仓 `omo-plan-structure` 作为单一标准。
  - Prometheus 开始规划工作前、Momus 开始审查任何计划版本前必须先
    加载该 skill；两个 prompt 不再各自复制结构 schema（含字段枚举、
    结构约束示例与原子性定义），结构类不一致以 skill 裁决。生成方法
    与审查裁决规则仍留在各自 prompt。
- 验收：两 prompt 均含会话启动门且无结构 schema 复制残留；skill 含
  五区块完整 schema；后续字段增改只改 skill 一处，prompt 不再出现
  字段名漂移（如 `内聚结果` / `行为验收` 旧名）。

### D-028 Momus 拆解与并发增强分析

- 状态：`active`
- 决策：
  - 并行准入六条件迁入 `omo-plan-structure`，与任务原子性契约同级
    共享；Prometheus 组织 wave 与 Momus 识别并发使用同一准入标准。
  - Momus 在结构核对外附加建设性分析：逐 task 反事实拆解（能否进
    一步拆出独立可发布/验收/回退的结果）与并发识别（被无证据串行化
    的 task、cohort 归属与 wave 重组建议）。产出为非阻断建议、不新
    设 blocker 类别，与 blocker 同粒度输出，随初审执行，复审仅对
    diff 引入的新捆绑/串行化增量补做。
- 验收：两 prompt 引用同一准入标准且无六条件复制残留；Momus 建议可
  被计划方直接落位（拆分边界+验收 / cohort / wave 重组），无建议被
  升级为 blocker 的记录（除非独立命中官方四类判据）。

### D-029 移除蜂群概念，收敛为最小化拆解与低档并行

- 状态：`active`
- 决策：
  - 上级已把并行约束为目标形态：上游 `start-work` sizing 规则要求可
    独立拆的工作用 `quick` / `unspecified-low` 低档 worker 单批并行、
    共享同一推理的工作保持整体不强行拆分；全局 `AGENTS.md` 以反过度
    工程与原子派发约束派发规模。本地「蜂群」术语不承载额外行为，只
    剩最大化代理数的误导暗示，全面移除。
  - 替代表述：拆解以任务内聚与原子性契约为限（最小化拆解，不为并行
    制造任务）；相互独立的 task 用最低足够档位 worker 并发执行，不追
    求代理数量。该立场由 `omo-adaptive-execution` 概述承载，各 prompt
    只保留各自的行为规则。
  - cohort 归属、并行准入六条件、lane 上限与 `concurrency_budget`
    预算体制不变。
- 验收：除本条历史记载外，本地 prompts 与 skills 全文无「蜂群」残留；
  未新增数值上限、门禁或 reviewer 要求。

### D-030 经济路由、失败升档与测试链流水

- 状态：`active`
- 决策：
  - 经济优先 sizing：内聚单元超出 `quick` / `unspecified-low` 可执行
    尺寸时，优先沿独立 owner / failure family / 可独立验收边界继续拆
    小；共享同一推理、不可拆的直接路由高档（D-016 / D-022 下限不
    变），不用低档硬试。由 `omo-plan-structure` 原子性契约承载。
  - 失败升档协议：归因前置排除缺上下文/依赖/环境后仅能力不足升档；
    `quick → unspecified-low → unspecified-high` 线性，之上按失败性
    质选 `deep` / `ultrabrain`；升档前复核不可拆、补
    `WHY_NOT_LOWER_COST`、新会话注入断点胶囊续用原 `task_id`；每次
    升档计入补救预算（默认 2 次），顶档仍失败转 blocked / oracle /
    用户。由 `omo-adaptive-execution` 承载。
  - 路由明确性审查：Momus 初审穷举维度新增矩阵 route 三选一核对、
    `load_skills` 匹配与高价路由举证核对。
  - Task 契约精简：写域三字段（`允许输入` / `唯一可写产物` /
    `禁止范围`）合并为 `写域`（读域由上下文胶囊承载）；删除与
    acceptance_contract 重复的 `可观察验收` / `必要证据`；删除
    `终止状态`（blocked 附断点胶囊的 worker 义务移入
    `omo-adaptive-execution` 委托契约）；`环境 preflight` 改条件字段
    （D-026 场景保留）。
  - 测试链流水：wave 从类型批次（同类归同 wave、wave 间串行）改为
    依赖就绪分组，`test-freeze` 可与写域互斥的 `impl` 同 wave 并行，
    测试链按 task 流水；最小波数约束防碎片化。
  - 研究溯源：TDD 四问判据与 Fucci et al.（ICSE 2017：test-first/
    test-last 整体差异小、循环粒度关键）及 Nagappan et al.（2008：
    工业案例缺陷密度 -40~90%）结论吻合，momus 判据不改；Cognition
    「共享推理不拆、上下文碎片化」与编排 pipeline 模式支持 sizing
    与流水裁决。
- 验收：两仓 grep 无被删字段名与「同类 task 归同 wave」残留；断点
  胶囊义务在 skill 委托契约有载体；Task 契约字段清单单一来源。
  canary 对照按 D-015 待首个真实计划执行时补。

### D-031 治理栈减负（节点统一召回与判据化）

- 状态：`active`
- 决策：
  - 验收节奏：删除「每个 delegation 返回先完成四阶段验证与 checkbox
    更新才能补位」的逐任务仪式；预算内持续 fan-out，验收集中在 wave
    末、检查点、依赖解锁前、终态排水四类节点；预算口径（运行中写入
    worker + 未验收产物，默认 3/4）为强制背压；高风险边界完成即验收。
  - 状态机与复审简化：COLLECTED→VERIFYING→ACCEPTED 三态收敛为
    `ACCEPTED(revision)` 单门；删除 INITIAL/DELTA/CARRIED/
    NOT_EVALUATED/review packet 体系，复审统一温链 diff-only；CAS
    三元组（artifact_revision/contract_revision/checklist_hash）保留。
  - 账本精简：task 条目 15→7 字段，`plan_revision` 事件 ~20→7 字段；
    摘要一致 fail-closed 保留。
  - 计划审查用户触发：Prometheus 计划完成后询问用户选择不审 / 单审
    Momus / 双审 Oracle→Momus，命中高风险特征建议双审。
  - AGENTS.md 减半重构：195→约 75 行，六套规则并为四节，流程性条款
    改判据性条款，细则由 skills 承载。
  - 计划正文减重：删逐 wave 差异式举证（矩阵 + 一行声明），Prometheus
    章节压缩约三分之一；wave 为依赖就绪集合（D-030）不变。
  - 参照：Codex/Claude 编排模式（controller 侧验证、并行 fan-out +
    统一收集）；Codex 社区「compaction 丢验收目标→无限循环」证明
    acceptance_contract 持久化必须保留；「orchestrator 频繁打断子代理」
    证明逐 task 验收节奏应废弃。
- 验收：核心栈行数 AGENTS ~75 / atlas ~105 / prometheus ~95 /
  adaptive-execution ~150；grep 无「四阶段验证、INITIAL、DELTA、
  CARRIED、NOT_EVALUATED、review packet」残留（本文件历史记载除外）；
  `sync-agents.ps1 -Check` 通过。

### D-032 计划产物格式减负（分级与字段精简）

- 状态：`active`
- 决策：
  - 计划分级：≤3 task、单 lane、未命中高风险特征（公共接口/契约
    变化、架构或数据结构变化、不可逆动作、权限/安全边界——分级
    唯一判源）走轻量三节（摘要含 core 缺省与假设子行、节尾 Workspaces
    一行 / 任务清单 / 终态验收含具名 gate 与 F1 行）；否则完整五
    区块。执行期超判据以一次 `topology_remap` 升格重排，条目 ID 与
    `checklist_hash` 不变。
  - Task 契约字段 10 → 5：标题行（`[test-freeze]`/`[test-supplement]`/
    `[integration]` 前缀替代 step_type）+ 路由行（`Recommended task
    executor category:` 字面前缀保留作上游锚，execution_mode 同行
    括注）+ 上下文胶囊 + 验收条目 + 写域 + 条件字段（环境
    preflight / reviewer 安排 / 放弃-风险判据）。
  - 验收条目机械语法：`- <ID>：<二元条件> → 命令=<命令> 预期=<结
    果>` 一行一条；`checklist_hash` = 条目按 ID 排序的原文行串接；
    高风险 task 追加 `scope=`（Tier 1 scope 扩展参照落点改写域 +
    scope）。CAS 三元组与 append-only 不变。
  - 拓扑唯一事实源 = 并发矩阵（列含 owner，账本 owner 取矩阵值）；
    Task 契约删除硬前驱/owner/lane/验证命令/目的，验收只写一遍。
  - 计划级通用约定（通用禁止、终止状态断点胶囊、package_manager、
    默认 load_skills）以 Task 契约区块引言一次承载。
  - 参考吸收：摘要「假设」子行与「不做的事」、计划级一行提交意
    图、放弃/风险判据（预授权 revert 触发线）、收尾 gate 具名。
  - 体积判据：固定字段仪式 ≤5 行/task、验收每条 1 行，task 参考
    区间 12-20 行；胶囊密度不设上限。
- 上游差异说明（D-021 先例式记录）：本地计划不经上游 scaffold 生
  成，上游模板结构自检不适用；todo 级 Commit/QA 行由验收条目与执
  行期提交治理承接（上游 start-work 不消费 todo 级 Commit 行，已核
  实）；task 行保留上游 checkbox 语法与 category 字面前缀。
- 验收：两仓 grep 无旧字段残留（step_type/验证命令/QA happy 等，
  本文件历史记载除外）；checklist_hash 切分语法在 skill 单一定义；
  轻量 Workspaces 一行含最小字段集（vcs/mode/主分支+路径或
  authorization_source，worktree 时含 lane 路径与分支）；plan-linter
  （若存在）schema 对新格式核对通过，未落地则豁免。

## 已废弃决策

### S-001 本地优先级声明

- 状态：`superseded`
- 已废弃：在 prompt 中写“冲突时以本文件为准”或显式覆盖上游条款。
- 替代：D-001，只做兼容补强，冲突时调整本地。

### S-002 以批量验收替代上游最低节奏

- 状态：`superseded`
- 已废弃：用本地触发式批量验收替代上游逐 task 验收或 checkbox 节奏。
- 替代：保留上游最低验收节奏，本地 checkpoint 只增加更强 gate。
- 补注（2026-08-22，D-031）：节点统一召回保留依赖 ACCEPTED 门与高风险逐 task 验收，与曾废弃的纯批量验收不同，不构成回退。

### S-003 固定 reviewer 流程

- 状态：`superseded`
- 已废弃：用本地固定 reviewer 顺序或并发方式替换上游审查流程。
- 替代：保留上游 reviewer 选择与流程；本地只过滤低价值建议，并保护
  用户决策边界。

### S-004 任意拆分实现与直接测试

- 状态：`superseded`
- 已废弃：仅凭说明理由，将实现与其直接测试拆成不同 task。
- 替代：实现、直接测试与必要调用方保持同一 task/todo，只遵循上游明确允许的例外。

### D-012 冻结验收契约与复审分级

- 状态：`superseded`
- 已废弃：验收契约批准后永久冻结、任何变化都冻结后重新规划的做法。
- 替代：D-025，初始基线 + 三级现场裁决；reviewer 边界、INITIAL / DELTA 分级与独立验证要求由 D-025 承接。

## 维护流程

1. 修改角色 prompt 前，先读本文件和 README 的上游兼容基线。
2. 对新增约束核对上游：上游已有则不写；未定义且兼容时才本地补强。
3. 上游版本变化后重新核对所有 `active` 决策；冲突时先调整本地文件，
   再更新兼容基线。
4. 用户新增、修正或废弃长期偏好时同步本文件；不记录临时排障过程、
   一次性猜测或审查日志。
5. 行为、文件索引或运行方式变化时同步 README；全局治理变化按脚本
   同步 `runtime/AGENTS.md` 到运行时副本。
