import fs from 'fs';
import { execSync } from 'child_process';

if (process.env.VERCEL) {
  const schemaPath = './prisma/schema.prisma';
  let schema = fs.readFileSync(schemaPath, 'utf8');
  schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"\n  directUrl = env("DIRECT_URL")');
  fs.writeFileSync(schemaPath, schema);
  console.log("Updated Prisma schema to PostgreSQL for Vercel deployment.");
  
  console.log("Pushing database schema to Neon PostgreSQL...");
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
}
