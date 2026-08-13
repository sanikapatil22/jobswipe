import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { fetchDiscoverPage, getDiscoverFacets, DISCOVER_PAGE_SIZE } from '@/server/jobs/discover';
import {
  JOB_TYPES,
  EXPERIENCE_LEVELS,
  GRAD_YEARS,
  DEGREES,
  BRANCHES,
  ROLE_GROUPS,
  BASE_SKILLS,
  LOCATION_WORK_TYPES,
  type DiscoverFilters,
} from '@/lib/jobs/filters';

export const runtime = 'nodejs';

const VALID_JOB_TYPES = new Set([...JOB_TYPES, ...EXPERIENCE_LEVELS]);
const VALID_ROLES = new Set(ROLE_GROUPS.flatMap((g) => g.roles));
const VALID_SKILLS = new Set(BASE_SKILLS);
const VALID_GRAD_YEARS = new Set(GRAD_YEARS);
const VALID_DEGREES = new Set(DEGREES);
const VALID_BRANCHES = new Set(BRANCHES);
const VALID_WORK_TYPES = new Set(LOCATION_WORK_TYPES);
const VALID_MIN_MATCH = new Set([0, 50, 70, 80, 90]);

/** GET /api/jobs?q=&location=&workTypes=&jobType=&role=&skills=&company=&gradYear=&degree=&branch=&minMatch=&cursor=&limit= */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const sp = req.nextUrl.searchParams;

  const filterValues = (key: string, valid?: Set<string>) =>
    (sp.get(key) || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((v) => !valid || valid.has(v));

  const rawMinMatch = Number.parseInt(sp.get('minMatch') || '0', 10);
  const minMatch = VALID_MIN_MATCH.has(rawMinMatch) ? rawMinMatch : 0;

  const filters: DiscoverFilters = {
    q: sp.get('q') || '',
    locations: filterValues('location'),
    workTypes: filterValues('workTypes', VALID_WORK_TYPES) as string[],
    jobTypes: filterValues('jobType', VALID_JOB_TYPES),
    roles: filterValues('role', VALID_ROLES),
    skills: filterValues('skills', VALID_SKILLS),
    companies: filterValues('company'),
    gradYears: filterValues('gradYear', VALID_GRAD_YEARS),
    degrees: filterValues('degree', VALID_DEGREES),
    branches: filterValues('branch', VALID_BRANCHES),
    minMatch,
  };

  const rawLimit = Number.parseInt(sp.get('limit') || String(DISCOVER_PAGE_SIZE), 10);
  const limit = Math.min(Math.max(rawLimit || DISCOVER_PAGE_SIZE, 1), 50);
  const cursor = sp.get('cursor');

  const page = await fetchDiscoverPage(session.user.id, filters, { cursor, limit });
  const facets = await getDiscoverFacets();

  return Response.json({ ...page, facets });
}
