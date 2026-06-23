const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.billingRecord.deleteMany({
    where: { shop: 'khushboo-test-store-lgno0ess.myshopify.com' }
  });
  console.log('Cleared billing records');
}

main().catch(console.error).finally(() => prisma.$disconnect());
