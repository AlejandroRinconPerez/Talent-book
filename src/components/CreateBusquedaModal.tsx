import React, { useRef, useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { ALL_PROFILES } from '../data/bookData';
import { PROFILE_BY_ID } from '../data/indexes';
import { BusquedaComercial, NivelIngles } from '../types';
import { Button } from './ui/Button';
import { Field } from './ui/Field';
import { Modal } from './ui/Modal';
import { todayIso } from '../utils/format';

const POPULAR_COUNTRIES = ['Colombia', 'México', 'Argentina', 'Chile', 'Perú', 'Uruguay', 'Costa Rica'];

interface CreateBusquedaModalProps {
  onClose: () => void;
  onCreate: (busqueda: BusquedaComercial) => void;
  usuarioId: string;
}

export const CreateBusquedaModal: React.FC<CreateBusquedaModalProps> = ({ onClose, onCreate, usuarioId }) => {
  const [nombre, setNombre] = useState('');
  const [clienteEmpresa, setClienteEmpresa] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [perfilBookId, setPerfilBookId] = useState('');

  // Base editable requirements
  const [experienciaMinimaAnos, setExperienciaMinimaAnos] = useState(3);
  const [nivelInglesMinimo, setNivelInglesMinimo] = useState<NivelIngles>('B2');
  const [modalidad, setModalidad] = useState('Remoto');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['Colombia', 'México', 'Argentina']);

  const [errorNombre, setErrorNombre] = useState('');
  const nombreRef = useRef<HTMLInputElement>(null);

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev => (prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]));
  };

  // Selecting a Book profile pre-fills the title and description
  const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setPerfilBookId(pId);
    if (!pId) return;
    const selectedProf = PROFILE_BY_ID.get(pId);
    if (!selectedProf) return;
    if (!nombre) setNombre(`${selectedProf.nombre} for ${clienteEmpresa || 'client'}`);
    if (!descripcion) setDescripcion(selectedProf.descripcion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorNombre('Give the search a title, for example the role and the client.');
      nombreRef.current?.focus();
      return;
    }

    const selectedProf = PROFILE_BY_ID.get(perfilBookId);
    const now = new Date().toISOString();

    onCreate({
      id: `BUSQ-${Math.floor(100 + Math.random() * 900)}`,
      usuarioId,
      nombre: nombre.trim(),
      clienteEmpresa: clienteEmpresa.trim() || undefined,
      descripcion: descripcion.trim() || 'Commercial search open for candidate evaluation.',
      perfilBookId: perfilBookId || undefined,
      perfilNombre: selectedProf?.nombre || undefined,
      fechaCreacion: todayIso(),
      estado: 'abierta',
      actualizadoEn: now,
      actividad: [{ fecha: now, tipo: 'creada', detalle: `Created${clienteEmpresa.trim() ? ` for ${clienteEmpresa.trim()}` : ''}.` }],
      requisitos: {
        experienciaMinimaAnos,
        nivelInglesMinimo,
        modalidad,
        ubicacionRequerida: selectedCountries.length > 0 ? selectedCountries.join(', ') : 'Latin America / Remote',
        habilidadesIndispensables: selectedProf ? selectedProf.habilidades.slice(0, 3) : ['Communication', 'Problem solving'],
        habilidadesDeseables: selectedProf ? selectedProf.habilidades.slice(3, 6) : ['Proactivity']
      },
      candidatosVinculados: []
    });
  };

  return (
    <Modal
      title="New search"
      description="Register a client requirement so you can link candidates and evaluate their fit."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-search-form" variant="primary" icon={<FolderPlus className="size-4" />}>
            Create search
          </Button>
        </>
      }
    >
      <form id="create-search-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field id="nombre" label="Title" error={errorNombre}>
          <input
            ref={nombreRef}
            type="text"
            name="title"
            autoComplete="off"
            required
            value={nombre}
            onChange={e => {
              setNombre(e.target.value);
              if (errorNombre) setErrorNombre('');
            }}
            placeholder="Senior Frontend Engineer for Fintech Global Bank"
            className="input"
          />
        </Field>

        <Field id="cliente" label="Client" optional>
          <input
            type="text"
            name="organization"
            autoComplete="organization"
            value={clienteEmpresa}
            onChange={e => setClienteEmpresa(e.target.value)}
            placeholder="Company name"
            className="input"
          />
        </Field>

        <Field id="perfil" label="Book profile" optional hint="Pre-fills the description and suggested skills.">
          <select value={perfilBookId} onChange={handleProfileChange} className="input select">
            <option value="">No profile</option>
            {ALL_PROFILES.map(p => (
              <option key={p.id} value={p.id}>
                {p.familia}: {p.nombre}
              </option>
            ))}
          </select>
        </Field>

        <Field id="descripcion" label="Requirement" optional>
          <textarea
            rows={3}
            name="description"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Responsibilities, client context, schedule or specific technical criteria…"
            className="input textarea"
          />
        </Field>

        <div className="border-t border-rule pt-5">
          <h3 className="mb-4 text-base font-semibold">Initial criteria</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field id="new-exp" label="Minimum experience">
              <select value={experienciaMinimaAnos} onChange={e => setExperienciaMinimaAnos(Number(e.target.value))} className="input select">
                <option value={1}>1 year</option>
                <option value={2}>2 years</option>
                <option value={3}>3 years</option>
                <option value={4}>4 years</option>
                <option value={5}>5+ years</option>
              </select>
            </Field>

            <Field id="new-english" label="Minimum English">
              <select value={nivelInglesMinimo} onChange={e => setNivelInglesMinimo(e.target.value as NivelIngles)} className="input select">
                <option value="Sin información">Not required</option>
                <option value="B1">B1, intermediate</option>
                <option value="B2">B2, professional</option>
                <option value="C1">C1, advanced</option>
                <option value="C2">C2, bilingual</option>
              </select>
            </Field>

            <Field id="new-modality" label="Work mode">
              <select value={modalidad} onChange={e => setModalidad(e.target.value)} className="input select">
                <option value="Remoto">Remote</option>
                <option value="Híbrido">Hybrid</option>
                <option value="Presencial">On-site</option>
              </select>
            </Field>
          </div>

          <fieldset className="mt-4">
            <legend className="label">Target countries</legend>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_COUNTRIES.map(country => (
                <button key={country} type="button" className="pill" aria-pressed={selectedCountries.includes(country)} onClick={() => toggleCountry(country)}>
                  {country}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <p className="text-[13px] text-ink-3">
          A search does not need a CEIPAL service order to exist. You will be asked for one only when you export a shortlist.
        </p>
      </form>
    </Modal>
  );
};
