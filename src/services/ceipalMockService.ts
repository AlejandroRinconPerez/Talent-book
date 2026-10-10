import { MOCK_SERVICE_ORDERS } from '../data/mockBusquedas';
import { ServiceOrderSimulada } from '../types';

export type ValidationStatus = 
  | 'idle' // Pendiente de validación
  | 'validating' // Validando...
  | 'valid' // Service Order válido
  | 'not_found' // Service Order no encontrado
  | 'error'; // Error de validación

export interface ValidationResult {
  status: ValidationStatus;
  message?: string;
  serviceOrder?: ServiceOrderSimulada;
}

export interface CandidateUploadResult {
  candidatoId: string;
  status: 'success' | 'error' | 'already_uploaded';
  message: string;
  timestamp: string;
}

/**
 * Simulates validation of a Service Order ID against CEIPAL
 */
export async function validarServiceOrderCeipal(serviceOrderId: string): Promise<ValidationResult> {
  const cleanId = serviceOrderId.trim().toUpperCase();

  // Simulate network latency of 900ms
  await new Promise(resolve => setTimeout(resolve, 900));

  if (!cleanId) {
    return {
      status: 'error',
      message: 'The Service Order ID is required.'
    };
  }

  // Simulate connection or syntax error
  if (cleanId.includes('ERROR') || cleanId.length < 3) {
    return {
      status: 'error',
      message: 'Error connecting to CEIPAL API. Please verify the code syntax.'
    };
  }

  // Find in mock list
  const found = MOCK_SERVICE_ORDERS.find(so => so.id.toUpperCase() === cleanId);

  if (found) {
    return {
      status: 'valid',
      serviceOrder: found,
      message: `Valid Service Order: ${found.cliente} - ${found.posicion}`
    };
  }

  // Codes starting with SO- and digits are accepted as dynamic valid simulation
  const soRegex = /^SO-\d{3,6}$/i;
  if (soRegex.test(cleanId) && cleanId !== 'SO-00000') {
    const dynamicSO: ServiceOrderSimulada = {
      id: cleanId,
      cliente: 'Client Registered in CEIPAL',
      posicion: 'Active Commercial Role',
      estado: 'Open',
      fechaRequerimiento: new Date().toISOString().split('T')[0],
      vacantesDisponibles: 2
    };
    return {
      status: 'valid',
      serviceOrder: dynamicSO,
      message: `Service Order identified successfully in CEIPAL.`
    };
  }

  // Not found
  return {
    status: 'not_found',
    message: `No active requirement found with ID "${cleanId}" in CEIPAL.`
  };
}

/**
 * Simulates batch uploading of candidates to CEIPAL pipeline
 */
export async function cargarCandidatosAPipelineCeipal(
  candidatosIds: string[],
  serviceOrderId: string,
  candidatosYaCargados: string[] = []
): Promise<CandidateUploadResult[]> {
  // Simulate upload latency
  await new Promise(resolve => setTimeout(resolve, 1400));

  const now = new Date().toISOString().split('T')[0];

  return candidatosIds.map((id, index) => {
    // If already uploaded
    if (candidatosYaCargados.includes(id)) {
      return {
        candidatoId: id,
        status: 'already_uploaded',
        message: 'Candidate was already linked to this Service Order.',
        timestamp: now
      };
    }

    // Occasional test failure on 4th candidate to demonstrate retry mechanism
    if (index === 3) {
      return {
        candidatoId: id,
        status: 'error',
        message: 'Temporary failure in CEIPAL skill mapping service.',
        timestamp: now
      };
    }

    return {
      candidatoId: id,
      status: 'success',
      message: 'Successfully linked to the initial pipeline stage.',
      timestamp: now
    };
  });
}
