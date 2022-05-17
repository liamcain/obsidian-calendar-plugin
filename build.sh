#!/usr/bin/env bash
set -e

# Keep
# pushd "../obsidian-calendar-ui"
# yarn run dev
# popd

# rm -rf ./node_modules/obsidian-calendar-ui
# mkdir ./node_modules/obsidian-calendar-ui
# cp ../obsidian-calendar-ui/dist/main.js ./node_modules/obsidian-calendar-ui/index.js
# cp ../obsidian-calendar-ui/dist/index.d.ts ./node_modules/obsidian-calendar-ui/
# cp ../obsidian-calendar-ui/package.json ./node_modules/obsidian-calendar-ui/

# Keep
# pushd "../obsidian-calendar-plugin"
# yarn run dev
# popd

yarn run dev
# cp './main.js' '/Users/liam/Documents/Test Vault/.obsidian/plugins/calendar/'
cp './main.js' '/Users/liam/Notes/.obsidian/plugins/calendar/'