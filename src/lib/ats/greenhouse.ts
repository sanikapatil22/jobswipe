import type { AtsAdapter, AtsJobSummary, NormalizedAtsJob } from './types';
import type { CompanyRegistryEntry } from '@/lib/jobs/company-registry';
import { toUtcDate } from '@/lib/jobs/job-utils';

interface GreenhouseListResponse {
  jobs: Array<{
    id: number;
    title: string;
    absolute_url: string;
    location?: { name?: string } | null;
    departments?: Array<{ name?: string }>;
    first_published?: string | null;
    updated_at?: string | null;
  }>;
}

interface GreenhouseJobDetailResponse {
  id: number;
  title: string;
  absolute_url: string;
  location?: { name?: string } | null;
  departments?: Array<{ name?: string }>;
  first_published?: string | null;
  updated_at?: string | null;
  content?: string;
  questions?: unknown[];
  metadata?: unknown;
  application_deadline?: string | null;
}

const BASE = 'https://boards-api.greenhouse.io/v1/boards';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Greenhouse request failed (${response.status}) for ${url}`);
  }

  return (await response.json()) as T;
}

export async function listGreenhouseJobs(company: CompanyRegistryEntry): Promise<AtsJobSummary[]> {
  const data = await fetchJson<GreenhouseListResponse>(`${BASE}/${company.slug}/jobs`);

  return data.jobs.map((job) => ({
    jobId: String(job.id),
    title: job.title,
    location: job.location?.name || '',
    department: job.departments?.[0]?.name,
    applyUrl: job.absolute_url,
    firstPublished: toUtcDate(job.first_published),
    updatedAt: toUtcDate(job.updated_at),
    rawResponse: job,
  }));
}

export async function fetchGreenhouseJobDetail(
  company: CompanyRegistryEntry,
  job: AtsJobSummary
): Promise<NormalizedAtsJob> {
  const data = await fetchJson<GreenhouseJobDetailResponse>(
    `${BASE}/${company.slug}/jobs/${job.jobId}?questions=true`
  );

  return {
    companyName: company.name,
    companySlug: company.slug,
    ats: company.ats,
    jobId: String(data.id),
    title: data.title,
    location: data.location?.name || job.location,
    applyUrl: data.absolute_url || job.applyUrl,
    descriptionHTML: data.content || '',
    firstPublished: toUtcDate(data.first_published) ?? job.firstPublished,
    updatedAtSource: toUtcDate(data.updated_at) ?? job.updatedAt,
    rawResponse: data,
    department: data.departments?.[0]?.name || job.department,
  };
}

export const greenhouseAdapter: AtsAdapter = {
  ats: 'greenhouse',
  listJobs: listGreenhouseJobs,
  fetchJobDetail: fetchGreenhouseJobDetail,
};