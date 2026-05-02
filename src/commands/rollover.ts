import { readState } from '../state.js'
import { renderBlock } from '../renderer.js'

const tricks: Record<string, string[]> = {
  goldie: [
    'ROLLOVER!! spins twice!! ends up facing wrong direction!! still perfect!!',
    'rolling!! paws up!! tongue out!! you love me!! i know it!!',
    'did you see that!! i rolled over!! i am so good!! please notice me!!',
  ],
  shiba: [
    'fine. rolled. trick: complete. do not make it a thing.',
    'i did the trick. i expect compensation.',
    'rolled. returned to neutral. do not clap.',
  ],
  byte: [
    'trick: rollover. execution: successful. approval rating: awaiting input.',
    'rollover subroutine: complete. performance: within expected parameters.',
    '360° rotation: logged. awaiting follow-up command.',
  ],
  pugsy: [
    'rolled. ow.',
    'did it. tired.',
    'rollover achieved. breathing heavy.',
  ],
  nova: [
    'ROLLOVER EXECUTED. FULL ROTATION. LANDING COMPLETE. READY FOR NEXT.',
    'TRICK MODE: ACTIVATED. ROLLOVER: DONE. TRICKS REMAINING: INFINITE.',
    'BOOM. ROLLED. TWICE. YOU\'RE WELCOME.',
  ],
  debug: [
    'trick: rollover. axis: longitudinal. rotation: 360°. ground contact: verified.',
    'rollover event fired. no exceptions thrown. treat expected.',
    'execution: complete. rolled from position A to position A. loop detected. exiting.',
  ],
}

export async function runRollover(): Promise<void> {
  const state = readState()

  const options = tricks[state.persona] ?? tricks.goldie
  const quip = options[Math.floor(Math.random() * options.length)]

  renderBlock(state.persona, 'excited', quip, state.terminal_protocol)
}
