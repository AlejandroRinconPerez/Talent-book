/* Independent bilingual deck. No application imports, storage, or session writes. */
(() => {
  'use strict';
  const slides = [...document.querySelectorAll('.slide')];
  const byId = id => document.getElementById(id);
  const overview = byId('overview');
  const preview = byId('preview');
  const dictionaries = window.TalentBookPresentationI18n;
  const readLanguage = () => new URLSearchParams(location.search).get('lang') === 'es' ? 'es' : 'en';
  let language = readLanguage();
  let current = 0;
  let notesOpen = false;
  const t = key => dictionaries[language][key] ?? dictionaries.en[key] ?? key;
  const fromHash = () => {
    const match = /^#slide-(\d+)$/.exec(location.hash);
    return match ? Math.max(0, Math.min(slides.length - 1, Number(match[1]) - 1)) : 0;
  };
  const loadFrames = slide => slide.querySelectorAll('iframe[data-src]').forEach(frame => {
    frame.src = frame.dataset.src;
    frame.removeAttribute('data-src');
  });
  function translatePage() {
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
    document.querySelectorAll('[data-i18n-label]').forEach(element => element.setAttribute('aria-label', t(element.dataset.i18nLabel)));
    document.querySelectorAll('[data-i18n-title]').forEach(element => element.setAttribute('title', t(element.dataset.i18nTitle)));
    document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    slides.forEach(slide => { slide.dataset.printFooter = `Talent Book / ${t('sampleData')}`; });
    byId('fullscreen-button').textContent = t(document.fullscreenElement ? 'exitFullscreen' : 'fullscreen');
    document.querySelectorAll('[data-slide]').forEach(button => {
      const index = Number(button.dataset.slide);
      button.querySelector('span').textContent = `${String(index + 1).padStart(2, '0')} / ${t(slides[index].dataset.chapter)}`;
      button.querySelector('strong').textContent = t(slides[index].dataset.title);
    });
  }
  function show(index, updateUrl = true) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, i) => {
      slide.hidden = i !== current;
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', language === 'es' ? 'diapositiva' : 'slide');
      slide.setAttribute('aria-label', `${i + 1} ${t('of')} ${slides.length}`);
    });
    const active = slides[current];
    loadFrames(active);
    if (slides[current + 1]) loadFrames(slides[current + 1]);
    byId('counter').innerHTML = `${String(current + 1).padStart(2, '0')} <span>/ ${slides.length}</span>`;
    byId('chapter').textContent = t(active.dataset.chapter);
    byId('previous').disabled = current === 0;
    byId('next').disabled = current === slides.length - 1;
    byId('progress').style.transform = `scaleX(${(current + 1) / slides.length})`;
    byId('note-text').textContent = dictionaries[language].speakerCopy[current];
    byId('announcement').textContent = `${t('slideWord')} ${current + 1} ${t('of')} ${slides.length}: ${t(active.dataset.title)}`;
    document.title = `${t(active.dataset.title)} | Talent Book`;
    document.querySelectorAll('[data-slide]').forEach(button => {
      if (Number(button.dataset.slide) === current) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    if (updateUrl && location.hash !== `#slide-${current + 1}`) history.pushState(null, '', `#slide-${current + 1}`);
    window.scrollTo({top:0, behavior:'instant'});
  }
  function setLanguage(next, updateUrl = true) {
    language = next === 'es' ? 'es' : 'en';
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set('lang', language);
      history.replaceState(null, '', url);
    }
    translatePage();
    show(current, false);
  }
  function toggleNotes(force) {
    notesOpen = typeof force === 'boolean' ? force : !notesOpen;
    byId('notes').hidden = !notesOpen;
    byId('notes-button').setAttribute('aria-expanded', String(notesOpen));
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else byId('announcement').textContent = t('fullscreenUnavailable');
    } catch { byId('announcement').textContent = t('fullscreenUnavailable'); }
  }
  slides.forEach((slide, i) => {
    const button = document.createElement('button');
    button.dataset.slide = String(i);
    button.append(document.createElement('span'), document.createElement('strong'));
    button.addEventListener('click', () => { overview.close(); show(i); byId('deck').focus({preventScroll:true}); });
    byId('overview-grid').append(button);
  });
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language)));
  byId('previous').addEventListener('click', () => show(current - 1));
  byId('next').addEventListener('click', () => show(current + 1));
  document.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', () => { show(current + 1); byId('deck').focus({preventScroll:true}); }));
  function openOverview() { overview.showModal(); overview.querySelector('[aria-current="step"]')?.focus(); }
  byId('overview-button').addEventListener('click', openOverview);
  byId('notes-button').addEventListener('click', () => toggleNotes());
  byId('close-notes').addEventListener('click', () => { toggleNotes(false); byId('notes-button').focus(); });
  byId('fullscreen-button').addEventListener('click', fullscreen);
  document.addEventListener('fullscreenchange', () => { byId('fullscreen-button').textContent = t(document.fullscreenElement ? 'exitFullscreen' : 'fullscreen'); });
  byId('print-button').addEventListener('click', async () => {
    const button = byId('print-button');
    button.disabled = true;
    button.textContent = t('printLoading');
    const frames = [...document.querySelectorAll('.slide iframe')];
    frames.forEach(frame => { frame.loading = 'eager'; });
    slides.forEach(loadFrames);
    try {
      await Promise.all(frames.map(frame => new Promise((resolve, reject) => {
        const deadline = Date.now() + 12000;
        const check = () => {
          if (frame.contentDocument?.querySelector('main')) resolve();
          else if (Date.now() > deadline) reject(new Error('Product view unavailable'));
          else setTimeout(check, 100);
        };
        check();
      })));
      await Promise.all(frames.map(frame => frame.contentDocument.fonts.ready));
      if (document.fonts) await document.fonts.ready;
      window.print();
    } catch { byId('announcement').textContent = t('printError'); }
    finally { button.disabled = false; button.textContent = t('savePdf'); }
  });
  window.addEventListener('beforeprint', () => { document.querySelectorAll('.slide iframe').forEach(frame => {frame.loading='eager';}); slides.forEach(loadFrames); });
  document.querySelectorAll('[data-preview]').forEach(button => button.addEventListener('click', () => {
    byId('preview-title').textContent = button.closest('figure').querySelector('.product-bar span').textContent;
    byId('large-preview').src = `./assets/${button.dataset.preview}.html`;
    preview.showModal();
  }));
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => byId(button.dataset.close).close()));
  [overview, preview].forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }));
  function restoreRoute() { language = readLanguage(); translatePage(); show(fromHash(), false); }
  window.addEventListener('popstate', restoreRoute);
  window.addEventListener('hashchange', restoreRoute);
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (overview.open || preview.open) {
      if (event.key === 'Escape') { event.preventDefault(); (preview.open ? preview : overview).close(); }
      return;
    }
    if (event.target instanceof HTMLElement && (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))) return;
    if (event.key === ' ' && event.target instanceof HTMLElement && event.target.closest('button,a')) return;
    const key = event.key.toLowerCase();
    if (['arrowright','pagedown',' '].includes(key)) { event.preventDefault(); show(current + 1); }
    else if (['arrowleft','pageup'].includes(key)) { event.preventDefault(); show(current - 1); }
    else if (key === 'home') { event.preventDefault(); show(0); }
    else if (key === 'end') { event.preventDefault(); show(slides.length - 1); }
    else if (key === 'f') { event.preventDefault(); fullscreen(); }
    else if (key === 'o') { event.preventDefault(); openOverview(); }
    else if (key === 'n') { event.preventDefault(); toggleNotes(); }
    else if (key === 'escape' && notesOpen) toggleNotes(false);
  });
  let touch = null;
  byId('deck').addEventListener('touchstart', event => {
    if (event.touches.length !== 1 || event.target.closest('button,a,iframe')) { touch = null; return; }
    touch = {x:event.touches[0].clientX, y:event.touches[0].clientY};
  }, {passive:true});
  byId('deck').addEventListener('touchend', event => {
    if (!touch) return;
    const dx=event.changedTouches[0].clientX-touch.x, dy=event.changedTouches[0].clientY-touch.y;
    if (Math.abs(dx)>70 && Math.abs(dx)>Math.abs(dy)*1.8) show(current+(dx<0?1:-1));
    touch=null;
  }, {passive:true});
  byId('deck').addEventListener('touchcancel', () => {touch=null;}, {passive:true});
  translatePage();
  show(fromHash(), false);
})();
