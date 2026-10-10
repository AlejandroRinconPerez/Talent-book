import React, { useEffect, useId, useRef, useState } from 'react';

export interface MenuItem {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  tone?: 'default' | 'danger';
}

interface MenuProps {
  /** The trigger; receives aria attributes and the toggle handler. */
  trigger: (props: { 'aria-haspopup': 'menu'; 'aria-expanded': boolean; 'aria-controls': string; onClick: () => void }) => React.ReactNode;
  items: MenuItem[];
  align?: 'left' | 'right';
}

/** Small action menu: click-outside and Escape close it, arrow keys move between items. */
export const Menu: React.FC<MenuProps> = ({ trigger, items, align = 'right' }) => {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
        if (buttons.length === 0) return;
        e.preventDefault();
        const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = e.key === 'ArrowDown' ? (idx + 1) % buttons.length : (idx - 1 + buttons.length) % buttons.length;
        buttons[next].focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    listRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {trigger({ 'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-controls': id, onClick: () => setOpen(v => !v) })}
      {open ? (
        <div
          ref={listRef}
          id={id}
          role="menu"
          className={`panel absolute top-full z-50 mt-1.5 min-w-56 p-1 shadow-pop animate-pop ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {items.map(item => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={`flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-well focus-visible:bg-well focus-visible:outline-none ${
                item.tone === 'danger' ? 'text-danger' : 'text-ink'
              }`}
            >
              {item.icon ? <span className={`mt-0.5 shrink-0 ${item.tone === 'danger' ? 'text-danger' : 'text-ink-3'}`}>{item.icon}</span> : null}
              <span className="min-w-0">
                <span className="block font-medium">{item.label}</span>
                {item.description ? <span className="block text-[13px] text-ink-3">{item.description}</span> : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
