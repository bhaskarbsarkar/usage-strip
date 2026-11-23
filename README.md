# usage-strip

[![License: Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)
[![Claude Code mod](https://img.shields.io/badge/Claude%20Code-mod-c96442)](#install)

Your Claude Code usage on **one compact line** above the prompt: how full the context is, how much of your 5-hour and weekly limits you've used, how long the prompt cache stays warm, what the session costs, and which subagents are running. Hover any pill for the details.

```text
☀ 107k │ 5h 32% · 3h00 │ 7d 59% · 3d00h │ cache 52 min │ ≈ $4.84 │ 2 agents
```

In the desktop app each block is a small tinted pill with an icon. In the terminal they're separated by thin rules, as above.

usage-strip is a slimmed-down fork of [Token Weather Usage](https://github.com/augiefra/claude-mods) by Eric Cologni. It keeps the same readings but drops the gauges and charts, so the band stays on one line even in a narrow window.

## What each pill says

| Pill | On the line | Hover card |
| --- | --- | --- |
| **Context** | Weather icon (Clear → Cloudy → Showers → Storm → Compact soon) and the tokens in the context | The weather, the share of the context window, and what the last prompt added |
| **5h** | Share of the 5-hour limit used, time until it resets | The limit's name, the share used, and the reset time |
| **7d** | Share of the weekly limit used, time until it resets | The same for the weekly limit |
| **Cache** | Minutes before the prompt cache lapses | When it expires, how much the last message read from it, and what a rewrite would cost |
| **Cost** | Estimated cost of the session | What the figure means (API list prices, as `/cost` shows; not billed on a subscription) and what the last prompt added in dollars and in points of the 5-hour limit |
| **Agents** | Subagents running now (only while some run) | Each one's type and task |

### Colors

- **Limits:** the percentage turns **red** at 90% used, or when you're more than 15 points ahead of the clock.
- **Cache:** **yellow** under 10 minutes left, with what letting it lapse would cost. **Red** once it has expired, with a suggestion: `/compact` from 100k tokens, a new thread from 300k.
- **Context:** the weather icon changes at 25%, 50%, 75% and 90% of the window.

## Install

**At the Claude Code prompt** (terminal):

```text
/plugin install usage-strip --marketplace bhaskarbsarkar/usage-strip
```

Answer `y` to add the marketplace, then pick a scope. "User" puts the mod in every session. It starts in the current session right away.

**From a shell:**

```bash
claude plugin install usage-strip --marketplace bhaskarbsarkar/usage-strip
```

**In the Claude desktop app:** click **+** next to the prompt box, then **Plugins** → **Add marketplace**, enter `bhaskarbsarkar/usage-strip`, then **Add plugin**.

On Team and Enterprise plans an administrator may limit which marketplaces can be added. If so, ask them to allow this repository.

## Update

```bash
claude plugin marketplace update usage-strip
```

```bash
claude plugin update usage-strip@usage-strip
```

The update takes effect after Claude Code restarts.

## Commands and options

- **`/bar`**: if several mods draw a usage band above the prompt, `/bar` lists them, `/bar <number|name>` shows only that one, and `/bar all` shows every band. By default, only usage-strip's band shows. The choice is remembered across sessions.
- **Language** (`/config` → usage-strip): `en`, `fr`, or `auto`. `auto` follows `LC_ALL`, `LC_MESSAGES` or `LANG` and falls back to English.

## Privacy and security

- **No network access.** The mod makes no requests of its own. It only reads the figures Claude Code already has: context size, rate limits, token usage and session cost.
- **Environment variables read:**
  - `LANG`, `LC_ALL` and `LC_MESSAGES`, to choose the language;
  - `DISABLE_PROMPT_CACHING`, `FORCE_PROMPT_CACHING_5M`, `CLAUDE_CODE_PROMPT_CACHE_TTL` and `ENABLE_PROMPT_CACHING_1H`, to know the cache lifetime.

  It reads nothing else and writes nothing.
- **What it stores:**
  - the last limit reading, so all open sessions agree;
  - each session's recent context readings, deleted after 8 days of inactivity;
  - your `/bar` choice.

  Everything stays in Claude Code's own local plugin storage on your machine. No file paths, prompts or code are kept.
- **No files, no shell.** It doesn't read or write your files and doesn't run commands.

Mods run on your machine with the same permissions as Claude Code, without a sandbox. As with any mod, read the code under [`hooks/`](hooks) before installing.

## Prices

The cache and cost estimates use Anthropic's public list prices per model, which are listed in `PRICES` in [`hooks/weather.mjs`](hooks/weather.mjs) with the date they were checked. For a model missing from that table, the cache pill shows tokens instead of dollars.

## Development

Run it from a clone without installing:

```bash
claude --plugin-dir ./usage-strip
```

Check and test:

```bash
claude plugin validate .
```

```bash
claude plugin test .
```

| File | What it holds |
| --- | --- |
| `hooks/register.tsx` | Entry point: loads the band and the `/bar` command |
| `hooks/weather.mjs` | The band: readings, pills, hover cards |
| `hooks/bar.ts` | `/bar`: choosing which usage band shows |
| `hooks/*.test.ts` | Tests |
| `types/index.d.ts` | The mod's state contract |

## Credits

- [Token Weather Usage](https://github.com/augiefra/claude-mods) by Eric Cologni (Apache-2.0): the band this fork is built from.
- Anthropic's Token Weather example (Apache-2.0): the weather and context readings.
- [HolyGrail's usage-meter](https://github.com/HolyGrail/claude-mods) and [Daniel San's prompt-cache-control](https://github.com/davila7/claude-code-templates): the ideas behind the limit and cache blocks.

See [NOTICE](NOTICE) for what changed from upstream.

## License

[Apache License 2.0](LICENSE). This project is a modified version of Apache-2.0 work; see [NOTICE](NOTICE).
