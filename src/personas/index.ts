import { PersonaConfig, PersonaId } from './types.js'

export const PERSONAS: Record<PersonaId, PersonaConfig> = {
  goldie: {
    id: 'goldie',
    name: 'Goldie',
    breed: 'Golden Retriever',
    tagline: 'enthusiastic optimist. celebrates everything.',
    colors: { primary: '#FFD700', accent: '#FFA500' },
    ascii: {
      happy: [
        '  /^\\ ',
        ' (°ᴥ°) ♪',
        '  )🎀(',
        ' /|  |\\',
      ],
      excited: [
        '  /^\\ /',
        ' (^ᴥ^)!!',
        '  )🎀(  ',
        '_/|  |\\_',
      ],
      proud: [
        '  /^\\ ★',
        ' (ᵔᴥᵔ) ',
        '  )🎀(',
        ' /|  |\\',
      ],
      alarmed: [
        '  /^\\ !',
        ' (°O°)! ',
        '  )🎀(',
        ' /|  |\\',
      ],
      sad: [
        '  /^\\ ',
        ' (óᴥò)  ',
        '  )🎀(',
        ' /|  |\\',
      ],
      sleepy: [
        '  /^\\ z',
        ' (-.-)  ',
        '  )🎀(',
        '/z|  |\\ ',
      ],
      judgy: [
        '  /^\\ ',
        ' (¬_¬)  ',
        '  )🎀(',
        ' /|  |\\',
      ],
      disgusted: [
        '  /^\\ ',
        ' (>_<)  ',
        '  )🎀( ~',
        ' /|  |\\',
      ],
    },
  },

  byte: {
    id: 'byte',
    name: 'Byte',
    breed: 'Border Collie',
    tagline: 'focused and clever. keeps you on track.',
    colors: { primary: '#4A9EFF', accent: '#2563EB' },
    ascii: {
      happy: [
        '  /|\\ ',
        ' (°v°) ◈',
        '  | ● |',
        ' /|   |\\',
      ],
      excited: [
        '  /|\\ /',
        ' (^v^)! ',
        '  | ● |',
        '_/|   |\\_',
      ],
      proud: [
        '  /|\\ ★',
        ' (ᵔvᵔ)  ',
        '  | ● |',
        ' /|   |\\',
      ],
      alarmed: [
        '  /|\\ !',
        ' (°O°)!!',
        '  | ● |',
        ' /|   |\\',
      ],
      sad: [
        '  /|\\ ',
        ' (òvó)  ',
        '  | ● |',
        ' /|   |\\',
      ],
      sleepy: [
        '  /|\\ z',
        ' (-.-)  ',
        '  | ● |',
        '/z|   |\\ ',
      ],
      judgy: [
        '  /|\\ ',
        ' (¬v¬)  ',
        '  | ● |',
        ' /|   |\\',
      ],
      disgusted: [
        '  /|\\ ',
        ' (>_<)  ',
        '  | ● | ~',
        ' /|   |\\',
      ],
    },
  },

  shiba: {
    id: 'shiba',
    name: 'Shiba',
    breed: 'Shiba Inu',
    tagline: 'sassy and independent. roasts your code.',
    colors: { primary: '#FF8C00', accent: '#DC6900' },
    ascii: {
      happy: [
        '  /ᴥ\\ ',
        ' (^ω^) ~',
        '  )🎍(',
        '  |  |',
      ],
      excited: [
        ' _/ᴥ\\_',
        ' (^▽^)♪',
        '  )🎍(',
        ' _|  |_',
      ],
      proud: [
        '  /ᴥ\\ ★',
        ' (ᵕᴗᵕ)  ',
        '  )🎍(',
        '  |  |',
      ],
      alarmed: [
        '  /ᴥ\\ !',
        ' (°□°)! ',
        '  )🎍(',
        '  |  |',
      ],
      sad: [
        '  /ᴥ\\ ',
        ' (；ω；) ',
        '  )🎍(',
        '  |  |',
      ],
      sleepy: [
        '  /ᴥ\\ z',
        ' (-.-)  ',
        '  )🎍(',
        ' z|  |  ',
      ],
      judgy: [
        '  /ᴥ\\ ',
        ' ( ._.) ',
        '  )🎍(',
        '  |  |',
      ],
      disgusted: [
        '  /ᴥ\\ ',
        ' (>_<)  ',
        '  )🎍( ~',
        '  |  |',
      ],
    },
  },

  pugsy: {
    id: 'pugsy',
    name: 'Pugsy',
    breed: 'Pug',
    tagline: 'lazy genius. ships when you least expect it.',
    colors: { primary: '#B088F9', accent: '#7C3AED' },
    ascii: {
      happy: [
        ' (UᴥU) ',
        ' ( ♟ )  ',
        '  |🔮|',
        '  |  |',
      ],
      excited: [
        ' (UᴥU)/',
        ' ( ♟ )! ',
        '  |🔮|',
        ' _|  |_',
      ],
      proud: [
        ' (UᴥU)★',
        ' ( ♟ )  ',
        '  |🔮|',
        '  |  |',
      ],
      alarmed: [
        ' (U°U)!',
        ' ( ♟ )! ',
        '  |🔮|',
        '  |  |',
      ],
      sad: [
        ' (UvU) ',
        ' ( ♟ )  ',
        '  |🔮|',
        '  |  |',
      ],
      sleepy: [
        ' (-.-) z',
        ' ( ♟ )  ',
        '  |🔮|',
        ' z|  |  ',
      ],
      judgy: [
        ' (U_U) ',
        ' ( ♟ )  ',
        '  |🔮|',
        '  |  |',
      ],
      disgusted: [
        ' (U>U) ',
        ' ( ♟ ) ~',
        '  |🔮|',
        '  |  |',
      ],
    },
  },

  nova: {
    id: 'nova',
    name: 'Nova',
    breed: 'Siberian Husky',
    tagline: 'energetic overachiever. loves fast code.',
    colors: { primary: '#00D4FF', accent: '#0891B2' },
    ascii: {
      happy: [
        '  /||\\ ',
        ' (°▽°) ⚡',
        '  | 🔵|',
        ' /|   |\\',
      ],
      excited: [
        ' _/||\\_',
        ' (^▽^)!!',
        '  | 🔵|',
        '_/|   |\\_',
      ],
      proud: [
        '  /||\\ ★',
        ' (ᵔ▽ᵔ)  ',
        '  | 🔵|',
        ' /|   |\\',
      ],
      alarmed: [
        '  /||\\ !',
        ' (°O°)!!',
        '  | 🔵|',
        ' /|   |\\',
      ],
      sad: [
        '  /|\\ ',
        ' (ó▽ò)  ',
        '  | 🔵|',
        ' /|   |\\',
      ],
      sleepy: [
        '  /||\\ z',
        ' (-.-)  ',
        '  | 🔵|',
        '/z|   |\\ ',
      ],
      judgy: [
        '  /||\\ ',
        ' (¬▽¬)  ',
        '  | 🔵|',
        ' /|   |\\',
      ],
      disgusted: [
        '  /||\\ ',
        ' (>_<)  ',
        '  | 🔵| ~',
        ' /|   |\\',
      ],
    },
  },

  debug: {
    id: 'debug',
    name: 'Debug',
    breed: 'Dachshund',
    tagline: 'sniffing out bugs. keeping score.',
    colors: { primary: '#39D353', accent: '#16A34A' },
    ascii: {
      happy: [
        ' /^\\ ',
        '(°ᴥ°)🔍',
        '======',
        ' |  | ',
      ],
      excited: [
        ' /^\\ /',
        '(^ᴥ^)!!',
        '======  ',
        '_|  |_  ',
      ],
      proud: [
        ' /^\\ ★',
        '(ᵔᴥᵔ)🔍',
        '======',
        ' |  | ',
      ],
      alarmed: [
        ' /^\\ !',
        '(°O°)!! ',
        '======',
        ' |  | ',
      ],
      sad: [
        ' /^\\ ',
        '(óᴥò)🔍',
        '======',
        ' |  | ',
      ],
      sleepy: [
        ' /^\\ z',
        '(-.-)   ',
        '======  ',
        'z|  |   ',
      ],
      judgy: [
        ' /^\\ ',
        '(¬_¬)🔍',
        '======',
        ' |  | ',
      ],
      disgusted: [
        ' /^\\ ',
        '(>_<)   ',
        '====== ~',
        ' |  | ',
      ],
    },
  },
}

export function getPersona(id: PersonaId): PersonaConfig {
  return PERSONAS[id]
}

export const PERSONA_LIST = Object.values(PERSONAS)
