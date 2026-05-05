---
name: obsidian-calendar-cli
description: Use this skill when an OpenClaw agent needs to create or find Obsidian Calendar daily or weekly notes using vault plugin settings.
---

# Obsidian Calendar CLI

Use this repo's CLI to create or find daily and weekly notes. Always pass `--vault <vault>`.

```bash
PLUGIN_REPO=/path/to/obsidian-calendar-plugin
npm --prefix "$PLUGIN_REPO" run cli-build
node "$PLUGIN_REPO/openclaw-calendar-cli.cjs" daily --vault <vault> --date 2026-05-06
```

Create or find weekly notes:

```bash
node "$PLUGIN_REPO/openclaw-calendar-cli.cjs" weekly --vault <vault> --date 2026-05-06
```

If installed or linked, `obsidian-calendar-cli ...` may be used instead.

## Safety

- Prefer explicit ISO dates for agent work.
- Existing notes are reused, not overwritten.
- Treat `ok: false` or nonzero exit as failure and report `error.message`.

