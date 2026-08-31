# 用户需求与决策

本文件记录会持续影响本仓库 prompt 行为的用户决策与行为裁决，是本仓
决策入口；修改角色行为前先核对其中的 `active` / `superseded` 状态。
它只保存本地增量偏好与已废弃方向，不复制上游完整规则。
纯维护规范（写作标准、提交流程、结构约定）不记录于此，直接维护在
README 的「维护规范」节。
上游行为事实以 README 中的固定兼容基线为准。
skills 仓的 skill 行为决策由该仓自己的 DECISIONS.md 独立承载，本文件
不记录 skill 行为裁决。

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
- 修订（2026-08-25，D-030）：双审模式下的 Oracle 委托以 `omo-plan-review`
  注入的架构层大雷判据为审查范围（非单一决策咨询形态）；本条验收的
  「唯一决策」仅指咨询形态委托。

### D-008 独立 ready 任务预算内同回合并发派发

- 状态：`active`
- 决策：每个 dispatch wave 开始时，按并发预算在同一回合 fan-out 独立 ready task；已派发的独立任务互不阻塞；任何 delegation 返回后完成该 task 的逐 task 验收与 checkbox 更新，才能补位派发新任务；依赖该产物的 task 仅在其 ACCEPTED 后可派发。单轮派发量 = min(ready set, 并发预算)。上游逐 task 验收节奏不变（S-002 边界不破）。
- 验收：scorecard 显示后台派发率 >0；不存在「验证未完成即阻塞无依赖 ready task」的串行门；canary 执行初始预算 2。
- 修订（2026-08-22，D-026）：验收节奏改为节点统一召回——预算内持续 fan-out 补位，验收集中在 wave 末/检查点/依赖解锁前/终态排水；预算上限（运行中+未验收）仍为强制背压。
- 修订（2026-08-26，D-039）：节点统一召回废止，验收回归上游「验证过即勾选」逐 task 节奏；预算 fan-out 与背压口径保留。

### D-009 计划可执行性前置门

- 状态：`active`
- 决策：计划定稿前由规划侧派廉价执行子代理实跑终态验收命令做基线预验，证据（命令/退出码/失败摘要/disposition）单行记入「检查点与集成」，不设专用模板区块；规划侧无法派发时标注「基线未验」交 Atlas 首个 wave 前补验。并发矩阵存在性、形状与可消费性仍由 plan-linter 脚本 lint 子命令机械校验，linter 非零时 momus 以官方 [REJECT] 类别阻断。拓扑分层：单 writer 单 lane 的计划可写 `cohorts: none`；存在两个可同时 ready 的 write task、跨 lane、共享可变资源或高风险门禁时矩阵强制完整。
- 验收：基线证据由子代理/Atlas 实跑输出产生，不由模型自报；wave 1 前 Atlas 无条件补验。（2026-08-20 修订：原「Baseline Gate 模板区块+工具四字段+命令同一性机械检查」轻量化为子代理预验，用户裁决避免通用模板负担。）
- 修订（2026-08-25，D-033 统筹审计）：①「plan-linter 机械校验」条款已被 D-014 废止（机械门槛不进送审链），本条不再包含 lint 送审；②基线预验派 quick 档执行子代理超出上游 `ulw-plan` 只读委托白名单，为经裁决的有意豁免，记入 README 已裁决相抵点。

### D-010 计划与执行账本物理分离

- 状态：`active`
- 决策：计划文档只含静态契约区块；checkbox、回执、尝试次数、review 结论等动态状态写入独立 append-only 执行账本（条目带 revision 锚），会话恢复 = 重放尾部，禁止原地编辑。主上下文只保留活动 cohort 的紧凑索引。
- 验收：计划文件在执行期不因状态更新而膨胀；崩溃续走能从账本尾部重建状态。
- 修订（2026-08-22，D-027）：task 行勾选状态随 `ACCEPTED` 投影为 `- [x]`（属计划正文当前生效投影），其余动态状态仍只在账本。
- 修订（2026-08-26，D-039）：执行账本载体由 `<plan>.ledger.md` 改为上游 `.omo/start-work/ledger.jsonl`；只追加、重放恢复、紧凑索引原则不变；勾选投影随验证通过（`AdversarialVerify` confirmed）。

### D-011 治理改动必须可证伪

- 状态：`active`
- 决策：影响执行行为的治理改动（prompt、路由、门禁）落地时必须附带 scorecard 度量项与至少一个 canary 执行对照；分析会话标注 prompt 文件 hash 以支持归因。
- 验收：改动前后各有可比较的同口径指标；无度量的治理改动不进入「已验证」状态。

### D-012 不可拆重任务路由下限

- 状态：`active`
- 决策：不可再拆且需要跨 package 推理、多 lane 汇合诊断或多门禁族根因裁决的 task 不得低于 `unspecified-high`；纯确定性汇合与固定命令执行可保持 low/quick；计划外 remediate lane 同此 REMAP 标准，不得把不同 owner 的失败捆成同步任务包。
- 验收：派发记录中重任务无低价路由；remediate lane 按 failure family 拆分。

### D-013 落地双审修正包

- 状态：`active`
- 决策：C1-C6 落地后经 Oracle 一致性验收与 Metis 盲区复扫的修正——并发预算单一来源（矩阵可声明 `concurrency_budget` 覆盖默认 3/4，atlas/prometheus/执行 skill 三方对齐，canary 预算以计划字段承接）；`cohorts: none` 按单 writer 单 lane 判定（允许串行多 task，不按 task 数）；「checkbox 更新」指向账本 append 事件、计划正文只读；红 baseline 例外放行 disposition 唯一映射的 remediation task；计划修订记录迁入账本（正文严格五区块）；DELTA 复审补 `CARRIED` 状态与资格证据字段。
- 验收：三方预算措辞一致；旧格式计划在 linter v2 下 fail-closed；DELTA 模式存在合法完整 PASS 路径。
- 修订（2026-08-26，D-039）：CAS 三元组与 `checklist_hash` 废除（完成判定回归 DoneClaim/AdversarialVerify）；并发预算单一来源条款保留。

### D-014 提示词与脚本解耦；机械校验仅显式触发

- 状态：`active`
- 决策：prompt 文件不引用脚本路径、命令行或工具名；计划阶段不得自动运行任何校验脚本（规划成本失控教训：机械门槛一律不进 prometheus/momus 的送审链）。计划的结构修复与规范化唯一入口是显式调用 `/repair-plan` command；机械检查（若有）在该 command 流程内按其自身 schema 执行。
- 验收：grep prompts 正文无 `plan-linter|\.mjs|lint` 命令行或工具名；prometheus/momus 送审链零脚本前置。

