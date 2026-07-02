const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Find all enums
const enumMatches = [...schema.matchAll(/enum\s+([A-Za-z0-9_]+)\s+\{/g)];
const enumNames = enumMatches.map(m => m[1]);

// 2. Replace `@default(ENUM_VALUE)` with `@default("ENUM_VALUE")` BEFORE replacing enum usages
for (const enumName of enumNames) {
  // We need to find defaults of this enum. But actually, any unquoted default that is ALL_CAPS or TitleCase could be an enum value.
}
// Actually, let's just quote ALL unquoted defaults that look like enum values
// e.g. @default(CUSTOMER) -> @default("CUSTOMER")
schema = schema.replace(/@default\(([A-Z_]+)\)/g, '@default("$1")');
schema = schema.replace(/@default\((PENDING|ACTIVE|MONTHLY|FIXED|TEXT|PERCENTAGE|COD)\)/g, '@default("$1")');

// 3. Replace all Enum types with String
for (const enumName of enumNames) {
  const usageRegex = new RegExp(`(\\s+[a-zA-Z0-9_]+\\s+)${enumName}(\\s|\\?|\\[|$)`, 'g');
  schema = schema.replace(usageRegex, '$1String$2');
  
  // also fix if the enum is the very first type parameter or something
  schema = schema.replace(new RegExp(` ${enumName} `, 'g'), ' String ');
  schema = schema.replace(new RegExp(` ${enumName}$`, 'gm'), ' String');
}

// 4. Remove all String[] since SQLite doesn't support them
schema = schema.replace(/ String\[\] /g, ' String ');
schema = schema.replace(/ String\[\]$/gm, ' String');
schema = schema.replace(/ String\[\]\?/g, ' String?');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema fully repaired');
