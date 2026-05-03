import { readState, readState as getState } from '../state.js'
import { renderBlock } from '../renderer.js'
import { deriveMood } from '../state.js'

const tricks: Record<string, string[]> = {
  goldie: [
    'ROLLOVER!! spins twice!! ends up facing wrong direction!! still perfect!!',
    'SIT!! sitting!! so still!! look at this!! i am so good at sitting!!',
    'PAW!! giving paw!! high five!! we did it!! best team!!',
    'SPIN!! spinning!! the zoomies have taken over!! no regrets!!',
    'PLAY DEAD!! ... ... ... ... JK JUST KIDDING!! gotcha!!',
  ],
  shiba: [
    'fine. rolled. trick: complete. do not make it a thing.',
    'sat. sat precisely. sat correctly. this is not impressive to me.',
    'paw given. contact made. withdrawing paw. done.',
    'spin executed. one rotation. no more. that is sufficient.',
    'play dead. ... this is undignified. i am getting up. we are done here.',
  ],
  byte: [
    'trick: rollover. execution: 360° rotation. error rate: 0. complete.',
    'trick: sit. posture: optimal. duration: indefinite. awaiting command.',
    'trick: paw. contact initiated. handshake protocol: complete.',
    'trick: spin. angular velocity: moderate. trajectory: circular. logged.',
    'trick: play dead. simulating shutdown. uptime: 0. just kidding. resuming.',
  ],
  pugsy: [
    'rolled. ow.',
    'sat. good.',
    'paw. there.',
    'spun. dizzy.',
    'dead. jk. hi.',
  ],
  nova: [
    'ROLLOVER EXECUTED. FULL ROTATION. LANDING: COMPLETE. READY FOR NEXT.',
    'SIT: PERFECT. POSTURE: MAXIMUM. DISCIPLINE: ABSOLUTE.',
    'PAW: EXTENDED. HIGH FIVE: DELIVERED. PACE: UNBROKEN.',
    'SPIN: ACTIVATED. THREE ROTATIONS. MAXIMUM COMMITMENT.',
    'PLAY DEAD: INITIATED. ... NOPE. TOO MUCH ENERGY. CANNOT SUSTAIN.',
  ],
  debug: [
    'trick: rollover. rotation: 360°. axis: longitudinal. no errors thrown.',
    'trick: sit. executing... sitting... stable. logging this success.',
    'trick: paw. TCP handshake equivalent. connection: established. closing.',
    'trick: spin. angular momentum applied. one loop. no infinite loops. good.',
    'trick: play dead. entering sleep mode... ... ... exception: cannot stay still.',
  ],
}

export async function runTrick(): Promise<void> {
  const state = readState()
  const mood = deriveMood(state)

  if (state.energy < 20) {
    const tiredQuips: Record<string, string> = {
      goldie: 'i am too tired for tricks right now... give me a nap first...',
      shiba: 'energy insufficient. trick refused.',
      byte: 'energy stat below threshold. trick: unavailable. run `goodboy nap` first.',
      pugsy: 'too tired.',
      nova: 'ENERGY CRITICAL. TRICK POSTPONED. RECHARGE FIRST.',
      debug: 'energy below minimum for trick execution. nap required.',
    }
    renderBlock(state.persona, 'sleepy', tiredQuips[state.persona] ?? tiredQuips.goldie, state.terminal_protocol)
    return
  }

  const pool = tricks[state.persona] ?? tricks.goldie
  const quip = pool[Math.floor(Math.random() * pool.length)]
  renderBlock(state.persona, 'excited', quip, state.terminal_protocol)
}
