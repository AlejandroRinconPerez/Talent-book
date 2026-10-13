import React, { useEffect, useEffectEvent, useId, useMemo, useRef, useState } from 'react';
import { Search, FolderKanban, Layers, User, CornerDownLeft } from 'lucide-react';
import { BusquedaComercial } from '../types';
import { SearchHit, queryIndex } from '../data/searchIndex';

interface GlobalSearchProps {
  busquedas: BusquedaComercial[];
  onClose: () => void;
  onOpenSearch: (id: string) => void;
  onOpenProfile: (profileId: string) => void;
  onOpenCandidate: (candidateId: string) => void;
}

const GROUP_LABEL: Record<SearchHit['type'], string> = { search: 'Searches', profile: 'Book profiles', candidate: 'Candidates' };
const GROUP_ICON: Record<SearchHit['type'], React.ReactNode> = {
  search: <FolderKanban className="size-4" />,
  profile: <Layers className="size-4" />,
  candidate: <User className="size-4" />
};

/**
 * Command-palette search over searches, Book profiles and candidates.
 * Opens with "/" or Ctrl+K; arrows move, Enter opens, Escape closes.
 */
export const GlobalSearch: React.FC<GlobalSearchProps> = ({ busquedas, onClose, onOpenSearch, onOpenProfile, onOpenCandidate }) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const close = useEffectEvent(() => onClose());

  const results = useMemo(() => queryIndex(query, busquedas), [query, busquedas]);
  const flat = useMemo(() => [...results.searches, ...results.profiles, ...results.candidates], [results]);
  const activeIndex = Math.min(active, Math.max(0, flat.length - 1));

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  const open = (hit: SearchHit) => {
    onClose();
    if (hit.type === 'search') onOpenSearch(hit.id);
    else if (hit.type === 'profile') onOpenProfile(hit.id);
    else onOpenCandidate(hit.id);
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(i => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flat[activeIndex]) {
      e.preventDefault();
      open(flat[activeIndex]);
    }
  };

  const groups: { type: SearchHit['type']; hits: SearchHit[] }[] = [
    { type: 'search', hits: results.searches },
    { type: 'profile', hits: results.profiles },
    { type: 'candidate', hits: results.candidates }
  ];
  let runningIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-4 pt-[12vh] animate-fade"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label="Search Talent Book" className="panel w-full max-w-xl overflow-hidden shadow-pop animate-pop">
        <div className="relative border-b border-rule">
          <Search className="input-icon left-4" />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={flat.length > 0}
            aria-controls={listId}
            aria-activedescendant={flat[activeIndex] ? `${listId}-${flat[activeIndex].type}-${flat[activeIndex].id}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            placeholder="Search searches, profiles and candidates…"
            className="h-14 w-full border-0 bg-transparent pl-11 pr-4 text-base text-ink placeholder:text-ink-3 focus:outline-none"
          />
        </div>

        <div id={listId} role="listbox" aria-label="Results" className="max-h-[60vh] overflow-y-auto overscroll-contain py-2">
          {query.trim() === '' ? (
            <p className="px-5 py-6 text-center text-[13px] text-ink-3">Type a name, a client, a skill, a city or an ID.</p>
          ) : flat.length === 0 ? (
            <p className="px-5 py-6 text-center text-[13px] text-ink-3">Nothing matches “{query}”.</p>
          ) : (
            groups
              .filter(g => g.hits.length > 0)
              .map(group => (
                <div key={group.type} role="group" aria-label={GROUP_LABEL[group.type]}>
                  <p className="px-4 pb-1 pt-2 text-[13px] font-medium text-ink-3">{GROUP_LABEL[group.type]}</p>
                  {group.hits.map(hit => {
                    const index = runningIndex++;
                    const isActive = index === activeIndex;
                    return (
                      <button
                        key={`${hit.type}-${hit.id}`}
                        id={`${listId}-${hit.type}-${hit.id}`}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => open(hit)}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left ${isActive ? 'bg-brand-wash text-brand-ink' : 'text-ink hover:bg-well'}`}
                      >
                        <span className={isActive ? 'text-brand' : 'text-ink-3'}>{GROUP_ICON[hit.type]}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{hit.title}</span>
                          <span className="block truncate text-[13px] text-ink-3">{hit.subtitle}</span>
                        </span>
                        {isActive ? <CornerDownLeft className="size-4 shrink-0 text-ink-3" aria-hidden="true" /> : null}
                      </button>
                    );
                  })}
                </div>
              ))
          )}
        </div>

        <p className="flex items-center justify-between border-t border-rule px-4 py-2 text-xs text-ink-3">
          <span>Arrows to move, Enter to open, Esc to close</span>
          <span className="tabular-nums">{flat.length > 0 ? `${flat.length} results` : ''}</span>
        </p>
      </div>
    </div>
  );
};
