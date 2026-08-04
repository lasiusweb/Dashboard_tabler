import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pkgJson = path.join(__dirname, '../../core/package.json')
const pkg = JSON.parse(readFileSync(pkgJson, 'utf8'))

const year = new Date().getFullYear()

function getBanner(pluginFilename) {
  return `/*!
 * FirstCrop${pluginFilename ? ` ${pluginFilename}` : ''} v${pkg.version} (${pkg.homepage})
 * Copyright 2018-${year} The FirstCrop Authors
 * Forked from Tabler (https://github.com/tabler/tabler/blob/master/LICENSE) — MIT licensed
 */`
}

export default getBanner
