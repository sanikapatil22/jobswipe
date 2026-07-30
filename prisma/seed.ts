import 'dotenv/config';
import { PrismaClient, WorkType } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { INITIAL_JOBS } from '../src/data/seedJobs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function toWorkType(label: string): WorkType {
  if (label === 'Remote' || label === 'REMOTE') return 'REMOTE';
  if (label === 'Hybrid' || label === 'HYBRID') return 'HYBRID';
  return 'ONSITE';
}

async function main() {
  for (const job of INITIAL_JOBS) {
    await prisma.job.upsert({
      where: { id: job.id },
      create: {
        id: job.id,
        companyName: job.companyName,
        companyLogo: job.companyLogo,
        role: job.role,
        description: job.description,
        requirements: job.requirements,
        salary: job.salary,
        location: job.location,
        workType: toWorkType(job.workType),
        companySize: job.companySize,
        deadline: new Date(job.deadline),
        applyUrl: job.applyUrl,
        tags: job.tags,
        isActive: true,
      },
      update: {
        companyName: job.companyName,
        companyLogo: job.companyLogo,
        role: job.role,
        description: job.description,
        requirements: job.requirements,
        salary: job.salary,
        location: job.location,
        workType: toWorkType(job.workType),
        companySize: job.companySize,
        deadline: new Date(job.deadline),
        applyUrl: job.applyUrl,
        tags: job.tags,
        isActive: true,
      },
    });
  }

  console.log(`Seeded ${INITIAL_JOBS.length} jobs.`);
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
