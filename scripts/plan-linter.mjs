#!/usr/bin/env node
/**
 * plan-linter.mjs — 计划可执行性前置门（C3/C4 的工具化执行臂，D-013）
 *
 * 用法（只读 lint；baseline 会实际执行验收命令）：
 *   node plan-linter.mjs lint <plan.md>                 结构校验：必备静态区块、并发矩阵 fail-closed、baseline 命令同一性
 *   node plan-linter.mjs baseline <plan.md> [--workspace <dir>]   从 Baseline Gate 区块提取验收命令并实跑，输出 exit code
 *
 * 计划格式 v2（静态区块约定，与 prompts/prometheus.md 计划契约同源）：
 *   ## 需求与目标 / ## Baseline Gate / ## Workspaces / ## 并发矩阵 / ## Task 契约 / ## 检查点与集成
 *   - Baseline Gate 内含一个 ```bash fenced 块，首行注释为 # workspace: <dir>（可选），其后为验收命令；该命令必须与「检查点与集成」中的终态验收命令逐字同一（忽略空白差异）。
 *   - 并发矩阵为表格：| task | cohort | 硬前驱 | 互斥资源 | lane | route |；每个 ## Task 契约 下的 ### task 标题必须恰好出现一次；硬前驱必须引用已知 task。
 *   - 拓扑豁免（D-013）：单 writer 单 lane（契约中仅 1 个 task）可写一行 `cohorts: none` 代替表格。
 *   - 动态状态（checkbox、回执、尝试次数）不得出现在计划文件，归 <plan>.ledger.md（append-only，D-014）；lint 对计划正文中的进度表/状态表给出 warning。
 *
 * 退出码：0 = 通过；1 = 结构违例（Momus 以官方 [REJECT] + Executability blocker 表达，linter 不发明 verdict token）；2 = 用法/IO 错误。
 * baseline 子命令的退出码 = 被测命令的退出码（透传），并在 stdout 末行打印机器可读摘要：BASELINE_EXIT=<n> CMD=<cmd>。
 */
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const [, , sub, planPath, ...rest] = process.argv
if (!['lint', 'baseline'].includes(sub) || !planPath) {
  console.error('usage: plan-linter.mjs lint|baseline <plan.md> [--workspace <dir>]')
  process.exit(2)
}
const wsIdx = rest.indexOf('--workspace')
const wsOverride = wsIdx !== -1 ? rest[wsIdx + 1] : null

let text
try {
  text = readFileSync(planPath, 'utf8')
} catch (e) {
  console.error(`cannot read plan: ${e.message}`)
  process.exit(2)
}

const norm = (s) => s.replace(/\s+/g, ' ').trim()
const errors = []
const warnings = []

// ---- 区块提取：按 ## 二级标题切分 ----
const sections = new Map()
let current = '_preamble'
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^##\s+(.+?)\s*$/)
  if (m) {
    current = m[1]
    sections.set(current, [])
  } else if (sections.size) {
    sections.get(current)?.push(line)
  }
}
const findSection = (...aliases) => {
  for (const [name, lines] of sections) {
    const n = norm(name).toLowerCase()
    if (aliases.some((a) => n.includes(a))) return { name, body: lines.join('\n') }
  }
  return null
}

const secGoal = findSection('需求与目标', 'goal')
const secBaseline = findSection('baseline')
const secWorkspaces = findSection('workspace')
const secMatrix = findSection('并发矩阵', 'cohort')
const secContracts = findSection('task 契约', '契约')
const secCheckpoints = findSection('检查点', '集成', 'checkpoint')

for (const [sec, label] of [[secGoal, '需求与目标'], [secBaseline, 'Baseline Gate'], [secWorkspaces, 'Workspaces'], [secMatrix, '并发矩阵'], [secContracts, 'Task 契约'], [secCheckpoints, '检查点与集成']]) {
  if (!sec) errors.push(`缺少必备静态区块: ${label}`)
}

// ---- Baseline Gate：fenced bash 命令提取 ----
let baselineCmd = null
let baselineWs = wsOverride
if (secBaseline) {
  const fence = secBaseline.body.match(/```(?:bash|sh|powershell|pwsh)?\s*\n([\s\S]*?)```/)
  if (!fence) {
    errors.push('Baseline Gate 区块内未找到 fenced 命令块')
  } else {
    const lines = fence[1].split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    const wsLine = lines.find((l) => l.startsWith('# workspace:'))
    if (wsLine && !baselineWs) baselineWs = wsLine.slice('# workspace:'.length).trim()
    baselineCmd = lines.filter((l) => !l.startsWith('#')).join(' && ')
    if (!baselineCmd) errors.push('Baseline Gate fenced 块内无实际命令')
  }
}

