#!/usr/bin/env bash

pushd "..\obsidian-calendar-ui"
yarn run build
popd

pushd "..\obsidian-calendar-plugin"
yarn --force
yarn run build
popd

cp '.\main.js' '..\..\Notes\Test Vault\.obsidian\plugins\calendar\'