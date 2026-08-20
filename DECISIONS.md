# 用户需求与决策

本文件记录会持续影响本仓库 prompt、skill 路由和验收方式的用户决策。
它只保存本地增量偏好与已废弃方向，不复制上游完整规则。
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

### D-008 Markdown 使用唯一 H1

- 状态：`active`
- 决策：每份 Markdown 只有一个描述文件用途的 H1；其余章节保持递增
  层级。
- 验收：markdownlint 的 MD025 与 MD041 为 clean。

### D-009 提交、推送与重启

- 状态：`active`
- 决策：prompt、skill 或运行时规则修改完成并验证后，按独立意图提交
  并推送；配置时文件变更后完全退出并重启 OpenCode。
- 验收：仓库 clean 且与 upstream 同步；新会话读取到新版本。

### D-010 prompt 拒绝废话文学

- 状态：`active`
- 决策：角色 prompt 只保留必要的准则、参考、约束与防漂移规则；禁止写入元声明、免责声明、兼容性声明及「本节只补充」「上游规则继续有效」等无行为约束力的表述。
- 验收：全仓角色 prompt 无此类废话模式；新增或修改 prompt 时按此标准审查。

### D-011 独立 ready 任务预算内同回合并发派发

- 状态：`active`
- 决策：每个 dispatch wave 开始时，按并发预算在同一回合 fan-out 独立 ready task；已派发的独立任务互不阻塞；任何 delegation 返回后完成该 task 的逐 task 验收与 checkbox 更新，才能补位派发新任务；依赖该产物的 task 仅在其 ACCEPTED 后可派发。单轮派发量 = min(ready set, 并发预算)。上游逐 task 验收节奏不变（S-002 边界不破）。
- 验收：scorecard 显示后台派发率 >0；不存在「验证未完成即阻塞无依赖 ready task」的串行门；canary 执行初始预算 2。

### D-012 冻结验收契约与复审分级

- 状态：`active`
- 决策：实施 task 携带冻结 acceptance_contract（条目含稳定 ID、二元条件、证据与证据作用域）；executor、reviewer 与验收 oracle 注入同一份原文。首次复审与高风险门禁（公共接口、并发、迁移、安全）永远 INITIAL 全量；低风险增量复审仅在前置 INITIAL 全绿后启用。PASS carry-over 在证据作用域工具化（文件清单/diff 求交由脚本计算）前默认关闭。契约修订 append-only。
- 验收：REJECT 的不变量必须已在冻结清单或触发契约修订；不存在由模型手算作用域交集产生的 PASS 携带。

### D-013 计划可执行性前置门

- 状态：`active`
- 决策：计划进入审查前，baseline 验收命令由工具实际执行并记录 `revision/command/exit_code/disposition`，且 baseline 命令与最终验收命令同一；并发矩阵存在性、形状与可消费性由 plan-linter 脚本机械校验，linter 非零时 momus 以官方 [REJECT] 类别阻断。拓扑分层：单 writer 单 lane 的计划可写 `cohorts: none`；存在两个可同时 ready 的 write task、跨 lane、共享可变资源或高风险门禁时矩阵强制完整。
- 验收：BLOCKED_BASELINE 类状态只由 linter/工具输出产生，不由模型自报；wave 1 前 Atlas 无条件重跑 baseline。

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
- 决策：C1-C6 落地后经 Oracle 一致性验收与 Metis 盲区复扫的修正——并发预算单一来源（矩阵可声明 `concurrency_budget` 覆盖默认 3/4，atlas/prometheus/执行 skill 三方对齐，canary 预算以计划字段承接）；`cohorts: none` 按单 writer 单 lane 判定（允许串行多 task，不按 task 数）；「checkbox 更新」指向账本 append 事件、计划正文只读；红 baseline 例外放行 disposition 唯一映射的 remediation task；计划修订记录迁入账本（正文严格六区块）；DELTA 复审补 `CARRIED` 状态与资格证据字段。
- 验收：三方预算措辞一致；旧格式计划在 linter v2 下 fail-closed；DELTA 模式存在合法完整 PASS 路径。

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
