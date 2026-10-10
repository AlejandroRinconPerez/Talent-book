import os
import re
import json

# Concatenate all parts
parts = [f"tmp/v2_part{i}.txt" for i in range(1, 15)]
full_text = ""
for p in parts:
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            full_text += f.read() + "\n"

lines = [line.strip() for line in full_text.splitlines() if line.strip()]

FAMILY_NAMES = [
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
]

FAMILY_INFO = {
    "Administración": ("FAM-ADM", "Soporte ejecutivo, gestión de expedientes, asistencia virtual, operaciones de oficina y administración financiera."),
    "Cobranzas": ("FAM-COB", "Gestión de cartera vencida, recuperación de deuda, negociación de pagos y calidad en cobranzas."),
    "Finanzas y contabilidad": ("FAM-FIN", "Contabilidad general, análisis financiero, auditoría, impuestos, cuentas por pagar y cobrar y nómina."),
    "Legal": ("FAM-LEG", "Gestión de casos y expedientes, prelitigio, intake de clientes, inmigración y registros médicos."),
    "Marketing": ("FAM-MKT", "Marketing digital y performance, redes sociales, contenido, diseño, desarrollo comercial y dibujo técnico."),
    "Operaciones": ("FAM-OPS", "Mejora continua, implementación de procesos, supervisión operativa, transporte y mantenimiento de instalaciones."),
    "Otros perfiles": ("FAM-OTR", "Servicios especializados de interpretación médica y legal bilingüe."),
    "Programación y agendas": ("FAM-PRG", "Coordinación diaria de agendas, programación de asignaciones médicas y soporte operativo."),
    "Salud": ("FAM-SAL", "Atención y navegación al paciente, coordinación clínica, autorizaciones de seguros y datos clínicos."),
    "Servicio al cliente": ("FAM-SAC", "Atención omnicanal, soporte de cuentas, gestión de reservas, despacho y coordinación de servicios."),
    "Talento humano": ("FAM-TH", "Atracción de talento, reclutamiento y selección, sourcing activo y operaciones de recursos humanos."),
    "Tecnología": ("FAM-TEC", "Desarrollo de software frontend, backend y full stack, DevOps, nube, IA, analítica de datos y soporte TI."),
    "Ventas": ("FAM-VEN", "Desarrollo comercial outbound e inbound, prospección B2B, venta consultiva, dirección y cierre comercial.")
}

families_dict = {}
for fam in FAMILY_NAMES:
    fid, desc = FAMILY_INFO[fam]
    families_dict[fam] = {
        "id": fid,
        "nombre": fam,
        "descripcionBreve": desc,
        "especialidades": {}
    }

current_family = "Administración"
current_specialty = ""

i = 0
while i < len(lines):
    line = lines[i]

    # Check if family
    matched_fam = next((f for f in FAMILY_NAMES if f.lower() == line.lower()), None)
    if matched_fam:
        current_family = matched_fam
        current_specialty = ""
        i += 1
        continue

    # Lookahead: is line + 1 or line + 2 an "ID: perfil-" line?
    if i + 1 < len(lines) and lines[i + 1].startswith("ID: perfil-"):
        # line is profile title
        prof_title = line
        prof_id = lines[i + 1].replace("ID:", "").strip()
        i += 2
        
        desc = ""
        incluye = []
        excluye = []
        habilidades = []
        vacantes = []

        while i < len(lines) and not (
            any(f.lower() == lines[i].lower() for f in FAMILY_NAMES) or
            (i + 1 < len(lines) and lines[i + 1].startswith("ID: perfil-")) or
            (i + 2 < len(lines) and lines[i + 2].startswith("ID: perfil-"))
        ):
            subline = lines[i]
            if subline.startswith("Descripción:"):
                desc = subline.replace("Descripción:", "").strip()
            elif subline.startswith("Incluye:"):
                inc_text = subline.replace("Incluye:", "").strip()
                incluye = [c.strip() for c in re.split(r'[,;.]', inc_text) if c.strip()]
            elif subline.startswith("Excluye:"):
                exc_text = subline.replace("Excluye:", "").strip()
                excluye = [c.strip() for c in re.split(r'[,;.]', exc_text) if c.strip()]
            elif subline.startswith("Habilidades:"):
                hab_text = subline.replace("Habilidades:", "").strip()
                habilidades = [h.strip() for h in re.split(r'[,;]', hab_text) if h.strip()]
            elif subline.startswith("Vacantes de respaldo:"):
                vac_text = subline.replace("Vacantes de respaldo:", "").strip()
                vacantes = [v.strip() for v in vac_text.split(",") if v.strip()]
            i += 1

        if not current_specialty:
            current_specialty = "General"

        spec_map = families_dict[current_family]["especialidades"]
        if current_specialty not in spec_map:
            spec_map[current_specialty] = []

        # Avoid duplicates within same specialty
        if not any(p["id"] == prof_id for p in spec_map[current_specialty]):
            spec_map[current_specialty].append({
                "id": prof_id,
                "nombre": prof_title,
                "familia": current_family,
                "especialidad": current_specialty,
                "descripcion": desc,
                "criteriosInclusion": incluye if incluye else ["Experiencia demostrable en el rol", "Conocimientos específicos de la función"],
                "criteriosExclusion": excluye if excluye else ["Sin experiencia mínima requerida"],
                "habilidades": habilidades if habilidades else ["organización", "comunicación"],
                "vacantesRespaldo": vacantes if vacantes else ["JPC - 1001"]
            })
        continue

    # If it's a specialty line (comes before profile title)
    if i + 2 < len(lines) and lines[i + 2].startswith("ID: perfil-"):
        current_specialty = line
        i += 1
        continue

    i += 1

# Convert families_dict into array
output_families = []
total_profiles = 0
for fam in FAMILY_NAMES:
    f_data = families_dict[fam]
    specs_list = []
    for spec_name, profs in f_data["especialidades"].items():
        specs_list.append({
            "nombre": spec_name,
            "perfiles": profs
        })
        total_profiles += len(profs)
    output_families.append({
        "id": f_data["id"],
        "nombre": f_data["nombre"],
        "descripcionBreve": f_data["descripcionBreve"],
        "especialidades": specs_list
    })

print(f"Parsed {len(output_families)} families with {total_profiles} profiles total.")

# Generate src/data/bookData.ts
ts_code = "import { FamiliaOcupacional, PerfilOcupacional } from '../types';\n\n"
ts_code += "export const FAMILIAS_DATA: FamiliaOcupacional[] = " + json.dumps(output_families, ensure_ascii=False, indent=2) + ";\n\n"
ts_code += "export const ALL_PROFILES: PerfilOcupacional[] = FAMILIAS_DATA.flatMap(f =>\n"
ts_code += "  f.especialidades.flatMap(s => s.perfiles)\n"
ts_code += ");\n"

with open("/src/data/bookData.ts", "w", encoding="utf-8") as f:
    f.write(ts_code)

print("Saved to /src/data/bookData.ts successfully!")
