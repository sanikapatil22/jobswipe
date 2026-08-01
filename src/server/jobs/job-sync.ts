import { COMPANY_REGISTRY, type CompanyRegistryEntry } from '@/lib/jobs/company-registry';
import { greenhouseAdapter } from '@/lib/ats/greenhouse';
import { leverAdapter } from '@/lib/ats/lever';
import type { AtsAdapter } from '@/lib/ats/types';
import { upsertSyncedJob, setInactiveJobsByCompany } from '@/server/repositories/job-repository';

const ADAPTERS: Record<'greenhouse' | 'lever', AtsAdapter> = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
};

function getAdapter(company: CompanyRegistryEntry): AtsAdapter {
  return ADAPTERS[company.ats];
}

function isRelevantJobTitle(title: string, department = ''): boolean {
  const haystack = `${title} ${department}`.toLowerCase();
  const includePatterns = [
    /intern/i,
    /new grad/i,
    /new graduate/i,
    /graduate/i,
    /software engineer/i,
    /software development engineer/i,
    /software developer/i,
    /sde/i,
    /backend engineer/i,
    /frontend engineer/i,
    /full stack engineer/i,
    /machine learning engineer/i,
    /research engineer/i,
    /ai engineer/i,
    /data engineer/i,
    /data scientist/i,
    /platform engineer/i,
    /site reliability engineer/i,
    /security engineer/i,
    /associate software engineer/i,
    /mobile engineer/i,
    /university/i,
    /entry level/i,
  ];
  const excludePatterns = [
    /senior/i,
    /staff/i,
    /principal/i,
    /manager/i,
    /director/i,
    /vice president/i,
    /vp\b/i,
    /head/i,
    /recruiter/i,
    /sales/i,
    /marketing/i,
    /finance/i,
    /legal/i,
    /hr\b/i,
  ];

  if (excludePatterns.some((pattern) => pattern.test(haystack))) return false;
  if (includePatterns.some((pattern) => pattern.test(haystack))) return true;
  return false;
}

async function syncCompany(company: CompanyRegistryEntry) {
  const adapter = getAdapter(company);
  const summaries = await adapter.listJobs(company);
  const relevant = summaries.filter((job) => isRelevantJobTitle(job.title, job.department));

  const activeSourceKeys: string[] = [];

  for (const summary of relevant) {
    const detail = await adapter.fetchJobDetail(company, summary);
    const sourceKey = `${detail.ats}:${detail.companySlug}:${detail.jobId}`;
    activeSourceKeys.push(sourceKey);
    await upsertSyncedJob(detail, sourceKey);
  }

  if (activeSourceKeys.length > 0) {
    await setInactiveJobsByCompany(company.slug, company.ats, activeSourceKeys);
  }

  return {
    company: company.name,
    ats: company.ats,
    discovered: summaries.length,
    relevant: relevant.length,
    stored: activeSourceKeys.length,
  };
}

export async function syncAllCompanies() {
  const results = [] as Array<Awaited<ReturnType<typeof syncCompany>>>;

  for (const company of COMPANY_REGISTRY) {
    try {
      results.push(await syncCompany(company));
    } catch (error) {
      results.push({
        company: company.name,
        ats: company.ats,
        discovered: 0,
        relevant: 0,
        stored: 0,
      });
      console.error(`Job sync failed for ${company.name}`, error);
    }
  }

  return results;
}

export async function syncCompanyJobs(company: CompanyRegistryEntry) {
  return syncCompany(company);
}