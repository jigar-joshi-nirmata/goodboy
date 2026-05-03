import { readState } from '../state.js'
import { renderBlock } from '../renderer.js'

const pleas: Record<string, string[]> = {
  goldie: [
    'please write a test!! just one!! for me!! i will be so happy!!',
    'when was the last time you did a code review?? please do one!! together we can!!',
    'you have been coding for a while!! please take a 5 minute break!! you deserve it!!',
    'have you updated your dependencies lately?? please do!! i worry about security!!',
    'please add a docstring to that function!! future you will be grateful!!',
  ],
  shiba: [
    'write a test. you know you should. i am not going to say it again.',
    'code review. do it. your PR has been sitting there for three days.',
    'take a break. you are diminishing returns right now. five minutes.',
    'update your dependencies. the audit warnings are not decorative.',
    'document that function. you will not remember this in two weeks. neither will i.',
  ],
  byte: [
    'test coverage: suboptimal. recommend: write one unit test before continuing.',
    'pending PR review detected. unreviewed code accumulates risk. address now.',
    'session duration suggests cognitive fatigue. recommended break: 10 minutes.',
    'dependency audit: overdue. `npm audit` has been waiting.',
    'undocumented function detected. documentation lag: increasing. address.',
  ],
  pugsy: [
    'write a test.',
    'code review.',
    'take a break.',
    'update deps.',
    'add a comment.',
  ],
  nova: [
    'WRITE A TEST. RIGHT NOW. THE COVERAGE IS LOW AND IT BOTHERS ME.',
    'CODE REVIEW PENDING. DO IT FAST. DO IT NOW. THEN KEEP GOING.',
    'BREAK TIME. 5 MINUTES. MANDATORY. NON-NEGOTIABLE. GO.',
    'DEPENDENCY AUDIT. NOW. SECURITY WAITS FOR NO ONE.',
    'DOCUMENT THAT FUNCTION. FUTURE-YOU RUNS FAST TOO AND WILL NEED THIS.',
  ],
  debug: [
    'test coverage gap detected. recommend: write one test targeting the uncovered path.',
    'code review queued. unreviewed code is a bug waiting to be found. i know bugs.',
    'session duration: elevated. recommend break. i will keep watching for bugs.',
    'npm audit: not run recently. logging this as a known risk.',
    'undocumented function: identified. adding to the technical debt log.',
  ],
}

export async function runBeg(): Promise<void> {
  const state = readState()
  const pool = pleas[state.persona] ?? pleas.goldie
  const quip = pool[Math.floor(Math.random() * pool.length)]
  renderBlock(state.persona, 'judgy', quip, state.terminal_protocol)
}
