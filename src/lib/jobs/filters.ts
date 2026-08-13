import type { Job } from '@/types';

/* ------------------------------------------------------------------ */
/* Option lists                                                        */
/* ------------------------------------------------------------------ */

export const LOCATION_WORK_TYPES = ['Remote', 'Hybrid', 'On-site'] as const;

/**
 * Countries offered in the Location filter (India + the main international
 * hubs). Each entry lists aliases used to match against each job's real
 * location string — nothing is fabricated.
 */
export const LOCATION_COUNTRIES: { id: string; name: string; aliases: string[] }[] = [
  {
    id: 'IN',
    name: 'India',
    aliases: [
      'india',
      'bengaluru',
      'bangalore',
      'hyderabad',
      'pune',
      'mumbai',
      'delhi',
      'noida',
      'gurgaon',
      'gurugram',
      'chennai',
      'kolkata',
      'remote - india',
    ],
  },
  {
    id: 'US',
    name: 'United States',
    aliases: [
      'united states',
      'usa',
      'san francisco',
      'new york',
      'seattle',
      'chicago',
      'boston',
      'austin',
      'denver',
      'california',
      'texas',
      'remote - us',
      'us - remote',
      'us remote',
    ],
  },
  {
    id: 'GB',
    name: 'United Kingdom',
    aliases: ['united kingdom', 'london', 'remote - united kingdom'],
  },
  {
    id: 'DE',
    name: 'Germany',
    aliases: ['germany', 'berlin', 'munich'],
  },
  {
    id: 'CA',
    name: 'Canada',
    aliases: ['canada', 'toronto', 'vancouver', 'montreal', 'remote - canada'],
  },
  {
    id: 'AU',
    name: 'Australia',
    aliases: ['australia', 'sydney', 'melbourne'],
  },
  {
    id: 'SG',
    name: 'Singapore',
    aliases: ['singapore'],
  },
  {
    id: 'AE',
    name: 'UAE',
    aliases: ['uae', 'dubai', 'abu dhabi'],
  },
];

/** States / cities offered within each country, matched against real job locations. */
export const LOCATION_REGIONS: Record<string, { id: string; name: string; aliases: string[] }[]> = {
  IN: [
    { id: 'Bengaluru', name: 'Bengaluru', aliases: ['bengaluru', 'bangalore'] },
    { id: 'Hyderabad', name: 'Hyderabad', aliases: ['hyderabad'] },
    { id: 'Pune', name: 'Pune', aliases: ['pune'] },
    { id: 'Mumbai', name: 'Mumbai', aliases: ['mumbai', 'bombay'] },
    { id: 'Delhi NCR', name: 'Delhi NCR', aliases: ['delhi', 'ncr'] },
    { id: 'Gurgaon', name: 'Gurgaon', aliases: ['gurgaon', 'gurugram'] },
    { id: 'Noida', name: 'Noida', aliases: ['noida'] },
    { id: 'Chennai', name: 'Chennai', aliases: ['chennai'] },
    { id: 'Kolkata', name: 'Kolkata', aliases: ['kolkata', 'calcutta'] },
    { id: 'Remote India', name: 'Remote India', aliases: ['remote - india'] },
    { id: 'Other India', name: 'Other India', aliases: ['india'] },
  ],
  US: [
    { id: 'California', name: 'California', aliases: ['california', 'san francisco', 'mountain view', 'san diego', 'los angeles'] },
    { id: 'New York', name: 'New York', aliases: ['new york'] },
    { id: 'Washington', name: 'Washington', aliases: ['washington', 'seattle', 'bellevue'] },
    { id: 'Texas', name: 'Texas', aliases: ['texas', 'austin', 'dallas', 'houston'] },
    { id: 'Massachusetts', name: 'Massachusetts', aliases: ['massachusetts', 'boston'] },
    { id: 'Illinois', name: 'Illinois', aliases: ['illinois', 'chicago'] },
    { id: 'Remote US', name: 'Remote US', aliases: ['remote - us', 'us - remote', 'us remote', 'usa'] },
    { id: 'Other US', name: 'Other US', aliases: ['united states', 'us'] },
  ],
  GB: [
    { id: 'London', name: 'London', aliases: ['london'] },
    { id: 'Remote UK', name: 'Remote UK', aliases: ['remote - united kingdom'] },
    { id: 'Other UK', name: 'Other UK', aliases: ['united kingdom', 'uk'] },
  ],
  DE: [
    { id: 'Berlin', name: 'Berlin', aliases: ['berlin'] },
    { id: 'Munich', name: 'Munich', aliases: ['munich'] },
    { id: 'Other Germany', name: 'Other Germany', aliases: ['germany'] },
  ],
  CA: [
    { id: 'Toronto', name: 'Toronto', aliases: ['toronto'] },
    { id: 'Vancouver', name: 'Vancouver', aliases: ['vancouver'] },
    { id: 'Remote Canada', name: 'Remote Canada', aliases: ['remote - canada'] },
    { id: 'Other Canada', name: 'Other Canada', aliases: ['canada'] },
  ],
  AU: [
    { id: 'Sydney', name: 'Sydney', aliases: ['sydney'] },
    { id: 'Melbourne', name: 'Melbourne', aliases: ['melbourne'] },
    { id: 'Other Australia', name: 'Other Australia', aliases: ['australia'] },
  ],
  SG: [{ id: 'Singapore', name: 'Singapore', aliases: ['singapore'] }],
  AE: [
    { id: 'Dubai', name: 'Dubai', aliases: ['dubai'] },
    { id: 'Other UAE', name: 'Other UAE', aliases: ['uae', 'abu dhabi'] },
  ],
};

