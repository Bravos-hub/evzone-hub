import fs from 'fs'
import path from 'path'

const routesFile = path.resolve(process.cwd(), 'src/app/router/routes.tsx')
const source = fs.readFileSync(routesFile, 'utf8')

const routeKeys = []
const literalRegex = /<Route\s+[^>]*\bpath="([^"]+)"/g
const expressionRegex = /<Route\s+[^>]*\bpath=\{([^}]+)\}/g

let match
while ((match = literalRegex.exec(source)) !== null) {
  routeKeys.push(`literal:${match[1].trim()}`)
}
while ((match = expressionRegex.exec(source)) !== null) {
  const normalized = match[1].replace(/\s+/g, ' ').trim()
  routeKeys.push(`expr:${normalized}`)
}

const counts = new Map()
for (const key of routeKeys) {
  counts.set(key, (counts.get(key) || 0) + 1)
}

const duplicates = Array.from(counts.entries()).filter(([, count]) => count > 1)
if (duplicates.length > 0) {
  console.error('Duplicate route path declarations found:')
  for (const [key, count] of duplicates) {
    console.error(`- ${key} (x${count})`)
  }
  process.exit(1)
}

console.log('No duplicate route path declarations found.')
