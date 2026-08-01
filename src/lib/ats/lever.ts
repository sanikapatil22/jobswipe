import type { AtsAdapter, AtsJobSummary, NormalizedAtsJob } from './types';
import type { CompanyRegistryEntry } from '@/lib/jobs/company-registry';
import { toUtcDate } from '@/lib/jobs/job-utils';

interface LeverPosting {
  id: string;
  text?: string;
  hostedUrl?: string;
  applyUrl?: string;
  categories?: {
    location?: string;
    team?: string;
    commitment?: string;
    department?: string;
  };
  createdAt?: number | string;
  updatedAt?: number | string;
  descriptionPlain?: string;
  description?: string;
  content?: string;
  additional?: Array<{ text?: string }>;
  lists?: Array<{ text?: string }>;
  workType?: string;
  remote?: boolean;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Lever request failed (${response.status}) for ${url}`);
  }

  return (await response.json()) as T;
}

export async function listLeverJobs(company: CompanyRegistryEntry): Promise<AtsJobSummary[]> {
  const data = await fetchJson<LeverPosting[]>(`https://api.lever.co/v0/postings/${company.slug}`);

  return data.map((posting) => {
    const title = posting.text || posting.categories?.team || 'Open Role';
    const location = posting.categories?.location || '';
    const applyUrl = posting.applyUrl || posting.hostedUrl || '';

    return {
      jobId: posting.id,
      title,
      location,
      department: posting.categories?.department || posting.categories?.team,
      applyUrl,
      firstPublished: toUtcDate(posting.createdAt ?? null),
      updatedAt: toUtcDate(posting.updatedAt ?? null),
      rawResponse: posting,
    };
  });
}

export async function fetchLeverJobDetail(
  company: CompanyRegistryEntry,
  job: AtsJobSummary
): Promise<NormalizedAtsJob> {
  const response = job.rawResponse as LeverPosting | undefined;
  const title = response?.text || job.title;
  const location = response?.categories?.location || job.location;
  const applyUrl = response?.applyUrl || response?.hostedUrl || job.applyUrl || '';
  const descriptionHTML = response?.content || response?.description || response?.descriptionPlain || '';

  return {
    companyName: company.name,
    companySlug: company.slug,
    ats: company.ats,
    jobId: job.jobId,
    title,
    location,
    applyUrl,
    descriptionHTML,
    firstPublished: job.firstPublished,
    updatedAtSource: job.updatedAt,
    rawResponse: response || job.rawResponse,
    department: response?.categories?.department || response?.categories?.team || job.department,
  };
}

export const leverAdapter: AtsAdapter = {
  ats: 'lever',
  listJobs: listLeverJobs,
  fetchJobDetail: fetchLeverJobDetail,
};