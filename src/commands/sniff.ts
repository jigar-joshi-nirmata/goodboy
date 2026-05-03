import { execSync } from 'child_process'
import chalk from 'chalk'
import { readState } from '../state.js'
import { renderBlock, renderDivider } from '../renderer.js'
import { getPersona } from '../personas/index.js'

interface SniffCheck {
  name: string
  command: string
  fix?: string
}

const DEFAULT_CHECKS: SniffCheck[] = [
  { name: 'typescript', command: 'tsc --noEmit 2>&1 | head -20', fix: 'fix type errors' },
  { name: 'eslint', command: 'eslint . --max-warnings=0 2>&1 | tail -5', fix: 'eslint --fix .' },
  { name: 'jest', command: 'jest --passWithNoTests 2>&1 | tail -5', fix: 'write tests' },
]

function runCheck(check: SniffCheck): { passed: boolean; output: string; durationMs: number } {
  const start = Date.now()
  try {
    const output = execSync(check.command, { encoding: 'utf8', timeout: 30000, stdio: 'pipe' })
    return { passed: true, output: output.trim().split('\n').slice(-3).join('\n'), durationMs: Date.now() - start }
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string }
    const out = ((err.stdout ?? '') + '\n' + (err.stderr ?? '')).trim().split('\n').slice(-3).join('\n')
    return { passed: false, output: out, durationMs: Date.now() - start }
  }
}

export async function runSniff(): Promise<void> {
  const state = readState()
  const config = getPersona(state.persona)
  const c = chalk.hex(config.colors.primary)
  const dim = chalk.dim

  const startQuips: Record<string, string> = {
    goldie: 'sniffing everything!! running all the checks!! so thorough!!',
    shiba: 'running checks. stand by.',
    byte: 'diagnostics initiated. running configured checks.',
    pugsy: 'sniffing.',
    nova: 'SNIFF MODE ACTIVATED. RUNNING ALL CHECKS. FAST.',
    debug: 'sniff event: started. running diagnostic suite.',
  }

  renderBlock(state.persona, 'proud', startQuips[state.persona] ?? startQuips.goldie, state.terminal_protocol)

  const results = DEFAULT_CHECKS.map(check => ({ check, result: runCheck(check) }))
  const passed = results.filter(r => r.result.passed).length
  const failed = results.length - passed

  renderDivider(c)
  console.log()

  for (const { check, result: res } of results) {
    const icon = res.passed ? c('✓') : chalk.red('✗')
    const dur = `(${res.durationMs}ms)`
    console.log(`  ${icon}  ${check.name.padEnd(14)} ${dim(dur)}`)
    if (!res.passed && res.output) {
      for (const line of res.output.split('\n').slice(0, 3)) {
        if (line.trim()) console.log(dim('     ' + line.trim()))
      }
      if (check.fix) console.log(dim(`     → fix: ${check.fix}`))
    }
  }

  console.log()
  renderDivider(c)
  console.log()

  const summaryQuips: Record<string, (p: number, f: number) => string> = {
    goldie: (p, f) => f === 0 ? 'ALL CLEAN!! everything passed!! i am so proud of this codebase!!' : `${f} check${f !== 1 ? 's' : ''} failed... but we can fix this!! i believe in us!!`,
    shiba: (p, f) => f === 0 ? 'checks passed. acceptable.' : `${f} issue${f !== 1 ? 's' : ''}. not great.`,
    byte: (p, f) => f === 0 ? `all ${p} checks passing. codebase: clean.` : `${f} check${f !== 1 ? 's' : ''} failed. remediation required.`,
    pugsy: (p, f) => f === 0 ? 'clean.' : `${f} problems.`,
    nova: (p, f) => f === 0 ? `ALL ${p} CHECKS GREEN. CLEAN BUILD. FULL SPEED.` : `${f} CHECK${f !== 1 ? 'S' : ''} FAILED. FIXING BEFORE MOVING.`,
    debug: (p, f) => f === 0 ? `sniff complete. ${p} checks passing. 0 issues logged.` : `sniff complete. ${f} issue${f !== 1 ? 's' : ''} found. logging for remediation.`,
  }

  const mood = failed === 0 ? 'excited' : 'judgy'
  const fn = summaryQuips[state.persona] ?? summaryQuips.goldie
  renderBlock(state.persona, mood, fn(passed, failed), state.terminal_protocol)
}
