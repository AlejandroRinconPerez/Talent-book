const dateFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});

const longDateFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const numberFormatter = new Intl.NumberFormat('en');

/** Formats an ISO date (YYYY-MM-DD) as "Oct 6, 2026". Falls back to the raw value. */
export function formatDate(iso: string | undefined, style: 'short' | 'long' = 'short'): string {
  if (!iso) return '';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return (style === 'long' ? longDateFormatter : dateFormatter).format(date);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** "1 candidate" / "3 candidates" */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

/** Today's date as YYYY-MM-DD, the storage format used by the mock data. */
export function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}
