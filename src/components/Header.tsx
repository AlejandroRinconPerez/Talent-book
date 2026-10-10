import React, { useState } from 'react';
import { Layers, Eye, Users, Search, FolderKanban, LogOut, User, X, Sparkles, BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Usuario } from '../types';
import { TalentBookLogo } from './TalentBookLogo';

interface HeaderProps {
  activeTab: 'busquedas' | 'book' | 'candidates';
  onSelectTab: (tab: 'busquedas' | 'book' | 'candidates') => void;
  selectedCount: number;
  onOpenPresentation: () => void;
  currentUser: Usuario | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  selectedCount,
  onOpenPresentation,
  currentUser,
  onLogout
}) => {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Zone 1: Single Brand Zone */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAboutModalOpen(true)}
                className="text-left group flex items-center gap-2 p-1.5 -ml-1.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#007685]/20"
                title="Click to learn about Talent Book"
              >
                <TalentBookLogo className="h-8 sm:h-9" showText={true} />
              </button>
            </div>

          {/* Zone 2: Navigation Links (My Searches, Talent Book, Candidates) */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onSelectTab('busquedas')}
              className={`px-3 sm:px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'busquedas'
                  ? 'bg-[#007685]/10 text-[#007685] font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-[#007685]" />
              <span>My Searches</span>
            </button>

            <button
              onClick={() => onSelectTab('book')}
              className={`px-3 sm:px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'book'
                  ? 'bg-[#007685]/10 text-[#007685] font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Layers className="w-4 h-4 text-[#007685]" />
              <span>Talent Book</span>
            </button>

            <button
              onClick={() => onSelectTab('candidates')}
              className={`px-3 sm:px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'candidates'
                  ? 'bg-[#007685]/10 text-[#007685] font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Users className="w-4 h-4 text-[#007685]" />
              <span>Candidates</span>
            </button>
          </nav>

          {/* Zone 3: Actions & User Session */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Presentation Mode Button */}
            <button
              onClick={onOpenPresentation}
              disabled={selectedCount === 0}
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-xs ${
                selectedCount > 0
                  ? 'bg-[#007685] text-white hover:bg-[#005d69] cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              title={selectedCount === 0 ? "Select candidates in a search to present to client" : "Open clean presentation view for client"}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Present</span>
              {selectedCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#EE7825] text-white text-[10px] flex items-center justify-center font-mono font-bold tabular-nums">
                  {selectedCount}
                </span>
              )}
            </button>

            {/* User Session Avatar & Logout */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.nombre}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">
                    {currentUser.rol}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#007685]/10 text-[#007685] font-bold text-xs flex items-center justify-center border border-[#007685]/20">
                  {currentUser.nombre.charAt(0)}
                </div>

                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

    {/* Explainer Modal when clicking Talent Book Logo */}
    {isAboutModalOpen && (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
        <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative animate-in zoom-in-95 duration-150">
          <button
            onClick={() => setIsAboutModalOpen(false)}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex flex-col items-start gap-3 pb-4 border-b border-slate-100">
            <TalentBookLogo className="h-10" showText={true} />
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Talent Book Architecture
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Standardized occupational catalog for talent operations and recruitment
              </p>
            </div>
          </div>

          {/* Explanatory Content */}
          <div className="py-4 space-y-3.5 text-xs text-slate-600">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                What is Talent Book?
              </span>
              <p className="leading-relaxed">
                Talent Book is the standardized occupational directory designed to classify and evaluate talent across <strong className="text-slate-800">12 Primary Job Families</strong>, specialized tracks, and generic occupational profiles.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#007685] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block text-xs">Taxonomy-Driven Organization</strong>
                  <span>Enables rapid matching across administration, engineering, collections, finance, and customer service.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#007685] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block text-xs">Direct Commercial Linking</strong>
                  <span>Associate vetted profiles directly to active client searches, CEIPAL pipelines, and presentation shortlists.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAboutModalOpen(false)}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAboutModalOpen(false);
                onSelectTab('book');
              }}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-[#007685] hover:bg-[#005d69] rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Start Exploring Talent Book</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
};