export const JOB_TYPES = ['Internship', 'Full-time', 'New Grad', 'Graduate', 'Co-op'] as const;

export const EXPERIENCE_LEVELS = ['0-1', '1-2', '2-3'] as const;

export const GRAD_YEARS = ['2026', '2027', '2028', '2029', '2030'] as const;

export const DEGREES = ['B.Tech / B.E.', 'BCA', 'MCA', 'M.Tech', 'BS', 'MS'] as const;

export const BRANCHES = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Mechanical',
  'Electrical',
  'Other',
] as const;

export const ROLE_GROUPS = [
  {
    group: 'Software',
    roles: [
      'Frontend Engineer',
      'Backend Engineer',
      'Full Stack Engineer',
      'Mobile Engineer',
      'DevOps Engineer',
      'Cloud Engineer',
      'Systems Engineer',
    ],
  },
  {
    group: 'AI / Data',
    roles: ['AI Engineer', 'ML Engineer', 'Data Scientist', 'Data Engineer'],
  },
  {
    group: 'Other',
    roles: ['Cybersecurity', 'Product', 'UI/UX', 'Embedded'],
  },
] as const;

export const BASE_SKILLS = [
  'C++',
  'C',
  'Java',
  'Python',
  'JavaScript',
  'TypeScript',
  'Go',
  'React',
  'Next.js',
  'Node.js',
  'AWS',
  'Docker',
  'Kubernetes',
  'Redis',
  'PostgreSQL',
  'MongoDB',
] as const;

export const MATCH_THRESHOLDS = [
  { label: 'Any', value: 0 },
  { label: '50%+', value: 50 },
  { label: '70%+', value: 70 },
  { label: '80%+', value: 80 },
  { label: '90%+', value: 90 },
] as const;

// Company type is not present in the synced data yet. Options are declared
// here so the filter can be wired up the moment the data exists.
export const COMPANY_TYPES = ['Startup', 'Small', 'Mid-size', 'Large', 'Enterprise'] as const;

/* ------------------------------------------------------------------ */
/* Filter state + URL serialization                                    */
/* ------------------------------------------------------------------ */

export interface DiscoverFilters {
  q: string;
  locations: string[];
  workTypes: string[];
  jobTypes: string[];
  roles: string[];
  skills: string[];
  companies: string[];
  gradYears: string[];
  degrees: string[];
  branches: string[];
  /** Selected country id (single-select; states are shown within it). */
  country: string;
  /** Selected states/cities within the chosen country. */
  regions: string[];
  minMatch: number;
}

export interface DiscoverFacets {
  locations: string[];
  companies: string[];
  skills: { name: string; count: number }[];
}

export const EMPTY_FILTERS: DiscoverFilters = {
  q: '',
  locations: [],
  workTypes: [],
  jobTypes: [],
  roles: [],
  skills: [],
  companies: [],
  gradYears: [],
  degrees: [],
  branches: [],
  country: '',
  regions: [],
  minMatch: 0,
};

// Canonical URL param names (see GET /api/jobs):
//   location, workTypes, jobType, role, skills, company, gradYear, degree, branch, country, region
const PARAM_KEYS: { key: keyof DiscoverFilters; param: string }[] = [
  { key: 'locations', param: 'location' },
  { key: 'workTypes', param: 'workTypes' },
  { key: 'jobTypes', param: 'jobType' },
  { key: 'roles', param: 'role' },
  { key: 'skills', param: 'skills' },
  { key: 'companies', param: 'company' },
  { key: 'gradYears', param: 'gradYear' },
  { key: 'degrees', param: 'degree' },
  { key: 'branches', param: 'branch' },
  { key: 'regions', param: 'region' },
];

export function filtersToParams(f: DiscoverFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (f.q.trim()) params.set('q', f.q.trim());
  for (const { key, param } of PARAM_KEYS) {
    const values = f[key] as string[];
    if (values.length > 0) params.set(param, values.join(','));
  }
  if (f.country) params.set('country', f.country);
  if (f.minMatch > 0) params.set('minMatch', String(f.minMatch));
  return params;
}

