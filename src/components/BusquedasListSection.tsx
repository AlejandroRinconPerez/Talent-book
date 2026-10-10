import React, { useState } from 'react';
import { 
  FolderKanban, 
  FolderPlus, 
  Building2, 
  Calendar, 
  Users, 
  ArrowRight, 
  Search, 
  Layers, 
  CheckCircle2, 
  Briefcase,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { BusquedaComercial } from '../types';

interface BusquedasListSectionProps {
  busquedas: BusquedaComercial[];
  onSelectBusqueda: (busquedaId: string) => void;
  onOpenCreateModal: () => void;
}

export const BusquedasListSection: React.FC<BusquedasListSectionProps> = ({
  busquedas,
  onSelectBusqueda,
  onOpenCreateModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBusquedas = busquedas.filter(b => {
    const term = searchTerm.toLowerCase();
    return (
      b.nombre.toLowerCase().includes(term) ||
      (b.clienteEmpresa && b.clienteEmpresa.toLowerCase().includes(term)) ||
      b.descripcion.toLowerCase().includes(term) ||
      (b.perfilNombre && b.perfilNombre.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats & Action */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono font-bold text-[#007685] bg-[#007685]/10 px-2.5 py-0.5 rounded uppercase tracking-wider">
                Sales Pipeline
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">
                Requirements & Shortlist Management
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              My Talent Searches
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Create and manage client searches, link candidates from the directory or Talent Book, evaluate fit, and sync candidates to CEIPAL pipelines.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#007685] hover:bg-[#005d69] rounded-xl transition-all flex items-center gap-2 shadow-xs group cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Create new search</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Search Bar */}
        <div className="mt-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by search name, client, or profile..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#20BFD0]/40 focus:border-[#007685] transition-all"
          />
        </div>
      </div>

      {/* Searches List Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700">
            Active Searches ({filteredBusquedas.length})
          </span>
          <span>Select a search to manage linked candidates</span>
        </div>

        {filteredBusquedas.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No searches found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No commercial searches match &ldquo;{searchTerm}&rdquo;. You can create a new search anytime.
            </p>
            <button
              onClick={onOpenCreateModal}
              className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-[#007685] bg-[#007685]/10 hover:bg-[#007685]/20 rounded-lg transition-colors"
            >
              Create first search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBusquedas.map((busqueda) => {
              const ceipalCargadosCount = busqueda.candidatosVinculados.filter(
                c => c.estadoCeipal === 'cargado'
              ).length;

              return (
                <div
                  key={busqueda.id}
                  onClick={() => onSelectBusqueda(busqueda.id)}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-[#007685]/50 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Top row: ID and Date */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 font-mono">
                      <span className="font-bold text-[#007685] bg-[#007685]/8 px-2 py-0.5 rounded">
                        {busqueda.id}
                      </span>
                      <span className="flex items-center gap-1 font-sans">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {busqueda.fechaCreacion}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#007685] transition-colors line-clamp-2">
                      {busqueda.nombre}
                    </h3>

                    {/* Client / Empresa */}
                    {busqueda.clienteEmpresa ? (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{busqueda.clienteEmpresa}</span>
                      </div>
                    ) : (
                      <div className="mt-1.5 text-xs text-slate-400 italic">
                        Client not specified
                      </div>
                    )}

                    {/* Description snippet */}
                    <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {busqueda.descripcion}
                    </p>

                    {/* Book profile tag if linked */}
                    {busqueda.perfilNombre && (
                      <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-500 bg-[#F5F5F6] px-2 py-1 rounded-md">
                        <Layers className="w-3 h-3 text-[#007685]" />
                        <span className="truncate">Book: {busqueda.perfilNombre}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Stats & Enter Action */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {busqueda.candidatosVinculados.length} {busqueda.candidatosVinculados.length === 1 ? 'candidate' : 'candidates'}
                      </span>

                      {ceipalCargadosCount > 0 && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.2 rounded font-semibold">
                          {ceipalCargadosCount} in CEIPAL
                        </span>
                      )}
                    </div>

                    <span className="flex items-center gap-1 font-bold text-[#007685] group-hover:translate-x-0.5 transition-transform">
                      Open <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
