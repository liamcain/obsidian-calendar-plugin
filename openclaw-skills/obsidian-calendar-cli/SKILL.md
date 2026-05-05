---
name: obsidian-calendar-cli
description: Use this skill when an OpenClaw agent needs to create or find Obsidian Calendar daily or weekly notes using vault plugin settings.
---

# Obsidian Calendar CLI

Use the CLI shipped in the installed plugin folder. Always pass `--vault <vault>`.

```bash
VAULT=/path/to/vault
CLI="$VAULT/.obsidian/plugins/calendar/openclaw-calendar-cli.cjs"
node "$CLI" daily --vault "$VAULT" --date 2026-05-06
```

Create or find weekly notes:

```bash
node "$CLI" weekly --vault "$VAULT" --date 2026-05-06
```

If the installed plugin does not include the CLI yet, use `obsidian-calendar-cli` from `PATH` or `node "$PLUGIN_REPO/openclaw-calendar-cli.cjs"` from a checkout.

## Safety

- Prefer explicit ISO dates for agent work.
- Existing notes are reused, not overwritten.
- Treat `ok: false` or nonzero exit as failure and report `error.message`.

