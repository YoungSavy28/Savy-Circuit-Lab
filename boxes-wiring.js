/* Diagram-only wiring trainer. Intentionally independent of the battery solver. */
(function (root) {
  'use strict';
  const TYPES = {
    h: { label: 'Hot · black', color: '#ffb23e' },
    sh: { label: 'Switched hot · red', color: '#ff7979' },
    n: { label: 'Neutral · white', color: '#edf2ff' },
    g: { label: 'Ground · bare/green', color: '#5dd6a0' }
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const terminals = spec => spec.groups.flatMap(g => g.nodes);

  function validate(spec, wires) {
    const nodes = terminals(spec), byId = new Map(nodes.map(n => [n.id, n]));
    const parent = new Map(nodes.map(n => [n.id, n.id]));
    const find = id => { let p = id; while (parent.get(p) !== p) p = parent.get(p); return p; };
    const degree = new Map(nodes.map(n => [n.id, 0]));
    const seen = new Set();
    for (const w of wires) {
      if (!Array.isArray(w) || w.length !== 3 || !byId.has(w[0]) || !byId.has(w[1]) || w[0] === w[1] || !TYPES[w[2]]) {
        return { ok: false, message: 'Remove an invalid connection and try again.' };
      }
      const key = [w[0], w[1]].sort().join('|');
      if (seen.has(key)) return { ok: false, message: 'Remove the duplicate connection.' };
      seen.add(key);
      for (const id of w.slice(0, 2)) {
        degree.set(id, degree.get(id) + 1);
        if (degree.get(id) > 1 && !byId.get(id).hub) return { ok: false, message: byId.get(id).label + ': use the splice connector to branch; this terminal accepts one trainer wire.' };
      }
      parent.set(find(w[0]), find(w[1]));
    }
    let best = null;
    for (const nets of [spec.nets].concat(spec.alternatives || [])) {
      const netOf = new Map(); nets.forEach((net, i) => net.forEach(id => netOf.set(id, i)));
      let error = '';
      for (const w of wires) {
        if (netOf.get(w[0]) !== netOf.get(w[1])) {
          error = 'Wrong path: ' + byId.get(w[0]).label + ' and ' + byId.get(w[1]).label + ' must be separate. Check hot, neutral, ground and switched-hot functions.'; break;
        }
        const net = nets[netOf.get(w[0])];
        const kind = net.map(id => byId.get(id).kind).find(k => k !== 'switch');
        if (w[2] !== kind) { error = 'Conductor label mismatch: use ' + TYPES[kind].label + ' for the path at ' + byId.get(w[0]).label + '.'; break; }
      }
      if (error) { if (!best) best = { ok: false, message: error }; continue; }
      const missing = nets.flatMap(net => net.filter(id => find(id) !== find(net[0]) || degree.get(id) === 0));
      if (!missing.length) return { ok: true, message: 'Connections correct. All required paths, including the metal-box bond, are connected. This checks the diagram only.' };
      return { ok: false, message: 'Keep going: the path to ' + byId.get(missing[0]).label + ' is incomplete. Check every connector and grounding pigtail.' };
    }
    return best || { ok: false, message: 'Check the connections.' };
  }

  function mount(host, spec, options) {
    const nodes = terminals(spec), byId = new Map(nodes.map(n => [n.id, n]));
    let wires = Array.isArray(options.state?.wires) ? options.state.wires.filter(w => Array.isArray(w) && w.length === 3 && byId.has(w[0]) && byId.has(w[1]) && w[0] !== w[1] && TYPES[w[2]]).map(w => w.slice()) : [];
    let selected = null, kind = 'h', checked = !!options.state?.checked, disposed = false, frame = 0;
    let message = checked ? validate(spec, wires).message : 'Choose a conductor, then select two terminal buttons to connect them.';
    const snapshot = () => ({ wires: wires.map(w => w.slice()), checked });
    function notify() { options.onChange(snapshot(), checked && validate(spec, wires).ok); }
    function draw() {
      if (disposed) return;
      const board = host.querySelector('.bw-board'), svg = host.querySelector('.bw-lines');
      const rect = board.getBoundingClientRect();
      svg.setAttribute('viewBox', '0 0 ' + rect.width + ' ' + rect.height);
      svg.innerHTML = wires.map((w, i) => {
        const ae = host.querySelector('[data-terminal="' + w[0] + '"]');
        const be = host.querySelector('[data-terminal="' + w[1] + '"]');
        const a = ae.getBoundingClientRect(), b = be.getBoundingClientRect();
        const same = ae.parentElement === be.parentElement;
        const goesRight = a.left < b.left;
        const x1 = (same || goesRight ? a.right : a.left) - rect.left;
        const x2 = (same || !goesRight ? b.right : b.left) - rect.left;
        const y1 = a.top - rect.top + a.height / 2, y2 = b.top - rect.top + b.height / 2;
        const lane = Math.max(x1, x2) + 12;
        const d = same ? 'M' + x1 + ',' + y1 + ' H' + lane + ' V' + y2 + ' H' + x2 : 'M' + x1 + ',' + y1 + ' L' + x2 + ',' + y2;
        const mx = same ? lane : (x1+x2)/2, my = (y1+y2)/2;
        return '<path d="' + d + '" stroke="' + TYPES[w[2]].color + '" stroke-width="3" fill="none" stroke-dasharray="' + (w[2] === 'g' ? '7 4' : 'none') + '"/><circle cx="' + x1 + '" cy="' + y1 + '" r="4" fill="' + TYPES[w[2]].color + '"/><circle cx="' + x2 + '" cy="' + y2 + '" r="4" fill="' + TYPES[w[2]].color + '"/><circle cx="' + mx + '" cy="' + my + '" r="8" fill="#10131d"/><text x="' + mx + '" y="' + (my+4) + '" fill="white" text-anchor="middle" font-size="10">' + (i+1) + '</text>';
      }).join('');
    }
    function render(focus) {
      const result = checked ? validate(spec, wires) : null;
      host.className = 'box-wiring';
      host.innerHTML = '<h3>' + esc(spec.title) + '</h3><p class="bw-tag">DE-ENERGIZED DIAGRAM · NO AC POWER SIMULATION</p><p>' + esc(spec.note) + '</p>' +
        '<div class="bw-colors" role="group" aria-label="Conductor function">' + Object.entries(TYPES).filter(([k]) => k !== 'sh' || spec.id === 'switch').map(([k, t]) => '<button type="button" data-wire="' + k + '" aria-pressed="' + (kind === k) + '" style="--wire:' + t.color + '">' + esc(t.label) + '</button>').join('') + '</div>' +
        '<div class="bw-board"><svg class="bw-lines" aria-hidden="true"></svg>' + spec.groups.map(g => '<section class="bw-group"><h4>' + esc(g.title) + '</h4>' + g.nodes.map(n => '<button type="button" class="bw-terminal" data-terminal="' + n.id + '" aria-pressed="' + (selected === n.id) + '"><span aria-hidden="true">' + (n.hub ? '◆' : '●') + '</span> ' + esc(n.label) + '</button>').join('') + '</section>').join('') + '</div>' +
        '<div class="bw-actions"><button type="button" data-action="check">Check wiring</button><button type="button" data-action="undo"' + (!wires.length ? ' disabled' : '') + '>Undo wire</button><button type="button" data-action="reset">Reset board</button></div>' +
        '<p class="bw-feedback' + (result?.ok ? ' bw-correct' : '') + '" role="status" aria-live="polite">' + esc(message) + '</p>' +
        '<h4>Connections (' + wires.length + ')</h4><ol class="bw-connections">' + wires.map((w, i) => '<li>' + esc(byId.get(w[0]).label) + ' ↔ ' + esc(byId.get(w[1]).label) + ' <small>' + esc(TYPES[w[2]].label) + '</small> <button type="button" data-remove="' + i + '" aria-label="Remove connection ' + (i+1) + '">Remove</button></li>').join('') + '</ol>' +
        (!wires.length ? '<p>No connections yet.</p>' : '') +
        '<details class="bw-guide"><summary>Show a connection guide</summary><p>One correct arrangement is listed below. Select the matching conductor before drawing each connection. A basic switch also accepts its two brass terminals reversed.</p><ol>' + spec.answer.map(w => '<li>' + esc(TYPES[w[2]].label) + ': ' + esc(byId.get(w[0]).label) + ' → ' + esc(byId.get(w[1]).label) + '</li>').join('') + '</ol></details>';
      cancelAnimationFrame(frame); frame = requestAnimationFrame(draw);
      if (focus) host.querySelector(focus)?.focus();
    }
    function changed() { checked = false; notify(); }
    function click(e) {
      const b = e.target.closest('button'); if (!b || !host.contains(b)) return;
      if (b.dataset.wire) {
        kind = b.dataset.wire; selected = null; message = 'Selected ' + TYPES[kind].label + '. Choose the first terminal.';
        render('[data-wire="' + kind + '"]'); return;
      }
      if (b.dataset.terminal) {
        const id = b.dataset.terminal;
        if (!selected) { selected = id; message = 'Selected ' + byId.get(id).label + '. Now choose the other terminal.'; }
        else if (selected === id) { selected = null; message = 'Selection cancelled. Choose a terminal to begin again.'; }
        else {
          const a = selected; selected = null;
          if (wires.some(w => (w[0] === a && w[1] === id) || (w[0] === id && w[1] === a))) message = 'Those terminals are already connected.';
          else if ([a, id].some(n => !byId.get(n).hub && wires.some(w => w[0] === n || w[1] === n))) message = 'That terminal already has a wire. Use a connector node for branching, or remove the existing wire.';
          else { wires.push([a, id, kind]); message = 'Connection added. Continue wiring, or check your work.'; changed(); }
        }
        render('[data-terminal="' + id + '"]'); return;
      }
      if (b.dataset.remove !== undefined) { wires.splice(Number(b.dataset.remove), 1); selected = null; message = 'Connection removed.'; changed(); render('[data-action="check"]'); return; }
      const action = b.dataset.action;
      if (action === 'check') { checked = true; selected = null; message = validate(spec, wires).message; notify(); }
      if (action === 'undo') { wires.pop(); selected = null; message = 'Last connection removed.'; changed(); }
      if (action === 'reset') { wires = []; selected = null; message = 'Board reset. Choose a conductor and connect two terminals.'; changed(); }
      render('[data-action="' + action + '"]');
    }
    host.addEventListener('click', click);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(draw); }) : null;
    observer?.observe(host);
    root.addEventListener('resize', draw);
    render(); notify();
    return () => { disposed = true; cancelAnimationFrame(frame); observer?.disconnect(); root.removeEventListener('resize', draw); host.removeEventListener('click', click); };
  }
  root.BoxWiring = { mount, validate };
})(window);
