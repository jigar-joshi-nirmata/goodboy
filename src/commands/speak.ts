import { readState } from '../state.js'
import { renderBlock } from '../renderer.js'
import { deriveMood } from '../state.js'

const wisdom: Record<string, string[]> = {
  goldie: [
    'the best code is the code that makes you proud to show it to someone!!',
    'every bug fixed is just a chance to learn something new!!',
    'you are doing SO well. i know this for a fact.',
    'error messages are just the computer asking for help. we can help!!',
    'variable names should be so clear they tell a story!! an exciting story!!',
    'tests are just love letters to future you!!',
  ],
  shiba: [
    'good code does not need comments. it explains itself. write less, mean more.',
    'git blame is not an accusation. it is archaeology.',
    'the error is almost always in the last place you look. this is not helpful advice. it is just true.',
    'comments lie. code does not.',
    'the simplest solution that works is the correct solution. resist complexity.',
    'your future self will not remember why. write it down.',
  ],
  byte: [
    'a function that does two things does one of them poorly.',
    'the time you spend on naming is not wasted. it is invested.',
    'complexity compounds. simplicity also compounds. choose carefully.',
    'a test that passes for the wrong reason is worse than no test.',
    'readable code is not slow code. that is a false trade-off.',
    'the bug is in the place you are most confident it is not.',
  ],
  pugsy: [
    'done is better than perfect.',
    'if it works, it works.',
    'sleep on it.',
    'the simplest fix is usually right.',
    'future you will figure it out.',
    'shipping is good.',
  ],
  nova: [
    'FAST CODE IS READABLE CODE. THE BOTTLENECK IS ALWAYS THE ALGORITHM.',
    'SHIP EARLY. ITERATE FAST. THE PERFECT VERSION NEVER EXISTS.',
    'MOMENTUM IS EVERYTHING. KEEP MOVING. OPTIMIZE LATER.',
    'TESTS ARE NOT OPTIONAL. NEITHER IS SPEED. HAVE BOTH.',
    'THE BEST REFACTOR IS THE ONE THAT SHIPS.',
    'DONE IS THE ENGINE OF MORE.',
  ],
  debug: [
    'the bug you cannot reproduce is the bug that will come back.',
    'assume nothing. verify everything. especially the obvious things.',
    'i have seen 2,847 bugs. most of them were off-by-one errors.',
    'a minimal reproduction is worth 100 log statements.',
    'the test that catches the bug is worth keeping forever.',
    'rubber duck debugging works. i am the duck.',
  ],
}

export async function runSpeak(): Promise<void> {
  const state = readState()
  const mood = deriveMood(state)
  const pool = wisdom[state.persona] ?? wisdom.goldie
  const quip = pool[Math.floor(Math.random() * pool.length)]
  renderBlock(state.persona, mood, quip, state.terminal_protocol)
}