### D-015 高精度审查线性串行

- 状态：`active`
- 决策：高精度审查按 Oracle → Momus 顺序送审（用户裁决顺序），不并行派发双审；**两阶段各自循环**——Oracle 阶段（`[REJECT]` → 修订 → Oracle 重审）循环至 `OKAY`，Momus 阶段（`[REJECT]` → 修订 → Momus 重审）循环至 `OKAY`；Momus 阶段的修订在 Momus 循环内消化，不回送 Oracle。仅约束本地双审门的送审顺序，不改变上游各 reviewer 的职责与复审轮次（S-003 边界不变）。
- 验收：送审记录中 Momus 委托不早于 Oracle `OKAY`；Momus 阶段修订无回送 Oracle 的记录。
- 修订（2026-08-22，D-026）：双审不再默认执行——计划审查由用户手动触发；选中双审时本条串行规则仍适用。
- 修订（2026-08-25，用户裁决）：废除「任一 reviewer 触发修订回到 Oracle 重审」与「两份 `OKAY` 绑定同一计划版本」的跨阶段绑定——双审明确为先 Oracle 循环通过、再 Momus 循环，各阶段内消化修订；循环与注入协议由 `omo-plan-review` skill 单一承载。

### D-016 计划审查分工与收敛三段式

- 状态：`active`
- 决策：计划审查双 reviewer 分工收敛（mitm 计划 5 轮 Oracle 循环 $12/41min 教训：无收敛条件+每轮全新会话重扫+显微架构同权重）——Oracle 只阻断架构层大雷（执行期无法自救且测试无法拦截级），显微级发现以 `handoff-to-momus` 非阻断建议移交；Momus 承接机械维度穷举（类型/单位/字段映射/调用方/文件归属/命令可执行性/契约-AC 一致性，完整审查委托逐维标注不允许遗漏）。每个 reviewer 环节内部三段式收敛：初审（干净上下文新会话）→ 修订后温链复审（续用原会话，只核闭合与 diff 新矛盾；不可续用时注入审查胶囊）→ 干净终审（新会话一次性复查，无雷即闭合）。温链复审默认 1 轮、最多 2 轮，超限停止循环升级用户裁决；reviewer 间线性 Oracle→Momus（D-015 两阶段循环）。落点分工见 README「维护规范」。
- 验收：送审记录无超上限审查循环；温链轮复审不重读全文（input 显著低于初审）；Oracle 显微发现以 handoff 建议出现在 Momus 核对清单。
- 修订（2026-08-22，D-026）：三段式收敛压缩为初核全量 + 温链 diff 复审 + 闭合（干净终审并入闭合条件）；reviewer 分工与 handoff 机制保留。
- 修订（2026-08-25，D-030）：「跨 reviewer 回退合计计入温链上限」随双审两阶段循环化废除——Momus 阶段修订不回送 Oracle；温链与收敛规则、reviewer 委托注入模板迁入 `omo-plan-review` skill 单一承载。

### D-017 测试时序判定（verdict 附件化）

- 状态：`active`
- 决策：测试时序由 Momus 审查时判定，Prometheus 不做测试任务组织。四问判据不变：①不读实现能否写测试 ②失败是否静默 ③是否语义变更/修复 ④是否仅模式复制；命中前三任一 → `tdd=first`，其余 → `tdd=after`。判定以 verdict 附件输出（`omo-plan-structure` 格式），**不再要求计划拆前置红测试 task、不作为 blocker**；`tdd=first` 由 Atlas 派发时在同一委托内注入「先证红再转绿」（不拆委托），`[EVIDENCE]` 含红绿两段。
- 边界：测试组织回归上游契约（agent-executed QA per todo 与 failing-first proof）；实现、直接测试与必要调用方同属一个 task/todo（上游 ONE todo 模型）；QA 场景核对仍按官方 QA Scenario Executability 执行（验收条目缺命令/预期仍可阻断）。
- 验收：verdict 附件含逐 task `tdd` 判定；`tdd=first` 派发委托含红绿两段证据要求；计划正文无测试专用 task 前缀。
- 修订（2026-08-25，D-030）：落点由「计划拆前置红测试 task + 分离派发（旧条款废除）」改为 verdict 附件直通执行期——时序判定保留（本地增强），任务组织回归上游 ONE todo 模型（Prometheus 减负，用户裁决）。

### D-018 风险特征路由下限

- 状态：`active`
- 决策：除 D-012 外，task 命中以下任一风险特征时路由不得低于 `unspecified-high`，且 `WHY_NOT_LOWER_COST` 必须点名低一档缺的能力：lifecycle 恰好一次动作；生产装配点（注册/接线点）语义变更；需先钉住错误被吞没的现状（baseline 表征测试）。案例：scheduled-model-block T2（ACK 2s 超时吞错 → 抛错+回滚）。
- 验收：命中风险特征的 task 派发记录无低于 `unspecified-high` 的路由；`WHY_NOT_LOWER_COST` 点名具体能力缺口。

### D-019 计划成本效率

- 状态：`active`
- 决策：
  - lane 收敛：lane 数 ≤ 可独立验收/发布的 owner 数 + 唯一 integration lane，不得因文件多或任务多开 lane；机械任务共享 lane。每个 parallel wave 须附墙钟论证：串行和 vs max(并行)+启动税（新 worktree 的环境初始化与基线验证成本）×lane 数，启动税大于并行节省时并入现有 lane。
  - 审查成本门槛：审查墙钟估算 > 执行墙钟估算 50% 时，须 `WHY_HIGH_REVIEW_COST` 点名该轮审查对执行的价值；否则降级审查 lane（Oracle 架构预检降 Momus 单审、温链复审降 diff-only）。成本问题只降 lane、不加轮。
  - 证据强度与宣称一致：检查点断言须标注证据强度（集成实测/切片单测拼装/类型检查），不得宣称高于证据强度（切片单测拼装的链不得宣称 E2E；需要 E2E 须显式加入范围）。
- 验收：plan 的并行 wave 有墙钟论证；超门槛审查有 `WHY_HIGH_REVIEW_COST` 或已降级；检查点断言与证据强度一致。

### D-020 账本与代码索引锚定主目录