export function filtersFromParams(searchParams: URLSearchParams): DiscoverFilters {
  const list = (param: string) =>
    (searchParams.get(param) || '').split(',').map((s) => s.trim()).filter(Boolean);
  const minMatch = Number.parseInt(searchParams.get('minMatch') || '0', 10);
  const country = searchParams.get('country') || '';
  return {
    q: searchParams.get('q') || '',
    locations: list('location'),
    workTypes: list('workTypes'),
    jobTypes: list('jobType'),
    roles: list('role'),
    skills: list('skills'),
    companies: list('company'),
    gradYears: list('gradYear'),
    degrees: list('degree'),
    branches: list('branch'),
    country,
    // Only keep regions that belong to the selected country.
    regions: LOCATION_REGIONS[country]
      ? list('region').filter((r) => LOCATION_REGIONS[country].some((x) => x.id === r))
      : [],
    minMatch: Number.isFinite(minMatch) && minMatch > 0 ? minMatch : 0,
  };
}

export function countActiveFilters(f: DiscoverFilters): number {
  return (
    PARAM_KEYS.reduce((sum, { key }) => sum + (f[key] as string[]).length, 0) +
    (f.country ? 1 : 0) +
    (f.minMatch > 0 ? 1 : 0) +
    (f.q.trim() ? 1 : 0)
  );
}

/* ------------------------------------------------------------------ */
/* Per-job metadata derived from REAL job data (title/description).    */
/* Nothing here is fabricated: detection is evidence-based.            */
/* ------------------------------------------------------------------ */

export function detectJobTypes(job: Job): string[] {
  const text = `${job.role} ${job.description}`.toLowerCase();
  const types: string[] = [];
  if (/\bintern\b|internship/.test(text)) types.push('Internship');
  if (/\bco-?op\b/.test(text)) types.push('Co-op');
  if (/\bnew\s+grad\b|\bearly\s+career\b|\bentry[- ]level\b/.test(text)) types.push('New Grad');
  if (/\bgraduate\b|\bgrad\s+(?:student|program)\b/.test(text)) types.push('Graduate');
  if (types.length === 0) types.push('Full-time');
  return types;
}

export function detectExperienceLevels(job: Job): string[] {
  const text = `${job.role} ${job.description}`.toLowerCase();
  const levels: string[] = [];
  if (/(0\s*[-–]\s*1|less\s+than\s+1|1\s*year)/.test(text)) levels.push('0-1');
  if (/(1\s*[-–]\s*2|1\s*[-–]\s*3)/.test(text)) levels.push('1-2');
  if (/(2\s*[-–]\s*3|2\s*[-–]\s*4)/.test(text)) levels.push('2-3');
  return levels;
}

export function detectRoles(job: Job): string[] {
  const text = `${job.role} ${job.description}`.toLowerCase();
  const roles: string[] = [];
  if (/front[\s-]?end/.test(text)) roles.push('Frontend Engineer');
  if (/back[\s-]?end/.test(text)) roles.push('Backend Engineer');
  if (/full[\s-]?stack/.test(text)) roles.push('Full Stack Engineer');
  if (/\bmobile\b|\bios\b|\bandroid\b/.test(text)) roles.push('Mobile Engineer');
  if (/\bdevops\b|\bsre\b|site reliability|\bci\/cd\b/.test(text)) roles.push('DevOps Engineer');
  if (/\bcloud\b|\baws\b|\bgcp\b|\bazure\b/.test(text)) roles.push('Cloud Engineer');
  if (/\bsystems\b|\binfrastructure\b|\bplatform\b/.test(text)) roles.push('Systems Engineer');
  if (/\bai\s+engineer\b|artificial intelligence/.test(text)) roles.push('AI Engineer');
  if (/\bmachine\s+learning\b|\bml\s+engineer\b/.test(text)) roles.push('ML Engineer');
  if (/\bdata\s+scientist\b/.test(text)) roles.push('Data Scientist');
  if (/\bdata\s+engineer(?:ing)?\b/.test(text)) roles.push('Data Engineer');
  if (/\bcyber\b|\bsecurity\b/.test(text)) roles.push('Cybersecurity');
  if (/\bproduct\b/.test(text)) roles.push('Product');
  if (/\bui\/?ux\b|user experience|\bdesign\b/.test(text)) roles.push('UI/UX');
  if (/\bembedded\b|\bfirmware\b/.test(text)) roles.push('Embedded');
  return roles;
}

