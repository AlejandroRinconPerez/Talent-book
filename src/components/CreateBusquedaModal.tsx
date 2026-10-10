import React, { useState } from 'react';
import { X, FolderPlus, Layers, Building2, FileText, CheckCircle2, Globe } from 'lucide-react';
import { ALL_PROFILES } from '../data/bookData';
import { BusquedaComercial, NivelIngles, VacancyRequisitos } from '../types';

const POPULAR_COUNTRIES = ['Colombia', 'México', 'Argentina', 'Chile', 'Perú', 'Uruguay', 'Costa Rica'];

interface CreateBusquedaModalProps {
  onClose: () => void;
  onCreate: (busqueda: BusquedaComercial) => void;
  usuarioId: string;
}

export const CreateBusquedaModal: React.FC<CreateBusquedaModalProps> = ({
  onClose,
  onCreate,
  usuarioId
}) => {
  const [nombre, setNombre] = useState('');
  const [clienteEmpresa, setClienteEmpresa] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [perfilBookId, setPerfilBookId] = useState('');

  // Requisitos base editables
  const [experienciaMinimaAnos, setExperienciaMinimaAnos] = useState(3);
  const [nivelInglesMinimo, setNivelInglesMinimo] = useState<NivelIngles>('B2');
  const [modalidad, setModalidad] = useState('Remoto');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['Colombia', 'México', 'Argentina']);

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev => 
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    );
  };

  const [errorNombre, setErrorNombre] = useState('');

  // Handle profile selection to autofill description/skills
  const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setPerfilBookId(pId);
    if (pId) {
      const selectedProf = ALL_PROFILES.find(p => p.id === pId);
      if (selectedProf) {
        if (!nombre) setNombre(`${selectedProf.nombre} para ${clienteEmpresa || 'Cliente'}`);
        if (!descripcion) setDescripcion(selectedProf.descripcion);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorNombre('Search title is required.');
      return;
    }

    const selectedProf = ALL_PROFILES.find(p => p.id === perfilBookId);

    const newBusqueda: BusquedaComercial = {
      id: `BUSQ-${Math.floor(100 + Math.random() * 900)}`,
      usuarioId,
      nombre: nombre.trim(),
      clienteEmpresa: clienteEmpresa.trim() || undefined,
      descripcion: descripcion.trim() || 'Commercial search open for candidate evaluation.',
      perfilBookId: perfilBookId || undefined,
      perfilNombre: selectedProf?.nombre || undefined,
      fechaCreacion: new Date().toISOString().split('T')[0],
      requisitos: {
        experienciaMinimaAnos,
        nivelInglesMinimo,
        modalidad,
        ubicacionRequerida: selectedCountries.length > 0 ? selectedCountries.join(', ') : 'Latin America / Remote',
        habilidadesIndispensables: selectedProf ? selectedProf.habilidades.slice(0, 3) : ['Communication', 'Problem Solving'],
        habilidadesDeseables: selectedProf ? selectedProf.habilidades.slice(3, 6) : ['Proactivity']
      },
      candidatosVinculados: []
    };

    onCreate(newBusqueda);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full my-8 p-6 sm:p-7 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold text-[#007685] bg-[#007685]/10 px-2 py-0.5 rounded">
                Sales Management
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Create New Talent Search
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Register a client opening to link candidates and evaluate suitability.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs">
          {/* Nombre (Obligatorio) */}
          <div>
            <label htmlFor="nombre" className="block font-bold text-slate-800 mb-1">
              Search Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="nombre"
              type="text"
              required
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errorNombre) setErrorNombre('');
              }}
              placeholder="e.g.: Senior Frontend Engineer for Fintech"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#20BFD0]/40 focus:border-[#007685]"
            />
            {errorNombre && (
              <p className="text-[11px] text-rose-600 mt-1">{errorNombre}</p>
            )}
          </div>

          {/* Cliente o Empresa (Opcional) */}
          <div>
            <label htmlFor="cliente" className="block font-bold text-slate-800 mb-1">
              Client or Company <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="cliente"
                type="text"
                value={clienteEmpresa}
                onChange={(e) => setClienteEmpresa(e.target.value)}
                placeholder="e.g.: Santander Bank, Nexus Corp, etc."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#20BFD0]/40 focus:border-[#007685]"
              />
            </div>
          </div>

          {/* Perfil del Book (Opcional) */}
          <div>
            <label htmlFor="perfil" className="block font-bold text-slate-800 mb-1">
              Talent Book Benchmark Profile <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <select
                id="perfil"
                value={perfilBookId}
                onChange={handleProfileChange}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#20BFD0]/40 focus:border-[#007685]"
              >
                <option value="">-- No default profile from Book --</option>
                {ALL_PROFILES.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.familia}] {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Selecting a profile pre-configures suggested skills and initial requirements.
            </p>
          </div>

          {/* Descripción de la necesidad */}
          <div>
            <label htmlFor="descripcion" className="block font-bold text-slate-800 mb-1">
              Requirement Description
            </label>
            <textarea
              id="descripcion"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe core responsibilities, client context, schedule, or specific technical criteria..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#20BFD0]/40 focus:border-[#007685]"
            />
          </div>

          {/* Requisitos iniciales (años, inglés, modalidad) */}
          <div className="p-3 bg-[#F5F5F6] border border-slate-200 rounded-xl space-y-3">
            <span className="font-bold text-slate-700 block">
              Initial Requirement Parameters
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-600 text-[11px] font-medium mb-1">
                  Minimum experience
                </label>
                <select
                  value={experienciaMinimaAnos}
                  onChange={(e) => setExperienciaMinimaAnos(Number(e.target.value))}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-xs"
                >
                  <option value={1}>1 year</option>
                  <option value={2}>2 years</option>
                  <option value={3}>3 years</option>
                  <option value={4}>4 years</option>
                  <option value={5}>5+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 text-[11px] font-medium mb-1">
                  English proficiency
                </label>
                <select
                  value={nivelInglesMinimo}
                  onChange={(e) => setNivelInglesMinimo(e.target.value as NivelIngles)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-xs"
                >
                  <option value="Sin información">Not required</option>
                  <option value="B1">B1 (Intermediate)</option>
                  <option value="B2">B2 (Professional)</option>
                  <option value="C1">C1 (Advanced)</option>
                  <option value="C2">C2 (Native bilingual)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 text-[11px] font-medium mb-1">
                  Modality
                </label>
                <select
                  value={modalidad}
                  onChange={(e) => setModalidad(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-xs"
                >
                  <option value="Remoto">100% Remote</option>
                  <option value="Híbrido">Hybrid</option>
                  <option value="Presencial">On-site</option>
                </select>
              </div>
            </div>

            {/* Países Objetivo (Selección Múltiple con pills) */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-slate-700 font-bold text-[11px] mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#007685]" />
                <span>Target talent countries (Multi-select)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_COUNTRIES.map(country => {
                  const isSelected = selectedCountries.includes(country);
                  return (
                    <button
                      key={country}
                      type="button"
                      onClick={() => toggleCountry(country)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#007685] text-white shadow-2xs'
                          : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {isSelected ? `✓ ${country}` : country}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-blue-50/70 p-2.5 rounded-lg border border-blue-200/80">
            Sales Note: A commercial search can be created without an official vacancy or Service Order ID. The Service Order is required only when exporting shortlists to CEIPAL.
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-[#007685] hover:bg-[#005d69] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Create search</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
