import { create } from 'zustand';
import type { Application, Job, UserProfile } from '@/types';

interface AppState {
  jobs: Job[];
  applications: Application[];
  profile: UserProfile | null;
  setJobs: (jobs: Job[]) => void;
  setApplications: (apps: Application[]) => void;
  upsertApplication: (app: Application) => void;
  setProfile: (profile: UserProfile) => void;
  patchProfile: (partial: Partial<UserProfile>) => void;
  setRoadmapGenerating: (appId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  jobs: [],
  applications: [],
  profile: null,
  setJobs: (jobs) => set({ jobs }),
  setApplications: (applications) => set({ applications }),
  upsertApplication: (app) =>
    set((state) => {
      const idx = state.applications.findIndex((a) => a.id === app.id || a.jobId === app.jobId);
      if (idx >= 0) {
        const copy = [...state.applications];
        copy[idx] = { ...copy[idx], ...app };
        return { applications: copy };
      }
      return { applications: [app, ...state.applications] };
    }),
  setProfile: (profile) => set({ profile }),
  patchProfile: (partial) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...partial } : null,
    })),
  setRoadmapGenerating: (appId) =>
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === appId
          ? { ...a, roadmapStatus: 'GENERATING', roadmapGenerating: true }
          : a
      ),
    })),
}));