- 状态：`active`
- 决策：
  - 执行账本 `<plan>.ledger.md` 只保留在主目录（计划所在目录），不复制到 worktree；全部 append 统一写入主目录账本，worktree 内不产生账本副本。
  - 当前目录为 git worktree 时，禁用主目录的 codegraph 索引（不向 codegraph 工具传主目录 `projectPath`），改用 worktree 内 grep/read 或自建索引。
- 验收：worktree 内无账本副本；worktree 会话中不存在指向主目录的 codegraph 调用。
- 修订（2026-08-26，D-039）：账本主目录路径条款由 `<plan>.ledger.md` 改为上游 `.omo/start-work/ledger.jsonl`；codegraph 锚定主目录条款不变。

### D-021 验收契约初始基线与三级现场裁决

- 状态：`active`
- 决策：验收契约由「批准后永久冻结、变化即重新规划」改为「初始基线 + 执行期三级现场裁决」。实施 task 的 acceptance_contract 以 `contract_revision: 0` 为初始基线：稳定条目 `ID` 从不复用，语义替换以 `supersedes` 关系表达；executor、reviewer 与验收 oracle 仍注入同一份当前生效契约原文与 `checklist_hash`；契约修订保持 append-only。执行期变化按三级裁决——Tier 1 现场放行：Atlas 裁决并 append 账本 `plan_revision`，仅限可由证据当场证明语义保持的类别（同一行为意图的 scope 扩展、断言单调加强、测试证据补充、机械步骤、等价或更强的检查点命令替换、锚与元数据订正、既有 REMAP 权限内的路由调整）；Tier 2 由 Oracle 裁决：验收语义变化、preference 降级、影响契约的 task 拆分/合并，及任何无法证明为 Tier 1 的变化，先收集普通证据，仅客观上无法证明 Tier 1 时才必须咨询；疑似 Tier 3（core 需求、明确用户指令、公共契约、安全边界、non-goal）停止并问用户，Oracle 不得替代用户。结构性拆分/合并/owner/依赖/顺序调整仍属证据驱动 REMAP，不构成契约裁决；触及 task 清单或并发矩阵的结构性 REMAP 须先通过项目既定的机械结构校验。复审规则承接：首次复审与高风险门禁永远 INITIAL 全量，PASS 携带以证据作用域工具化为前提；Tier 2 / Tier 3 及高风险变化强制 INITIAL，Tier 1 仅在前置 INITIAL 存在、变更条目全部实际评估、未变更条目有工具化 `CARRIED` 时允许 DELTA；Oracle 回执只是修订前门禁，契约修订后须由新的独立验证者重新验收。`ACCEPTED` 绑定（`artifact_revision`、`contract_revision`、`checklist_hash`）三元组，任一变化即回 `COLLECTED`，契约修订同时使受影响 task 的检查点证据失效。计划正文承载当前生效投影，账本承载 append-only 历史；正文与账本头部摘要不一致即 fail-closed，停止派发、验收与恢复。执行期审查注由 Atlas 按三级裁决现场处置，不再一律回到计划修订者。
- 验收：本改动按 D-011 附证伪条件——3 个 canary（Tier 1 scope 扩展、Tier 2 语义变化、Tier 3 公共契约各一例）且分析会话记录 `prompt_rev`；scorecard 至少 4 项度量：自主裁决率、Tier 1 误判升级率、计划/账本摘要不一致次数、修订后再验收合规率。
- 修订（2026-08-22，D-026）：INITIAL/DELTA/CARRIED/NOT_EVALUATED 复审分级与 review packet 体系删除，复审统一为温链 diff-only；三级裁决、CAS 三元组、append-only 与 fail-closed 保留。

### D-022 计划结构单一标准 skill 化

- 状态：`active`
- 决策：Prometheus 开始规划工作前、Momus 开始审查任何计划版本前必须先加载 `omo-plan-structure`；两个 prompt 不复制结构 schema（字段枚举、结构约束示例、原子性定义），结构类不一致以 skill 裁决；生成方法与审查裁决规则留在各自 prompt。
- 验收：两 prompt 均含会话启动门且无结构 schema 复制残留，prompt 不出现字段名漂移（如 `内聚结果` / `行为验收` 旧名）。

### D-023 Momus 拆解与并发判定（split 附件化）

- 状态：`active`
- 决策：Momus 在结构核对外附加执行判定 `split`：逐 task 反事实拆分（能否进一步拆出独立可发布/验收/回退的结果）与并发重组识别（被无证据串行化的 task、cohort 归属与 wave 重组），判据对照 `omo-plan-structure` 的原子性契约与并行准入标准；产出以 verdict 附件输出（`split=no | yes:拆分边界与各自验收`），不再走「建议计划方修订」通道——Atlas 按判定经标准 REMAP 通道直接生效（含机械结构校验），不触发计划回炉修订循环。判定随初审执行，温链复审仅对 diff 新引入的 task 补做。
- 验收：`split=yes` 判定可被 Atlas 直接 REMAP 落位（拆分边界+各自验收 / cohort / wave 重组）；无判定被升级为 blocker 的记录（除非独立命中官方四类判据）。
- 修订（2026-08-25，D-030）：产出通道由「非阻断建议→Prometheus 修订」改为 verdict 附件直通执行期 REMAP（用户裁决）。

### D-024 移除蜂群概念，收敛为最小化拆解与低档并行

- 状态：`active`
- 决策：本仓 prompt（prometheus / sisyphus / README）移除「蜂群」术语——上级已把并行约束为「按独立性拆解 + 低档 worker 并发」，本地术语不承载额外行为，只剩最大化代理数的误导暗示；cohort 归属与 `concurrency_budget` 预算体制不变，执行侧立场由 skills 仓承载。
- 验收：本仓全文无「蜂群」残留（本条历史记载除外）；未新增数值上限、门禁或 reviewer 要求。
- 修订（2026-08-24，D-028）：「蜂群」术语在 `sisyphus.md` 及其 README 索引描述的受控语境恢复使用——指「依赖就绪集派发 + 滑动补位的蜂群并发」，不承载最大化代理数暗示，其余场合维持无残留；Sisyphus 路径新增滑动窗口上限（运行中 + 未验收 ≤ 6），属有意新增并单独成决策（D-028），不违背本条「未新增数值上限」原意——该原意指术语移除不夹带新限制。

### D-025 路由明确性与合适性审查

- 状态：`active`
- 决策：
  - 路由明确性审查：Momus 初审穷举维度含矩阵 route 三选一核对、`load_skills` 匹配与高价路由举证核对。
  - 路由合适性判定：Momus 对照 `omo-plan-structure`「路由档位判据」输出 `route=` 判定附件——标注明显失当时写判定值，Atlas preflight 采纳（覆盖计划标注）；执行期失败证据（升档协议）仍可覆盖判定；判定不阻塞派发。
  - wave 组织：从类型批次（同类归同 wave、wave 间串行）改为依赖就绪分组；最小波数约束防碎片化。
