import * as crypto from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const configFile = path.join(__dirname, '../../shared/data/sri.json')

interface FileConfig {
	file: string
	configPropertyName: string
}

const files: FileConfig[] = [
	{
		file: 'dist/css/firstcrop.min.css',
		configPropertyName: 'css'
	},
	{
		file: 'dist/css/firstcrop.rtl.min.css',
		configPropertyName: 'css-rtl'
	},
	{
		file: 'dist/css/firstcrop-flags.min.css',
		configPropertyName: 'css-flags'
	},
	{
		file: 'dist/css/firstcrop-flags.rtl.min.css',
		configPropertyName: 'css-flags-rtl'
	},
	{
		file: 'dist/css/firstcrop-marketing.min.css',
		configPropertyName: 'css-marketing'
	},
	{
		file: 'dist/css/firstcrop-marketing.rtl.min.css',
		configPropertyName: 'css-marketing-rtl'
	},
	{
		file: 'dist/css/firstcrop-payments.min.css',
		configPropertyName: 'css-payments'
	},
	{
		file: 'dist/css/firstcrop-payments.rtl.min.css',
		configPropertyName: 'css-payments-rtl'
	},
	{
		file: 'dist/css/firstcrop-props.min.css',
		configPropertyName: 'css-props'
	},
	{
		file: 'dist/css/firstcrop-props.rtl.min.css',
		configPropertyName: 'css-props-rtl'
	},
	{
		file: 'dist/css/firstcrop-themes.min.css',
		configPropertyName: 'css-themes'
	},
	{
		file: 'dist/css/firstcrop-themes.rtl.min.css',
		configPropertyName: 'css-themes-rtl'
	},
	{
		file: 'dist/css/firstcrop-socials.min.css',
		configPropertyName: 'css-socials'
	},
	{
		file: 'dist/css/firstcrop-socials.rtl.min.css',
		configPropertyName: 'css-socials-rtl'
	},
	{
		file: 'dist/css/firstcrop-vendors.min.css',
		configPropertyName: 'css-vendors'
	},
	{
		file: 'dist/css/firstcrop-vendors.rtl.min.css',
		configPropertyName: 'css-vendors-rtl'
	},
	{
		file: 'dist/js/firstcrop.min.js',
		configPropertyName: 'js'
	},
	{
		file: 'dist/js/firstcrop-theme.min.js',
		configPropertyName: 'js-theme'
	},
]

function generateSRI(): void {
	const sriData: Record<string, string> = {}

	for (const { file, configPropertyName } of files) {
		try {
			const filePath = path.join(__dirname, '..', file)
			const data = readFileSync(filePath, 'utf8')

			const algorithm = 'sha384'
			const hash = crypto.createHash(algorithm).update(data, 'utf8').digest('base64')
			const integrity = `${algorithm}-${hash}`

			console.log(`${configPropertyName}: ${integrity}`)

			sriData[configPropertyName] = integrity
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			console.error(`Error processing ${file}:`, errorMessage)
			throw error
		}
	}

	writeFileSync(configFile, JSON.stringify(sriData, null, 2) + '\n', 'utf8')
}

try {
	generateSRI()
} catch (error) {
	console.error('Failed to generate SRI:', error)
	process.exit(1)
}

