import { execSync } from 'child_process'
import chalk from 'chalk'
import { readState } from '../state.js'
import { renderBlock, renderDivider } from '../renderer.js'
import { getPersona } from '../personas/index.js'

interface Finding {
  label: string
  value: string
  score: number
  deduction: number
  ok: boolean
  fix?: string
}

function tryExec(cmd: string): string {
  try { return execSync(cmd, { encoding: 'utf8', timeout: 15000, stdio: 'pipe' }).trim() } catch { return '' }
}

function countMatches(cmd: string): number {
  const out = tryExec(cmd)
  if (!out) return 0
  return out.split('\n').filter(Boolean).length
}

export async function runVet(): Promise<void> {
  const state = readState()
  const config = getPersona(state.persona)
  const c = chalk.hex(config.colors.primary)
  const dim = chalk.dim

  const startQuips: Record<string, string> = {
    goldie: 'full health check!! checking everything!! i care about this codebase!!',
    shiba: 'running diagnostics. i will not soften the results.',
    byte: 'initiating full codebase health assessment.',
    pugsy: 'checking.',
    nova: 'VET MODE. FULL DIAGNOSTIC. ALL METRICS. FAST.',
    debug: 'vet event: initiated. comprehensive codebase scan: running.',
  }

  renderBlock(state.persona, 'proud', startQuips[state.persona] ?? startQuips.goldie, state.terminal_protocol)

  const findings: Finding[] = []
  let score = 100

  // Test files
  const testFiles = countMatches('find . -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | grep -v node_modules | grep -v .git')
  const hasTests = testFiles > 0
  const testFinding: Finding = {
    label: 'test files',
    value: `${testFiles} found`,
    score: 0,
    deduction: hasTests ? 0 : 20,
    ok: hasTests,
    fix: hasTests ? undefined : 'add tests — start with `*.test.ts` files',
  }
  findings.push(testFinding)

  // TODO / FIXME count
  const todoCount = countMatches('grep -r "TODO\\|FIXME" src/ 2>/dev/null | grep -v node_modules')
  const todoOk = todoCount <= 5
  findings.push({
    label: 'TODO / FIXME',
    value: `${todoCount} found`,
    score: 0,
    deduction: todoOk ? 0 : todoCount > 20 ? 15 : 10,
    ok: todoOk,
    fix: todoOk ? undefined : 'resolve or track TODOs in GitHub issues',
  })

  // console.log in src
  const consoleLogs = countMatches('grep -r "console\\.log" src/ 2>/dev/null | grep -v node_modules | grep -v "\\.test\\."')
  const consoleOk = consoleLogs === 0
  findings.push({
    label: 'console.log in src',
    value: `${consoleLogs} found`,
    score: 0,
    deduction: consoleOk ? 0 : Math.min(10, consoleLogs * 2),
    ok: consoleOk,
    fix: consoleOk ? undefined : 'remove console.log or use a proper logger',
  })

  // Large files (> 500 lines)
  const largeFiles = tryExec("find . -name '*.ts' -o -name '*.js' 2>/dev/null | grep -v node_modules | grep -v dist | xargs wc -l 2>/dev/null | awk '$1 > 500 {print $2}' | grep -v total")
  const largeCount = largeFiles ? largeFiles.split('\n').filter(Boolean).length : 0
  const largeOk = largeCount === 0
  findings.push({
    label: 'files > 500 lines',
    value: largeCount === 0 ? 'none' : `${largeCount}: ${largeFiles.split('\n')[0]}...`,
    score: 0,
    deduction: largeOk ? 0 : Math.min(15, largeCount * 5),
    ok: largeOk,
    fix: largeOk ? undefined : 'split large files into smaller modules',
  })

  // TypeScript errors
  const tscOutput = tryExec('tsc --noEmit 2>&1 | grep "error TS" | wc -l')
  const tscErrors = parseInt(tscOutput, 10) || 0
  const tscOk = tscErrors === 0
  findings.push({
    label: 'typescript errors',
    value: tscErrors === 0 ? 'none' : `${tscErrors} error${tscErrors !== 1 ? 's' : ''}`,
    score: 0,
    deduction: tscOk ? 0 : Math.min(20, tscErrors * 3),
    ok: tscOk,
    fix: tscOk ? undefined : 'run `tsc --noEmit` to see full error list',
  })

  // Compute final score
  for (const f of findings) score = Math.max(0, score - f.deduction)

  // Render results
  renderDivider(c)
  console.log()

  for (const f of findings) {
    const icon = f.ok ? c('✓') : chalk.red('✗')
    const deducStr = f.deduction > 0 ? chalk.red(` -${f.deduction}`) : ''
    console.log(`  ${icon}  ${f.label.padEnd(22)} ${dim(f.value)}${deducStr}`)
    if (!f.ok && f.fix) console.log(dim(`       → ${f.fix}`))
  }

  console.log()
  renderDivider(c)

  const scoreColor = score >= 80 ? c : score >= 60 ? chalk.yellow : chalk.red
  console.log(`\n  health score: ${scoreColor(String(score))}/100\n`)
  renderDivider(c)
  console.log()

  // Summary quip based on score
  const getQuip = (persona: string) => {
    const ranges: Record<string, Record<string, string>> = {
      goldie: {
        high: 'this codebase is in great shape!! i am so proud!! look at these numbers!!',
        mid: 'pretty good!! a few things to fix but i believe we can do it!!',
        low: 'we have work to do... but we are going to be okay!! i believe in us!!',
      },
      shiba: {
        high: 'clean. not impressed, but it is objectively clean.',
        mid: 'adequate. could be worse. should be better.',
        low: 'this codebase needs attention. i will not sugarcoat it.',
      },
      byte: {
        high: `health score ${score}/100. all metrics within acceptable range. ship it.`,
        mid: `health score ${score}/100. moderate technical debt. address before next release.`,
        low: `health score ${score}/100. significant remediation required. do not ship this.`,
      },
      pugsy: { high: 'clean.', mid: 'ok.', low: 'fix this.' },
      nova: {
        high: `${score}/100! CLEAN! FAST! READY TO SHIP!`,
        mid: `${score}/100. SOME ISSUES. FIX THEM FAST. THEN SHIP.`,
        low: `${score}/100. NOT GREAT. FIXING BEFORE SHIPPING. NON-NEGOTIABLE.`,
      },
      debug: {
        high: `vet complete. score: ${score}/100. all checks nominal. codebase: healthy.`,
        mid: `vet complete. score: ${score}/100. issues found: documented. remediation: recommended.`,
        low: `vet complete. score: ${score}/100. significant issues logged. shipping not recommended.`,
      },
    }
    const tier = score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low'
    return ranges[persona]?.[tier] ?? `health score: ${score}/100`
  }

  const mood = score >= 80 ? 'excited' : score >= 60 ? 'judgy' : 'sad'
  renderBlock(state.persona, mood, getQuip(state.persona), state.terminal_protocol)
}
