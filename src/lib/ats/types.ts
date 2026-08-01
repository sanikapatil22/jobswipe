import type { AtsProvider, CompanyRegistryEntry } from '@/lib/jobs/company-registry';

export interface NormalizedAtsJob {
  companyName: string;
  companySlug: string;
  ats: AtsProvider;
  jobId: string;
  title: string;
  location: string;
  applyUrl: string;
  descriptionHTML: string;
  firstPublished: Date | null;
  updatedAtSource: Date | null;
  rawResponse: unknown;
  department?: string;
}

export interface AtsAdapter {
  ats: AtsProvider;
  listJobs(company: CompanyRegistryEntry): Promise<AtsJobSummary[]>;
  fetchJobDetail(company: CompanyRegistryEntry, job: AtsJobSummary): Promise<NormalizedAtsJob>;
}

export interface AtsJobSummary {
  jobId: string;
  title: string;
  location: string;
  department?: string;
  applyUrl: string;
  firstPublished: Date | null;
  updatedAt: Date | null;
  rawResponse: unknown;
}