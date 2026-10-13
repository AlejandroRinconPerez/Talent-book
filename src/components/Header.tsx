import React, { useRef, useState } from 'react';
import { Layers, Users, FolderKanban, LogOut, Presentation, Database, Download, Upload, RotateCcw, CircleHelp, Search, Sun, Moon, Monitor } from 'lucide-react';
import { Usuario } from '../types';
import { TalentBookLogo } from './TalentBookLogo';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Menu } from './ui/Menu';
import { useTheme } from '../utils/theme';

export type MainTab = 'busquedas' | 'book' | 'candidates';

interface HeaderProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  selectedCount: number;
  onOpenPresentation: () => void;
  currentUser: Usuario | null;
  onLogout: () => void;
  onStartTour: () => void;
  onOpenSearch: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onResetData: () => void;
}

const TABS: { id: MainTab; label: string; icon: React.ReactNode; href: string }[] = [
  { id: 'busquedas', label: 'My searches', icon: <FolderKanban className="size-4" />, href: '#/searches' },
  { id: 'book', label: 'Book', icon: <Layers className="size-4" />, href: '#/book' },
  { id: 'candidates', label: 'Candidates', icon: <Users className="size-4" />, href: '#/candidates' }
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  selectedCount,
  onOpenPresentation,
  currentUser,
  onLogout,
  onStartTour,
  onOpenSearch,
  onExportData,
  onImportData,
  onResetData
}) => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { preference, resolved, setPreference } = useTheme();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-rule bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="-ml-1.5 flex items-center rounded-md px-1.5 py-1 hover:bg-well"
            aria-label="About Talent Book"
          >
            <TalentBookLogo className="h-7 sm:h-8" showText />
          </button>

          <nav aria-label="Primary" className="flex items-center gap-0.5 sm:gap-1" data-tour="nav">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <a
                  key={tab.id}
                  href={tab.href}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={e => {
                    e.preventDefault();
                    onSelectTab(tab.id);
                  }}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-[background-color,color] duration-150 sm:px-3 ${
                    isActive ? 'bg-brand-wash text-brand-ink' : 'text-ink-2 hover:bg-well hover:text-ink'
                  }`}
                >
                  <span className={isActive ? 'text-brand' : 'text-ink-3'}>{tab.icon}</span>
                  <span className="hidden min-[400px]:inline">{tab.label}</span>
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onOpenSearch}
              className="hidden h-9 items-center gap-2 rounded-md border border-rule-strong bg-surface px-3 text-sm text-ink-3 hover:border-ink-3 hover:text-ink lg:inline-flex"
              aria-label="Search searches, profiles and candidates"
            >
              <Search className="size-4" />
              <span>Search</span>
              <kbd className="ml-3 rounded-sm border border-rule px-1.5 font-sans text-xs text-ink-3" aria-hidden="true">
                /
              </kbd>
            </button>
            <Button variant="icon" onClick={onOpenSearch} aria-label="Search" title="Search (/)" className="lg:hidden">
              <Search className="size-4" />
            </Button>

            <Button
              variant="commercial"
              size="sm"
              icon={<Presentation className="size-4" />}
              onClick={onOpenPresentation}
              disabled={selectedCount === 0}
              title={
                selectedCount === 0
                  ? 'Open a search or select candidates to present'
                  : `Prepare a presentation with ${selectedCount} candidate${selectedCount === 1 ? '' : 's'}`
              }
              className="hidden md:inline-flex"
              data-tour="present"
            >
              Present
              {selectedCount > 0 ? <span className="ml-1 rounded-full bg-on-accent/20 px-1.5 text-xs tabular-nums">{selectedCount}</span> : null}
            </Button>

            <Menu
              trigger={props => (
                <Button variant="icon" aria-label={`Theme: ${preference === 'system' ? 'follow system' : preference}`} title="Theme" {...props}>
                  {resolved === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
                </Button>
              )}
              items={[
                { label: `Light${preference === 'light' ? ' (current)' : ''}`, icon: <Sun className="size-4" />, onSelect: () => setPreference('light') },
                { label: `Dark${preference === 'dark' ? ' (current)' : ''}`, icon: <Moon className="size-4" />, onSelect: () => setPreference('dark') },
                {
                  label: `Follow system${preference === 'system' ? ' (current)' : ''}`,
                  description: `Currently ${resolved}.`,
                  icon: <Monitor className="size-4" />,
                  onSelect: () => setPreference('system')
                }
              ]}
            />

            <Button variant="icon" onClick={onStartTour} aria-label="Start the guided tour" title="Guided tour">
              <CircleHelp className="size-4" />
            </Button>

            <Menu
              trigger={props => (
                <Button variant="icon" aria-label="Workspace data" title="Workspace data" {...props}>
                  <Database className="size-4" />
                </Button>
              )}
              items={[
                {
                  label: 'Export workspace',
                  description: 'Download your searches as a JSON file.',
                  icon: <Download className="size-4" />,
                  onSelect: onExportData
                },
                {
                  label: 'Import workspace',
                  description: 'Load a JSON file exported from Talent Book.',
                  icon: <Upload className="size-4" />,
                  onSelect: () => fileInputRef.current?.click()
                },
                {
                  label: 'Reset demo data',
                  description: 'Discard local changes and reload the sample searches.',
                  icon: <RotateCcw className="size-4" />,
                  onSelect: onResetData,
                  tone: 'danger'
                }
              ]}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) onImportData(file);
                e.target.value = '';
              }}
            />

            {currentUser ? (
              <div className="flex items-center gap-2 border-l border-rule pl-2 sm:pl-3">
                <div className="hidden text-right leading-tight xl:block">
                  <div className="text-[13px] font-semibold text-ink">{currentUser.nombre}</div>
                  <div className="text-xs text-ink-3">{currentUser.rol}</div>
                </div>
                <div
                  className="flex size-8 items-center justify-center rounded-full bg-brand-wash text-[13px] font-semibold text-brand-ink"
                  aria-hidden="true"
                >
                  {currentUser.nombre.charAt(0)}
                </div>
                <Button variant="icon" onClick={onLogout} aria-label="Log out" title="Log out">
                  <LogOut className="size-4" />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {isAboutOpen ? (
        <Modal
          size="sm"
          title="What Talent Book is"
          onClose={() => setIsAboutOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsAboutOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsAboutOpen(false);
                  onStartTour();
                }}
              >
                Take the tour
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-[15px] leading-relaxed text-ink-2">
            <p>
              Talent Book is the standard directory of occupational profiles our sales team sells against. It groups roles into 12 job
              families, each with specialties and generic profiles that describe what a role includes and excludes.
            </p>
            <p>
              From any profile you can jump to matching candidates, link them to a client search, evaluate fit against the vacancy and
              export the shortlist to CEIPAL or present it on a call.
            </p>
            <p className="text-[13px] text-ink-3">
              This is a functional mockup with sample data: candidates and clients are fictional, and the CEIPAL integration is simulated.
              Your searches are saved in this browser and can be exported as JSON.
            </p>
          </div>
        </Modal>
      ) : null}
    </>
  );
};