- 修订（2026-08-25，D-030）：「测试链流水」与「TDD 四问研究佐证」条目删除（测试组织随 D-017 改造回归上游）；新增 route 合适性判定（verdict 附件）。
- 验收：本仓无「同类 task 归同 wave」残留；Momus 穷举维度含路由标注明确性；送审计划 verdict 附件含逐 task `route` 判定。

### D-026 治理栈减负（节点统一召回与判据化）

- 状态：`active`
- 决策：
  - 验收节奏（atlas）：删除「每个 delegation 返回先完成四阶段验证与 checkbox 更新才能补位」的逐任务仪式；预算内持续 fan-out，验收集中在 wave 末、检查点、依赖解锁前、终态排水四类节点；预算口径（运行中写入 worker + 未验收产物，默认 3/4）为强制背压；高风险边界完成即验收。
  - 状态机与复审简化（atlas）：COLLECTED→VERIFYING→ACCEPTED 三态收敛为 `ACCEPTED(revision)` 单门；删除 INITIAL/DELTA/CARRIED/NOT_EVALUATED/review packet 体系，复审统一温链 diff-only；CAS 三元组保留。
  - 账本精简（atlas）：task 条目 15→7 字段，`plan_revision` 事件 ~20→7 字段；摘要一致 fail-closed 保留。
  - 计划审查用户触发（prometheus）：计划完成后询问用户选择不审 / 单审 Momus / 双审 Oracle→Momus，命中高风险特征建议双审。
  - 修订（2026-08-25，D-030）：三选项定为「1 直接执行（不审）/ 2 Momus 单审 / 3 Oracle 循环→Momus 循环」，去掉「命中高风险建议双审」——只提供选项不加建议（用户裁决）。
  - AGENTS.md 减半重构：195→约 75 行，六套规则并为四节，流程性条款改判据性条款。
  - 计划正文减重（prometheus）：删逐 wave 差异式举证（矩阵 + 一行声明），章节压缩约三分之一。
  - 参照：Codex/Claude 编排模式（controller 侧验证、并行 fan-out + 统一收集）；「compaction 丢验收目标→无限循环」证明 acceptance_contract 持久化必须保留；「orchestrator 频繁打断子代理」证明逐 task 验收节奏应废弃。
- 验收：AGENTS ~75 / atlas ~105 / prometheus ~95 行；本仓无「四阶段验证、INITIAL、DELTA、CARRIED、NOT_EVALUATED、review packet」残留（本文件历史记载除外）；`sync-agents.ps1 -Check` 通过。

### D-027 计划产物格式减负

- 状态：`active`
- 决策：
  - Prometheus 编写前按 `omo-plan-structure` 的分级判据判级并写入计划首行；轻量路径跳过矩阵与检查点全套，执行期超判据按 skill 升格规则处理。
  - 「验收只写一遍」禁令：凡验收条目已含的命令与预期，禁止在其他位置复述；通用证据由计划级通用约定一次承载。
  - Momus 按分级核对新字段与矩阵列完整性，QA 场景核对落点迁至验收条目；矩阵为唯一拓扑事实源，Task 契约不含拓扑字段不构成缺失。
- 验收：本仓无被删字段名残留（step_type / 验证命令 / QA happy 等，本文件历史记载除外）。

### D-028 Sisyphus 路径受控蜂群（双路径分工）

- 状态：`active`
- 决策：
  - 双路径分工：计划路径（Prometheus→Atlas）维持预算波次制（`concurrency_budget` 为计划路径唯一覆盖入口不变）；日常路径（Sisyphus）采用**蜂群滑动并发**——互不依赖、写域不重叠的 ready 产品任务按依赖就绪集在同一响应一次发完（多条 `task()`、全部 `run_in_background=true`，单批爆发），仅命名依赖（后继读取前驱产物、同文件写入）串行；单个成员完成即释放额度、滑动补位下一 ready 任务，不等批边界。
  - 路径入口由用户选择（2026-08-25 用户裁决）：Sisyphus 短计划更快、Prometheus 完整计划更保险，Sisyphus 的 Planning Threshold 命中（含高风险特征）不强制移交 Prometheus，走哪条路径由用户决定，不做自动分流。
  - 硬边界：写域互斥；命名依赖串行；共享同一推理/同接口/同不变量不拆、整体单发高档（D-012 / D-018 路由下限不变）；背压口径**运行中 + 未验收之和 ≤ 6**（滑动窗口，与计划路径预算口径同构）；验收集中在排水点（窗口满需释放额度、目标派发完毕、终态）——逐个收 `background_output` 按契约 `[EVIDENCE]` 核对；公共接口、持久化、权限、并发、迁移、不可逆边界完成即验；蜂群批轻量锚点复用既有 todo 条款，不引入账本。
  - 上游依据与档位取舍：start-work sizing 原文「a swarm of quick/unspecified-low workers in ONE parallel burst」与「共享推理不拆」；本机 glm 动态提示的并行派发段亦鼓励并发但建议 deep/high 档，本地取 start-work 的 quick/low 口径与经济路由（D-004）一致；ultrawork 关键字注入主会话的 `<parallel_by_default>` 为补充证据。
  - overlay 覆盖边界：`sisyphus.md` 覆盖的仅是并发节奏与数值上限；Category 路由、升档协议、发现委托、质量门仍以 `omo-adaptive-execution` 为权威；该 skill 的例外条款限定「仅 Sisyphus overlay」，计划路径不适用。
  - 修订 D-024：见 D-024 修订注。
- 验收：`sisyphus.md` 含蜂群滑动并发条款（单批爆发 + 滑动补位 + 排水点验收）与后台派发/收集流程；skill 例外条款点名 Sisyphus overlay 且「唯一覆盖入口」表述全部带「计划路径」限定；度量项：蜂群批次平均规模、排水点一次验收通过率、蜂群后重派率、滑动窗口占用率（在飞+未验收 / 6）、单批墙钟 vs 逐个派发对照；canary 对照按 D-011 待首个真实蜂群任务补。

### D-029 Atlas 无计划新需求处置与角色劫持防护

