const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const remainingEnums = [
  'PaymentMethod',
  'OrderStatus',
  'CourierService',
  'LoyaltyPointType',
  'AutoDiscountRule',
  'ReturnReason',
  'WorkflowTrigger',
  'PriceRuleType'
];

for (const enumName of remainingEnums) {
  const usageRegex = new RegExp(`(\\s+[a-zA-Z0-9_]+\\s+)${enumName}(\\s|\\?|\\[|$)`, 'g');
  schema = schema.replace(usageRegex, '$1String$2');
}

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Remaining enums replaced');
