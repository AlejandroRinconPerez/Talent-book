import { Candidato } from '../types';
import { formatDate, todayIso } from './format';

interface PrintProfileOptions {
  /** Occupational profile titles, already resolved by the caller. */
  profileNames: string[];
  /** Normalised modality label ("Remote" / "Hybrid" / "On-site"). */
  modality: string;
  /**
   * Internal rate and source are sales-only data and stay out of the printout
   * unless the caller explicitly asks for them.
   */
  includeInternalData?: boolean;
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

const esc = (value: string) => value.replace(/[&<>"']/g, c => ESCAPES[c]);

/** Chip list items for competencies and skills. */
const chips = (items: string[], tone: 'brand' | 'neutral') =>
  items.map(item => `<li class="chip chip-${tone}">${esc(item)}</li>`).join('');

const fact = (label: string, value: string, numeric = false) =>
  value ? `<div><dt>${esc(label)}</dt><dd${numeric ? ' class="num"' : ''}>${esc(value)}</dd></div>` : '';

/** Standalone print stylesheet: the app's tokens, restated for an A4 page. */
const STYLES = `
  @page { size: A4; margin: 15mm 14mm 14mm; }

  *, *::before, *::after { box-sizing: border-box; }

  html {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    margin: 0;
    font-family: "Bricolage Grotesque", "Segoe UI", system-ui, -apple-system, sans-serif;
    font-size: 10.5pt;
    line-height: 1.5;
    color: #1A2329;
    background: #FFFFFF;
  }

  h1, h2 { margin: 0; font-weight: 600; letter-spacing: -0.01em; }

  .masthead {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid #007685;
  }
  .wordmark { font-size: 10pt; font-weight: 600; color: #007685; letter-spacing: 0.04em; text-transform: uppercase; }
  .issued { font-size: 8.5pt; color: #6B7680; }

  .identity { margin-top: 14px; }
  .identity h1 { font-size: 21pt; line-height: 1.15; }
  .roles { margin-top: 3px; font-size: 11pt; color: #4A5660; }
  .meta { margin-top: 6px; font-size: 9pt; color: #6B7680; }
  .meta span + span::before { content: "\\00B7"; margin: 0 7px; color: #C3C9CE; }
  .code { font-variant-numeric: tabular-nums; letter-spacing: 0.02em; }

  dl.facts {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px 20px;
    margin: 16px 0 0;
    padding: 12px 14px;
    background: #F5F5F6;
    border: 1px solid #DEE2E5;
    border-radius: 6px;
  }
  dl.facts dt { font-size: 8pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7680; }
  dl.facts dd { margin: 2px 0 0; font-size: 10pt; color: #1A2329; }
  dl.facts dd.num { font-variant-numeric: tabular-nums; }

  section { margin-top: 16px; break-inside: avoid; }
  section h2 {
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #005D69;
    padding-bottom: 4px;
    margin-bottom: 8px;
    border-bottom: 1px solid #DEE2E5;
  }

  p.summary { margin: 0; max-width: 72ch; color: #4A5660; }

  ul.chips { display: flex; flex-wrap: wrap; gap: 4px; margin: 0; padding: 0; list-style: none; }
  .chip {
    display: inline-block;
    padding: 2px 7px;
    font-size: 8.5pt;
    line-height: 1.4;
    border-radius: 4px;
    border: 1px solid;
  }
  .chip-brand { background: #E6F4F6; border-color: #CDE9ED; color: #003F48; }
  .chip-neutral { background: #EEF0F1; border-color: #DEE2E5; color: #4A5660; }

  ol.career { margin: 0; padding: 0; list-style: none; }
  ol.career > li {
    display: grid;
    grid-template-columns: 34mm 1fr;
    gap: 0 14px;
    padding: 9px 0;
    border-top: 1px solid #DEE2E5;
    break-inside: avoid;
  }
  ol.career > li:first-child { border-top: 0; padding-top: 0; }
  .duration { font-size: 9pt; color: #6B7680; font-variant-numeric: tabular-nums; }
  .role { font-weight: 600; }
  .employer { font-size: 9pt; color: #4A5660; }
  ul.bullets { margin: 5px 0 0; padding-left: 15px; color: #4A5660; list-style: disc; }
  ul.bullets li { margin-top: 2px; }

  footer.page-note {
    margin-top: 20px;
    padding-top: 8px;
    border-top: 1px solid #DEE2E5;
    font-size: 8pt;
    color: #6B7680;
  }
`;

/** The whole print document for one candidate. Exported so it can be rendered without a print dialog. */
export function buildCandidateProfileDocument(candidate: Candidato, options: PrintProfileOptions): string {
  const { profileNames, modality, includeInternalData = false } = options;

  const career = candidate.trayectoria
    .map(
      item => `
        <li>
          <div class="duration">${esc(item.duracion)}</div>
          <div>
            <div class="role">${esc(item.cargo)}</div>
            <div class="employer">${esc(item.sectorEmpresa)}</div>
            ${
              item.logros.length > 0
                ? `<ul class="bullets">${item.logros.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`
                : ''
            }
          </div>
        </li>`
    )
    .join('');

  const englishLabel =
    candidate.nivelIngles === 'Sin información' || candidate.nivelIngles === 'Not specified'
      ? 'Not assessed'
      : candidate.nivelIngles;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${esc(`${candidate.nombre} - ${candidate.id} - Talent Book profile`)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&display=swap" rel="stylesheet" />
    <style>${STYLES}</style>
  </head>
  <body>
    <div class="masthead">
      <div class="wordmark">Talent Book</div>
      <div class="issued">Issued ${esc(formatDate(todayIso(), 'long'))}</div>
    </div>

    <div class="identity">
      <h1>${esc(candidate.nombre)}</h1>
      ${profileNames.length > 0 ? `<div class="roles">${esc(profileNames.join(' / '))}</div>` : ''}
      <div class="meta">
        <span class="code">${esc(candidate.id)}</span>
        <span>${esc(`${candidate.ciudad}, ${candidate.pais}`)}</span>
        <span>${esc(modality)}</span>
      </div>
    </div>

    <dl class="facts">
      ${fact('Experience', candidate.experienciaTexto, true)}
      ${fact('English', englishLabel)}
      ${fact('Availability', candidate.disponibilidad)}
      ${fact('Education', candidate.educacion)}
      ${includeInternalData ? fact('Internal rate', candidate.rangoSalarialInterno ?? '', true) : ''}
      ${includeInternalData ? fact('Source', candidate.fuente ?? '') : ''}
      ${fact('Profile updated', formatDate(candidate.ultimaActualizacion))}
    </dl>

    <section>
      <h2>Professional summary</h2>
      <p class="summary">${esc(candidate.resumenProfesional)}</p>
    </section>

    ${
      candidate.competenciasClave.length > 0
        ? `<section>
      <h2>Key competencies</h2>
      <ul class="chips">${chips(candidate.competenciasClave, 'brand')}</ul>
    </section>`
        : ''
    }

    ${
      candidate.habilidades.length > 0
        ? `<section>
      <h2>Skills</h2>
      <ul class="chips">${chips(candidate.habilidades, 'neutral')}</ul>
    </section>`
        : ''
    }

    ${
      candidate.trayectoria.length > 0
        ? `<section>
      <h2>Career history</h2>
      <ol class="career">${career}</ol>
    </section>`
        : ''
    }

    ${
      candidate.certificaciones.length > 0
        ? `<section>
      <h2>Certifications</h2>
      <ul class="bullets">${candidate.certificaciones.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
    </section>`
        : ''
    }

    <footer class="page-note">
      Talent Book &middot; profile <span class="code">${esc(candidate.id)}</span>${
        includeInternalData ? ' &middot; contains internal commercial data, not for client distribution' : ''
      }
    </footer>
  </body>
</html>`;
}

/**
 * Renders one candidate profile into an offscreen document and opens the browser
 * print dialog on it, so the user can save a PDF holding that profile alone.
 * None of the app chrome reaches the page.
 */
export function printCandidateProfile(candidate: Candidato, options: PrintProfileOptions): void {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('title', 'Printable candidate profile');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;';

  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    frame.remove();
  };

  frame.onload = () => {
    const win = frame.contentWindow;
    if (!win) {
      remove();
      return;
    }
    // Keep the frame alive while the dialog is open, drop it once the user is done.
    win.addEventListener('afterprint', remove, { once: true });
    const print = () => {
      win.focus();
      win.print();
      // Safety net for browsers that never fire afterprint.
      window.setTimeout(remove, 60_000);
    };
    // Wait for the webfont so the layout does not reflow mid-print.
    const fonts = win.document.fonts;
    if (fonts) {
      fonts.ready.then(print, print);
    } else {
      print();
    }
  };

  frame.srcdoc = buildCandidateProfileDocument(candidate, options);
  document.body.appendChild(frame);
}
