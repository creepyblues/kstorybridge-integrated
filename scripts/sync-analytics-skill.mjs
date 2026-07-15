#!/usr/bin/env node

import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const canonicalPath = resolve('.claude/skills/analytics/SKILL.md')
const runtimePath = resolve('.agents/skills/analytics/SKILL.md')

await mkdir(dirname(runtimePath), { recursive: true })
await copyFile(canonicalPath, runtimePath)

console.log('Analytics runtime skill synchronized from the tracked canonical skill.')
