'use client';

import React, { useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import {
  BASE_SKILLS,
  BRANCHES,
  COMPANY_TYPES,
  DEGREES,
  EXPERIENCE_LEVELS,
  GRAD_YEARS,
  JOB_TYPES,
  LOCATION_COUNTRIES,
  LOCATION_REGIONS,
  LOCATION_WORK_TYPES,
  MATCH_THRESHOLDS,
  ROLE_GROUPS,
  type DiscoverFacets,
  type DiscoverFilters,
} from '@/lib/jobs/filters';

type SectionId = 'location' | 'jobType' | 'role' | 'education' | 'company' | 'more';

interface FilterSidebarProps {
  filters: DiscoverFilters;
  onChange: (filters: DiscoverFilters) => void;
  onClear: () => void;
  facets: DiscoverFacets | null;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
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
    <label className="flex items-center gap-2.5 px-1 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none">
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

const SECTION_LABELS: { id: SectionId; label: string }[] = [
  { id: 'location', label: 'Location' },
  { id: 'jobType', label: 'Job Type & Experience' },
  { id: 'role', label: 'Role' },
  { id: 'education', label: 'Education' },
  { id: 'company', label: 'Company' },
  { id: 'more', label: 'More Filters' },
];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, onChange, onClear, facets }) => {
  const [open, setOpen] = useState<SectionId[]>(['location', 'jobType']);
  const [searches, setSearches] = useState<Partial<Record<SectionId, string>>>({});

  const set = (patch: Partial<DiscoverFilters>) => onChange({ ...filters, ...patch });

  const toggleSection = (id: SectionId) =>
    setOpen((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const q = (id: SectionId) => (searches[id] || '').trim().toLowerCase();
  const matches = (id: SectionId, value: string) =>
    !q(id) || value.toLowerCase().includes(q(id));

  const sectionSearch = (id: SectionId, placeholder: string) => (
    <div className="relative mb-2">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={searches[id] || ''}
        onChange={(e) => setSearches((prev) => ({ ...prev, [id]: e.target.value }))}
        className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border-2 border-slate-200 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500"
      />
    </div>
  );

  const sectionTitle = (text: string) => (
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1 mb-1.5 mt-2.5">
      {text}
    </p>
  );

  const noResults = (
    <p className="px-2 py-2 text-[11px] font-bold text-slate-400">No matching options</p>
  );

  const scrollBox = (children: React.ReactNode) => (
    <div className="max-h-44 overflow-y-auto space-y-0.5 pr-1">{children}</div>
  );

  const filteredCountries = LOCATION_COUNTRIES.filter((c) => matches('location', c.name));
  const filteredRegions = (LOCATION_REGIONS[filters.country] || []).filter((r) =>
    matches('location', r.name)
  );
  const filteredJobTypes = JOB_TYPES.filter((t) => matches('jobType', t));
  const filteredExperience = EXPERIENCE_LEVELS.filter((l) => matches('jobType', l));
  const filteredRoleGroups = ROLE_GROUPS.map((g) => ({
    ...g,
    roles: g.roles.filter((r) => matches('role', r)),
  })).filter((g) => g.roles.length > 0);
  const filteredGradYears = GRAD_YEARS.filter((y) => matches('education', y));
  const filteredDegrees = DEGREES.filter((d) => matches('education', d));
  const filteredBranches = BRANCHES.filter((b) => matches('education', b));
  const filteredCompanies = (facets?.companies || []).filter((c) => matches('company', c));
  const filteredSkills = (facets?.skills || BASE_SKILLS.map((s) => ({ name: s, count: 0 }))).filter(
    (s) => matches('more', s.name)
  );

  const renderSection = (id: SectionId) => {
    switch (id) {
      case 'location':
        return (
          <>
            {sectionSearch('location', 'Search countries or cities…')}
            {sectionTitle('Work mode')}
            {LOCATION_WORK_TYPES.filter((wt) => matches('location', wt)).map((wt) => (
              <CheckboxRow
                key={wt}
                label={wt}
                checked={filters.workTypes.includes(wt)}
                onChange={() => set({ workTypes: toggle(filters.workTypes, wt) })}
              />
            ))}
            {sectionTitle('Country')}
            {filteredCountries.length ? (
              filteredCountries.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2.5 px-1 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none"
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-none transition-colors ${
                      filters.country === c.id ? 'border-indigo-600' : 'border-slate-300'
                    }`}
                  >
                    {filters.country === c.id && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </span>
                  <input
                    type="radio"
                    name="country"
                    className="sr-only"
                    checked={filters.country === c.id}
                    onChange={() => set({ country: c.id, regions: [] })}
                  />
                  <span className="text-xs font-semibold text-slate-800">{c.name}</span>
                </label>
              ))
            ) : (
              noResults
            )}
            {sectionTitle('States & cities')}
            {filters.country ? (
              filteredRegions.length ? (
                scrollBox(
                  filteredRegions.map((r) => (
                    <CheckboxRow
                      key={r.id}
                      label={r.name}
                      checked={filters.regions.includes(r.id)}
                      onChange={() => set({ regions: toggle(filters.regions, r.id) })}
                    />
                  ))
                )
              ) : (
                noResults
              )
            ) : (
              <p className="px-1 py-1.5 text-[11px] font-semibold text-slate-400">
                Select a country to see its states & cities.
              </p>
            )}
          </>
        );
      case 'jobType':
        return (
          <>
            {sectionSearch('jobType', 'Search job types or experience…')}
            {sectionTitle('Role type')}
            {filteredJobTypes.length
              ? filteredJobTypes.map((t) => (
                  <CheckboxRow
                    key={t}
                    label={t}
                    checked={filters.jobTypes.includes(t)}
                    onChange={() => set({ jobTypes: toggle(filters.jobTypes, t) })}
                  />
                ))
              : noResults}
            {sectionTitle('Experience')}
            {filteredExperience.length
              ? filteredExperience.map((lvl) => (
                  <CheckboxRow
                    key={lvl}
                    label={`${lvl} years`}
                    checked={filters.jobTypes.includes(lvl)}
                    onChange={() => set({ jobTypes: toggle(filters.jobTypes, lvl) })}
                  />
                ))
              : noResults}
          </>
        );
      case 'role':
        return (
          <>
            {sectionSearch('role', 'Search roles…')}
            {filteredRoleGroups.length
              ? filteredRoleGroups.map((group) => (
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
              : noResults}
          </>
        );
      case 'education':
        return (
          <>
            {sectionSearch('education', 'Search graduation year, degree, branch…')}
            {sectionTitle('Graduation year')}
            {filteredGradYears.length
              ? filteredGradYears.map((y) => (
                  <CheckboxRow
                    key={y}
                    label={y}
                    checked={filters.gradYears.includes(y)}
                    onChange={() => set({ gradYears: toggle(filters.gradYears, y) })}
                  />
                ))
              : noResults}
            {sectionTitle('Degree')}
            {filteredDegrees.length
              ? filteredDegrees.map((d) => (
                  <CheckboxRow
                    key={d}
                    label={d}
                    checked={filters.degrees.includes(d)}
                    onChange={() => set({ degrees: toggle(filters.degrees, d) })}
                  />
                ))
              : noResults}
            {sectionTitle('Branch')}
            {filteredBranches.length
              ? filteredBranches.map((b) => (
                  <CheckboxRow
                    key={b}
                    label={b}
                    checked={filters.branches.includes(b)}
                    onChange={() => set({ branches: toggle(filters.branches, b) })}
                  />
                ))
              : noResults}
          </>
        );
      case 'company':
        return (
          <>
            {sectionSearch('company', 'Search companies…')}
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
            {sectionSearch('more', 'Search skills…')}
            {scrollBox(
              filteredSkills.length
                ? filteredSkills.map((s) => (
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
            <div className="px-1">
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
            <div className="px-1">
              <p className="text-[11px] font-semibold text-slate-400 leading-relaxed">
                Company size data isn&apos;t synced yet — this filter will appear once it is.
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {COMPANY_TYPES.map((ct) => (
                  <span key={ct} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px] font-bold">
                    {ct}
                  </span>
                ))}
              </div>
            </div>
          </>
        );
    }
  };

  const sectionCount: Record<SectionId, number> = {
    location:
      filters.locations.length +
      filters.workTypes.length +
      (filters.country ? 1 : 0) +
      filters.regions.length,
    jobType: filters.jobTypes.length,
    role: filters.roles.length,
    education: filters.gradYears.length + filters.degrees.length + filters.branches.length,
    company: filters.companies.length,
    more: filters.skills.length + (filters.minMatch > 0 ? 1 : 0),
  };

  // Active filter chips.
  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  filters.locations.forEach((v) =>
    chips.push({ key: `loc-${v}`, label: `Location: ${v}`, onRemove: () => set({ locations: filters.locations.filter((x) => x !== v) }) })
  );
  filters.workTypes.forEach((v) =>
    chips.push({ key: `wt-${v}`, label: `Work: ${v}`, onRemove: () => set({ workTypes: filters.workTypes.filter((x) => x !== v) }) })
  );
  if (filters.country) {
    const countryName = LOCATION_COUNTRIES.find((c) => c.id === filters.country)?.name || filters.country;
    chips.push({
      key: 'country',
      label: `Country: ${countryName}`,
      onRemove: () => set({ country: '', regions: [] }),
    });
  }
  filters.regions.forEach((v) =>
    chips.push({
      key: `region-${v}`,
      label: `State: ${v}`,
      onRemove: () => set({ regions: filters.regions.filter((x) => x !== v) }),
    })
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

  return (
    <div className="w-full flex flex-col gap-1">
      {SECTION_LABELS.map(({ id, label }) => {
        const isOpen = open.includes(id);
        const count = sectionCount[id];
        return (
          <div key={id} className="border-b border-slate-100 last:border-b-0">
            <button
              type="button"
              onClick={() => toggleSection(id)}
              className="w-full flex items-center justify-between gap-2 py-3 text-left transition-colors"
            >
              <span className="flex items-center gap-2 text-xs font-black text-slate-700">
                {label}
                {count > 0 && (
                  <span className="min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">
                    {count}
                  </span>
                )}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && <div className="pb-3">{renderSection(id)}</div>}
          </div>
        );
      })}

      {chips.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
            Active filters
          </p>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-800"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="text-indigo-400 hover:text-indigo-700 transition-colors"
                  aria-label={`Remove filter ${chip.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={onClear}
            className="mt-2.5 text-[11px] font-black text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};
