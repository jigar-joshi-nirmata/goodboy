import { execSync } from 'child_process'
import { readState } from '../state.js'
import { renderBlock } from '../renderer.js'

export async function runFetch(): Promise<void> {
  const state = readState()

  let fetchResult = ''
  let error = false

  try {
    execSync('git fetch --all --prune 2>&1', { encoding: 'utf8', timeout: 10000 })
    try {
      const log = execSync('git log HEAD..@{u} --oneline 2>/dev/null || echo ""', { encoding: 'utf8', timeout: 5000 }).trim()
      const count = log ? log.split('\n').filter(Boolean).length : 0
      fetchResult = count > 0 ? `fetched ${count} new commit${count !== 1 ? 's' : ''}` : 'already up to date'
    } catch {
      fetchResult = 'fetched'
    }
  } catch {
    error = true
    fetchResult = 'fetch failed (no remote?)'
  }

  const quips: Record<string, (r: string, err: boolean) => string> = {
    goldie: (r, e) => e ? `i tried to fetch!! but something went wrong!! ${r}!!` : `fetched!! ${r}!! good things are incoming!!`,
    shiba: (r, e) => e ? `fetch failed. ${r}.` : `fetched. ${r}. as expected.`,
    byte: (r, e) => e ? `git fetch: failed. reason: ${r}.` : `git fetch: complete. ${r}.`,
    pugsy: (r, e) => e ? `fetch failed.` : `fetched. ${r}.`,
    nova: (r, e) => e ? `FETCH FAILED. ${r.toUpperCase()}.` : `FETCH COMPLETE. ${r.toUpperCase()}. LET'S GO.`,
    debug: (r, e) => e ? `git fetch: error. ${r}. network or remote issue.` : `git fetch: success. result: ${r}. good boy.`,
  }

  const quipFn = quips[state.persona] ?? quips.goldie
  const quip = quipFn(fetchResult, error)
  const mood = error ? 'sad' : 'excited'

  renderBlock(state.persona, mood, quip, state.terminal_protocol)
}
