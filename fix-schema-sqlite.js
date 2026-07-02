const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Ensure provider is sqlite
schema = schema.replace(/provider = "postgresql"/, 'provider = "sqlite"');
if (!schema.includes('url      = env("DATABASE_URL")')) {
    schema = schema.replace(/provider = "sqlite"/, 'provider = "sqlite"\n  url      = env("DATABASE_URL")');
}

// Replace Json with String
schema = schema.replace(/ Json\?/g, ' String?');
schema = schema.replace(/ Json /g, ' String ');

// Find all enums
const enumMatches = [...schema.matchAll(/enum\s+([A-Za-z0-9_]+)\s+\{/g)];
const enumNames = enumMatches.map(m => m[1]);

// Replace enum usages with String
for (const enumName of enumNames) {
  // Be careful not to replace the enum definition itself, just the usages
  // Usages are typically like: `role Role` or `role Role @default(...)`
  const usageRegex = new RegExp(`(\\s+[a-zA-Z0-9_]+\\s+)${enumName}(\\s|\\?|\\[)`, 'g');
  schema = schema.replace(usageRegex, '$1String$2');
}

// Comment out enum blocks properly with //
schema = schema.replace(/enum\s+[A-Za-z0-9_]+\s+\{[\s\S]*?\}/g, (match) => {
  return match.split('\n').map(line => '// ' + line).join('\n');
});

// Remove unsupported @db attributes if any are left
schema = schema.replace(/@db\.[A-Za-z0-9_]+\(.*?\)/g, '');

// Also remove String[] because SQLite doesn't support scalar arrays
schema = schema.replace(/ String\[\] /g, ' String ');
schema = schema.replace(/ String\[\]$/gm, ' String');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema fixed for SQLite');
