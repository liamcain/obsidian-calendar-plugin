#!/usr/bin/env node
"use strict";

process.env.OPENCLAW_PLUGIN_CONFIG = JSON.stringify({
  pluginId: "calendar",
  installedId: "calendar",
  bin: "obsidian-calendar-cli",
  domain: "calendar",
  capabilities: ["settings", "daily-notes", "weekly-notes"],
  commands: ["daily", "weekly"],
});
require("./openclaw-plugin-cli.cjs");