- 状态：`active`
- 决策：Atlas 会话收到无计划依托的新需求时，不加载规划类 skill、不自任 Prometheus——规划类 skill 正文含整体角色覆盖与 plan mode sticky 条款，加载即角色劫持；处置：小需求（`quick` / `unspecified-low` 可闭合）征得用户同意后按轻量路径执行或委托，大需求或多阶段高风险目标停止并建议用户在 Prometheus 会话规划后再回执行。
- 触发证据：真实会话中 Atlas 收到开发需求后自行加载 ulw-plan，被其「You are Prometheus」+「Plan mode is sticky」条款完全劫持角色；根因是 skill description 的泛化触发词（make a plan / start planning 等）与「用户自然语言要计划」的主观激活判定，叠加 Atlas prompt 与上游 base prompt 均无「无计划新需求」处置条款的行为缺口。
- 验收：`atlas.md` 角色边界含无计划新需求处置条款；后续 Atlas 会话无加载规划类 skill 的记录。

### D-030 审查协议 skill 化与三判定直通执行期

- 状态：`active`
- 决策：
  - 职责重分配（用户裁决）：Prometheus 专注收集资料与编写计划（不做测试任务组织、不做路由精调——只初标，档位判据以 `omo-plan-structure`「路由档位判据」为准）；Momus 承担三类执行判定；Oracle 纯本职（双审大雷判据随委托注入，不写 Oracle prompt——「派发方持有协议」原则）。
  - 审查协议 skill 化：新建 skills 仓 `omo-plan-review`，单一承载审查模式（单审/双审两阶段循环）、reviewer 委托注入模板、温链收敛与成本门槛；`prometheus.md` 审查节缩减为三选项 + 加载指令。
  - 触发模型：默认不送审；计划完成后只提供三选项——1 直接执行（不审）/ 2 Momus 单审 / 3 Oracle 循环→Momus 循环；不加高风险建议。
  - 三判定 verdict 附件（`omo-plan-structure` 格式）：`tdd`（D-017 四问）/ `split`（D-023 拆解与并发重组）/ `route`（D-025 合适性）逐 task 一行，附于官方 verdict 之后，不改变 verdict 格式与阻断语义。
  - 判定直通执行期（不回炉计划）：`tdd=first` → Atlas 同一委托内注入先红后绿；`split=yes` → Atlas 标准 REMAP 通道（含机械结构校验）；`route=` → Atlas preflight 采纳，执行期失败证据仍可覆盖。判定差异不触发计划修订循环。
  - 判定持久化与版本绑定：Atlas 首次消费前以 `review_verdict` 事件摘录入执行账本（抗会话压缩）；判定绑定审查时计划版本，结构性变化触及的 task 判定失效、回到自行 preflight；未送审计划无判定、全部自行 preflight。
  - 判定增量原则：随初审执行，温链复审仅对 diff 新引入的 task 补判定。
- 验收：`omo-plan-review` 含两阶段循环与注入模板；`momus.md` 含执行判定节；`atlas.md` 含判定消费映射与 `review_verdict` 入账；两仓无 `[test-freeze]`/`[test-supplement]`/「测试时序裁决（blocker 通道）」残留（本文件历史记载除外）；canary 对照按 D-011 待首次送审计划执行时补（度量：判定覆盖完整率、tdd=first 委托红绿证据率、split 判定 REMAP 采用率、审查-执行墙钟比）。

### D-031 Sisyphus 轻量混合执行（自改 + 蜂群 + 统一回归验收）

- 状态：`active`
- 决策（2026-08-25 用户裁决，同日判据化修订）：废除「产品代码无论多简单必派恰好 1 个 worker、Sisyphus 禁 edit/write」——Sisyphus **以编排为主，自改为编排的补充**；自改/派发**不设硬分界**（覆盖情况不全），以权衡判据与漂移信号描述、由模型按场景判断：
  - **权衡判据**：派发省父级上下文且可并行，但代理缺目标语境易偏移、验收修正有回路成本；自改在语境最热时最贴近目标、无偏移回路，但占用父级注意力。倾向自改——已知位置的小改、验收后的少量修正；倾向派发——量大、规格可独立写清、或自改开始扩散成探索；规格能写死的工作先结晶成修改点清单与预期再派（父出规格、代理出劳力）。
  - **漂移信号**：自改连续扩散、开始探索未知区域、或明显占用编排注意力 = 转拆解派发的信号；本就是单目标深度实现的目标建议用户改用 Hephaestus。
  - **蜂群优先**：非简单工作尽量拆解进蜂群滑动并发（D-028 体制不变）。
  - **统一回归验收**：父级亲自做回归验收（定向测试/lint/diff 核对）；修正少量自修、量大派修（续用原 `task_id`，委托写明上版偏差、正确语义与原因，防同一偏移重复）；委托 `[CONTEXT]` 附一句目标语义锚（用户可见目的）。
  - **上下文防污染**：定向 read（目标区域带区间）、改后不回读全文、非平凡探索一律 explore/librarian。
  - 边界：Atlas 不适用（计划路径仍是纯编排、不写产品代码）；`omo-adaptive-execution` 路径选择表的「恰好 1 worker」条款以 Sisyphus overlay 例外标注。
- 验收：`sisyphus.md` 无「必派恰好 1」「禁止 edit/write」残留、无「必须/仅限」式自改硬分界；skill 路径选择表含 Sisyphus 例外与 Atlas 不适用标注；canary 按 D-011 待首个真实任务补（度量：自改扩散率、回归一次通过率、修正自修/派修比、父级上下文增幅）。

### D-032 委托契约对齐上游六段（上游优先）

- 状态：`active`
- 决策（2026-08-25 用户裁决「上游优先，我们改不了」，skills 仓 SK-010 主载体）：本地委托六段（`[CONTEXT][GOAL][STOP WHEN][EVIDENCE][DOWNSTREAM][REQUEST]`）与上游 MUST 级六段模板（`TASK / EXPECTED OUTCOME / REQUIRED TOOLS / MUST DO / MUST NOT DO / CONTEXT`）双强制并存、运行时行为不可判定，上游不可改，本地对齐。prompts 侧：`sisyphus.md` 委托契约行改引上游六段并保留 `CONTEXT` 目标语义锚（D-031 语义不变）；排水点验收与 `atlas.md` tdd 证据引用由 `[EVIDENCE]` 改为 `EXPECTED OUTCOME` 段。
- 验收：两 prompt 无旧六段名残留；语义锚与红绿两段证据要求保留。

### D-033 上游相抵点显式记载（统筹审计）

