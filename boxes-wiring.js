/* Building-wiring components for the existing SVG workbench.
   Connectivity exercises share its drag/wire/undo editor; no mains physics. */
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
        if (degree.get(id) > (byId.get(id).capacity || 1) && !byId.get(id).hub) return { ok: false, message: byId.get(id).label + ': use the splice connector to branch; this terminal accepts one trainer wire.' };
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
      return { ok: false, incomplete: true, message: 'Keep going: the path to ' + byId.get(missing[0]).label + ' is incomplete. Check every connector and grounding pigtail.' };
    }
    return best || { ok: false, message: 'Check the connections.' };
  }

  const defs = {
    trainingfeed: { name: 'Isolated training supply', terms: [[90,-45],[90,0],[90,45]], labels: ['HOT','NEUTRAL','GROUND'], box: [-90,-85,180,170] },
    outletbox: { name: 'Receptacle outlet box', terms: [[105,-30],[-105,-30],[42,100],[-42,100]], labels: ['BRASS · H','SILVER · N','GREEN · G','BOX BOND'], box: [-105,-90,210,190] },
    devicebox: { name: 'Switch device box', terms: [[105,-40],[105,20],[42,100],[-42,100]], labels: ['BRASS 1','BRASS 2','GREEN · G','BOX BOND'], box: [-105,-90,210,190] },
    junctionbox: { name: 'Junction box', terms: [[-105,-40],[-105,25],[105,-40],[105,25]], labels: ['HOT SPLICE','NEUTRAL','GROUND','BOX BOND'], box: [-105,-90,210,180] },
    pullbox: { name: 'Pull box', terms: [[-140,-55],[-140,0],[-140,55],[140,-55],[140,0],[140,55],[55,105]], labels: ['IN · H','IN · N','IN · G','OUT · H','OUT · N','OUT · G','BOX BOND'], box: [-140,-90,280,195] },
    wireconnector: { name: 'Splice connector', terms: [[0,0]], labels: ['CONNECTOR'], box: [-40,-25,80,50] },
    cableend: { name: 'Outgoing cable', terms: [[-90,-45],[-90,0],[-90,45]], labels: ['HOT','NEUTRAL','GROUND'], box: [-90,-85,180,170] },
    buildingload: { name: 'Light fixture', terms: [[-90,-45],[-90,0],[-90,45]], labels: ['SW. HOT','NEUTRAL','GROUND'], box: [-90,-85,180,170] }
  };
  const isPart = p => !!defs[p.type];
  function markup(p) {
    const d = defs[p.type], b = d.box;
    let h = '<rect class="building-shell" x="' + (b[0]+7) + '" y="' + (b[1]+7) + '" width="' + (b[2]-14) + '" height="' + (b[3]-14) + '" rx="14"/>';
    if (p.type === 'outletbox') h += '<rect class="building-device" x="-30" y="-58" width="60" height="114" rx="9"/>' + [-28,24].map(y => '<rect x="-15" y="' + y + '" width="5" height="14" rx="1" fill="#151b26"/><rect x="10" y="' + y + '" width="4" height="11" rx="1" fill="#151b26"/><path d="M-5 ' + (y+26) + ' a5 5 0 0 1 10 0 v4 h-10z" fill="#151b26"/>').join('');
    if (p.type === 'devicebox') h += '<rect class="building-device" x="-28" y="-57" width="56" height="113" rx="8"/><rect class="building-toggle" x="-14" y="' + (p.closed ? -34 : 1) + '" width="28" height="32" rx="4"/><text class="building-state" x="0" y="76">' + (p.closed ? 'ON' : 'OFF') + '</text>';
    if (p.type === 'trainingfeed') h += '<text class="building-center" x="-20" y="-50">ISOLATED</text><text class="building-center" x="-20" y="-28">TRAINING FEED</text><text class="building-small" x="0" y="65">CONNECTIONS ONLY</text>';
    if (p.type === 'buildingload') h += '<circle class="building-glow" r="62" fill="url(#glowGrad)" opacity="0"/><circle class="building-lamp" r="31"/><path class="pl" d="M-18 -18 L18 18 M18 -18 L-18 18"/>';
    if (p.type === 'junctionbox') h += '<text class="building-center" x="0" y="-64">SPLICE INSIDE BOX</text><rect class="building-connector" x="-65" y="-46" width="34" height="16" rx="4"/><rect class="building-connector" x="-65" y="17" width="34" height="16" rx="4"/><rect class="building-connector" x="31" y="-46" width="34" height="16" rx="4"/>';
    if (p.type === 'pullbox') h += '<text class="building-center" x="0" y="-62">PULL THROUGH</text><text class="building-small" x="0" y="79">CONTINUOUS H / N</text>';
    if (p.type === 'wireconnector') h = '<rect class="building-connector" x="-22" y="-16" width="44" height="32" rx="7"/>';
    if (p.type === 'cableend') h += '<text class="building-center" x="12" y="-12">OUTGOING</text><text class="building-center" x="12" y="10">CABLE</text>';
    if (p.type !== 'wireconnector') d.terms.forEach(([x,y], k) => {
      const bottom = y >= 100, tx = bottom ? x : x < 0 ? x+13 : x-13;
      h += '<text class="building-port" x="' + tx + '" y="' + (bottom ? y-13 : y-9) + '" text-anchor="' + (bottom ? 'middle' : x < 0 ? 'start' : 'end') + '">' + d.labels[k] + '</text>';
    });
    return h;
  }
  function compute(parts, wires) {
    const feed = parts.find(p => p.type === 'trainingfeed' && p.plan);
    let result = { ok:false, incomplete:true, message:'Use Give me the parts to restore the exercise.' }, paths = {};
    let spec = null;
    if (feed) {
      const map = new Map();
      parts.forEach(p => (p.ports || []).forEach((id,k) => map.set(id, p.id + ':' + k)));
      const raw = feed.plan;
      if (terminals(raw).every(n => map.has(n.id))) {
        spec = { ...raw, groups: raw.groups.map(g => ({ ...g, nodes:g.nodes.map(n => ({ ...n, id:map.get(n.id) })) })),
          nets:raw.nets.map(net => net.map(id => map.get(id))), alternatives:(raw.alternatives || []).map(ns => ns.map(net => net.map(id => map.get(id)))) };
        const ws = wires.map(w => [w.a,w.b,w.c]);
        result = validate(spec,ws);
        if (wires.some(w => w.open)) result = { ok:false, message:'Replace the open wire before completing this circuit.' };
        if (result.ok || result.incomplete) {
          const parent = new Map(terminals(spec).map(n => [n.id,n.id]));
          const find = id => parent.get(id) === id ? id : find(parent.get(id));
          ws.forEach(w => parent.set(find(w[0]),find(w[1])));
          const kinds = new Map(terminals(spec).map(n => [n.id,n.kind]));
          const candidates = [spec.nets].concat(spec.alternatives || []);
          // Choose the valid orientation before checking partial paths.
          const chosen = candidates.find(ns => {
            const ni = new Map(); ns.forEach((net,i) => net.forEach(id => ni.set(id,i)));
            return ws.every(w => ni.get(w[0]) === ni.get(w[1]));
          }) || spec.nets;
          chosen.forEach(net => {
            const kind = net.map(id => kinds.get(id)).find(k => k !== 'switch');
            paths[kind] = net.every(id => find(id) === find(net[0]) && ws.some(w => w[0] === id || w[1] === id));
          });
        }
      }
    }
    const sw = parts.find(p => p.type === 'devicebox');
    const functional = !!result.ok && (!sw || !!sw.closed);
    const res = {}; parts.filter(isPart).forEach(p => { res[p.id] = { ready:!!result.ok, lit:functional && p.type === 'buildingload' }; });
    return { res, wireI:{}, faults:[], faultWires:new Set(), meters:[], meggers:[], clamps:[], blew:[], blewBat:[], blewFuse:[],
      stats:{ bulbs:[],lit:functional ? parts.filter(p => p.type === 'buildingload').length : 0,blown:0,off:0,batteries:0,blownBat:0,shorts:0,faults:[],wiresRed:0,wiresBlack:0,
        switches:parts.filter(p => p.type === 'devicebox').map(p => ({id:p.id,closed:!!p.closed})),junctions:0,wires:wires.length,parts:parts.length,sel:null,meters:[],meggers:[],clamps:[],provers:0,cables:0,blownFuses:0,hidden:0,
        building:{correct:!!result.ok,safe:!!(result.ok || result.incomplete),message:result.message,paths,functional} }
    };
  }
  root.BoxWiring = { validate, defs, isPart, markup, compute, types:TYPES };
})(window);

