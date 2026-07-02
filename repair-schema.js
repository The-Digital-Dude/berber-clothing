const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// The original enum definitions got replaced by `/* enum String {`
// Let's remove them completely since they are invalid anyway!
schema = schema.replace(/\/\*\s*enum\s+String\s+\{[\s\S]*?\}\s*\*\//g, '');

// Also remove `String[]` because SQLite doesn't support arrays
schema = schema.replace(/ String\[\] /g, ' String ');
schema = schema.replace(/ String\[\]$/gm, ' String');
schema = schema.replace(/ String\[\]\?/g, ' String?');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema repaired');