- 状态：`active`
- 决策（2026-08-25，五角色三层栈统筹审计后）：本地对上游的经裁决相抵点统一记入 README「已裁决相抵点」清单（工件体制、审查触发、Atlas 并发与验收三处、基线预验白名单），逐条带决策号，上游版本核对时以清单为豁免依据。`omo-plan-structure` 的 scaffold 豁免条款由此获得决策背书；上游规划期 draft 恢复点无本地对应物记为已知缺口。已裁决缝隙之外仍待用户裁决：上游 Momus 输入契约只认 `.omo/plans/*.md` 路径模式与本地 `docs/plans/` 存储的冲突。同批审计措辞修复：`prometheus.md` 重复段删除与「检查点与集成」节名对齐、`WHY_NOT_LOWER_COST` 点名能力缺口、`momus.md` 空引用与矩阵列名复制清理、「基线未验」豁免、`atlas.md` 父级定义/补救预算计数/终态消歧/Final Wave 承载注、`sisyphus.md` 蜂群「尽量」软化与视觉/前端不自改。
- 验收：README 含相抵点清单且逐条带决策号；审计所列措辞级问题在各 prompt 无残留。

### D-034 L0 路由删除「纯只读」行（上游 Advise 已覆盖）

- 状态：`active`
- 决策（2026-08-25 用户裁决）：`sisyphus.md` L0 路由表删除「纯只读（解释/问答/审查/比较）→ 自行回答」行。依据：①上游 Advise 模式（用户提问/求评估/求解释时直接回答、不为问题启动实现）已原样覆盖该行为，按「上游已有则不写」本不应入本地；②该行与「非平凡发现→explore/librarian」行冲突——带发现的只读问题被「自行回答」压制，反把大读拉回父级上下文，与上下文防污染目标相反；③「纯只读不加载执行 skill」语义已由 BOOTSTRAP GATE 与 `omo-adaptive-execution` description 承载。门内「纯只读」定义保留（门作用域唯一定义点）。
- 验收：L0 表无纯只读行；BOOTSTRAP GATE 作用域定义不变；非平凡只读发现落入发现委托行。

### D-035 送审触发权收归用户（上游自动审条款不予执行）

- 状态：`active`
- 决策（2026-08-25 用户裁决，触发证据：真实会话中 Prometheus 自动发起双审的先例）：上游 `ulw-plan` 的三处送审触发在本地不予执行——①UNCLEAR 且非 Trivial 自动置 `review_required` 并自动跑高精度双审（SKILL.md:46）；②用户任何一轮说出 high accuracy / deep review 类修饰词当轮强制送审（:37，上游定性为 gate trigger not a style cue）；③交付时改问「执行还是高精度审查」（:45/:98）。本地行为统一为：触发权只在用户，命中上述情形照常呈现三选项等待选择、不加送审建议，编写过程中与写入完成后均不得自动发起审查委托。同时补 D-030 遗留直通道：用户在本轮或既往消息中已明确要求审查的，视为已选择对应选项，直接进入该模式，不重复询问。D-026/D-030 三选项制由此对上游触发条款获得行为级覆盖。
- 验收：`prometheus.md` 计划审查节含「触发权只在用户」条款并逐点名三处上游触发；上游触发条件命中时行为仍为三选项；用户明确要求审查时不再重复询问菜单。

### D-036 计划工位对齐上游 .omo/plans（Momus 输入缝隙裁决）

- 状态：`active`
- 决策（2026-08-25 用户裁决，skills 仓 SK-013 承载路径约定）：上游 Momus 输入契约只认 `.omo/plans/*.md`（0 匹配即拒审），ulw-plan 计划工位与 `/start-work` 计划选择均基于该路径——**维持上游契约原样、不做本地适配**；OMO 体系计划存放约定由 `docs/plans/` 改为 `.omo/plans/`，送审管道与执行入口由此天然成立。`docs/plans/` 等其他路径为非 OMO 体系计划，不经本体系送审与执行；存量计划按已声明路径继续生效，不强制迁移。
- 验收：README 未裁决缝隙条目关闭（相抵点清单更新）；新计划 workspaces 声明路径为 `.omo/plans/`。

### D-037 oracle.md 冗余重述精简

- 状态：`active`
- 决策（2026-08-25 用户裁决）：删除 oracle.md 中上游正文已有语义的重述——「当前阶段可落地的最佳方案」（上游 pragmatic minimalism 已有）与「不提前展开后续阶段的规划」（上游 resist hypothetical future needs 已有）；保留真补充（理论风险实体化禁令、相称性判据）、审查让步条款（双审入口）与关键细节聚焦条款（D-007 落点）。
- 验收：oracle.md 仅含上游未覆盖的补充条款；删除项在上游正文均有对应，无行为语义损失。

### D-038 角色单职化：Oracle 架构师纯职与 Metis 提问循环（2026-08-25 用户裁决）

- 状态：`active`
- 决策：确立**角色单职原则**——一个角色一个职业，调用场景（规划期/双审期/执行期）由派发方在委托中写明意图，角色 prompt 禁止调用方分支、双职条款与「被 X 调用时…被 Y 调用时…」模式语句（README 派发方原则同步强化）。据此重定义：
  - **Oracle = 资深架构师纯职**：制定与目标相称的架构方案与必要技术细节、搜索技术盲点、给出可落地建议；删除审查让步句（双审意图由 omo-plan-review 注入承载，见 skills 仓 SK-014）。规划期架构咨询入口在派发方 prometheus.md：涉及架构决策、技术选型或多方案分叉时委托 Oracle（只读单次自包含），普通有界实现不请（D-007 经济性不变）。
  - **Metis = 意图分析与定向提问纯职**：删除「先识别调用阶段（规划前/执行期）」双职分支，执行图等分析目标由委托意图指明（上游本体的六类意图分类是对请求本身的分析方法，保留由上游承载）；提问纪律升级——每轮最多 3 个定向问题（最关键的在前），续问轮结合既有回答与新增证据继续收敛、仍每轮最多 3 个，定位清晰或调用方停止即结束。
  - **Momus 完善不执笔**（确认既有边界）：审核完善通过「blocker 到可直接修订粒度 + tdd/split/route 三判定」实现，修订的笔归 Prometheus，保持评审独立性；「温链复审」等轮次词汇从 momus.md 移除，增量范围由复审委托载明。
- 验收：metis.md 无调用阶段分支；oracle.md 无审查模式语句；prometheus.md 含 Oracle 架构咨询触发条款；omo-plan-review Oracle 注入为架构师评估（SK-014）。

### D-039 Atlas 回归上游执行状态体系（boulder / ledger.jsonl / 完成契约承接）

