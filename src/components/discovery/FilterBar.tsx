'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  Code2,
  GraduationCap,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  BRANCHES,
  DEGREES,
  EXPERIENCE_LEVELS,
  GRAD_YEARS,
  JOB_TYPES,
  LOCATION_WORK_TYPES,
  MATCH_THRESHOLDS,
  ROLE_GROUPS,
  BASE_SKILLS,
  COMPANY_TYPES,
  EMPTY_FILTERS,
  type DiscoverFacets,
  type DiscoverFilters,
} from '@/lib/jobs/filters';

type DropdownId = 'location' | 'jobType' | 'role' | 'education' | 'company' | 'more';

interface OpenPanel {
  id: DropdownId;
  anchor: DOMRect;
  alignRight: boolean;
}

const PANEL_WIDTH: Record<DropdownId, number> = {
  location: 256,
  jobType: 256,
  role: 340,
  education: 340,
  company: 300,
  more: 340,
};

interface FilterBarProps {
  filters: DiscoverFilters;
  onChange: (filters: DiscoverFilters) => void;
  facets: DiscoverFacets | null;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-800">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="text-indigo-400 hover:text-indigo-700 transition-colors"
        aria-label={`Remove filter ${label}`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
  count,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  count?: number;
}) {
  return (
    <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none">
      <span
        className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-none transition-colors ${
          checked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
        }`}
      >
        {checked && <Check className="w-3 h-3" />}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <span className="text-xs font-semibold text-slate-800 flex-1">{label}</span>
      {typeof count === 'number' && (
        <span className="text-[10px] font-bold text-slate-400">{count}</span>
      )}
    </label>
  );
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange, facets }) => {
  const [open, setOpen] = useState<OpenPanel | null>(null);
  const [panelSearch, setPanelSearch] = useState('');
  const barRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const set = (patch: Partial<DiscoverFilters>) => onChange({ ...filters, ...patch });

  const togglePanel = (id: DropdownId) => (e: React.MouseEvent<HTMLButtonElement>) => {
    const anchor = e.currentTarget.getBoundingClientRect();
    setPanelSearch('');
    setOpen((prev) =>
      prev && prev.id === id ? null : { id, anchor, alignRight: id === 'company' || id === 'more' }
    );
  };

  // Close when clicking outside the bar or the open portal panel.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (barRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  // Close when the window is resized or the page scrolls (anchor goes stale).
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(null);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  const sectionTitle = (text: string) => (
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 mb-1.5 mt-2">
      {text}
    </p>
  );

  const scrollBox = (children: React.ReactNode) => (
    <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1">{children}</div>
  );

  // Searchable option lists — every dropdown gets a search box.
  const q = panelSearch.trim().toLowerCase();
  const matches = useCallback(
    (value: string) => !q || value.toLowerCase().includes(q),
    [q]
  );

  const filteredLocations = useMemo(() => {
    const all = facets?.locations.length ? facets.locations : [];
    return all.filter(matches);
  }, [facets, matches]);

  const filteredJobTypes = useMemo(
    () => JOB_TYPES.filter(matches),
    [matches]
  );
  const filteredExperience = useMemo(
    () => EXPERIENCE_LEVELS.filter(matches),
    [matches]
  );

  const filteredRoleGroups = useMemo(
    () =>
      ROLE_GROUPS.map((g) => ({
        ...g,
        roles: g.roles.filter(matches),
      })).filter((g) => g.roles.length > 0),
    [matches]
  );

  const filteredGradYears = useMemo(() => GRAD_YEARS.filter(matches), [matches]);
  const filteredDegrees = useMemo(() => DEGREES.filter(matches), [matches]);
  const filteredBranches = useMemo(() => BRANCHES.filter(matches), [matches]);

  const filteredSkillOptions = useMemo(
    () =>
      (facets?.skills || BASE_SKILLS.map((s) => ({ name: s, count: 0 }))).filter((s) =>
        matches(s.name)
      ),
    [facets, matches]
  );

  const filteredCompanies = useMemo(
    () => (facets?.companies || []).filter((c) => matches(c)),
    [facets, matches]
  );

  const searchInput = (placeholder: string) => (
    <div className="relative mb-2">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={panelSearch}
        onChange={(e) => setPanelSearch(e.target.value)}
        className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border-2 border-slate-200 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500"
      />
    </div>
  );

  const noResults = (
    <p className="px-2 py-3 text-[11px] font-bold text-slate-400">No matching options</p>
  );

  const renderPanel = (id: DropdownId) => {
    switch (id) {
      case 'location':
        return (
          <>
            {searchInput('Search locations, cities, Remote, On-site…')}
            {sectionTitle('Work mode')}
            {LOCATION_WORK_TYPES.filter(matches).map((wt) => (
              <CheckboxRow
                key={wt}
                label={wt}
                checked={filters.workTypes.includes(wt)}
                onChange={() => set({ workTypes: toggle(filters.workTypes, wt) })}
              />
            ))}
            {sectionTitle('Cities & regions')}
            {scrollBox(
              filteredLocations.length
                ? filteredLocations.map((loc) => (
                    <CheckboxRow
                      key={loc}
                      label={loc}
                      checked={filters.locations.includes(loc)}
                      onChange={() => set({ locations: toggle(filters.locations, loc) })}
                    />
                  ))
                : noResults
            )}
          </>
        );
      case 'jobType':
        return (
          <>
            {searchInput('Search job types or experience…')}
            {sectionTitle('Role type')}
            {filteredJobTypes.length ? (
              filteredJobTypes.map((t) => (
                <CheckboxRow
                  key={t}
                  label={t}
                  checked={filters.jobTypes.includes(t)}
                  onChange={() => set({ jobTypes: toggle(filters.jobTypes, t) })}
                />
              ))
            ) : (
              noResults
            )}
            {sectionTitle('Experience')}
            {filteredExperience.length ? (
              filteredExperience.map((lvl) => (
                <CheckboxRow
                  key={lvl}
                  label={`${lvl} years`}
                  checked={filters.jobTypes.includes(lvl)}
                  onChange={() => set({ jobTypes: toggle(filters.jobTypes, lvl) })}
                />
              ))
            ) : (
              noResults
            )}
          </>
        );
      case 'role':
        return (
          <>
            {searchInput('Search roles…')}
            {filteredRoleGroups.length ? (
              filteredRoleGroups.map((group) => (
                <React.Fragment key={group.group}>
                  {sectionTitle(group.group)}
                  {group.roles.map((role) => (
                    <CheckboxRow
                      key={role}
                      label={role}
                      checked={filters.roles.includes(role)}
                      onChange={() => set({ roles: toggle(filters.roles, role) })}
                    />
                  ))}
                </React.Fragment>
              ))
            ) : (
              noResults
            )}
          </>
        );
      case 'education':
        return (
          <>
            {searchInput('Search graduation year, degree, branch…')}
            {sectionTitle('Graduation year')}
            {filteredGradYears.length ? (
              filteredGradYears.map((y) => (
                <CheckboxRow
                  key={y}
                  label={y}
                  checked={filters.gradYears.includes(y)}
                  onChange={() => set({ gradYears: toggle(filters.gradYears, y) })}
                />
              ))
            ) : (
              noResults
            )}
            {sectionTitle('Degree')}
            {filteredDegrees.length ? (
              filteredDegrees.map((d) => (
                <CheckboxRow
                  key={d}
                  label={d}
                  checked={filters.degrees.includes(d)}
                  onChange={() => set({ degrees: toggle(filters.degrees, d) })}
                />
              ))
            ) : (
              noResults
            )}
            {sectionTitle('Branch')}
            {filteredBranches.length ? (
              filteredBranches.map((b) => (
                <CheckboxRow
                  key={b}
                  label={b}
                  checked={filters.branches.includes(b)}
                  onChange={() => set({ branches: toggle(filters.branches, b) })}
                />
              ))
            ) : (
              noResults
            )}
          </>
        );
      case 'company':
        return (
          <>
            {searchInput('Search companies…')}
            {scrollBox(
              filteredCompanies.length
                ? filteredCompanies.map((c) => (
                    <CheckboxRow
                      key={c}
                      label={c}
                      checked={filters.companies.includes(c)}
                      onChange={() => set({ companies: toggle(filters.companies, c) })}
                    />
                  ))
                : noResults
            )}
          </>
        );
      case 'more':
        return (
          <>
            {sectionTitle('Skills')}
            {searchInput('Search skills…')}
            {scrollBox(
              filteredSkillOptions.length
                ? filteredSkillOptions.map((s) => (
                    <CheckboxRow
                      key={s.name}
                      label={s.name}
                      count={s.count}
                      checked={filters.skills.includes(s.name)}
                      onChange={() => set({ skills: toggle(filters.skills, s.name) })}
                    />
                  ))
                : noResults
            )}

            {sectionTitle('Resume match')}
            <div className="px-2 pb-1">
              {MATCH_THRESHOLDS.map((t) => (
                <label key={t.value} className="flex items-center gap-2.5 py-1.5 cursor-pointer select-none">
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-none transition-colors ${
                      filters.minMatch === t.value ? 'border-indigo-600' : 'border-slate-300'
                    }`}
                  >
                    {filters.minMatch === t.value && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                  </span>
                  <input
                    type="radio"
                    name="minMatch"
                    className="sr-only"
                    checked={filters.minMatch === t.value}
                    onChange={() => set({ minMatch: t.value })}
                  />
                  <span className="text-xs font-semibold text-slate-800">{t.label}</span>
                </label>
              ))}
            </div>

            {sectionTitle('Company type')}
            <div className="px-2 pb-1">
              <p className="text-[11px] font-semibold text-slate-400 leading-relaxed">
                Company size data isn&apos;t synced yet — this filter will appear once it is.
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {COMPANY_TYPES.map((ct) => (
                  <span
                    key={ct}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px] font-bold"
                  >
                    {ct}
                  </span>
                ))}
              </div>
            </div>
          </>
        );
    }
  };

  const filterButton = (
    id: DropdownId,
    icon: React.ReactNode,
    label: string,
    activeCount: number
  ) => (
    <button
      type="button"
      onClick={togglePanel(id)}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-[11px] font-bold transition-all whitespace-nowrap ${
        open?.id === id
          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
          : activeCount > 0
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
      }`}
    >
      {icon}
      <span>{label}</span>
      {activeCount > 0 && (
        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">
          {activeCount}
        </span>
      )}
      <ChevronDown className={`w-3 h-3 transition-transform ${open?.id === id ? 'rotate-180' : ''}`} />
    </button>
  );

  // Build chips for active filters.
  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (filters.q.trim()) {
    chips.push({ key: 'q', label: `Search: ${filters.q.trim()}`, onRemove: () => set({ q: '' }) });
  }
  filters.locations.forEach((v) =>
    chips.push({ key: `loc-${v}`, label: `Location: ${v}`, onRemove: () => set({ locations: filters.locations.filter((x) => x !== v) }) })
  );
  filters.workTypes.forEach((v) =>
    chips.push({ key: `wt-${v}`, label: `Work: ${v}`, onRemove: () => set({ workTypes: filters.workTypes.filter((x) => x !== v) }) })
  );
  filters.jobTypes.forEach((v) =>
    chips.push({ key: `jt-${v}`, label: `Job Type: ${v}`, onRemove: () => set({ jobTypes: filters.jobTypes.filter((x) => x !== v) }) })
  );
  filters.roles.forEach((v) =>
    chips.push({ key: `role-${v}`, label: `Role: ${v}`, onRemove: () => set({ roles: filters.roles.filter((x) => x !== v) }) })
  );
  filters.skills.forEach((v) =>
    chips.push({ key: `sk-${v}`, label: `Skill: ${v}`, onRemove: () => set({ skills: filters.skills.filter((x) => x !== v) }) })
  );
  filters.companies.forEach((v) =>
    chips.push({ key: `co-${v}`, label: `Company: ${v}`, onRemove: () => set({ companies: filters.companies.filter((x) => x !== v) }) })
  );
  filters.gradYears.forEach((v) =>
    chips.push({ key: `gy-${v}`, label: `Graduation: ${v}`, onRemove: () => set({ gradYears: filters.gradYears.filter((x) => x !== v) }) })
  );
  filters.degrees.forEach((v) =>
    chips.push({ key: `deg-${v}`, label: `Degree: ${v}`, onRemove: () => set({ degrees: filters.degrees.filter((x) => x !== v) }) })
  );
  filters.branches.forEach((v) =>
    chips.push({ key: `br-${v}`, label: `Branch: ${v}`, onRemove: () => set({ branches: filters.branches.filter((x) => x !== v) }) })
  );
  if (filters.minMatch > 0) {
    chips.push({
      key: 'match',
      label: `Resume Match: ${filters.minMatch}%+`,
      onRemove: () => set({ minMatch: 0 }),
    });
  }

  // Portal panel placement: fixed position, clamped to the viewport, opening
  // upward when there isn't enough room below the button.
  const portal = useMemo(() => {
    if (!open) return null;
    const width = PANEL_WIDTH[open.id];
    let left = open.alignRight ? open.anchor.right - width : open.anchor.left;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    const spaceBelow = window.innerHeight - open.anchor.bottom;
    const maxHeight = Math.min(480, Math.max(220, spaceBelow - 8));
    const top = spaceBelow > 220 ? open.anchor.bottom + 8 : Math.max(8, open.anchor.top - maxHeight - 8);
    return { left, top, width, maxHeight };
  }, [open]);

  return (
    <div ref={barRef} className="w-full flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {filterButton('location', <MapPin className="w-3.5 h-3.5" />, 'Location', filters.locations.length + filters.workTypes.length)}
        {filterButton('jobType', <Briefcase className="w-3.5 h-3.5" />, 'Job Type', filters.jobTypes.length)}
        {filterButton('role', <Code2 className="w-3.5 h-3.5" />, 'Role', filters.roles.length)}
        {filterButton('education', <GraduationCap className="w-3.5 h-3.5" />, 'Education', filters.gradYears.length + filters.degrees.length + filters.branches.length)}
        {filterButton('company', <Building2 className="w-3.5 h-3.5" />, 'Company', filters.companies.length)}
        {filterButton('more', <SlidersHorizontal className="w-3.5 h-3.5" />, 'More Filters', filters.skills.length + (filters.minMatch > 0 ? 1 : 0))}
      </div>

      {chips.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {chips.map((chip) => (
            <Chip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_FILTERS })}
            className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 px-2 py-1"
          >
            Clear All
          </button>
        </div>
      )}

      {open &&
        portal &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-50 bg-white border-2 border-slate-200 rounded-2xl shadow-xl p-3 overflow-y-auto"
            style={{ left: portal.left, top: portal.top, width: portal.width, maxHeight: portal.maxHeight }}
          >
            {renderPanel(open.id)}
          </div>,
          document.body
        )}
    </div>
  );
};
