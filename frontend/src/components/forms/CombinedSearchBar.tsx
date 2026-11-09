import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronDown, ArrowRight } from 'lucide-react';

const MUNICIPALITIES = [
  { label: 'All of Batanes', value: '' },
  { label: 'Basco', value: 'Basco' },
  { label: 'Mahatao', value: 'Mahatao' },
  { label: 'Ivana', value: 'Ivana' },
  { label: 'Uyugan', value: 'Uyugan' },
  { label: 'Sabtang', value: 'Sabtang' },
  { label: 'Itbayat', value: 'Itbayat' },
];

interface CombinedSearchBarProps {
  initialQuery?: string;
  initialMunicipality?: string;
  className?: string;
}

export default function CombinedSearchBar({
  initialQuery = '',
  initialMunicipality = '',
  className = '',
}: CombinedSearchBarProps) {
  const navigate = useNavigate();
  const [q, setQ] = useState(initialQuery);
  const [municipality, setMunicipality] = useState(initialMunicipality);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (municipality) params.set('municipality', municipality);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div id="main-search-bar" className={`w-full max-w-2xl mx-auto shrink-0 ${className}`}>
      {/* 
        Mobile View (< sm): ONE rounded-2xl box with 2 rows.
        Row 1: Search icon, input (placeholder "Front Desk, Driver, Tour Guide"), round yellow submit arrow button.
        Row 2: Location row under a thin divider with pin, "All of Batanes", chevron (44px+ tap target).
      */}
      <form
        onSubmit={handleSubmit}
        className="block sm:hidden card rounded-2xl border border-border shadow-md overflow-hidden bg-surface"
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden="true" />
          <input
            id="mobile-combined-search-input"
            type="text"
            aria-label="Job title or keyword"
            placeholder="Front Desk, Driver, Tour Guide"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-base text-foreground placeholder:text-muted-foreground font-medium py-1"
          />
          <button
            type="submit"
            aria-label="Search jobs"
            className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs hover:bg-primary-hover active:scale-95 transition-all"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="border-t border-border/60" />

        <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-soft/30 min-h-[44px]">
          <div className="flex items-center gap-2 flex-1">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <select
              id="mobile-combined-municipality-select"
              aria-label="Filter by municipality"
              value={municipality}
              onChange={e => setMunicipality(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-foreground font-semibold cursor-pointer w-full py-2 min-h-[44px]"
            >
              {MUNICIPALITIES.map(m => (
                <option key={m.label} value={m.value} className="bg-surface text-foreground">
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 pointer-events-none" aria-hidden="true" />
        </div>
      </form>

      {/* 
        Desktop View (>= sm): Combined pill search bar
      */}
      <form
        onSubmit={handleSubmit}
        className="hidden sm:flex card p-2 rounded-2xl sm:rounded-full shadow-md items-center gap-2 border-border bg-surface"
      >
        <div className="flex-1 pl-4 pr-2 py-2 flex items-center gap-2.5">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <input
            id="desktop-combined-search-input"
            type="text"
            aria-label="Job title or keyword"
            placeholder="Front Desk, Driver, Tour Guide"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground font-medium"
          />
        </div>

        <div className="border-l border-border/60 px-2 py-1">
          <select
            id="desktop-combined-municipality-select"
            aria-label="Filter by municipality"
            value={municipality}
            onChange={e => setMunicipality(e.target.value)}
            className="w-44 bg-transparent border-none outline-none text-xs text-foreground font-semibold cursor-pointer py-2 pr-6 min-h-[44px]"
          >
            {MUNICIPALITIES.map(m => (
              <option key={m.label} value={m.value} className="bg-surface text-foreground">
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <button
          id="btn-desktop-combined-search"
          type="submit"
          className="btn btn-primary rounded-full px-6 py-2.5 text-xs font-bold shrink-0 min-h-[44px]"
        >
          Search jobs
        </button>
      </form>
    </div>
  );
}

