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
    trainingfeed: {name:'Supply cable',terms:[[78,-46],[88,0],[78,46]],labels:['HOT','NEUTRAL','GROUND'],box:[-95,-85,190,170]},
    outletbox: {name:'Duplex receptacle in metal box',terms:[[42,-24],[-42,-24],[28,64],[-76,65]],labels:['BRASS','SILVER','GREEN','BOX BOND'],box:[-105,-100,210,200]},
    devicebox: {name:'Single-pole switch in metal box',terms:[[42,-28],[42,22],[-28,64],[-76,65]],labels:['BRASS 1','BRASS 2','GREEN','BOX BOND'],box:[-105,-100,210,200]},
    junctionbox: {name:'Open junction box',terms:[[-45,-20],[-45,35],[45,-20],[65,60]],labels:['HOT SPLICE','NEUTRAL','GROUND','BOX BOND'],box:[-105,-90,210,180]},
    pullbox: {name:'Open pull box',terms:[[-140,-55],[-140,0],[-140,55],[140,-55],[140,0],[140,55],[55,65]],labels:['IN · H','IN · N','IN · G','OUT · H','OUT · N','OUT · G','BOX BOND'],box:[-150,-90,300,180]},
    wireconnector: {name:'Splice connector',terms:[[0,0]],labels:['CONNECTOR'],box:[-40,-25,80,50]},
    cableend: {name:'Outgoing cable',terms:[[-78,-46],[-88,0],[-78,46]],labels:['HOT','NEUTRAL','GROUND'],box:[-95,-85,190,170]},
    buildingload: {name:'Light fixture socket',terms:[[48,22],[-48,22],[0,78]],labels:['BRASS','SILVER','GROUND'],box:[-90,-100,180,200]}
  };
  const isPart=p=>!!defs[p.type];
  function terminalKind(p,k) {
    if(p.type==='outletbox')return ['h','n','g','g'][k];
    if(p.type==='devicebox')return ['h','h','g','g'][k];
    if(p.type==='junctionbox')return ['h','n','g','g'][k];
    if(p.type==='pullbox')return ['h','n','g','h','n','g','g'][k];
    if(p.type==='wireconnector')return (p.ports?.[0]||'').startsWith('n')?'n':(p.ports?.[0]||'').startsWith('h')?'h':'g';
    return ['h','n','g'][k];
  }
  function markup(p) {
    const d=defs[p.type];let h='';
    if(['outletbox','devicebox','junctionbox','pullbox'].includes(p.type)) {
      const b=d.box;
      h='<rect class="building-shell" x="'+(b[0]+5)+'" y="'+(b[1]+5)+'" width="'+(b[2]-10)+'" height="'+(b[3]-10)+'" rx="9"/>';
      h+='<path class="steel-detail" d="M'+(b[0]+12)+' '+(b[1]+20)+' h12 M'+(b[0]+12)+' '+(b[1]+30)+' h12"/>';
      [-65,65].forEach(x=>{h+='<circle class="box-knockout" cx="'+x+'" cy="-77" r="10"/>';});
    }
    if(p.type==='outletbox'||p.type==='devicebox') {
      h+='<rect class="mounting-strap" x="-13" y="-85" width="26" height="171" rx="5"/><ellipse class="strap-hole" cx="0" cy="-76" rx="4" ry="6"/><ellipse class="strap-hole" cx="0" cy="77" rx="4" ry="6"/>';
      h+='<rect class="device-side" x="-41" y="-53" width="82" height="107" rx="5"/><rect class="building-device" x="-29" y="-57" width="58" height="111" rx="9"/>';
      if(p.type==='outletbox')h+=[-30,19].map(y=>'<path class="receptacle-face" d="M-19 '+(y-7)+' Q0 '+(y-17)+' 19 '+(y-7)+' v35 Q0 '+(y+43)+' -19 '+(y+35)+'z"/><rect x="-12" y="'+y+'" width="4" height="14" rx="1" fill="#18202b"/><rect x="9" y="'+y+'" width="4" height="11" rx="1" fill="#18202b"/><path d="M-5 '+(y+25)+' a5 5 0 0 1 10 0 v4 h-10z" fill="#18202b"/>').join('');
      else h+='<rect class="switch-slot" x="-14" y="-36" width="28" height="66" rx="4"/><rect class="building-toggle" x="-10" y="'+(p.closed?-32:2)+'" width="20" height="27" rx="3"/><text class="building-state" x="0" y="-63">'+(p.closed?'ON':'OFF')+'</text>';
    }
    if(p.type==='trainingfeed'||p.type==='cableend') {
      const flip=p.type==='cableend'?-1:1;
      h='<g transform="scale('+flip+',1)"><rect class="cable-sheath" x="-90" y="-24" width="100" height="48" rx="8"/>';
      const colors=['#262b35','#ecedf1','#70bb8d'];
      [[78,-46],[88,0],[78,46]].forEach(([x,y],k)=>{
        const sy=(k-1)*13;
        h+='<path class="cable-tail-outline" d="M0 '+sy+' Q32 '+sy+' 45 '+y+' H'+x+'"/><path class="cable-tail" stroke="'+colors[k]+'" d="M0 '+sy+' Q32 '+sy+' 45 '+y+' H'+x+'"/><path class="copper-tip" d="M'+(x-12)+' '+y+' H'+x+'"/>';
      });h+='</g>';
      h+='<text class="building-small" x="0" y="76">'+(p.type==='trainingfeed'?'ISOLATED SUPPLY CABLE':'OUTGOING CABLE')+'</text>';
    }
    if(p.type==='buildingload') h+='<circle class="fixture-base" cx="0" cy="28" r="53"/><rect class="socket-base" x="-23" y="-2" width="46" height="38" rx="5"/><path class="socket-ridges" d="M-22 7 h44 M-22 16 h44 M-22 25 h44"/><circle class="building-glow" cx="0" cy="-35" r="73" fill="url(#glowGrad)" opacity="0"/><path class="building-lamp" d="M-18 0 v-12 C-58 -55 -30 -87 0 -87 C30 -87 58 -55 18 -12 V0z"/><path class="bulb-filament" d="M-9 -6 l-7 -29 16 8 16 -8 -7 29"/>';
    if(p.type==='junctionbox')h+=[[-45,-20],[-45,35],[45,-20]].map(([x,y])=>'<rect class="building-connector" x="'+(x-20)+'" y="'+(y-13)+'" width="40" height="26" rx="5"/>').join('');
    if(p.type==='pullbox')h+='<text class="building-small" x="0" y="-65">OPEN PULL BOX</text>';
    if(p.type==='wireconnector')h='<rect class="building-connector" x="-22" y="-16" width="44" height="32" rx="7"/><path class="connector-ports" d="M-13 -7 v14 M0 -7 v14 M13 -7 v14"/>';
    d.terms.forEach(([x,y],k)=>{
      const kind=terminalKind(p,k),screw=!['trainingfeed','cableend','pullbox','wireconnector'].includes(p.type);
      if(screw)h+='<circle class="terminal-screw screw-'+kind+'" cx="'+x+'" cy="'+y+'" r="7"/><path class="screw-slot" d="M'+(x-3)+' '+(y+3)+' l6 -6"/>';
      let tx=x,ty=y-13,anchor='middle';
      if(p.type==='outletbox'||p.type==='devicebox') {if(k<2){tx=x<0?x-12:x+12;ty=y+3;anchor=x<0?'end':'start';}else ty=y+19;}
      if(p.type==='buildingload'){if(k<2){tx=x<0?x-12:x+12;ty=y+3;anchor=x<0?'end':'start';}else ty=y+17;}
      if(p.type!=='wireconnector')h+='<text class="building-port" x="'+tx+'" y="'+ty+'" text-anchor="'+anchor+'">'+d.labels[k]+'</text>';
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
  root.BoxWiring = { validate, defs, isPart, markup, compute, terminalKind, types:TYPES };
})(window);

