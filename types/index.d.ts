/** /bar's choice: the plugin whose row alone shows above the prompt, or null for all. */
export type BarChoice = string | null

declare module 'claude-code' {
  interface PluginState {
    'usage-strip': {
      only: BarChoice
    }
  }
}
