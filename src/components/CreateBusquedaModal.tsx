import React, { useRef, useState } from 'react';
import { FolderPlus, Sparkles } from 'lucide-react';
import { FAMILIAS_DATA, specialtyKey } from '../data/bookData';
import { SPECIALTY_BY_KEY } from '../data/indexes';
import { BusquedaComercial, NivelIngles } from '../types';
import { DetectedRequirement, FILTER_LABEL, Modalidad, isCefr, parseRequirement } from '../services/candidateSearch';
import { Button } from './ui/Button';
import { Field } from './ui/Field';
import { Modal } from './ui/Modal';
import { EnglishMinimumOptions, ModalityOptions } from './shared/searchControls';
import { todayIso } from '../utils/format';

/** Countries as the candidate records spell them, so a search's location lines up with the pool. */
const POPULAR_COUNTRIES = ['Colombia', 'Mexico', 'Argentina', 'Chile', 'Peru', 'Costa Rica', 'Guatemala', 'Dominican Republic', 'Ecuador'];

const EXPERIENCE_YEARS = [1, 2, 3, 4, 5, 6, 8, 10];

interface CreateBusquedaModalProps {
  onClose: () => void;
  onCreate: (busqueda: BusquedaComercial) => void;
  usuarioId: string;
}

export const CreateBusquedaModal: React.FC<CreateBusquedaModalProps> = ({ onClose, onCreate, usuarioId }) => {
  const [nombre, setNombre] = useState('');
  const [clienteEmpresa, setClienteEmpresa] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [especialidadKey, setEspecialidadKey] = useState('');

  // Base editable requirements. English and experience are minimums.
  const [experienciaMinimaAnos, setExperienciaMinimaAnos] = useState(3);
  const [nivelInglesMinimo, setNivelInglesMinimo] = useState<NivelIngles>('B2');
  const [modalidad, setModalidad] = useState<Modalidad>('Remote');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['Colombia', 'Mexico', 'Argentina']);
  const [readFromText, setReadFromText] = useState<DetectedRequirement[] | null>(null);

  const [errorNombre, setErrorNombre] = useState('');
  const nombreRef = useRef<HTMLInputElement>(null);

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev => (prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]));
  };

  // Selecting a Book specialty pre-fills the title and description
  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setEspecialidadKey(key);
    const specialty = SPECIALTY_BY_KEY.get(key);
    if (!specialty) return;
    if (!nombre) setNombre(`${specialty.nombre} for ${clienteEmpresa || 'client'}`);
    if (!descripcion) setDescripcion(specialty.descripcion);
  };

  /** Fills the criteria with whatever the requirement text states; what it does not state stays as it was. */
  const handleReadCriteria = () => {
    const { filtros, detectados } = parseRequirement(descripcion);
    if (filtros.experienciaMinima) setExperienciaMinimaAnos(filtros.experienciaMinima);
    if (filtros.inglesMinimo) setNivelInglesMinimo(filtros.inglesMinimo);
    if (filtros.modalidad) setModalidad(filtros.modalidad);
    if (filtros.paises) setSelectedCountries(filtros.paises);
    setReadFromText(detectados);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorNombre('Give the search a title, for example the role and the client.');
      nombreRef.current?.focus();
      return;
    }

    const specialty = SPECIALTY_BY_KEY.get(especialidadKey);
    const now = new Date().toISOString();

    onCreate({
      id: `BUSQ-${Math.floor(100 + Math.random() * 900)}`,
      usuarioId,
      nombre: nombre.trim(),
      clienteEmpresa: clienteEmpresa.trim() || undefined,
      descripcion: descripcion.trim() || 'Commercial search open for candidate evaluation.',
      especialidadKey: specialty?.key,
      especialidadNombre: specialty?.nombre,
      fechaCreacion: todayIso(),
      estado: 'abierta',
      actualizadoEn: now,
      actividad: [{ fecha: now, tipo: 'creada', detalle: `Created${clienteEmpresa.trim() ? ` for ${clienteEmpresa.trim()}` : ''}.` }],
      requisitos: {
        experienciaMinimaAnos,
        nivelInglesMinimo,
        modalidad,
        ubicacionRequerida: selectedCountries.length > 0 ? selectedCountries.join(', ') : 'Latin America / Remote',
        habilidadesIndispensables: specialty ? specialty.habilidades.slice(0, 3) : ['Communication', 'Problem solving'],
        habilidadesDeseables: specialty ? specialty.habilidades.slice(3, 6) : ['Proactivity']
      },
      candidatosVinculados: []
    });
  };

  const experienceSteps = EXPERIENCE_YEARS.includes(experienciaMinimaAnos) ? EXPERIENCE_YEARS : [...EXPERIENCE_YEARS, experienciaMinimaAnos].sort((a, b) => a - b);

  return (
    <Modal
      title="New search"
      description="Register a client requirement so you can find candidates, link them and evaluate their fit."
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

        <Field id="especialidad" label="Book specialty" optional hint="Pre-fills the description and suggested skills.">
          <select value={especialidadKey} onChange={handleSpecialtyChange} className="input select">
            <option value="">No specialty</option>
            {FAMILIAS_DATA.map(f => (
              <optgroup key={f.id} label={f.nombre}>
                {f.especialidades.map(s => (
                  <option key={s.nombre} value={specialtyKey(f.id, s.nombre)}>
                    {s.nombre}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>

        <div>
          <Field id="descripcion" label="Requirement" optional hint="Paste what the client sent. It is also the text the candidate search runs with.">
            <textarea
              rows={4}
              name="description"
              value={descripcion}
              onChange={e => {
                setDescripcion(e.target.value);
                setReadFromText(null);
              }}
              placeholder="Accountant for month-end close and bank reconciliations, English B2, 3+ years, remote from Colombia or Mexico…"
              className="input textarea"
            />
          </Field>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]" aria-live="polite">
            <Button size="sm" icon={<Sparkles className="size-4" />} onClick={handleReadCriteria} disabled={!descripcion.trim()}>
              Read criteria from the text
            </Button>
            {readFromText === null ? null : readFromText.length === 0 ? (
              <span className="text-ink-3">No English level, years, country or work mode found in the text.</span>
            ) : (
              <span className="text-ink-2">
                Filled in: {readFromText.map(d => `${FILTER_LABEL[d.field]} ${d.label}`).join(', ')}. Review below.
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-rule pt-5">
          <h3 className="mb-4 text-base font-semibold">Initial criteria</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field id="new-exp" label="Minimum experience">
              <select value={experienciaMinimaAnos} onChange={e => setExperienciaMinimaAnos(Number(e.target.value))} className="input select">
                {experienceSteps.map(n => (
                  <option key={n} value={n}>
                    {n === 1 ? '1 year or more' : `${n} years or more`}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="new-english" label="Minimum English">
              <select value={isCefr(nivelInglesMinimo) ? nivelInglesMinimo : ''} onChange={e => setNivelInglesMinimo((e.target.value || 'Sin información') as NivelIngles)} className="input select">
                <EnglishMinimumOptions />
              </select>
            </Field>

            <Field id="new-modality" label="Work mode">
              <select value={modalidad} onChange={e => setModalidad(e.target.value as Modalidad)} className="input select">
                <ModalityOptions withAny={false} />
              </select>
            </Field>
          </div>

          <fieldset className="mt-4">
            <legend className="label">Target countries</legend>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(new Set([...POPULAR_COUNTRIES, ...selectedCountries])).map(country => (
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
