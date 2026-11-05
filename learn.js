/* learn.js - course navigation, part panel, self-checking goals, saved progress, guided demo. */
(function () {
'use strict';
const C = window.COURSE, $ = s => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode: just don't save */ } }
};
let progress = store.get('circuitlab:progress', {});
let cur = null, demo = null, saveT = 0;
const pg = id => (progress[id] = progress[id] || { tasks: {}, quiz: {}, mem: {} });
const wsKey = id => 'circuitlab:ws:' + id;
const allParts = () => C.allParts();

/* first version of the app used ids lesson-1..6; keep that progress */
(function migrate() {
  for (let n = 1; n <= 6; n++) {
    const o = 'lesson-' + n, nw = 'circuits-' + n;
    if (progress[o] && !progress[nw]) { progress[nw] = progress[o]; delete progress[o]; }
    const w = store.get(wsKey(o), null); if (w && !store.get(wsKey(nw), null)) store.set(wsKey(nw), w);
  }
  store.set('circuitlab:progress', progress);
})();

function done(p) {
  const g = pg(p.id);
  if (p.tasks && p.tasks.length) return p.tasks.every(t => g.tasks[t.id]);
  if (p.quiz && p.quiz.length) return p.quiz.every((_, i) => g.quiz['q' + i] !== undefined);
  return !!g.read;
}
function saveProgress() { store.set('circuitlab:progress', progress); }
function updateTop() {
  const ps = allParts(), n = ps.filter(done).length;
  $('#progBar').style.width = (ps.length ? 100 * n / ps.length : 0) + '%';
  $('#progTxt').textContent = n + ' / ' + ps.length + ' parts';
}
const lessonDone = l => l.parts.filter(done).length;

/* ---------- navigation (lesson > parts) ---------- */
function renderNav() {
  const l = cur.lesson;
  if (!l) { $('#chips').innerHTML = '<div class="lessonhead"><span>Free build</span></div>'; return; }
  const li = C.lessons.indexOf(l);
  $('#chips').innerHTML = '<div class="lessonhead"><span>Lesson ' + (li + 1) + ' · ' + l.title + '</span><em>' + lessonDone(l) + '/' + l.parts.length + ' parts</em></div><div class="chiprow">' +
    l.parts.map((p, i) => '<button data-go="' + p.id + '" class="' + (p.id === cur.id ? 'on ' : '') + (done(p) ? 'done' : '') + '" title="' + p.title + '">' + (done(p) ? '✓' : (i + 1)) + '</button>').join('') + '</div>';
}
function nextOf(p) {
  if (!p.lesson) return null;
  const l = p.lesson, i = l.parts.indexOf(p);
  if (l.parts[i + 1]) return { part: l.parts[i + 1], label: 'Next part: ' + l.parts[i + 1].title };
  const nl = C.lessons[C.lessons.indexOf(l) + 1];
  return nl ? { part: nl.parts[0], label: 'Next lesson: ' + nl.title } : null;
}
function renderMap() {
  let h = '<div class="mapbox"><div class="maph"><b>Course map</b><button id="mapClose" aria-label="Close">×</button></div>';
  C.lessons.forEach((l, li) => {
    h += '<div class="mlesson"><div class="mt"><span>Lesson ' + (li + 1) + '</span> ' + l.title + '<em>' + lessonDone(l) + '/' + l.parts.length + '</em></div>' +
      l.parts.map((p, i) => '<button data-go="' + p.id + '" class="' + (done(p) ? 'done' : '') + (cur && p.id === cur.id ? ' on' : '') + '"><i>' + (done(p) ? '✓' : (i + 1)) + '</i>' + p.title + (p.bench === false ? '<small>reading</small>' : '') + '</button>').join('') + '</div>';
  });
  (C.upcoming || []).forEach(t => { h += '<div class="mlesson soon"><div class="mt"><span>Lesson ' + (C.lessons.length + 1) + '</span> ' + t + '</div></div>'; });
  h += '<button class="mfree" data-go="sandbox">Free build bench</button></div>';
  $('#map').innerHTML = h;
}
function toggleMap(on) { const m = $('#map'); if (on === undefined) on = !m.classList.contains('show'); if (on) renderMap(); m.classList.toggle('show', on); }

function renderPart() {
  const p = cur, g = pg(p.id), next = nextOf(p), l = p.lesson;
  const li = l ? C.lessons.indexOf(l) : -1, pi = l ? l.parts.indexOf(p) : -1;
  let h = '<div class="kicker">' + (p.sandbox ? 'Sandbox' : 'Lesson ' + (li + 1) + ' · Part ' + (pi + 1) + ' of ' + l.parts.length + (p.mins ? ' · about ' + p.mins + ' min' : '')) + '</div><h1>' + p.title + '</h1><p class="goal">' + p.goal + '</p>';
  if (p.body) h += '<div class="body">' + p.body + '</div>';
  if (p.demo) h += '<button class="btn demo" id="btnDemo">▶ Watch the demo</button>';
  if (p.learn && p.learn.length) h += '<h3>Learn</h3><ul class="learn">' + p.learn.map(t => '<li>' + t + '</li>').join('') + '</ul>';
  if (p.refs) h += '<h3>The diagrams</h3><div class="refs">' + p.refs.map(r => '<figure>' + Sim.thumb(r.state) + '<figcaption>' + r.label + '</figcaption></figure>').join('') + '</div>';
  if (p.bench !== false && (p.tasks.length || p.sandbox)) {
    h += '<h3>' + (p.sandbox ? 'Build' : 'Your turn') + '</h3>';
    h += '<p class="help">' + (p.help || 'Wire colors matter: red on the + side, black on the − side. Never let red touch black.') + '</p>';
    h += '<div class="acts">' + (p.start && p.start.parts.length ? '<button id="btnParts">Give me the parts</button>' : '') + (p.answer ? '<button id="btnAnswer">Show me the answer</button>' : '') + '<button id="btnReset">Reset workspace</button></div>';
    if (p.tasks.length) h += '<ol class="tasks">' + p.tasks.map(t => '<li data-t="' + t.id + '" class="' + (g.tasks[t.id] ? 'ok' : '') + '"><span class="tick"></span><span>' + t.text + '</span></li>').join('') + '</ol>';
  }
  if (p.quiz && p.quiz.length) {
    h += '<h3>Check yourself</h3>' + p.quiz.map((q, qi) => {
      const ans = g.quiz['q' + qi];
      return '<div class="quiz" data-q="' + qi + '"><p>' + q.q + '</p>' + q.o.map((o, oi) => '<button data-qa="' + oi + '" class="' + (ans !== undefined ? (oi === q.a ? 'right ' : (oi === ans ? 'wrong ' : '')) : '') + '"' + (ans !== undefined ? ' disabled' : '') + '>' + o + '</button>').join('') +
        '<div class="why' + (ans !== undefined ? ' show' : '') + '">' + (ans !== undefined ? (ans === q.a ? '<b>Correct.</b> ' : '<b>Not quite.</b> ') + q.why : '') + '</div></div>';
    }).join('');
  }
  if (!p.sandbox) {
    if (!(p.tasks && p.tasks.length) && !(p.quiz && p.quiz.length)) h += '<button class="btn sm" id="btnRead">Mark this part complete</button>';
    h += '<div id="complete" class="complete' + (done(p) ? ' show' : '') + '"><b>Part complete ✓</b>' + (next ? ' <button class="btn sm" data-go="' + next.part.id + '">' + next.label + ' →</button>' : ' <span>That is everything so far. More lessons get added as the class goes on.</span>') + '</div>';
  }
  $('#lesson').innerHTML = h;
  renderNav(); updateTop();
}

/* ---------- workspace per part ---------- */
function saveWorkspace() { if (cur && cur.bench !== false && !demo) store.set(wsKey(cur.id), Sim.getState()); }
function openPart(id) {
  if (demo) exitDemo(true);
  saveWorkspace();
  cur = C.find(id) || C.lessons[0].parts[0];
  history.replaceState(null, '', '#' + cur.id);
  const bench = cur.bench !== false;
  document.querySelector('.lab').classList.toggle('nobench', !bench);
  toggleMap(false);
  renderPart();
  if (bench) {
    const saved = store.get(wsKey(cur.id), null);
    Sim.setState(saved || cur.start || { parts: [], wires: [] }, { reason: 'load' });
    if (!saved) Sim.fit();
  }
  $('#lessonPane').scrollTop = 0; scrollTo(0, 0);
  if (bench && cur.demo && !pg(cur.id).seenDemo && !done(cur)) { pg(cur.id).seenDemo = true; saveProgress(); startDemo(); }
}

/* ---------- task evaluation ---------- */
function evaluate(stats) {
  if (!cur || demo || cur.bench === false) return;
  const g = pg(cur.id); let changed = false; const was = done(cur);
  cur.tasks.forEach(t => {
    if (g.tasks[t.id]) return;
    let ok = false; try { ok = !!t.check(stats, g.mem); } catch (e) { ok = false; }
    if (ok) { g.tasks[t.id] = true; changed = true; const li = document.querySelector('[data-t="' + t.id + '"]'); if (li) li.classList.add('ok', 'pop'); }
  });
  if (changed) {
    saveProgress(); updateTop(); renderNav();
    if (!was && done(cur)) { const c = $('#complete'); if (c) c.classList.add('show'); Sim.toast('🎉 Part complete!'); }
  } else if (Object.keys(g.mem).length) saveProgress();
}

/* ---------- guided demo ---------- */
function startDemo() {
  if (!cur || !cur.demo) return;
  saveWorkspace();
  demo = { i: 0, playing: true, t: 0, part: cur };
  Sim.setReadOnly(true); $('#demoBar').classList.add('show'); $('#canvasPane').classList.add('demoing');
  $('#demoDots').innerHTML = cur.demo.map((_, i) => '<i data-d="' + i + '"></i>').join('');
  Sim.setState({ parts: [], wires: [] }, { reason: 'demo' }); Sim.fit();
  stepTo(0);
}
function stepTo(i) {
  if (!demo) return; const steps = demo.part.demo; i = Math.max(0, Math.min(steps.length - 1, i)); demo.i = i;
  clearTimeout(demo.t); const s = steps[i];
  Sim.setState(s.state, { animate: true, reason: 'demo' }); Sim.setHighlight(s.hl || []); Sim.fit();
  $('#demoCap').innerHTML = s.text;
  document.querySelectorAll('#demoDots i').forEach((d, k) => d.classList.toggle('on', k === i));
  $('#demoNext').textContent = i === steps.length - 1 ? 'Replay ↺' : 'Next ▶';
  $('#demoPlay').textContent = demo.playing ? '⏸ Pause' : '▶ Play';
  if (demo.playing && i < steps.length - 1) demo.t = setTimeout(() => stepTo(i + 1), s.ms || 6000);
}
function exitDemo(quiet) {
  if (!demo) return; clearTimeout(demo.t); demo = null;
  Sim.setReadOnly(false); Sim.setHighlight([]); $('#demoBar').classList.remove('show'); $('#canvasPane').classList.remove('demoing');
  const saved = store.get(wsKey(cur.id), null);
  Sim.setState(saved || cur.start || { parts: [], wires: [] }, { reason: 'load' }); if (!saved) Sim.fit();
  if (!quiet) Sim.toast('Your turn: build it yourself. Use the toolbar to add parts.');
}
$('#demoPrev').onclick = () => { if (demo) { demo.playing = false; stepTo(demo.i - 1); } };
$('#demoNext').onclick = () => { if (!demo) return; const last = demo.i === demo.part.demo.length - 1; demo.playing = false; stepTo(last ? 0 : demo.i + 1); };
$('#demoPlay').onclick = () => { if (!demo) return; demo.playing = !demo.playing; stepTo(demo.i); };
$('#demoExit').onclick = () => exitDemo();

/* ---------- clicks ---------- */
document.addEventListener('click', e => {
  if (e.target.closest('#btnMap')) { toggleMap(); return; }
  if (e.target.closest('#mapClose') || e.target.id === 'map') { toggleMap(false); return; }
  const go = e.target.closest('[data-go]'); if (go) { openPart(go.dataset.go); return; }
  if (e.target.closest('#btnDemo')) { startDemo(); return; }
  if (e.target.closest('#btnParts')) { Sim.setState(cur.start, { reason: 'load' }); Sim.fit(); Sim.toast('Parts placed. Now wire them up.'); return; }
  if (e.target.closest('#btnAnswer')) { Sim.setState(cur.answer, { reason: 'load', animate: true }); Sim.fit(); Sim.toast('Here is one way to wire it. Study it, then rebuild it yourself.'); return; }
  if (e.target.closest('#btnReset')) { Sim.setState(cur.start || { parts: [], wires: [] }, { reason: 'load' }); Sim.fit(); return; }
  if (e.target.closest('#btnRead')) { pg(cur.id).read = true; saveProgress(); renderPart(); const c = $('#complete'); if (c) c.classList.add('show'); return; }
  const qa = e.target.closest('[data-qa]');
  if (qa) {
    const box = qa.closest('.quiz'), qi = +box.dataset.q, q = cur.quiz[qi], a = +qa.dataset.qa, g = pg(cur.id), was = done(cur);
    g.quiz['q' + qi] = a; saveProgress();
    box.querySelectorAll('button').forEach((b, k) => { b.disabled = true; if (k === q.a) b.classList.add('right'); else if (k === a) b.classList.add('wrong'); });
    const w = box.querySelector('.why'); w.innerHTML = (a === q.a ? '<b>Correct.</b> ' : '<b>Not quite.</b> ') + q.why; w.classList.add('show');
    if (!was && done(cur)) { const c = $('#complete'); if (c) c.classList.add('show'); }
    renderNav(); updateTop();
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMap(false); });

Sim.init($('#sim'), {
  onChange: (stats, why) => {
    evaluate(stats);
    if (why !== 'init' && why !== 'demo' && why !== 'mode' && why !== 'select') { clearTimeout(saveT); saveT = setTimeout(saveWorkspace, 400); }
  }
});
addEventListener('beforeunload', saveWorkspace);
let h0 = (location.hash || '').slice(1); if (/^lesson-\d$/.test(h0)) h0 = h0.replace('lesson-', 'circuits-');
openPart(h0 || C.lessons[0].parts[0].id);
})();
