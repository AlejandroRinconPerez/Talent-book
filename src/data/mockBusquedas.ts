import seed from './busquedas.seed.json';
import { BusquedaComercial, ServiceOrderSimulada, Usuario } from '../types';

export const DEMO_USER: Usuario = {
  id: 'USR-001',
  nombre: 'Carlos Morales',
  email: 'carlos.morales@talentbook.com',
  rol: 'Senior Talent Partner',
  departamento: 'Sales & Commercial Solutions'
};

/** Service orders the simulated CEIPAL knows about (plus any SO-nnnnn pattern). */
export const MOCK_SERVICE_ORDERS: ServiceOrderSimulada[] = [
  { id: 'SO-99214', cliente: 'Fintech Global Bank', posicion: 'Senior Frontend Engineer (React/TypeScript)', estado: 'Open', fechaRequerimiento: '2026-09-15', vacantesDisponibles: 3 },
  { id: 'SO-88301', cliente: 'Andean Retail Corp', posicion: 'Accounting & Reconciliation Analyst', estado: 'Open', fechaRequerimiento: '2026-09-28', vacantesDisponibles: 2 },
  { id: 'SO-77405', cliente: 'Nexus Corp Latin America', posicion: 'Bilingual Executive Assistant (C1)', estado: 'Open', fechaRequerimiento: '2026-10-01', vacantesDisponibles: 1 },
  { id: 'SO-12003', cliente: 'Southern Logistics Operations', posicion: 'Billing & Accounts Receivable Coordinator', estado: 'In progress', fechaRequerimiento: '2026-08-20', vacantesDisponibles: 2 },
  { id: 'SO-45120', cliente: 'Sunrise Health Partners', posicion: 'Medical Biller & Coder', estado: 'Open', fechaRequerimiento: '2026-10-05', vacantesDisponibles: 3 }
];

/**
 * Seed searches (sample data) loaded on first run and after "Reset demo data".
 * Client names are fictional.
 */
export const INITIAL_BUSQUEDAS: BusquedaComercial[] = seed as BusquedaComercial[];
