import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readJson = async path => JSON.parse(await readFile(path, 'utf8'))

const apps = [
  {
    name: 'dashboard',
    workspace: '@kstorybridge/dashboard',
    configPath: new URL('../apps/dashboard/vercel.json', import.meta.url),
    packagePath: new URL('../apps/dashboard/package.json', import.meta.url),
    rootScript: 'build:dashboard',
  },
  {
    name: 'creator',
    workspace: '@kstorybridge/creator',
    configPath: new URL('../apps/creator/vercel.json', import.meta.url),
    packagePath: new URL('../apps/creator/package.json', import.meta.url),
    rootScript: 'build:creator',
  },
]

test('Vercel app builds use the root Turbo graph for shared-package dependencies', async () => {
  const [rootPackage, turbo] = await Promise.all([
    readJson(new URL('../package.json', import.meta.url)),
    readJson(new URL('../turbo.json', import.meta.url)),
  ])

  assert.ok(turbo.tasks?.build?.dependsOn?.includes('^build'))

  for (const app of apps) {
    const [config, packageJson] = await Promise.all([
      readJson(app.configPath),
      readJson(app.packagePath),
    ])
    assert.equal(packageJson.name, app.workspace)
    assert.equal(packageJson.dependencies?.['@kstorybridge/analytics'], '*')
    assert.equal(
      config.buildCommand,
      `cd ../.. && npm run ${app.rootScript}`,
      `${app.name} must not bypass Turbo with a direct workspace build`
    )
    assert.equal(
      rootPackage.scripts?.[app.rootScript],
      `turbo run build --filter=${app.workspace}`
    )
  }
})
