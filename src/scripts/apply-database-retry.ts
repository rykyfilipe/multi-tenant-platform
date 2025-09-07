/** @format */

/**
 * Script to automatically apply database retry logic to all API routes
 * This script can be run to update existing API routes with retry logic
 */

import fs from 'fs';
import path from 'path';

const API_DIR = path.join(process.cwd(), 'src/app/api');

// Find all API route files
function findApiFiles(dir: string): string[] {
	const files: string[] = [];
	const items = fs.readdirSync(dir);
	
	for (const item of items) {
		const fullPath = path.join(dir, item);
		const stat = fs.statSync(fullPath);
		
		if (stat.isDirectory()) {
			files.push(...findApiFiles(fullPath));
		} else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
			files.push(fullPath);
		}
	}
	
	return files;
}

// Check if file already has retry logic
function hasRetryLogic(content: string): boolean {
	return content.includes('withRetry') || content.includes('handleDatabaseError');
}

// Add retry imports to file
function addRetryImports(content: string): string {
	if (content.includes('import prisma from')) {
		return content.replace(
			/import prisma from ["']@\/lib\/prisma["'];?/g,
			'import prisma, { withRetry } from "@/lib/prisma";'
		);
	}
	
	if (content.includes('from "@/lib/prisma"')) {
		return content.replace(
			/from ["']@\/lib\/prisma["']/g,
			'from "@/lib/prisma"'
		);
	}
	
	// Add import if not present
	const importMatch = content.match(/import.*from ["']@\/lib\/prisma["'];?/);
	if (importMatch) {
		return content.replace(
			importMatch[0],
			'import prisma, { withRetry } from "@/lib/prisma";'
		);
	}
	
	// Add import at the top
	const firstImport = content.match(/import.*from.*["'];?/);
	if (firstImport) {
		return content.replace(
			firstImport[0],
			`import prisma, { withRetry } from "@/lib/prisma";\n${firstImport[0]}`
		);
	}
	
	return `import prisma, { withRetry } from "@/lib/prisma";\n${content}`;
}

// Add error handling import
function addErrorHandlingImport(content: string): string {
	if (content.includes('handleDatabaseError')) {
		return content;
	}
	
	const prismaImport = content.match(/import prisma.*from.*["'];?/);
	if (prismaImport) {
		return content.replace(
			prismaImport[0],
			`import prisma, { withRetry } from "@/lib/prisma";\nimport { handleDatabaseError } from "@/lib/database-error-handler";`
		);
	}
	
	return content;
}

// Wrap prisma operations with retry logic
function wrapPrismaOperations(content: string): string {
	// Wrap common prisma operations
	const patterns = [
		// findMany
		{
			pattern: /await prisma\.(\w+)\.findMany\(/g,
			replacement: 'await withRetry(() => prisma.$1.findMany('
		},
		// findUnique
		{
			pattern: /await prisma\.(\w+)\.findUnique\(/g,
			replacement: 'await withRetry(() => prisma.$1.findUnique('
		},
		// findFirst
		{
			pattern: /await prisma\.(\w+)\.findFirst\(/g,
			replacement: 'await withRetry(() => prisma.$1.findFirst('
		},
		// create
		{
			pattern: /await prisma\.(\w+)\.create\(/g,
			replacement: 'await withRetry(() => prisma.$1.create('
		},
		// update
		{
			pattern: /await prisma\.(\w+)\.update\(/g,
			replacement: 'await withRetry(() => prisma.$1.update('
		},
		// delete
		{
			pattern: /await prisma\.(\w+)\.delete\(/g,
			replacement: 'await withRetry(() => prisma.$1.delete('
		},
		// createMany
		{
			pattern: /await prisma\.(\w+)\.createMany\(/g,
			replacement: 'await withRetry(() => prisma.$1.createMany('
		},
		// updateMany
		{
			pattern: /await prisma\.(\w+)\.updateMany\(/g,
			replacement: 'await withRetry(() => prisma.$1.updateMany('
		},
		// deleteMany
		{
			pattern: /await prisma\.(\w+)\.deleteMany\(/g,
			replacement: 'await withRetry(() => prisma.$1.deleteMany('
		},
		// count
		{
			pattern: /await prisma\.(\w+)\.count\(/g,
			replacement: 'await withRetry(() => prisma.$1.count('
		},
		// aggregate
		{
			pattern: /await prisma\.(\w+)\.aggregate\(/g,
			replacement: 'await withRetry(() => prisma.$1.aggregate('
		}
	];
	
	let updatedContent = content;
	
	for (const { pattern, replacement } of patterns) {
		updatedContent = updatedContent.replace(pattern, replacement);
	}
	
	// Add closing parentheses for wrapped operations
	updatedContent = updatedContent.replace(
		/await withRetry\(\(\) => prisma\.\w+\.\w+\([^)]*\);/g,
		(match) => match.replace(/\);$/, '}));')
	);
	
	return updatedContent;
}

// Add error handling to catch blocks
function addErrorHandling(content: string): string {
	const catchBlockPattern = /catch\s*\(\s*error[^)]*\)\s*\{[^}]*console\.error[^}]*return NextResponse\.json[^}]*\}/g;
	
	return content.replace(catchBlockPattern, (match) => {
		if (match.includes('handleDatabaseError')) {
			return match;
		}
		
		// Add error handling before the return statement
		return match.replace(
			/console\.error[^;]*;/,
			`$&\n\t\t\n\t\t// Check if it's a database connection error\n\t\tconst dbErrorResponse = handleDatabaseError(error, 'api-route');\n\t\tif (dbErrorResponse) {\n\t\t\treturn dbErrorResponse;\n\t\t}`
		);
	});
}

// Main function to process files
function processFile(filePath: string): void {
	try {
		const content = fs.readFileSync(filePath, 'utf8');
		
		if (hasRetryLogic(content)) {
			console.log(`Skipping ${filePath} - already has retry logic`);
			return;
		}
		
		if (!content.includes('prisma.')) {
			console.log(`Skipping ${filePath} - no prisma operations`);
			return;
		}
		
		let updatedContent = content;
		updatedContent = addRetryImports(updatedContent);
		updatedContent = addErrorHandlingImport(updatedContent);
		updatedContent = wrapPrismaOperations(updatedContent);
		updatedContent = addErrorHandling(updatedContent);
		
		fs.writeFileSync(filePath, updatedContent);
		console.log(`Updated ${filePath}`);
		
	} catch (error) {
		console.error(`Error processing ${filePath}:`, error);
	}
}

// Run the script
function main() {
	console.log('Applying database retry logic to API routes...');
	
	const apiFiles = findApiFiles(API_DIR);
	console.log(`Found ${apiFiles.length} API files`);
	
	for (const file of apiFiles) {
		processFile(file);
	}
	
	console.log('Done!');
}

if (require.main === module) {
	main();
}

export { processFile, findApiFiles };