- 状态：`active`
- 决策（2026-08-26 用户裁决「还是优先上游的政策，我们这多余的步骤可以去除」；两边界裁决：验收节奏回上游「验证过即勾选」，验证强度保留 D-006）。计划路径执行状态体系整体回归上游：
  - **承接**：boulder.json 状态（经 `/start-work` 或首个 wave 前写入，续跑 hook、`BOULDER COMPLETE` 响应、`FINAL WAVE` 判定词全生态生效）；notepad 经验本（上游正文原生生效，不豁免）；`.omo/start-work/ledger.jsonl` 为唯一执行账本（本地事件 `review_verdict` / `plan_revision` / `prompt_rev` 改为 jsonl 条目）；DoneClaim→AdversarialVerify 完成契约（`confirmed` 唯一通过；高风险 gate reviewer 或新会话 fresh reviewer，其余父级 root-verify——Atlas 不实现故合法）。
  - **废除**：`<plan>.ledger.md` 账本、`ACCEPTED(revision)` 单门与 CAS 三元组（`checklist_hash` 字段随之废除）、节点统一召回验收（wave 末/依赖解锁前节点取消；检查点/集成/终态排水降为聚合强化点）。
  - **保留（上游无对应物）**：并发预算与波次背压（D-005/D-013 预算体制）、契约三级裁决（D-021）、路由经济性与升档（SK-003）、三判定消费（D-030）、基线补验（D-009）、防劫持（D-029）、按比例验证强度（D-006）、Sisyphus 蜂群滑动并发日常路径不受影响（D-028/D-031）。
- 验收：`atlas.md` 无 `<plan>.ledger.md` / `ACCEPTED` / `CAS` / `checklist_hash` 残留，含「续跑 hook 契约」节与 DoneClaim/AdversarialVerify 条款；`omo-plan-structure` 账本分离节载体为 ledger.jsonl。
- 修订（2026-08-26，证据档案 E-B24 实装复核）：final-wave-approval-gate 的实际匹配是任务输出中的 `VERDICT: APPROVE/REJECT`（bundle `VERDICT_PATTERN`）；`FINAL WAVE` 字样为展示模板非 gate 匹配目标。终验输出以 `VERDICT: APPROVE` 承载 gate 兼容，FINAL WAVE 汇总行保留作展示。

### D-040 上游命令改名适配（/start-work → /ulw-execute）

- 状态：`active`
- 决策（2026-08-26，上游 5.0.0-beta.24 实装核对）：上游将执行入口命令 `/start-work` 更名为 `/ulw-execute`（触发词含 execute plan / continue plan / resume plan），skill 目录改为 `dist/skills/ulw-execute/`，**执行账本路径随之改为 `.omo/ulw-execute/ledger.jsonl`**；`.omo/boulder.json`、`.omo/plans/`、notepads、DoneClaim/AdversarialVerify 契约、`FINAL WAVE` 判定词（bundle hook 词表）均未变。beta.19→24 全角色正文重提取 diff：仅 4 处命令名字符串变化（atlas 三变体 + prometheus-consultant），Momus 双变体零变化。本地活动引用同步更名：`atlas.md`（入口与账本路径）、`prometheus.md`（handoff 入口）、`omo-plan-structure`（workspaces 与账本分离节路径，skills 仓 SK-016）。历史决策文本中的旧名以本条为准，不逐一改写。
- 验收：两仓活动文件无 `/start-work` 与 `.omo/start-work/` 残留；`docs/upstream-baseline/` 快照已刷新至 beta.24。

### D-041 todos 纪律（详细镜像与即时更新）

- 状态：`active`
- 决策（2026-08-29 用户裁决「Atlas 生成的 todos 要详细，所有模型都要及时更新 todos」；实为 D-039 上游承接的漏项补齐——上游 `ulw-execute` L54-55 本有对应条款）：todos 是对用户可见的进度事实源。
  - **详细（Atlas）**：启动时把计划全量预注册为 todos——每个 wave 一条、每个 task 一条（文本含 `task_id` 与路由/owner 摘要）、Final Verification Wave 一条；不内存持有；计划外工作（REMAP/补救/环境修复）先注册 todo 再执行（承接上游 "Register every phase and task as todos… never keep tasks in memory only"）。
  - **即时（所有模型）**：全局 `runtime/AGENTS.md` 执行纪律新增「todo 纪律」（覆盖全部角色与子代理）——开始执行该单元即置进行中、验证通过即置完成、不批量滞后补记、新发现工作先注册再执行；todo 与计划勾选、账本等进度载体同一叙事（承接上游 "Keep them current at every moment… never batch-complete at the end"）。
  - **三方一致**：todos、boulder、计划 checkbox 始终同一进度叙事（atlas.md 条款承载）。
  - Sisyphus 蜂群路径：todo 即轻量锚点不变，补充即时更新语义（派发即进行中、排水点验收后勾销）。
- 验收：`atlas.md` 含 todos 镜像条款；`runtime/AGENTS.md`（及同步后的 config 根 `AGENTS.md`）含全局 todo 纪律；`sisyphus.md` todo 条款含即时更新。

### D-042 派发路由纪律（计划推荐 category 默认采纳）

- 状态：`active`
- 决策（2026-08-31 用户指令，prompts 52a9cec / skills 29605b4〔SK-017 同裁决〕；chat-unify 计划实证：Atlas 把触碰 UI 文件的 T3/T4〔计划推荐 `unspecified-high`〕擅派 `visual-engineering`，DB 证实该 category 与落模型 kimi k3-256k 100% 对应〔分类模型池首位〕，4 次派发 2 次中断后 fallback gemini-3.1-pro）：`atlas.md`「派发前置·路由解析」增补——计划 task 已标注 `Recommended task executor category` 时默认采纳该值，改用其他 category 须给出指向该 task 证据的偏离理由并入账；category 按 `omo-adaptive-execution`「Category 选择」以交付物性质判定，触碰 UI 文件或含 UI/manual QA 验收不构成视觉类依据。共享定义（visual-engineering 边界收紧）归 skills 仓 SK-017，atlas.md 只留引用与执行纪律。
- 验收：`atlas.md` 路由解析条含计划推荐采纳与偏离入账；`omo-adaptive-execution` visual-engineering「不应使用」列含交付物性质判定边界。

### D-043 执行期再拆分授权

