// /bar: choose which mod's row shows above the prompt.
import { atom, update } from 'claude-code'
import type { EngineInterface } from 'claude-code'

const only = atom({ plugin: 'usage-strip', key: 'only' } as const, 'usage-strip')
export const ONLY_STORE_KEY = 'bar.only'
/** This mod's own name: what shows when nothing was chosen yet. */
export const OWN = 'usage-strip'
/** What the store holds after `/bar all`, so "all" is remembered and not taken for "nothing chosen". */
export const ALL = '*'

/** The choice a session starts with: what was saved, else this mod's own row alone. */
export const initialChoice = (saved: unknown): string | null => {
  if (saved === ALL) return null
  return typeof saved === 'string' && saved !== '' ? saved : OWN
}

/** Registers /bar and restores the saved choice; called from session.start. */
export async function startBar($: EngineInterface): Promise<void> {
  await $.command.register({
    name: 'bar',
    description: 'Choose which usage bar shows above the prompt (no argument lists them)',
    argumentHint: '[number | name | all]',
  })
  const saved = await $.store.get(ONLY_STORE_KEY)
  await update($, only, () => initialChoice(saved))
}

/** A row's plugin without its marketplace: `usage-strip@usage-strip` is `usage-strip`. */
export const baseName = (plugin: string): string => plugin.split('@')[0] ?? plugin

/** True when a row's plugin is the one chosen, with or without its marketplace. */
export const isChosen = (plugin: string, choice: string): boolean =>
  plugin === choice || baseName(plugin) === baseName(choice)

/** The rows /bar keeps: the chosen plugin's alone, or all when none is chosen or it draws nothing. */
export const pickRows = <R extends { plugin: string }>(rows: readonly R[], choice: string | null): readonly R[] => {
  if (choice === null) return rows
  const kept = rows.filter(r => isChosen(r.plugin, choice))
  return kept.length > 0 ? kept : rows
}

/** Resolve `/bar <arg>` against the plugins seen drawing rows: a number from the list, or part of a name. */
export const resolveChoice = (arg: string, seen: readonly string[]): string | null | undefined => {
  const a = arg.trim().toLowerCase()
  if (a === 'all' || a === 'off') return null
  const n = Number(a)
  if (Number.isInteger(n) && n >= 1 && n <= seen.length) return seen[n - 1]
  const exact = seen.find(p => p.toLowerCase() === a || baseName(p).toLowerCase() === a)
  if (exact) return exact
  const partial = seen.filter(p => p.toLowerCase().includes(a))
  return partial.length === 1 ? partial[0] : undefined
}
