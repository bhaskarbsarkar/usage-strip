import { expect, mock, test } from 'claude-code/testing'

import { ALL, initialChoice, pickRows, resolveChoice } from './bar'

const NOW = Date.UTC(2026, 10, 23, 12, 0)

test('a new session shows our own row alone unless something else was saved', () => {
  expect(initialChoice(undefined)).toBe('usage-strip')
  expect(initialChoice(null)).toBe('usage-strip')
  expect(initialChoice('')).toBe('usage-strip')
  expect(initialChoice(ALL)).toBe(null)
  expect(initialChoice('usage-line')).toBe('usage-line')

  // The installed copy's rows may carry the marketplace in their name.
  const rows = [{ plugin: 'usage-strip@usage-strip' }, { plugin: 'token-weather-usage' }, { plugin: 'usage-line' }]
  expect(pickRows(rows, initialChoice(undefined)).map(r => r.plugin)).toEqual(['usage-strip@usage-strip'])
  expect(resolveChoice('usage-strip', rows.map(r => r.plugin))).toBe('usage-strip@usage-strip')
})

test('with nothing saved, the band above the prompt keeps only our row', async ($, on) => {
  mock.store(on, {})
  on('session.start', (_$: any, e: any) => ({ cwd: e.cwd ?? '/tmp' }))
  on('ui.render', ($: any, e: any) => {
    const { Box } = $.ui.resolve(e)
    return Box({ children: e.props.rows.map((r: any) => r.tree) })
  })
  const row = (plugin: string) => ({ plugin, tree: { type: 'Text', props: {}, children: [plugin] } })
  const ui = await $.ui.mount({
    plugin: 'usage-strip',
    surface: 'desktop',
    component: 'AbovePromptList',
    props: {
      rows: [row('token-weather-usage'), row('usage-strip'), row('usage-line')],
      hasSurvey: false,
      isCollapsed: false,
      isWorking: false,
      maxRows: 10,
    } as any,
  })
  const texts = ((await ui.findAll({ type: 'Text' })) as any[]).map(t => t.text)
  expect(texts).toEqual(['usage-strip'])
  await ui.unmount()
})

test('/bar picks a row by number or name, and falls back to all', () => {
  const seen = ['usage-strip', 'token-weather-usage', 'usage-line']
  expect(resolveChoice('2', seen)).toBe('token-weather-usage')
  expect(resolveChoice('line', seen)).toBe('usage-line')
  expect(resolveChoice('usage-strip', seen)).toBe('usage-strip')
  expect(resolveChoice('all', seen)).toBe(null)
  expect(resolveChoice('usage', seen)).toBe(undefined) // ambiguous
  expect(resolveChoice('9', seen)).toBe(undefined)

  const rows = seen.map(plugin => ({ plugin }))
  expect(pickRows(rows, 'usage-line').map(r => r.plugin)).toEqual(['usage-line'])
  expect(pickRows(rows, null)).toHaveLength(3)
  expect(pickRows(rows, 'uninstalled')).toHaveLength(3)
})

// The band stays on one line: no wrapping onto a second row.
for (const surface of ['desktop', 'terminal'] as const) {
  test(`the ${surface} band stays on one line`, async ($, on) => {
    mock.clock(on, { now: NOW })
    mock.store(on, {})
    mock.env(on, {})
    on('session.id', () => ({ value: 'session-1' }))
    on('session.start', (_$: any, e: any) => ({ cwd: e.cwd ?? '/tmp' }))
    on('ui.invalidate', () => ({ value: undefined }))
    on('command.register', () => ({ value: { command: 'bar' } }))
    on('ui.render', ($: any, e: any) => $.ui.resolve(e).Box({ children: [] }))
    on('session.usage', () => ({
      value: {
        startedAt: NOW,
        context: { tokens: 107_000, window: 1_000_000, percent: 11 },
        rateLimits: [
          { kind: 'five_hour', percentUsed: 32, resetsAt: new Date(NOW + 3 * 3_600_000).toISOString() },
          { kind: 'seven_day', percentUsed: 59, resetsAt: new Date(NOW + 3 * 86_400_000).toISOString() },
        ],
        cost: { usd: 4.32 },
      },
    }))
    await $.session.start({ source: 'startup', cwd: '/tmp' } as any)

    const ui = await $.ui.mount({ plugin: 'usage-strip', surface, component: 'AbovePrompt', props: { bodyColumns: 40 } as any })
    const boxes = (await ui.findAll({ type: 'Box' })) as any[]
    expect(boxes.some(b => b.props?.flexWrap === 'wrap')).toBe(false)
    expect(boxes.some(b => b.props?.flexWrap === 'nowrap' && b.props?.flexDirection === 'row')).toBe(true)
    await ui.unmount()
  })
}
