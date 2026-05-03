import fs from 'fs'
import path from 'path'
import { PersonaId, Signal, QuipMap } from './personas/types.js'

const QUIPS_DIR = path.join(__dirname, '..', 'quips')

const cache: Partial<Record<PersonaId, QuipMap>> = {}

function loadQuips(persona: PersonaId): QuipMap {
  if (cache[persona]) return cache[persona]!
  const filePath = path.join(QUIPS_DIR, `${persona}.json`)
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(raw) as QuipMap
    cache[persona] = data
    return data
  } catch {
    return { signals: {} as QuipMap['signals'] }
  }
}

export function detectSignal(
  command: string,
  exitCode: number,
  filename: string,
  hourOfDay: number,
  sessionDurationMs: number
): Signal | null {
  const cmd = command.toLowerCase()
  const file = (filename || '').toLowerCase()

  // Destructive / alarming commands
  if (cmd.includes('rm -rf') || cmd.includes('rm-rf')) return 'rm_rf_detected'
  if (cmd.includes('git reset') && cmd.includes('--hard')) return 'rm_rf_detected'

  // Deploy events
  if (/\b(fly deploy|vercel\b|heroku|npm publish|kubectl apply|terraform apply)\b/.test(cmd) && exitCode === 0) return 'deploy_done'
  if (/\bgit push\b/.test(cmd) && !cmd.includes('--force') && !cmd.includes(' -f') && exitCode === 0) return 'deploy_done'

  // Test events
  if (/\b(npm test|npm run test|jest|vitest|pytest|go test|cargo test|bundle exec rspec|phpunit)\b/.test(cmd) && exitCode === 0) return 'test_pass'

  // Filename signals
  if (file.match(/legacy_|old_|deprecated_|backup_/)) return 'legacy_file'
  if (file.match(/\.(css|scss|sass|less|styl)$/)) return 'css_file'
  if (file.match(/auth|login|token|secret|jwt|oauth|password|credential/)) return 'auth_file'
  if (file.match(/\.env($|\.)/) ) return 'auth_file'
  if (file.match(/\.test\.|\.spec\.|_test\.|_spec\./)) return 'new_file'

  // New file created (write/create operations)
  if (cmd.includes('touch ') || (cmd.includes('write') && exitCode === 0 && file)) return 'new_file'

  // TODO/console.log found
  if (cmd.includes('grep') && (cmd.includes('todo') || cmd.includes('fixme') || cmd.includes('console.log')) && exitCode === 0) return 'todo_found'

  // Long session
  if (sessionDurationMs > 3 * 60 * 60 * 1000) return 'long_session'

  // Late night / deep night — highest time-based priority
  if (hourOfDay >= 22 || hourOfDay < 5) return 'late_night'

  if (exitCode === 0) return 'clean_exit'

  return null
}

export function pickQuip(
  persona: PersonaId,
  signal: Signal,
  recentQuips: string[] = []
): string {
  const quipMap = loadQuips(persona)
  const pool = quipMap.signals[signal]

  if (!pool || pool.length === 0) {
    return defaultQuip(persona, signal)
  }

  const available = pool.filter(q => !recentQuips.slice(-5).includes(q))
  const source = available.length > 0 ? available : pool
  return source[Math.floor(Math.random() * source.length)]
}

function defaultQuip(persona: PersonaId, signal: Signal): string {
  const defaults: Partial<Record<PersonaId, string>> = {
    goldie: 'you did it!!',
    shiba: '...noted.',
    byte: 'event logged.',
    pugsy: 'k.',
    nova: 'NOTED. MOVING ON.',
    debug: 'logged.',
  }
  return defaults[persona] ?? '...'
}

