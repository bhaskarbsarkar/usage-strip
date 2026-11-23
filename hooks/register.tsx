import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { ALL, ONLY_STORE_KEY, isChosen, pickRows, resolveChoice } from './bar'
// The usage band itself: a port of Token Weather Usage (Apache-2.0), see weather.mjs.
// Its session.start also registers /bar (startBar in bar.ts).
import { register as registerWeather } from './weather.mjs'

// The same state as bar.ts's `only`: the engine's scan wants each file to name its own.
// Until session.start restores the saved choice, our own row shows alone (the default).
const only = atom({ plugin: 'usage-strip', key: 'only' } as const, 'usage-strip')

export const register: Register = (on, options) => {
  registerWeather(on, options)

  // Plugins that drew a row above the prompt at the last draw, for /bar's list.
  let seen: string[] = []

  on('command.run', { command: 'bar' }, async ($, e) => {
    const current = await read($, only)
    if (e.args.trim() === '') {
      if (seen.length === 0) return { text: 'No usage bars are drawing above the prompt yet.' }
      const lines = seen.map((p, i) => `  ${i + 1}. ${p}${current !== null && isChosen(p, current) ? '  ← showing' : ''}`)
      return {
        text: [
          `Bars above the prompt (${current === null ? 'showing all' : 'showing one'}):`,
          ...lines,
          '',
          'Use /bar <number|name> to show one, /bar all to show every bar.',
        ].join('\n'),
      }
    }
    const choice = resolveChoice(e.args, seen)
    if (choice === undefined) {
      return { text: `No single bar matches "${e.args.trim()}". Run /bar to list them.` }
    }
    await update($, only, () => choice)
    // "all" is saved too: with nothing saved, a session starts with our own row alone.
    await $.store.set(ONLY_STORE_KEY, choice === null ? ALL : choice)
    return { text: choice === null ? 'Showing every bar above the prompt.' : `Showing only ${choice} above the prompt.` }
  })

  on('ui.render', { component: 'AbovePromptList' }, async ($, e, next) => {
    seen = e.props.rows.map(r => r.plugin)
    const choice = await read($, only)
    return next({ ...e, props: { ...e.props, rows: pickRows(e.props.rows, choice) } })
  })
}
