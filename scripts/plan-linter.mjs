#!/usr/bin/env node
/**
 * plan-linter.mjs v2 — 计划可执行性前置门（C3/C4 工具化执行臂，D-013/D-017）
 *
 * 用法：
 *   node plan-linter.mjs lint <plan.md>                          结构校验（fail-closed）
 *   node plan-linter.mjs baseline <plan.md> [--workspace <dir>]  实跑 Baseline Gate 命令并透传 exit code
 *
 * lint 检查项（与 prompts/prometheus.md 计划契约同源，新增 mandate 必须同步此处）：
 *   1. 六区块存在性：需求与目标 / Baseline Gate / Workspaces / 并发矩阵 / Task 契约 / 检查点与集成
 *   2. 六区块排他性：出现任何无法映射到六区块的 ## 二级区块即 FAIL（修订记录等动态内容归 ledger，D-014/D-017）
 *   3. Baseline Gate：fenced 命令块 + 证据四字段（revision / exit_code / disposition；command 即块本身）；
 *      命令与「检查点与集成」的 fenced 终态验收命令规范化后双向相等（Goodhart 防线）
 *   4. 并发矩阵：表头须含 task|cohort|硬前驱|lane|route 列；每个 ### task 恰好出现一次（精确规范化匹配，
 *      不做子串模糊匹配）；硬前驱可解析且无环；未声明矩阵时仅接受 `cohorts: none` 且全部 task 同属单一
 *      workspace_lane（D-017：按 lane 判定，不按 task 数）
 *   5. Task 契约：每个 ### task 块须含 acceptance_contract，且至少含 条件/证据/证据作用域 标记
 *   6. 动态状态泄漏：真实 checkbox 语法 `- [ ]`/`- [x]` 出现在正文即 FAIL（D-014）
 *
 * 退出码：0 = 通过；1 = 结构违例（momus 以官方 [REJECT] + Executability blocker 表达）；2 = 用法/IO 错误。
 * baseline 子命令：lint 存在结构错误时拒绝运行（exit 2）；否则用系统 shell 原样执行 fenced 块全文
 * （不做 && 重写），流式透传输出，退出码 = 被测命令退出码，末行打印 BASELINE_EXIT=<n> CMD=<cmd>。
 */
import { readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'

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

const CANON = [
  ['需求与目标', ['需求与目标', 'goal']],
  ['Baseline Gate', ['baseline']],
  ['Workspaces', ['workspace']],
  ['并发矩阵', ['并发矩阵', 'cohort']],
  ['Task 契约', ['task 契约', 'task契约', '契约']],
  ['检查点与集成', ['检查点', '集成', 'checkpoint']],
]
const canonicalOf = (name) => {
  const n = norm(name).toLowerCase()
  for (const [canon, aliases] of CANON) {
    if (aliases.some((a) => n.includes(a))) return canon
  }
  return null
}

const found = new Map()
for (const [name, lines] of sections) {
  if (name === '_preamble') continue
  const canon = canonicalOf(name)
  if (!canon) {
    errors.push(`未声明的二级区块「${name}」——计划正文严格只含六区块，修订记录/动态状态归 ledger（D-014/D-017）`)
  } else if (found.has(canon)) {
    errors.push(`区块「${canon}」出现多次（「${found.get(canon).name}」与「${name}」）`)
  } else {
    found.set(canon, { name, body: lines.join('\n') })
  }
}
for (const [canon] of CANON) {
  if (!found.has(canon)) errors.push(`缺少必备静态区块: ${canon}`)
}

const secBaseline = found.get('Baseline Gate')
const secMatrix = found.get('并发矩阵')
const secContracts = found.get('Task 契约')
const secCheckpoints = found.get('检查点与集成')

const extractFence = (body) => {
  const m = body.match(/```(?:bash|sh|powershell|pwsh)?\s*\n([\s\S]*?)```/)
  return m ? m[1] : null
}

// ---- Baseline Gate：fenced 命令 + 证据四字段 ----
let baselineScript = null
let baselineWs = wsOverride
if (secBaseline) {
  const fence = extractFence(secBaseline.body)
  if (!fence) {
    errors.push('Baseline Gate 区块内未找到 fenced 命令块')
  } else {
    const lines = fence.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim())
    const wsLine = lines.find((l) => l.trim().startsWith('# workspace:'))
    if (wsLine && !baselineWs) baselineWs = wsLine.split(':').slice(1).join(':').trim()
    baselineScript = lines.filter((l) => !l.trim().startsWith('#')).join('\n')
    if (!baselineScript.trim()) errors.push('Baseline Gate fenced 块内无实际命令')
  }
  for (const [field, re] of [['revision', /revision/i], ['exit_code', /exit[_ ]?code|退出码/i], ['disposition', /disposition|处置/i]]) {
    if (!re.test(secBaseline.body)) errors.push(`Baseline Gate 缺少证据字段: ${field}（D-013：工具实跑后记录四字段，非模型自报）`)
  }
}