- 状态：`active`
- 决策（2026-08-31 用户指令「给 Atlas 增加权限，允许他再次对任务进行拆分」）：`atlas.md`「原子化与并发」新增**执行期再拆分**条款——Atlas 可将计划 task 再次拆分为多个子派发（派生 task_id 如 `T4a`/`T4b`，各按委托契约六段派发与独立验收），**无需先走 REMAP、不改计划正文**；边界：子派发写域互斥且并集不超出原 task 写域，原 task 验收条目全部通过后才勾选 checkbox（checkbox/todo/boulder 仍以计划 task 为粒度），拆分决策与子派发清单 append ledger 入账；改变计划拓扑（task 数量、依赖或 owner 归属写入计划正文）仍属 REMAP。与「必须先 REMAP」条的分工：后者针对 task 边界无效（计划缺陷，含多个 owner family），本条针对计划合法但执行粒度需更细的场景。
- 验收：`atlas.md`「原子化与并发」含再拆分条款且与 REMAP 边界无冲突。

### D-044 路由判定勘察前置（explore 定性流程）

- 状态：`active`
- 决策（2026-08-31 用户裁决「要让 Atlas 严格按照路由去选择相应执行层，执行前用 explore 扫描判断任务所属类型」；系 D-042 的流程化补强）：`atlas.md`「派发前置·路由解析」增补——无计划推荐、或交付物性质不明/候选 category 不止一个时，**先派后台 `explore` 勘察该 task 触及的代码面与交付物性质**，以勘察证据按 `omo-adaptive-execution`「Category 选择」定档并把结论随委托入账；不以标题措辞或触碰文件面推断。共享流程定义在 skills 仓 SK-018（路由决策顺序第 5 步证据化），atlas.md 只承载执行纪律。
- 验收：`atlas.md` 路由解析含勘察前置与入账要求；`omo-adaptive-execution` 路由决策顺序第 5 步含领域 category 证据判定与 explore 前置。

### D-045 Atlas 上下文经济与分层验收

- 状态：`active`
- 决策（2026-08-31 用户裁决：Atlas 优先保证干净上下文；善用子代理探索；验收「配合 explore 做简单验收，产物与计划及时修正」；子代理须有明确边界、不无止境扩展；经上游基线复核修订——原稿「默认派验证子代理、父级不重跑」与上游 verify-personally/Manual Code Review NON-NEGOTIABLE 冲突面过大且含 root-verify 术语误用，已重写）：`atlas.md` 五处——
  1. **角色边界新增「内容把握靠子代理」**：分析、定性、勘察与影响面确认优先派后台 `explore`，不亲自大范围读代码；「只关心计划」≠放弃内容掌握；diff 与产物核对义务不变、由 explore 事实核查承载。
  2. **派发前置新增「委托边界具名」**：六段内 `EXPECTED OUTCOME` 停止条件与 `MUST NOT DO` 禁止项必须非空具名（写域、行为域）；子代理超界返回 `blocked` 由父级裁决续派或 REMAP，不得顺手扩界。
  3. **验收分层（修订 D-039「其余由父级亲自验证」）**：简单验收（默认）= Atlas 亲跑计划验收条目命令（二元、输出小）+ 后台 `explore` 只读事实核查（写域一致、声称与产物一致、diff 摘要），Atlas 汇总裁决，explore 只报事实不判质量；强化验收（公共接口/并发/迁移/安全/高难/计划 reviewer 安排）= 新会话独立验证子代理五 gate 全套；五 gate 由当前验证者承载、父级始终裁决；验收不过即处置——产物修正续用原 `task_id` 重派、计划修正按契约裁决 Tier 分级（Tier 1 现场放行）或执行期再拆分，不搁置 wave 末。
  4. **上下文维护强化**：治理条款要点（会话启动门、验收契约、路由与拆分纪律）压缩时不得丢失；上下文压力优先经委托发现/验证子代理消化，不以削减治理条款换取空间。
  5. **README 相抵点补「验证分工」条**：上游 Manual Code Review 亲读豁免依据，与 D-006 验证降样并列（强度降样之外新增主体分工维度）。
  todos 即时更新为既有 D-041 纪律，本轮重申、无新增条款。
- 验收：`atlas.md` 含「内容把握靠子代理」「委托边界具名」、验收分层三 bullet（简单/强化/质量门 overlay）与「验收不过即处置」句；README 相抵点含「验证分工」条；D-039 验收分工以本条为准。

## 已废弃决策

### S-001 本地优先级声明

- 状态：`superseded`
- 已废弃：在 prompt 中写“冲突时以本文件为准”或显式覆盖上游条款。
- 替代：D-001，只做兼容补强，冲突时调整本地。

### S-002 以批量验收替代上游最低节奏

- 状态：`superseded`
- 已废弃：用本地触发式批量验收替代上游逐 task 验收或 checkbox 节奏。
- 替代：保留上游最低验收节奏，本地 checkpoint 只增加更强 gate。
- 补注（2026-08-22，D-026）：节点统一召回保留依赖 ACCEPTED 门与高风险逐 task 验收，与曾废弃的纯批量验收不同，不构成回退。
- 补注（2026-08-26，D-039）：本地已按用户裁决回归上游逐 task 验证节奏（验证过即勾选），与本条「保留上游最低节奏」方向一致；曾废弃的本地批量验收体系不以任何形式回归。

### S-003 固定 reviewer 流程

- 状态：`superseded`
- 已废弃：用本地固定 reviewer 顺序或并发方式替换上游审查流程。
- 替代：保留上游 reviewer 选择与流程；本地只过滤低价值建议，并保护
  用户决策边界。

### S-004 任意拆分实现与直接测试

- 状态：`superseded`
- 已废弃：仅凭说明理由，将实现与其直接测试拆成不同 task。
- 替代：实现、直接测试与必要调用方保持同一 task/todo，只遵循上游明确允许的例外。

### S-005 冻结验收契约与复审分级

- 状态：`superseded`
- 已废弃：验收契约批准后永久冻结、任何变化都冻结后重新规划的做法。
- 替代：D-021，初始基线 + 三级现场裁决；reviewer 边界与独立验证要求由 D-021 承接。

## 维护流程

1. 修改角色 prompt 前，先读本文件和 README 的上游兼容基线。
2. 对新增约束核对上游：上游已有则不写；未定义且兼容时才本地补强。
3. 上游版本变化后重新核对所有 `active` 决策；冲突时先调整本地文件，
   再更新兼容基线。
4. 用户新增、修正或废弃长期偏好时同步本文件；不记录临时排障过程、
   一次性猜测或审查日志。
5. 行为、文件索引或运行方式变化时同步 README；全局治理变化按脚本
   同步 `runtime/AGENTS.md` 到运行时副本。
