/** Browser QA for the isolated presentation. Uses a fresh headless Chrome profile,
 * Node's built-in WebSocket, and no additional project dependencies.
 * Run: node scripts/check-presentation.mjs http://127.0.0.1:3004/presentacion/
 */
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const url = process.argv[2] || 'http://127.0.0.1:3004/presentacion/';
const copyContext={window:{}};
runInNewContext(await readFile('public/presentacion/translations.js','utf8'),copyContext);
const copy=copyContext.window.TalentBookPresentationI18n;
assert.deepEqual(Object.keys(copy.en).sort(),Object.keys(copy.es).sort());
const source=await readFile('public/presentacion/index.html','utf8');
for(const match of source.matchAll(/data-i18n(?:-label|-title)?="([^"]+)"/g)) assert.ok(copy.en[match[1]] && copy.es[match[1]],`Missing translation: ${match[1]}`);
assert.equal(copy.en.speakerCopy.length,6);assert.equal(copy.es.speakerCopy.length,6);
const output = resolve('output/presentation-qa');
await mkdir(output, {recursive:true});
const profile = await mkdtemp(join(tmpdir(), 'talentbook-presentation-qa-'));
const executable = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const chrome = spawn(executable, ['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'], {windowsHide:true,stdio:['ignore','ignore','pipe']});
let ws;
let failures = [];
let id = 0;
const pending = new Map();
try {
  const endpoint = await new Promise((resolveEndpoint,reject) => {
    let stderr = '';
    const timeout = setTimeout(()=>reject(new Error('Chrome startup timed out')),20000);
    chrome.stderr.on('data', chunk => { stderr += chunk; const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/); if(match){clearTimeout(timeout);resolveEndpoint(match[1]);} });
    chrome.once('error', reject);
    chrome.once('exit', code=>{clearTimeout(timeout);reject(new Error(`Chrome exited before connection (${code}): ${stderr.slice(-500)}`));});
  });
  const origin = endpoint.replace(/^ws:/,'http:').split('/devtools/')[0];
  const pages = await (await fetch(`${origin}/json/list`)).json();
  ws = new WebSocket(pages.find(page=>page.type==='page').webSocketDebuggerUrl);
  await new Promise((ok,no)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',no,{once:true});});
  ws.addEventListener('message', event=>{
    const msg=JSON.parse(event.data);
    if(msg.id){const task=pending.get(msg.id);if(task){clearTimeout(task.timeout);pending.delete(msg.id);msg.error?task.reject(new Error(msg.error.message)):task.resolve(msg.result);}}
    if(msg.method==='Runtime.exceptionThrown') failures.push(msg.params.exceptionDetails.text);
    if(msg.method==='Log.entryAdded' && msg.params.entry.level==='error') {
      const entry=msg.params.entry;
      // Managed Chrome extensions try injecting into the empty sandboxed preview.
      // This expected browser security refusal is unrelated to application code.
      if(entry.url==='about:blank' && entry.text.startsWith("Blocked script execution in 'about:blank'")) return;
      failures.push(`${entry.text} ${entry.url||''}`);
    }
  });
  const send = (method,params={}) => new Promise((resolveCall,reject)=>{
    const callId=++id;
    const timeout=setTimeout(()=>{pending.delete(callId);reject(new Error(`CDP timeout: ${method}`));},25000);
    pending.set(callId,{resolve:resolveCall,reject,timeout});ws.send(JSON.stringify({id:callId,method,params}));
  });
  const evaluate = async expression => {
    const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const key = async keyName => {
    const codes={Escape:27,Home:36,End:35,ArrowLeft:37,ArrowRight:39,PageUp:33,PageDown:34};
    const params={key:keyName,code:keyName.length===1?`Key${keyName.toUpperCase()}`:keyName,windowsVirtualKeyCode:codes[keyName] || keyName.toUpperCase().charCodeAt(0)};
    await send('Input.dispatchKeyEvent',{type:'keyDown',...params});await send('Input.dispatchKeyEvent',{type:'keyUp',...params});
  };
  const ready = () => evaluate(`new Promise(resolve=>{const check=()=>{if(document.querySelector('#counter') && !document.querySelector('.slide').hidden && document.querySelectorAll('[data-slide]').length===6)resolve(true);else setTimeout(check,30)};check()})`);
  const settle = () => evaluate(`(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('.slide:not([hidden]) iframe')].map(f=>new Promise(resolve=>{const check=()=>{if(f.contentDocument?.querySelector('main') && f.contentDocument?.readyState==='complete')resolve();else setTimeout(check,30)};check()})));await Promise.all([...document.querySelectorAll('.slide:not([hidden]) iframe')].map(f=>f.contentDocument.fonts.ready));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return true})()`);
  await send('Page.enable');await send('Runtime.enable');await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await send('Page.navigate',{url});
  for (let attempt=0;attempt<20;attempt++) {
    try { await ready(); break; }
    catch(error) {
      if(attempt===19 || !/navigated|context|closed/i.test(error.message)) throw error;
      await new Promise(resolve=>setTimeout(resolve,100));
    }
  }
  for(const language of ['en','es']) {
  await evaluate(`document.querySelector('[data-language="${language}"]').click()`);
  assert.equal(await evaluate(`document.documentElement.lang`),language);
  assert.equal(await evaluate(`document.querySelector('[data-language="${language}"]').getAttribute('aria-pressed')`),'true');
  for(const size of [{width:1440,height:900,name:'desktop'},{width:1280,height:720,name:'laptop'},{width:390,height:844,name:'mobile'}]){
    await send('Emulation.setDeviceMetricsOverride',{...size,name:undefined,deviceScaleFactor:1,mobile:size.name==='mobile'});
    await key('Home');
    for(let index=1;index<=6;index++){
      await settle();
      const layout=await evaluate(`({visible:document.querySelectorAll('.slide:not([hidden])').length, index:document.querySelector('#counter').textContent.trim(),horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,height:document.documentElement.scrollHeight,viewport:innerHeight,frames:[...document.querySelectorAll('.slide:not([hidden]) iframe')].map(f=>({width:f.getBoundingClientRect().width,parent:f.parentElement.clientWidth,loaded:!!f.contentDocument?.querySelector('main')}))})`);
      assert.equal(layout.visible,1);assert.ok(layout.index.startsWith(String(index).padStart(2,'0')));
      assert.equal(layout.horizontalOverflow,false,`${size.name} slide ${index} has horizontal overflow`);
      if(size.name!=='mobile') assert.ok(layout.height<=layout.viewport+1,`${language} ${size.name} slide ${index} exceeds viewport: ${layout.height}`);
      for(const frame of layout.frames){assert.ok(frame.loaded,`Slide ${index} frame not loaded`);assert.ok(Math.abs(frame.width-frame.parent)<3,`Slide ${index} frame scale mismatch ${frame.width}/${frame.parent}`);}
      if(size.name==='desktop' || [1,2,4,6].includes(index)){
        const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        await writeFile(join(output,`${language}-${size.name}-${String(index).padStart(2,'0')}.png`),Buffer.from(screenshot.data,'base64'));
      }
      await key('ArrowRight');
    }
    console.log(`PASS ${language} ${size.name}: all 6 slides, visible content, frames, and page width`);
  }
  }
  await key('Home');await key('ArrowLeft');
  assert.equal(await evaluate(`location.hash`),'#slide-1');
  await key('n');assert.equal(await evaluate(`document.querySelector('#notes').hidden`),false);
  await key('Escape');assert.equal(await evaluate(`document.querySelector('#notes').hidden`),true);
  await key('o');assert.equal(await evaluate(`document.querySelector('#overview').open`),true);
  await key('ArrowRight');assert.equal(await evaluate(`location.hash`),'#slide-1');
  await evaluate(`document.querySelector('[data-slide="4"]').click()`);
  assert.equal(await evaluate(`location.hash`),'#slide-5');
  assert.equal(await evaluate(`document.querySelector('#overview').open`),false);
  await evaluate(`document.querySelector('.slide:not([hidden]) [data-preview]').click()`);
  assert.equal(await evaluate(`document.querySelector('#preview').open`),true);
  await key('Escape');assert.equal(await evaluate(`document.querySelector('#preview').open`),false);
  await key('End');await key('ArrowRight');assert.equal(await evaluate(`location.hash`),'#slide-6');
  await evaluate(`history.back()`);
  await evaluate(`new Promise(resolve=>{const check=()=>location.hash==='#slide-5'?resolve(true):setTimeout(check,20);check()})`);
  assert.ok(await evaluate(`document.querySelector('#counter').textContent.trim().startsWith('05')`));
  console.log('PASS keyboard boundaries, notes, overview, enlarged view, and browser history');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await evaluate(`document.querySelectorAll('iframe[data-src]').forEach(f=>{f.src=f.dataset.src;f.removeAttribute('data-src')})`);
  await evaluate(`Promise.all([...document.querySelectorAll('.slide iframe')].map(f=>new Promise(resolve=>{const check=()=>{if(f.contentDocument?.querySelector('main') && f.contentDocument?.readyState==='complete')resolve();else setTimeout(check,30)};check()}))).then(()=>true)`);
  await send('Emulation.setEmulatedMedia',{media:'print'});
  for(const language of ['en','es']) {
  await evaluate(`document.querySelector('[data-language="${language}"]').click()`);
  const printLayout = await evaluate(`({slides:[...document.querySelectorAll('.slide')].map((s,i)=>({slide:i+1,visible:getComputedStyle(s).display!=='none',overflow:s.scrollHeight>s.clientHeight+2,height:s.clientHeight,scrollHeight:s.scrollHeight})),notes:getComputedStyle(document.querySelector('#notes')).display})`);
  assert.equal(printLayout.slides.filter(s=>s.visible).length,6);
  assert.equal(printLayout.notes,'none');
  assert.equal(printLayout.slides.filter(s=>s.overflow).length,0,`Print content exceeds slide height (${language}): ${JSON.stringify(printLayout.slides.filter(s=>s.overflow))}`);
  const pdf=await send('Page.printToPDF',{printBackground:true,preferCSSPageSize:true});
  const pdfBytes=Buffer.from(pdf.data,'base64');
  assert.equal((pdfBytes.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,6,'PDF must have exactly 6 pages');
  await writeFile(join(output,`talent-book-presentation-${language}.pdf`),pdfBytes);
  const printClip = await evaluate(`(()=>{const r=document.querySelector('.cover').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}})()`);
  const printScreenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:printClip});
  await writeFile(join(output,`${language}-print-cover.png`),Buffer.from(printScreenshot.data,'base64'));
  }
  assert.equal(failures.length,0,`Browser errors: ${failures.join('; ')}`);
  console.log('PASS both languages: printable 6-slide layout, speaker notes excluded, no browser errors');
  console.log(`Artifacts: ${output}`);
} finally {
  ws?.close();chrome.kill();
  // Only the fresh temporary profile created above is eligible for cleanup.
  if(resolve(profile).startsWith(resolve(tmpdir())+ '\\') && profile.includes('talentbook-presentation-qa-')) await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:300}).catch(()=>{});
}
