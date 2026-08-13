'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DiscoveryView } from '@/components/discovery/DiscoveryView';
import { handleSwipe } from '@/server/actions';
import { useAppStore } from '@/store/app-store';
import {
  EMPTY_FILTERS,
  filtersFromParams,
  filtersToParams,
  type DiscoverFacets,
  type DiscoverFilters,
} from '@/lib/jobs/filters';
import type { Job, UserProfile } from '@/types';

export function DiscoverClient({
  jobs: initialJobs,
  userProfile,
}: {
  jobs: Job[];
  userProfile: UserProfile;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setJobs = useAppStore((s) => s.setJobs);
  const upsertApplication = useAppStore((s) => s.upsertApplication);

  const [filters, setFiltersState] = useState<DiscoverFilters>(() =>
    filtersFromParams(new URLSearchParams(searchParams.toString()))
  );
  const [jobs, setJobsList] = useState<Job[]>(initialJobs.slice(0, 20));
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [facets, setFacets] = useState<DiscoverFacets | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestSeq = useRef(0);

  const setFilters = useCallback(
    (next: DiscoverFilters) => {
      setFiltersState(next);
      const qs = filtersToParams(next).toString();
      router.replace(qs ? `/discover?${qs}` : '/discover', { scroll: false });
    },
    [router]
  );

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
  }, [setFilters]);

  // Fetch the first page whenever filters change.
  useEffect(() => {
    const seq = ++requestSeq.current;
    setLoading(true);
    const params = filtersToParams(filters);
    fetch(`/api/jobs?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (seq !== requestSeq.current) return;
        setJobsList(data.jobs || []);
        setNextCursor(data.nextCursor || null);
        setHasMore(Boolean(data.hasMore));
        if (data.facets) setFacets(data.facets);
      })
      .catch(() => undefined)
      .finally(() => {
        if (seq === requestSeq.current) setLoading(false);
      });
  }, [filters]);

  // Cursor pagination — append the next page of matching jobs.
  const loadMore = useCallback(() => {
    if (!hasMore || loading || loadingMore) return;
    const seq = ++requestSeq.current;
    setLoadingMore(true);
    const params = filtersToParams(filters);
    if (nextCursor) params.set('cursor', nextCursor);
    fetch(`/api/jobs?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (seq !== requestSeq.current) return;
        setJobsList((prev) => [...prev, ...(data.jobs || [])]);
        setNextCursor(data.nextCursor || null);
        setHasMore(Boolean(data.hasMore));
      })
      .catch(() => undefined)
      .finally(() => {
        if (seq === requestSeq.current) setLoadingMore(false);
      });
  }, [hasMore, loading, loadingMore, nextCursor, filters]);

  useEffect(() => {
    setJobs(jobs);
  }, [jobs, setJobs]);

  const onInterestedJob = async (job: Job) => {
    const result = await handleSwipe({
      jobId: job.id,
      direction: 'right',
    });
    if (result.application) {
      upsertApplication(result.application);
    }
  };

  const onPassJob = async (job: Job) => {
    await handleSwipe({ jobId: job.id, direction: 'left' });
  };

  return (
    <DiscoveryView
      jobs={jobs}
      userProfile={userProfile}
      filters={filters}
      facets={facets}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      onFiltersChange={setFilters}
      onClearFilters={clearFilters}
      onLoadMore={loadMore}
      onInterestedJob={onInterestedJob}
      onPassJob={onPassJob}
    />
  );
}
