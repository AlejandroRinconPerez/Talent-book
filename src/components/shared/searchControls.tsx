import React from 'react';
import { Search, Sparkles, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { DetectedRequirement, ENGLISH_LEVELS, FILTER_LABEL, Modalidad, MODALITY_LABEL, NivelCefr } from '../../services/candidateSearch';

/* Controls shared by every place a rep searches the pool: the Candidates page and "Add candidates" inside a search. */

interface RequirementSearchBoxProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Runs the search with the current text. */
  onSubmit: () => void;
  onClear: () => void;
  /** Requirements read out of the last submitted text, now applied as filters. */
  detected: DetectedRequirement[];
  onRemoveDetected: (field: DetectedRequirement['field']) => void;
  /** Sample requests shown while the box is empty. */
  examples?: string[];
  onPickExample?: (text: string) => void;
  rows?: number;
}

/**
 * One box for what the client asked for. Submitting runs the semantic search over
 * every CV and reads requirements out of the text into filters the rep can change.
 * Enter searches; Shift+Enter adds a line.
 */
export const RequirementSearchBox: React.FC<RequirementSearchBoxProps> = ({
  id,
  value,
  onChange,
  onSubmit,
  onClear,
  detected,
  onRemoveDetected,
  examples = [],
  onPickExample,
  rows = 2
}) => (
  <div className="space-y-3">
    <form
      role="search"
      onSubmit={e => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-2 sm:flex-row sm:items-start"
    >
      <div className="relative min-w-0 flex-1">
        <label htmlFor={id} className="sr-only">
          What does the client need?
        </label>
        <Search className="pointer-events-none absolute left-3 top-3 size-4 text-ink-3" />
        <textarea
          id={id}
          rows={rows}
          value={value}
          autoComplete="off"
          spellCheck={false}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Describe what the client needs: role, tasks, tools, English, years, country, work mode…"
          className="input textarea input-with-icon pr-9"
        />
        {value ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-md text-ink-3 hover:bg-well hover:text-ink"
            aria-label="Clear the search text"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      <Button type="submit" variant="primary" icon={<Sparkles className="size-4" />} className="shrink-0">
        Search
      </Button>
    </form>

    {detected.length > 0 ? (
      <div className="flex flex-wrap items-center gap-1.5 text-[13px]" aria-live="polite">
        <span className="text-ink-3">Read from your text:</span>
        {detected.map(d => (
          <span key={d.field} className="chip chip-brand gap-1.5 py-0.5 pr-0.5" title={`From “${d.source}”`}>
            <span className="text-brand-ink/70">{FILTER_LABEL[d.field]}</span>
            {d.label}
            <button
              type="button"
              onClick={() => onRemoveDetected(d.field)}
              className="flex size-5 items-center justify-center rounded-sm hover:bg-brand-wash-2"
              aria-label={`Remove the ${FILTER_LABEL[d.field].toLowerCase()} filter read from the text`}
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
      </div>
    ) : !value && examples.length > 0 && onPickExample ? (
      <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
        <span className="text-ink-3">Try:</span>
        {examples.map(example => (
          <button key={example} type="button" className="pill max-w-full" onClick={() => onPickExample(example)}>
            <span className="truncate">{example}</span>
          </button>
        ))}
      </div>
    ) : null}
  </div>
);

const ENGLISH_DESCRIPTOR: Record<NivelCefr, string> = {
  A1: 'beginner',
  A2: 'basic',
  B1: 'intermediate',
  B2: 'upper intermediate',
  C1: 'advanced',
  C2: 'proficient'
};

/** Minimum English. Every option reads as a floor because that is how it filters. */
export const EnglishMinimumOptions: React.FC = () => (
  <>
    <option value="">Any level</option>
    {ENGLISH_LEVELS.filter(l => l !== 'A1').map(level => (
      <option key={level} value={level}>
        {level === 'C2' ? 'C2, proficient' : `${level} or higher (${ENGLISH_DESCRIPTOR[level]})`}
      </option>
    ))}
  </>
);

const EXPERIENCE_STEPS = [1, 2, 3, 4, 5, 6, 8, 10];

/** Minimum years. Keeps a value read from text visible even when it is not one of the usual steps. */
export const ExperienceMinimumOptions: React.FC<{ current?: number }> = ({ current }) => {
  const steps = current && !EXPERIENCE_STEPS.includes(current) ? [...EXPERIENCE_STEPS, current].sort((a, b) => a - b) : EXPERIENCE_STEPS;
  return (
    <>
      <option value="0">Any</option>
      {steps.map(n => (
        <option key={n} value={n}>
          {n === 1 ? '1 year or more' : `${n} years or more`}
        </option>
      ))}
    </>
  );
};

export const ModalityOptions: React.FC<{ withAny?: boolean }> = ({ withAny = true }) => (
  <>
    {withAny ? <option value="">Any</option> : null}
    {(Object.keys(MODALITY_LABEL) as Modalidad[]).map(m => (
      <option key={m} value={m}>
        {MODALITY_LABEL[m]}
      </option>
    ))}
  </>
);

/** Whether candidates who lack data for a filter stay in the list. */
export const IncludeToValidateToggle: React.FC<{ id: string; checked: boolean; onChange: (v: boolean) => void }> = ({ id, checked, onChange }) => (
  <div className="flex items-start gap-2.5">
    <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-0.5 size-4 shrink-0" aria-describedby={`${id}-hint`} />
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        Include candidates with missing data
      </label>
      <p id={`${id}-hint`} className="text-[13px] text-ink-3">
        They stay in the list, after full matches, marked “To validate”.
      </p>
    </div>
  </div>
);
