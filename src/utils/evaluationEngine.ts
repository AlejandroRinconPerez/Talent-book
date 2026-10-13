import { Candidato, Vacancy, EvaluacionCandidato, ItemEvaluacion, NivelIngles, DimensionPuntaje } from '../types';

/**
 * Points each dimension contributes to the 0-100 fit score. Must-have skills carry
 * the most weight because they are what the client actually screens on; nice-to-haves
 * can only round the number up.
 */
export const PESOS_PUNTAJE = {
  habilidadesClave: 40,
  experiencia: 20,
  ingles: 20,
  modalidad: 10,
  habilidadesDeseables: 10
} as const;

const INGLES_RANK: Record<string, number> = {
  'A1': 1,
  'A2': 2,
  'B1': 3,
  'B2': 4,
  'C1': 5,
  'C2': 6,
  'Not specified': 0,
  'Sin información': 0
};

export const SAMPLE_VACANCIES: Vacancy[] = [
  {
    titulo: "Senior Frontend Developer (React & TypeScript) - Remote",
    descripcion: "We are seeking a Frontend Engineer with at least 4 years of experience building interactive web applications with React, TypeScript, and Tailwind CSS. The role requires B2 or higher English communication with distributed North American teams.",
    cliente: "Tech Client (Fintech / E-Commerce)",
    requisitos: {
      experienciaMinimaAnos: 4,
      nivelInglesMinimo: 'B2',
      ubicacionRequerida: 'Any (Latin America)',
      modalidad: 'Remote',
      habilidadesIndispensables: ['React.js', 'TypeScript', 'Tailwind CSS'],
      habilidadesDeseables: ['Next.js', 'State Management', 'Git']
    }
  },
  {
    titulo: "Bilingual Executive Assistant to C-Level",
    descripcion: "Bilingual Executive Assistant for high-complexity corporate schedule management, international calls, itinerary planning, and board meeting minutes. Requires C1 or C2 English proficiency.",
    cliente: "International Investment Firm",
    requisitos: {
      experienciaMinimaAnos: 5,
      nivelInglesMinimo: 'C1',
      ubicacionRequerida: 'Latin America',
      modalidad: 'Remote',
      habilidadesIndispensables: ['Google Calendar', 'Executive Writing', 'Confidentiality Management'],
      habilidadesDeseables: ['Travel Planning', 'Microsoft Outlook', 'Calendly / Acuity']
    }
  },
  {
    titulo: "Accounting & Financial Compliance Analyst (SOX / IFRS)",
    descripcion: "Accounting or audit professional with 4+ years reviewing internal controls, bank reconciliations, and preparing for external audits under IFRS / US GAAP.",
    cliente: "Regional Corporate Group",
    requisitos: {
      experienciaMinimaAnos: 4,
      nivelInglesMinimo: 'B1',
      ubicacionRequerida: 'Colombia / Peru / Mexico',
      modalidad: 'Hybrid',
      habilidadesIndispensables: ['IFRS / US GAAP', 'Bank Reconciliations', 'SAP ERP'],
      habilidadesDeseables: ['SOX Audit', 'COSO Framework', 'Financial Excel']
    }
  }
];

