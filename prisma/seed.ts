import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { syncAllCompanies } from '../src/server/jobs/job-sync';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const results = await syncAllCompanies();
  const totals = results.reduce(
    (accumulator, result) => {
      accumulator.discovered += result.discovered;
      accumulator.relevant += result.relevant;
      accumulator.stored += result.stored;
      return accumulator;
    },
    { discovered: 0, relevant: 0, stored: 0 }
  );

  console.log(
    `Synced ${totals.stored} live jobs from ${results.length} companies (${totals.relevant} relevant out of ${totals.discovered} discovered).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