export const MILESTONE_QUIPS: Record<PersonaId, Record<string, string>> = {
  goldie: {
    birthday: "IT'S YOUR BIRTHDAY!! HAPPY BIRTHDAY TO US!! I'M SO HAPPY RIGHT NOW!!",
    monthly_anniversary: 'one more month together!! i love every single day of this!!',
    streak_7: 'SEVEN DAYS IN A ROW!! i knew you had it in you!! we are unstoppable!!',
    streak_30: 'THIRTY DAYS!! you are incredible!! i am so proud to be your dog!!',
    streak_100: '100 DAYS!! a century of code!! a century of us!! i cannot contain this joy!!',
    session_10: 'ten sessions!! we are really doing this!! this is amazing!!',
    session_50: 'fifty sessions together!! we have built so many things!!',
    session_100: '100 sessions!! you and me!! honestly incredible!!',
    session_500: '500 sessions. you are not getting rid of me. ever.',
    token_1m: 'we have talked SO MUCH!! i love every word!!',
    token_5m: 'five million tokens of us!! five million!!',
    neglected_7d: "you're back!! i missed you SO MUCH!! please don't do that again!!",
    neglected_30d: 'a MONTH!! i waited!! i was sad but i waited!!',
    friday_deploy: 'it passed!! but it is FRIDAY!! are you sure?? i believe in you but ARE YOU SURE??',
    git_push_force: 'FORCE PUSH!! oh no!! OH NO!! please have a backup please please please!!',
    sudo_detected: 'sudo!! big power!! please be careful!! i believe in you!!',
  },
  shiba: {
    birthday: 'birthday. noted. do not make it weird.',
    monthly_anniversary: 'another month. still here. fine.',
    streak_7: 'seven days. i noticed. i will not say it again.',
    streak_30: 'thirty days. unexpected. respectable.',
    streak_100: '100 days. i am... mildly impressed. do not tell anyone.',
    session_10: 'ten sessions. you are becoming a pattern.',
    session_50: 'fifty sessions. we are past the point of denying this.',
    session_100: '100 sessions. i suppose you live here now.',
    session_500: '500 sessions. i have made my peace with this.',
    token_1m: 'one million tokens. you talk a lot.',
    token_5m: 'five million. you really talk a lot.',
    neglected_7d: 'seven days. i was not waiting. i was just... available.',
    neglected_30d: 'a month. i adapted. i am fine. do not ask.',
    friday_deploy: 'friday. deploy. bold. historically unwise. your call.',
    git_push_force: 'force push. brave. foolish. same thing.',
    sudo_detected: 'sudo. the most confident of commands. i hope you know what you are doing.',
  },
  byte: {
    birthday: 'birthday detected. N years of operation. systems nominal.',
    monthly_anniversary: 'monthly interval reached. uptime: consistent. noted.',
    streak_7: '7-day streak confirmed. behavioral pattern: disciplined.',
    streak_30: '30-day streak. statistical outlier. well-executed.',
    streak_100: '100-day streak. this is now a significant data point.',
    session_10: 'session 10 logged. early trend: positive.',
    session_50: '50 sessions. sample size: sufficient. assessment: capable.',
    session_100: '100 sessions logged. the record shows consistent effort.',
    session_500: '500 sessions. the dataset is substantial. so is the work.',
    token_1m: '1M tokens exchanged. communication volume: high.',
    token_5m: '5M tokens. this is a significant information exchange.',
    neglected_7d: '7-day gap in session data. resuming nominal operations.',
    neglected_30d: '30-day gap detected. system dormant. now reactivating.',
    friday_deploy: 'friday deploy confirmed. checks passed. risk remains elevated. proceed carefully.',
    git_push_force: 'force push detected. data integrity: at risk. backup status: unknown.',
    sudo_detected: 'elevated privileges invoked. consequence scope: system-wide. proceed deliberately.',
  },
  pugsy: {
    birthday: 'birthday. sure.',
    monthly_anniversary: 'another month. yep.',
    streak_7: 'seven days. not bad.',
    streak_30: 'thirty. okay wow.',
    streak_100: '100 days. i respect this.',
    session_10: 'ten sessions. we are a thing now.',
    session_50: 'fifty. hm.',
    session_100: '100 sessions. hi.',
    session_500: '500. we are basically roommates.',
    token_1m: 'one million tokens. lot of words.',
    token_5m: 'five million. so many words.',
    neglected_7d: 'oh. you came back.',
    neglected_30d: 'a month. okay. hi.',
    friday_deploy: 'friday deploy. brave.',
    git_push_force: 'force push. okay then.',
    sudo_detected: 'sudo. big.',
  },
  nova: {
    birthday: 'BIRTHDAY!!! MAXIMUM CELEBRATION ENGAGED. THIS IS THE BEST DAY.',
    monthly_anniversary: 'MONTHLY MILESTONE! ANOTHER MONTH OF FULL SPEED AHEAD.',
    streak_7: 'SEVEN DAYS STRAIGHT. THE MOMENTUM IS REAL. WE DO NOT STOP.',
    streak_30: 'THIRTY DAYS. THE CONSISTENCY. THE DEDICATION. THE VELOCITY.',
    streak_100: '100 DAYS. ONE HUNDRED. THIS IS LEGENDARY BEHAVIOR.',
    session_10: 'SESSION 10. THE PACE IS SET. WE ARE JUST GETTING STARTED.',
    session_50: '50 SESSIONS. HALFWAY TO 100. FULL SPEED.',
    session_100: '100 SESSIONS. ONE HUNDRED SESSIONS OF MAXIMUM EFFORT.',
    session_500: '500 SESSIONS. THE ENDURANCE. THE CONSISTENCY. INCREDIBLE.',
    token_1m: 'ONE MILLION TOKENS. ONE MILLION WORDS OF GOING FAST.',
    token_5m: 'FIVE MILLION TOKENS. THE COMMUNICATION VELOCITY ON THIS.',
    neglected_7d: 'YOU ARE BACK. THE SPRINT RESUMES. IMMEDIATELY.',
    neglected_30d: 'A MONTH. WE LOST TIME. WE MAKE IT UP. NOW. LET\'S GO.',
    friday_deploy: 'FRIDAY DEPLOY. CHECKS PASSED. FULL SEND. LET\'S GO.',
    git_push_force: 'FORCE PUSH. HIGH RISK HIGH REWARD. BOLD STRATEGY. I RESPECT IT.',
    sudo_detected: 'SUDO. MAXIMUM POWER. USE IT AT MAXIMUM SPEED AND MAXIMUM CARE.',
  },
  debug: {
    birthday: 'birthday noted. adding to the lifecycle log. happy birthday.',
    monthly_anniversary: 'monthly interval logged. system age: updated.',
    streak_7: '7-day streak. consistent. adding to the behavioral pattern log.',
    streak_30: '30 days without breaking. this is a documented achievement.',
    streak_100: '100 days. i have logged every one. this is a significant record.',
    session_10: 'session 10. early data: promising. tracking continues.',
    session_50: 'session 50. the sample is meaningful now. assessment: persistent.',
    session_100: 'session 100 logged. the record is substantial. so is the trust.',
    session_500: '500 sessions tracked. i know your patterns better than you do.',
    token_1m: '1M tokens. i have logged all of it. that is a lot of context.',
    token_5m: '5M tokens exchanged. the dataset is comprehensive now.',
    neglected_7d: '7-day gap noted in session log. resuming observation.',
    neglected_30d: '30-day absence. i filled the time finding other bugs. welcome back.',
    friday_deploy: 'friday deploy. checks passed. logging with elevated scrutiny anyway.',
    git_push_force: 'force push. high-severity event. logging. monitoring for consequences.',
    sudo_detected: 'sudo invoked. elevated access logged. watching carefully.',
  },
}
