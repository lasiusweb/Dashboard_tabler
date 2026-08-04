import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// File paths (relative to core/.build directory)
const bootstrapPath = path.join(__dirname, '../node_modules/bootstrap/scss/_variables.scss')
const firstcropPath = path.join(__dirname, '../scss/_variables.scss')

// Function to extract variable names from SCSS file
function extractVariables(filePath: string): Set<string> {
	const content = readFileSync(filePath, 'utf8')
	const variables = new Set<string>()

	// Regex to find SCSS variables
	// Looks for patterns like: $variable-name: value
	// Includes variables in maps and lists
	const variableRegex = /\$([a-zA-Z0-9_-]+)\s*[:=]/g

	let match: RegExpExecArray | null
	while ((match = variableRegex.exec(content)) !== null) {
		const varName = match[1]
		variables.add(varName)
	}

	return variables
}

// Main function
function compareVariables(): void {
	console.log('Analyzing Bootstrap variables...')
	const bootstrapVars = extractVariables(bootstrapPath)
	console.log(`Found ${bootstrapVars.size} variables in Bootstrap\n`)

	console.log('Analyzing FirstCrop variables...')
	const firstcropVars = extractVariables(firstcropPath)
	console.log(`Found ${firstcropVars.size} variables in FirstCrop\n`)

	// Find variables that are in Bootstrap but not in FirstCrop
	const missingInFirstCrop: string[] = []
	for (const varName of bootstrapVars) {
		if (!firstcropVars.has(varName)) {
			missingInFirstCrop.push(varName)
		}
	}

	// Sort alphabetically
	missingInFirstCrop.sort()

	console.log('='.repeat(60))
	console.log(`Variables in Bootstrap that are missing in FirstCrop: ${missingInFirstCrop.length}`)
	console.log('='.repeat(60))

	if (missingInFirstCrop.length === 0) {
		console.log('All Bootstrap variables are present in FirstCrop!')
	} else {
		console.log('\nList of missing variables:\n')
		missingInFirstCrop.forEach((varName: string, index: number) => {
			console.log(`${(index + 1).toString().padStart(4)}. $${varName}`)
		})
	}

	// Optionally: show statistics
	console.log('\n' + '='.repeat(60))
	console.log('Statistics:')
	console.log(`  Bootstrap: ${bootstrapVars.size} variables`)
	console.log(`  FirstCrop:    ${firstcropVars.size} variables`)
	console.log(`  Missing:    ${missingInFirstCrop.length} variables`)
	console.log(`  Coverage:   ${((1 - missingInFirstCrop.length / bootstrapVars.size) * 100).toFixed(1)}%`)
	console.log('='.repeat(60))
}

// Run analysis
try {
	compareVariables()
} catch (error) {
	const errorMessage = error instanceof Error ? error.message : String(error)
	console.error('Error during analysis:', errorMessage)
	process.exit(1)
}