export function evaluarCandidatoConVacante(candidato: Candidato, vacancy: Vacancy): EvaluacionCandidato {
  const req = vacancy.requisitos;
  const cumplidos: ItemEvaluacion[] = [];
  const brechas: ItemEvaluacion[] = [];
  const porValidar: ItemEvaluacion[] = [];
  const dimensiones: DimensionPuntaje[] = [];

  // 1. Experience Evaluation
  const ratioExperiencia =
    req.experienciaMinimaAnos <= 0 ? 1 : Math.min(1, candidato.experienciaAnos / req.experienciaMinimaAnos);
  dimensiones.push({
    criterio: 'Experience',
    peso: PESOS_PUNTAJE.experiencia,
    obtenido: PESOS_PUNTAJE.experiencia * ratioExperiencia,
    detalle: `${candidato.experienciaTexto} against a ${req.experienciaMinimaAnos}-year minimum.`
  });

  if (candidato.experienciaAnos >= req.experienciaMinimaAnos) {
    cumplidos.push({
      criterio: `Relevant experience (${req.experienciaMinimaAnos}+ years)`,
      estado: 'meets',
      detalle: `Candidate has ${candidato.experienciaTexto} of verified experience, surpassing the required minimum of ${req.experienciaMinimaAnos} years.`
    });
  } else {
    brechas.push({
      criterio: `Required experience (${req.experienciaMinimaAnos}+ years)`,
      estado: 'gap',
      detalle: `Candidate has ${candidato.experienciaTexto}, presenting a gap of ${req.experienciaMinimaAnos - candidato.experienciaAnos} year(s) compared to the target benchmark.`
    });
  }

  // 2. English Level Evaluation
  if (candidato.nivelIngles === 'Sin información' || candidato.nivelIngles === 'Not specified') {
    // No level on file: left out of the score entirely rather than counted as a zero,
    // so an unassessed candidate is not ranked below one we know falls short.
    porValidar.push({
      criterio: `English proficiency (${req.nivelInglesMinimo}+ required)`,
      estado: 'pending',
      detalle: `No certified level recorded in initial file. An oral fluency assessment during the first screening call is required.`
    });
  } else {
    const candidateRank = INGLES_RANK[candidato.nivelIngles] || 0;
    const reqRank = INGLES_RANK[req.nivelInglesMinimo] || 0;

    // One CEFR level short still carries most of the weight; three or more carries none.
    const faltante = Math.max(0, reqRank - candidateRank);
    const factorIngles = [1, 0.6, 0.3][faltante] ?? 0;
    dimensiones.push({
      criterio: 'English',
      peso: PESOS_PUNTAJE.ingles,
      obtenido: PESOS_PUNTAJE.ingles * factorIngles,
      detalle: `${candidato.nivelIngles} against a ${req.nivelInglesMinimo} minimum.`
    });

    if (candidateRank >= reqRank) {
      cumplidos.push({
        criterio: `English level (${req.nivelInglesMinimo}+)`,
        estado: 'meets',
        detalle: `Certified at level ${candidato.nivelIngles}, aligning with operational requirement ${req.nivelInglesMinimo}.`
      });
    } else {
      brechas.push({
        criterio: `English level (${req.nivelInglesMinimo}+)`,
        estado: 'gap',
        detalle: `Certified at level ${candidato.nivelIngles}, which is below the ${req.nivelInglesMinimo} level needed for daily client interaction.`
      });
    }
  }

  // 3. Work Mode & Location
  const candModLower = candidato.modalidad.toLowerCase();
  const reqModLower = req.modalidad.toLowerCase();
  const isMatch = reqModLower.includes('remot') || candModLower === reqModLower || 
    (candModLower.includes('remot') && reqModLower.includes('remot')) ||
    (candModLower.includes('híbrid') && reqModLower.includes('hybrid')) ||
    (candModLower.includes('hybrid') && reqModLower.includes('hybrid'));

  dimensiones.push({
    criterio: 'Work arrangement',
    peso: PESOS_PUNTAJE.modalidad,
    obtenido: isMatch ? PESOS_PUNTAJE.modalidad : 0,
    detalle: `${candidato.modalidad} against ${req.modalidad}.`
  });

  if (isMatch) {
    cumplidos.push({
      criterio: `Work arrangement (${req.modalidad})`,
      estado: 'meets',
      detalle: `Candidate operates in ${candidato.modalidad} arrangement from ${candidato.ciudad}, ${candidato.pais}.`
    });
  } else {
    brechas.push({
      criterio: `Required work arrangement (${req.modalidad})`,
      estado: 'gap',
      detalle: `Position requires ${req.modalidad} schedule, whereas candidate currently prefers ${candidato.modalidad}.`
    });
  }

  // 4. Must-have skills
  const candSkillsNormalized = candidato.habilidades.map(h => h.toLowerCase());

  let indispensablesCubiertas = 0;
  req.habilidadesIndispensables.forEach(hReq => {
    const match = candSkillsNormalized.some(cs => cs.includes(hReq.toLowerCase()) || hReq.toLowerCase().includes(cs));
    if (match) {
      indispensablesCubiertas += 1;
      cumplidos.push({
        criterio: `Essential skill: ${hReq}`,
        estado: 'meets',
        detalle: `Verified competence in candidate background.`
      });
    } else {
      brechas.push({
        criterio: `Essential skill: ${hReq}`,
        estado: 'gap',
        detalle: `No direct evidence in current profile for ${hReq}. Requires screening validation or ramp-up period.`
      });
    }
  });

  if (req.habilidadesIndispensables.length > 0) {
    dimensiones.push({
      criterio: 'Must-have skills',
      peso: PESOS_PUNTAJE.habilidadesClave,
      obtenido: (PESOS_PUNTAJE.habilidadesClave * indispensablesCubiertas) / req.habilidadesIndispensables.length,
      detalle: `${indispensablesCubiertas} of ${req.habilidadesIndispensables.length} evidenced in the profile.`
    });
  }

  // 5. Nice-to-have skills
  let deseablesCubiertas = 0;
  req.habilidadesDeseables.forEach(hReq => {
    const match = candSkillsNormalized.some(cs => cs.includes(hReq.toLowerCase()) || hReq.toLowerCase().includes(cs));
    if (match) {
      deseablesCubiertas += 1;
      cumplidos.push({
        criterio: `Desirable skill: ${hReq}`,
        estado: 'meets',
        detalle: `Added value: Proficient in complementary tool or methodology.`
      });
    }
  });

  if (req.habilidadesDeseables.length > 0) {
    dimensiones.push({
      criterio: 'Nice-to-have skills',
      peso: PESOS_PUNTAJE.habilidadesDeseables,
      obtenido: (PESOS_PUNTAJE.habilidadesDeseables * deseablesCubiertas) / req.habilidadesDeseables.length,
      detalle: `${deseablesCubiertas} of ${req.habilidadesDeseables.length} evidenced in the profile.`
    });
  }

  // 6. Qualitative items to validate
  porValidar.push({
    criterio: "Notice period and estimated start date",
    estado: 'pending',
    detalle: `File indicates '${candidato.disponibilidad}'. Confirm transition timeline with current employer.`
  });

  if (candidato.trayectoria.length > 0) {
    porValidar.push({
      criterio: "Technical depth in client practical scenarios",
      estado: 'pending',
      detalle: `Recommend brief technical or situational scenario regarding the account's specific architecture.`
    });
  }

  // Quantitative fit: points earned over points actually assessable, so a dimension
  // with no data on file neither inflates nor deflates the result.
  const pesoEvaluado = dimensiones.reduce((acc, d) => acc + d.peso, 0);
  const puntosObtenidos = dimensiones.reduce((acc, d) => acc + d.obtenido, 0);
  const puntaje = pesoEvaluado === 0 ? 0 : Math.round((puntosObtenidos / pesoEvaluado) * 100);

  // Qualitative Synthesis & Overall Level
  let nivelAjuste: 'High' | 'Medium' | 'Partial with gaps' = 'Medium';
  let sintesis = "";

  const cantBrechasCriticas = brechas.filter(b => b.estado === 'gap' || b.estado === 'no_cumple').length;

  if (cantBrechasCriticas === 0) {
    nivelAjuste = 'High';
    sintesis = `Outstanding match for the requested profile. Candidate fully meets experience years, required work mode, and essential competencies. We recommend advancing to initial interview to gauge team chemistry and compensation expectations.`;
  } else if (cantBrechasCriticas <= 2) {
    nivelAjuste = 'Medium';
    sintesis = `Strong competitive profile with high adaptation potential. Meets the majority of core criteria, with specific gaps or pending points to explore during technical screening.`;
  } else {
    nivelAjuste = 'Partial with gaps';
    sintesis = `Partial match relative to the job specification. Demonstrates misalignment in more than one critical criterion. Consider as an alternative candidate if client offers flexibility on requirements.`;
  }

  return {
    candidatoId: candidato.id,
    requisitosCumplidos: cumplidos,
    brechasEncontradas: brechas,
    informacionPorValidar: porValidar,
    sintesisAjuste: sintesis,
    nivelAjusteGeneral: nivelAjuste,
    puntajeAjuste: puntaje,
    desglosePuntaje: dimensiones
  };
}
