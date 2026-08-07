import { readFileSync, writeFileSync } from 'node:fs'
import { minify } from 'terser'

const dir = 'tmp-assets/js'
const input = `${dir}/demo.js`
const output = `${dir}/demo.min.js`

const source = readFileSync(input, 'utf8')
const sourceMap = JSON.parse(readFileSync(`${dir}/demo.js.map`, 'utf8'))

const result = await minify(source, {
	module: true,
	compress: true,
	mangle: true,
	format: {
		comments: /@license|@preserve|^!/,
	},
	sourceMap: {
		content: sourceMap,
		filename: 'demo.min.js.map',
		url: 'demo.min.js.map',
	},
})

writeFileSync(output, result.code)
writeFileSync(`${dir}/demo.min.js.map`, result.map)