// ---- 命令同一性：双向规范化相等 ----
if (baselineScript && secCheckpoints) {
  const cpFence = extractFence(secCheckpoints.body)
  if (!cpFence) {
    errors.push('检查点与集成 区块缺少 fenced 终态验收命令块，无法核对与 Baseline Gate 的同一性')
  } else if (norm(cpFence) !== norm(baselineScript)) {
    errors.push('Baseline Gate 命令与 检查点与集成 的终态验收命令不同一（双向规范化比较，Goodhart 防线）')
  }
}

// ---- Task 契约：### task 块 + acceptance_contract 结构 ----
const taskBlocks = []
if (secContracts) {
  let cur = null
  for (const l of secContracts.body.split(/\r?\n/)) {
    const m = l.match(/^###\s+(.+?)\s*$/)
    if (m) {
      cur = { title: norm(m[1]), body: [] }
      taskBlocks.push(cur)
    } else if (cur) cur.body.push(l)
  }
  for (const t of taskBlocks) {
    const b = t.body.join('\n')
    if (!/acceptance_contract/i.test(b)) {
      errors.push(`Task「${t.title}」缺少 acceptance_contract（D-012 冻结验收契约）`)
    } else {
      for (const [label, re] of [['条件', /条件|condition/i], ['证据', /证据|evidence/i], ['证据作用域', /证据作用域|evidence_scope/i]]) {
        if (!re.test(b)) errors.push(`Task「${t.title}」acceptance_contract 条目缺少「${label}」标记`)
      }
    }
  }
}

// ---- 并发矩阵 fail-closed ----
if (secMatrix) {
  const body = secMatrix.body
  if (/cohorts\s*:\s*none/i.test(body)) {
    const lanes = new Set()
    if (secContracts) {
      for (const m of secContracts.body.matchAll(/workspace_lane[:：]\s*`?([\w\-./\\]+)`?/g)) lanes.add(m[1])
    }
    if (lanes.size > 1) {
      errors.push(`拓扑豁免失效: cohorts: none 但 Task 契约引用 ${lanes.size} 个不同 lane（${[...lanes].join(', ')}）——豁免按单 writer 单 lane 判定（D-017）`)
    }
    if (taskBlocks.length > 1) warnings.push(`cohorts: none 且含 ${taskBlocks.length} 个串行 task：确认同属单一 writer（D-017 允许，人工复核 writer 唯一性）`)
  } else {
    const tableLines = body.split(/\r?\n/).filter((l) => /^\s*\|/.test(l))
    const dataRows = tableLines.filter((l) => !/^\s*\|[\s\-|]+\|$/.test(l))
    const header = dataRows.shift()
    if (!header) {
      errors.push('并发矩阵区块存在但无表格（且未声明 cohorts: none）')
    } else {
      const hcells = header.split('|').map((c) => c.trim().toLowerCase())
      for (const [label, re] of [['task', /task|任务/], ['cohort', /cohort/], ['硬前驱', /前驱|deps/], ['lane', /lane/], ['route', /route/]]) {
        if (!hcells.some((c) => re.test(c))) errors.push(`并发矩阵表头缺少列: ${label}`)
      }
      if (!dataRows.length) errors.push('并发矩阵有表头但无数据行')
      const seen = new Map()
      const edges = []
      for (const row of dataRows) {
        const cells = row.split('|').map((c) => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1)
        const [task, , deps] = cells
        if (!task) { errors.push(`矩阵行缺少 task 列: ${row.trim()}`); continue }
        const key = norm(task)
        seen.set(key, (seen.get(key) || 0) + 1)
        if (deps && !/^(无|none|-)$/i.test(deps)) {
          for (const d of deps.split(/[,，]/)) edges.push([norm(d), key])
        }
      }
      const matrixKeys = [...seen.keys()]
      for (const t of taskBlocks) {
        if (!matrixKeys.includes(t.title)) errors.push(`Task 契约「${t.title}」未出现在并发矩阵（精确匹配，不用子串）`)
      }
      for (const t of matrixKeys) {
        if (!taskBlocks.some((b) => b.title === t)) warnings.push(`矩阵 task「${t}」在 Task 契约中无对应 ### 块`)
      }
      for (const [t, n] of seen) if (n > 1) errors.push(`task「${t}」在矩阵中出现 ${n} 次（必须恰好一次）`)
      for (const [d] of edges) {
        if (!matrixKeys.includes(d)) errors.push(`硬前驱「${d}」无法解析到矩阵中的 task`)
      }
      // 无环检查（拓扑排序）
      const indeg = new Map(matrixKeys.map((k) => [k, 0]))
      const adj = new Map(matrixKeys.map((k) => [k, []]))
      for (const [d, t] of edges) {
        if (indeg.has(d)) { indeg.set(t, indeg.get(t) + 1); adj.get(d).push(t) }
      }
      const queue = matrixKeys.filter((k) => indeg.get(k) === 0)
      let visited = 0
      while (queue.length) {
        const k = queue.shift()
        visited++
        for (const nxt of adj.get(k)) {
          indeg.set(nxt, indeg.get(nxt) - 1)
          if (indeg.get(nxt) === 0) queue.push(nxt)
        }
      }
      if (visited < matrixKeys.length) errors.push('并发矩阵硬前驱存在循环依赖')
    }
  }
}

// ---- 动态状态泄漏（D-014）：真实 checkbox 语法即 FAIL ----
const checkboxLines = text.split(/\r?\n/).filter((l) => /-\s*\[[ xX]\]/.test(l))
if (checkboxLines.length) {
  errors.push(`计划正文含 ${checkboxLines.length} 行 checkbox（如「${norm(checkboxLines[0]).slice(0, 50)}」）——动态状态归 append-only ledger（D-014）`)
}

if (sub === 'lint') {
  for (const w of warnings) console.log(`WARN: ${w}`)
  for (const e of errors) console.log(`FAIL: ${e}`)
  console.log(errors.length ? `LINT_FAIL errors=${errors.length} warnings=${warnings.length}` : `LINT_OK warnings=${warnings.length}`)
  process.exitCode = errors.length ? 1 : 0
} else {
  // ---- baseline 子命令：结构错误时拒绝运行；否则原样流式执行 ----
  if (errors.length) {
    for (const e of errors) console.log(`FAIL: ${e}`)
    console.log('BASELINE_EXIT=2 (lint 结构错误，拒绝实跑)')
    process.exitCode = 2
  } else if (!baselineWs) {
    console.error('未提供 workspace：在 Baseline Gate fenced 块内写 `# workspace: <dir>` 或传 --workspace')
    process.exitCode = 2
  } else {
    console.log(`baseline workspace: ${baselineWs}`)
    console.log('---- baseline command (verbatim) ----')
    console.log(baselineScript)
    console.log('---- output ----')
    const isWin = process.platform === 'win32'
    const shell = isWin ? 'pwsh' : '/bin/sh'
    const args = isWin ? ['-NoProfile', '-Command', baselineScript] : ['-c', baselineScript]
    const child = spawn(shell, args, { cwd: baselineWs, stdio: ['ignore', 'inherit', 'inherit'] })
    const killer = setTimeout(() => { child.kill(); console.error('baseline timeout (30min)') }, 30 * 60 * 1000)
    child.on('close', (code) => {
      clearTimeout(killer)
      const c = code ?? 1
      console.log(`BASELINE_EXIT=${c} CMD=${norm(baselineScript).slice(0, 120)}`)
      process.exitCode = c
    })
    child.on('error', (e) => {
      clearTimeout(killer)
      console.error(`baseline spawn failed: ${e.message}`)
      process.exitCode = 2
    })
  }
}
