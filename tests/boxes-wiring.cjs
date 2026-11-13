const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const dir = __dirname + '/../';
const context = { window: {}, document: { write() {} } };
vm.createContext(context);
const run = p => vm.runInContext(fs.readFileSync(dir + p, 'utf8'), context, { filename:p });
run('boxes-wiring.js'); context.BoxWiring=context.window.BoxWiring;
run('sim.js'); context.Sim=context.window.Sim;
run('course.js'); context.COURSE=context.window.COURSE;
for(const f of context.COURSE.files) run('content/'+f+'.js');
const copy = s => JSON.parse(JSON.stringify(s));
const evaluate = s => context.Sim.evaluate(copy(s));
assert.equal(context.COURSE.lessons.length,3);
const parts=context.COURSE.allParts(); assert.equal(new Set(parts.map(p=>p.id)).size,parts.length);
const lesson=context.COURSE.lessons[2];assert.equal(lesson.parts.length,13);
const work=lesson.parts.filter(p=>p.workbench==='building');assert.equal(work.length,10);
let checks=0;
for(const p of lesson.parts){
  for(const q of p.quiz){assert.ok(q.a>=0 && q.a<q.o.length); checks++;}
  if(p.bench===false) continue;
  assert.ok(p.start && p.answer && p.demo.length>=3);
  const solved=evaluate(p.answer), mem={};
  assert.ok(solved.building.safe,p.id+': solution must be safe');
  for(const t of p.tasks.filter(t=>t.live)){assert.ok(t.check(solved,mem),p.id+': solution task '+t.id);checks++;}
  const empty=copy(p.answer);empty.wires=[];
  assert.equal(evaluate(empty).building.correct,false,p.id+': empty rejected');checks++;
  const crossed=copy(empty);crossed.wires=[{id:'bad',a:'1:0',b:'1:1',c:'h'}];
  assert.equal(evaluate(crossed).building.safe,false,p.id+': hot-neutral cross rejected');checks++;
  const badColor=copy(p.answer);badColor.wires[0].c='g';
  assert.equal(evaluate(badColor).building.correct,false,p.id+': wrong color rejected');checks++;
  const missingFeed=copy(p.answer);missingFeed.parts=missingFeed.parts.filter(p=>p.type!=='trainingfeed');
  assert.equal(evaluate(missingFeed).building.correct,false,p.id+': deleted supply rejected');checks++;
  if(solved.building.correct){
    const bond=p.answer.parts.flatMap(p=>(p.ports||[]).map((id,k)=>id==='bond'?p.id+':'+k:null)).find(Boolean);
    const missing=copy(p.answer);missing.wires=missing.wires.filter(w=>w.a!==bond && w.b!==bond);
    assert.equal(evaluate(missing).building.correct,false,p.id+': missing box bond rejected');checks++;
  }
  for(const d of p.demo) assert.doesNotThrow(()=>evaluate(d.state));
}
const sw=work.find(p=>p.id==='boxes-switch-return');
const reverse=copy(sw.answer);reverse.wires.forEach(w=>{for(const k of ['a','b']) w[k]=w[k]==='2:0'?'2:1':w[k]==='2:1'?'2:0':w[k];});
assert.equal(evaluate(reverse).building.correct,true);checks++;
const toggle=work.find(p=>p.id==='boxes-switch-test'), mem={};
let s=evaluate(toggle.start);assert.equal(s.building.functional,false);
assert.equal(toggle.tasks[2].check(s,mem),false,'opening before closing must not satisfy sequence');checks++;
s=evaluate(toggle.answer);assert.equal(s.building.functional,true);
assert.equal(toggle.tasks[1].check(s,mem),true);checks++;
s=evaluate(toggle.start);assert.equal(toggle.tasks[2].check(s,mem),true);checks++;
for(const l of context.COURSE.lessons.slice(0,2))for(const p of l.parts){if(p.start)assert.doesNotThrow(()=>evaluate(p.start));if(p.answer)assert.doesNotThrow(()=>evaluate(p.answer));}
const bulb={parts:[{id:1,type:'battery',x:100,y:100,v:9},{id:2,type:'bulb',x:300,y:100}],wires:[{id:'w1',a:'1:0',b:'2:0',c:'r'},{id:'w2',a:'2:1',b:'1:1',c:'k'}]};
assert.equal(evaluate(bulb).lit,1,'original DC loop still lights');checks++;
const short=copy(bulb);short.wires.push({id:'w3',a:'1:0',b:'1:1',c:'r'});assert.equal(evaluate(short).blownBat,1,'original short detection still works');checks++;
console.log('Passed '+checks+' assertions, all 10 workbench activities/demos, and prior-lesson preset evaluation.');
// Device terminals must be on the hardware, not on abstract enclosure edges.
const D=context.BoxWiring.defs;
assert.equal(D.outletbox.terms[0][0],42);
assert.equal(D.outletbox.terms[1][0],-42);
assert.ok(Math.abs(D.outletbox.terms[0][0]) < Math.abs(D.outletbox.box[0]));
assert.notDeepEqual(D.outletbox.terms[2],D.outletbox.terms[3]);
for(const type of ['outletbox','devicebox','buildingload']){
  const html=context.BoxWiring.markup({type});
  assert.ok(html.includes('terminal-screw screw-h'));
  assert.ok(html.includes('terminal-screw screw-n') || type==='devicebox');
  assert.ok(html.includes('terminal-screw screw-g'));
}
const cableHTML=context.BoxWiring.markup({type:'trainingfeed'});
assert.ok(cableHTML.includes('cable-sheath') && cableHTML.includes('copper-tip'));
assert.ok(!cableHTML.includes('building-shell'));
console.log('Passed device-terminal geometry and hardware rendering checks.');