// ---- 命令同一性：Baseline Gate 命令必须逐字出现在 检查点与集成 ----
if (baselineCmd && secCheckpoints && !norm(secCheckpoints.body).includes(norm(baselineCmd))) {
  errors.push('Baseline Gate 命令与 检查点与集成 的终态验收命令不同一（Goodhart 防线：baseline 必须实跑最终验收命令本身）')
}

// ---- 并发矩阵 fail-closed ----
const taskTitles = []
if (secContracts) {
  for (const l of secContracts.body.split(/\r?\n/)) {
    const m = l.match(/^###\s+(.+?)\s*$/)
    if (m) taskTitles.push(norm(m[1]))
  }
}
if (secMatrix) {
  const body = secMatrix.body
  if (/cohorts\s*:\s*none/i.test(body)) {
    if (taskTitles.length > 1) errors.push(`拓扑豁免失效: cohorts: none 但 Task 契约含 ${taskTitles.length} 个 task（仅单 writer 单 lane 可豁免，D-013）`)
  } else {
    const rows = body.split(/\r?\n/).filter((l) => /^\s*\|/.test(l) && !/^\s*\|[\s\-|]+\|$/.test(l) && !/task\s*\|\s*cohort/i.test(l))
    if (!rows.length) {
      errors.push('并发矩阵区块存在但无表格行（且未声明 cohorts: none）')
    } else {
      const seen = new Map()
      const refs = new Set()
      for (const row of rows) {
        const cells = row.split('|').map((c) => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1)
        const [task, , deps] = cells
        if (!task) { errors.push(`矩阵行缺少 task 列: ${row.trim()}`); continue }
        seen.set(norm(task), (seen.get(norm(task)) || 0) + 1)
        if (deps && !/^(无|none|-)$/i.test(deps)) deps.split(/[,，]/).forEach((d) => { refs.add(norm(d)) })
      }
      for (const t of taskTitles) {
        if (![...seen.keys()].some((k) => k.includes(t) || t.includes(k))) errors.push(`Task 契约「${t}」未出现在并发矩阵`)
      }
      for (const [t, n] of seen) if (n > 1) errors.push(`task「${t}」在矩阵中出现 ${n} 次（必须恰好一次）`)
      for (const r of refs) {
        if (![...seen.keys()].some((k) => k.includes(r) || r.includes(k)) && !taskTitles.some((t) => t.includes(r) || r.includes(t))) {
          errors.push(`硬前驱「${r}」无法解析到任何已知 task`)
        }
      }
    }
  }
}

// ---- 动态状态泄漏检查（D-014）----
if (/checkbox|尝试次数|回执|进度表|状态:\s*(in-progress|done|blocked)/i.test(text)) {
  warnings.push('计划正文疑似含动态状态（checkbox/回执/尝试次数）——应移至 append-only ledger 文件（D-014）')
}

if (sub === 'lint') {
  for (const w of warnings) console.log(`WARN: ${w}`)
  if (errors.length) {
    for (const e of errors) console.log(`FAIL: ${e}`)
    console.log(`LINT_FAIL errors=${errors.length} warnings=${warnings.length}`)
    process.exit(1)
  }
  console.log(`LINT_OK warnings=${warnings.length}`)
  process.exit(0)
}

// ---- baseline 子命令：实跑验收命令 ----
if (!baselineCmd) {
  for (const e of errors) console.log(`FAIL: ${e}`)
  console.log('BASELINE_EXIT=2 (无法提取验收命令)')
  process.exit(2)
}
if (!baselineWs) {
  console.error('未提供 workspace：在 Baseline Gate fenced 块内写 `# workspace: <dir>` 或传 --workspace')
  process.exit(2)
}
console.log(`baseline workspace: ${baselineWs}`)
console.log(`baseline command:   ${baselineCmd}`)
let code = 0
let tail = ''
try {
  const out = execSync(baselineCmd, { cwd: baselineWs, shell: process.platform === 'win32' ? 'pwsh' : '/bin/sh', encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30 * 60 * 1000 })
  tail = out.split('\n').slice(-15).join('\n')
} catch (e) {
  code = e.status ?? 1
  tail = [e.stdout, e.stderr].filter(Boolean).join('\n').split('\n').slice(-15).join('\n')
}
console.log('---- output tail ----')
console.log(tail)
console.log(`BASELINE_EXIT=${code} CMD=${norm(baselineCmd).slice(0, 120)}`)
process.exit(code)
