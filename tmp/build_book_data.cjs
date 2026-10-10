const fs = require('fs');

// We define the families and brief descriptions for each family
const FAMILY_DESCRIPTIONS = {
  "Administración": "Soporte ejecutivo, gestión de expedientes, asistencia virtual, operaciones de oficina y administración financiera.",
  "Cobranzas": "Gestión de cartera vencida, recuperación de deuda, negociación de pagos y calidad en cobranzas.",
  "Finanzas y contabilidad": "Contabilidad general, análisis financiero, auditoría, impuestos, cuentas por pagar y cobrar y nómina.",
  "Legal": "Gestión de casos y expedientes, prelitigio, intake de clientes, inmigración y registros médicos.",
  "Marketing": "Marketing digital y performance, redes sociales, contenido, diseño, desarrollo comercial y dibujo técnico.",
  "Operaciones": "Mejora continua, implementación de procesos, supervisión operativa, transporte y mantenimiento de instalaciones.",
  "Otros perfiles": "Servicios especializados de interpretación médica y legal bilingüe.",
  "Programación y agendas": "Coordinación diaria de agendas, programación de asignaciones médicas y soporte operativo.",
  "Salud": "Atención y navegación al paciente, coordinación clínica, autorizaciones de seguros y datos clínicos.",
  "Servicio al cliente": "Atención omnicanal, soporte de cuentas, gestión de reservas, despacho y coordinación de servicios.",
  "Talento humano": "Atracción de talento, reclutamiento y selección, sourcing activo y operaciones de recursos humanos.",
  "Tecnología": "Desarrollo de software frontend, backend y full stack, DevOps, nube, IA, analítica de datos y soporte TI.",
  "Ventas": "Desarrollo comercial outbound e inbound, prospección B2B, venta consultiva, dirección y cierre comercial."
};

const FAMILY_IDS = {
  "Administración": "FAM-ADM",
  "Cobranzas": "FAM-COB",
  "Finanzas y contabilidad": "FAM-FIN",
  "Legal": "FAM-LEG",
  "Marketing": "FAM-MKT",
  "Operaciones": "FAM-OPS",
  "Otros perfiles": "FAM-OTR",
  "Programación y agendas": "FAM-PRG",
  "Salud": "FAM-SAL",
  "Servicio al cliente": "FAM-SAC",
  "Talento humano": "FAM-TH",
  "Tecnología": "FAM-TEC",
  "Ventas": "FAM-VEN"
};

const rawText = fs.readFileSync('/tmp/raw_input.txt', 'utf8');

// Parse text line by line
const lines = rawText.split('\n');

const familiesMap = new Map();

let currentFamily = "";
let currentSpecialty = "";
let currentProfile = null;

// Known Families in this exact document
const KNOWN_FAMILIES = [
  "Administración",
  "Cobranzas",
  "Finanzas y contabilidad",
  "Legal",
  "Marketing",
  "Operaciones",
  "Otros perfiles",
  "Programación y agendas",
  "Salud",
  "Servicio al cliente",
  "Talento humano",
  "Tecnología",
  "Ventas"
];

let i = 0;
while (i < lines.length) {
  let line = lines[i].trim();

  if (!line || line.startsWith("BORRADOR:") || line.startsWith("Book de perfiles ocupacionales")) {
    i++;
    continue;
  }

  // Check if line matches a known family exactly
  const matchedFamily = KNOWN_FAMILIES.find(f => f.toLowerCase() === line.toLowerCase());
  if (matchedFamily) {
    currentFamily = matchedFamily;
    currentSpecialty = "";
    i++;
    continue;
  }

  // If we see "ID: perfil-..."
  if (line.startsWith("ID:")) {
    // The previous line was the profile title!
    // But wait, what if currentSpecialty was not set?
    // Let's handle by looking at the structure.
    i++;
    continue;
  }

  i++;
}

console.log("Parsing test complete");
