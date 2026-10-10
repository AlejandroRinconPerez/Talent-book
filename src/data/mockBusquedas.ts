import { BusquedaComercial, ServiceOrderSimulada, Usuario } from '../types';

export const DEMO_USER: Usuario = {
  id: "USR-001",
  nombre: "Carlos Morales",
  email: "carlos.morales@talentbook.com",
  rol: "Senior Talent Partner",
  departamento: "Sales & Commercial Solutions"
};

export const MOCK_SERVICE_ORDERS: ServiceOrderSimulada[] = [
  {
    id: "SO-99214",
    cliente: "Fintech Global Bank",
    posicion: "Senior Frontend Engineer (React/TypeScript)",
    estado: "Open",
    fechaRequerimiento: "2026-09-15",
    vacantesDisponibles: 3
  },
  {
    id: "SO-88301",
    cliente: "Andean Retail Corp",
    posicion: "Accounting & Reconciliation Analyst",
    estado: "Open",
    fechaRequerimiento: "2026-09-28",
    vacantesDisponibles: 2
  },
  {
    id: "SO-77405",
    cliente: "Nexus Corp Latin America",
    posicion: "Bilingual Executive Assistant (C1)",
    estado: "Open",
    fechaRequerimiento: "2026-10-01",
    vacantesDisponibles: 1
  },
  {
    id: "SO-12003",
    cliente: "Southern Logistics Operations",
    posicion: "Billing & Accounts Receivable Coordinator",
    estado: "In progress",
    fechaRequerimiento: "2026-08-20",
    vacantesDisponibles: 2
  }
];

export const INITIAL_BUSQUEDAS: BusquedaComercial[] = [
  {
    id: "BUSQ-101",
    usuarioId: "USR-001",
    nombre: "Senior Frontend Developer - React & TypeScript",
    clienteEmpresa: "Fintech Global Bank",
    descripcion: "Professional with 4+ years of experience in modern web development using React, TypeScript, and Tailwind CSS for high-concurrency banking platform. 100% remote.",
    perfilBookId: "perfil-tec-fe01",
    perfilNombre: "Frontend Developer (React / TypeScript)",
    fechaCreacion: "2026-10-02",
    requisitos: {
      experienciaMinimaAnos: 4,
      nivelInglesMinimo: "B2",
      modalidad: "Remote",
      ubicacionRequerida: "LATAM (Any)",
      habilidadesIndispensables: ["React", "TypeScript", "Tailwind CSS"],
      habilidadesDeseables: ["Next.js", "Docker", "Jest", "GraphQL"]
    },
    candidatosVinculados: [
      {
        candidatoId: "CAN-8821",
        fechaVinculacion: "2026-10-03",
        estadoCeipal: "cargado",
        serviceOrderId: "SO-99214",
        fechaCargaCeipal: "2026-10-04"
      },
      {
        candidatoId: "CAN-4432",
        fechaVinculacion: "2026-10-03",
        estadoCeipal: "no_cargado"
      },
      {
        candidatoId: "CAN-3019",
        fechaVinculacion: "2026-10-05",
        estadoCeipal: "no_cargado"
      }
    ]
  },
  {
    id: "BUSQ-102",
    usuarioId: "USR-001",
    nombre: "Bilingual Executive Assistant to VP",
    clienteEmpresa: "Nexus Corp Latin America",
    descripcion: "Direct executive support for Regional VP: global calendar control, executive meeting coordination, minute drafting, and complex travel planning in fluent English.",
    perfilBookId: "perfil-6bd3e7ebb76c",
    perfilNombre: "Executive Administrative Assistant",
    fechaCreacion: "2026-10-04",
    requisitos: {
      experienciaMinimaAnos: 3,
      nivelInglesMinimo: "C1",
      modalidad: "Hybrid",
      ubicacionRequerida: "Bogotá, Colombia",
      habilidadesIndispensables: ["calendar management", "travel coordination", "executive support"],
      habilidadesDeseables: ["Microsoft Office", "business writing", "confidentiality"]
    },
    candidatosVinculados: [
      {
        candidatoId: "CAN-5512",
        fechaVinculacion: "2026-10-05",
        estadoCeipal: "no_cargado"
      },
      {
        candidatoId: "CAN-9104",
        fechaVinculacion: "2026-10-05",
        estadoCeipal: "no_cargado"
      }
    ]
  },
  {
    id: "BUSQ-103",
    usuarioId: "USR-001",
    nombre: "Collections & Portfolio Recovery Analyst",
    clienteEmpresa: "Andean Retail Corp",
    descripcion: "Early-stage and write-off portfolio management, client outbound calls, and payment reconciliation in enterprise ERP.",
    perfilBookId: "perfil-238ac2a7fe61",
    perfilNombre: "Collections Specialist (AR Monitoring)",
    fechaCreacion: "2026-10-06",
    requisitos: {
      experienciaMinimaAnos: 2,
      nivelInglesMinimo: "Not specified",
      modalidad: "On-site",
      ubicacionRequerida: "Lima, Peru",
      habilidadesIndispensables: ["phone collections", "portfolio management", "negotiation"],
      habilidadesDeseables: ["Intermediate Excel", "SAP", "customer service"]
    },
    candidatosVinculados: [
      {
        candidatoId: "CAN-7741",
        fechaVinculacion: "2026-10-06",
        estadoCeipal: "cargado",
        serviceOrderId: "SO-88301",
        fechaCargaCeipal: "2026-10-06"
      }
    ]
  }
];