export function detectDegrees(job: Job): string[] {
  const text = `${job.role} ${job.description} ${job.requirements.join(' ')}`.toLowerCase();
  const degrees: string[] = [];
  if (/b\.?\s?tech|\bbe\b|bachelor/.test(text)) degrees.push('B.Tech / B.E.');
  if (/\bbca\b/.test(text)) degrees.push('BCA');
  if (/\bmca\b/.test(text)) degrees.push('MCA');
  if (/m\.?\s?tech|master/.test(text)) degrees.push('M.Tech');
  if (/\bbs\b|\bb\.?\s?s\b/.test(text)) degrees.push('BS');
  if (/\bms\b|\bm\.?\s?s\b/.test(text)) degrees.push('MS');
  return degrees;
}

export function detectBranches(job: Job): string[] {
  const text = `${job.role} ${job.description} ${job.requirements.join(' ')}`.toLowerCase();
  const branches: string[] = [];
  if (/computer\s+science|\bcse\b|\bcs\b/.test(text)) branches.push('Computer Science');
  if (/information\s+technology|\bit\b/.test(text)) branches.push('Information Technology');
  if (/\belectronics\b|\bece\b|\belectronics\s+and\s+communication/.test(text)) branches.push('Electronics');
  if (/\bmechanical\b/.test(text)) branches.push('Mechanical');
  if (/\belectrical\b|\bee\b/.test(text)) branches.push('Electrical');
  if (branches.length === 0) branches.push('Other');
  return branches;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Word-boundary-aware containment test against a location string. */
function locationContains(loc: string, alias: string): boolean {
  const escaped = escapeRegex(alias).toLowerCase();
  return new RegExp(`\\b${escaped}\\b`).test(loc);
}

/** Word-boundary-aware containment test for a skill token. */
export function hasSkill(job: Job, skill: string): boolean {
  const text = `${job.description} ${job.requirements.join(' ')} ${job.tags.join(' ')}`.toLowerCase();
  const escaped = escapeRegex(skill).toLowerCase();
  // Multi-word / symbol skills: plain containment; single tokens: word boundary.
  if (/\s/.test(skill) || /[+#.]/.test(skill)) {
    return text.includes(escaped);
  }
  return new RegExp(`\\b${escaped}\\b`).test(text);
}

/* ------------------------------------------------------------------ */
/* Filter matching                                                     */
/* ------------------------------------------------------------------ */

export function jobMatchesFilters(job: Job, f: DiscoverFilters): boolean {
  if (f.q.trim()) {
    const q = f.q.trim().toLowerCase();
    const haystack = `${job.companyName} ${job.role} ${job.description} ${job.tags.join(' ')}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  if (f.locations.length > 0) {
    const loc = job.location.toLowerCase();
    if (!f.locations.some((l) => loc.includes(l.toLowerCase()))) return false;
  }

  if (f.workTypes.length > 0) {
    const wt = job.workType.toLowerCase();
    if (!f.workTypes.some((t) => wt.includes(t.toLowerCase().replace('-', '')))) return false;
  }

  // Country + state/city filters — matched against the job's real location.
  if (f.country) {
    const loc = job.location.toLowerCase();
    const country = LOCATION_COUNTRIES.find((c) => c.id === f.country);
    if (!country || !country.aliases.some((a) => locationContains(loc, a))) return false;
  }
  if (f.regions.length > 0 && f.country) {
    const loc = job.location.toLowerCase();
    const regions = LOCATION_REGIONS[f.country] || [];
    const ok = f.regions.some((r) => {
      const region = regions.find((x) => x.id === r);
      return region ? region.aliases.some((a) => locationContains(loc, a)) : false;
    });
    if (!ok) return false;
  }

  if (f.jobTypes.length > 0) {
    const detected = detectJobTypes(job);
    if (!f.jobTypes.some((t) => detected.includes(t))) return false;
  }

  if (f.roles.length > 0) {
    const detected = detectRoles(job);
    if (!f.roles.some((r) => detected.includes(r))) return false;
  }

  if (f.skills.length > 0) {
    if (!f.skills.every((s) => hasSkill(job, s))) return false;
  }

  if (f.companies.length > 0) {
    const company = job.companyName.toLowerCase();
    if (!f.companies.some((c) => company.includes(c.toLowerCase()))) return false;
  }

  // Graduation year maps to early-career roles (Internship / New Grad /
  // Graduate) — the honest signal we have; no fake eligibility.
  if (f.gradYears.length > 0) {
    const detected = detectJobTypes(job);
    if (!detected.some((t) => t === 'Internship' || t === 'New Grad' || t === 'Graduate')) {
      return false;
    }
  }

  if (f.degrees.length > 0) {
    const detected = detectDegrees(job);
    if (!f.degrees.some((d) => detected.includes(d))) return false;
  }

  if (f.branches.length > 0) {
    const detected = detectBranches(job);
    if (!f.branches.some((b) => detected.includes(b))) return false;
  }

  if (f.minMatch > 0 && (job.staticMatchScore ?? 0) < f.minMatch) return false;

  return true;
}
