const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{},document:{write(){}}};vm.createContext(ctx);
const run=p=>vm.runInContext(fs.readFileSync(__dirname+'/../'+p,'utf8'),ctx,{filename:p});
run('cable-lab.js');ctx.CableLab=ctx.window.CableLab;run('boxes-wiring.js');ctx.BoxWiring=ctx.window.BoxWiring;run('sim.js');ctx.Sim=ctx.window.Sim;
run('course.js');ctx.COURSE=ctx.window.COURSE;for(const f of ctx.COURSE.files)run('content/'+f+'.js');
const L=ctx.CableLab,lesson=ctx.COURSE.lessons[3],copy=x=>JSON.parse(JSON.stringify(x));let count=0;
assert.equal(lesson.parts.length,20);assert.equal(lesson.parts.filter(p=>p.workbench==='cables').length,18);
for(const p of lesson.parts){
 for(const q of p.quiz){assert.ok(q.a>=0&&q.a<q.o.length);count++;}
 if(p.bench===false)continue;
 for(const d of p.demo)assert.doesNotThrow(()=>ctx.Sim.evaluate(d.state));
 const goal=ctx.Sim.evaluate(p.answer);for(const t of p.tasks){assert.ok(t.check(goal),p.id+': answer '+t.id);count++;}
 const start=ctx.Sim.evaluate(p.start);assert.ok(!p.tasks.every(t=>t.check(start)),p.id+': start should need work');count++;
 assert.ok(L.markup(p.start.parts[0]).includes('cl-work-surface'));
}
const start=id=>copy(lesson.parts.find(p=>p.id==='cables-'+id).start.parts[0]);
let p=start('conductor-cut');L.drop(p,'stripper',0,40);assert.ok(p.cut);count++;
p=start('cut');L.drop(p,'stripper',0,40);assert.ok(!p.cut);L.drop(p,'cutter',200,40);assert.ok(!p.cut);L.drop(p,'cutter',0,40);assert.ok(p.cut);count+=3;
p=start('jacket');L.action(p,'depth:deep');L.drop(p,'ripper',75,40);assert.ok(p.damaged&&!p.jacketRemoved);count++;
p=start('jacket');L.action(p,'depth:shallow');L.drop(p,'ripper',75,40);assert.ok(p.jacketRemoved&&!p.damaged);count++;
p=start('strip');L.action(p,'gauge:14');L.action(p,'length:12');L.drop(p,'stripper',240,4);assert.ok(p.damaged);count++;
p=start('strip');L.action(p,'gauge:12');L.action(p,'length:20');L.drop(p,'stripper',240,4);assert.ok(!p.stripped);L.action(p,'length:12');L.drop(p,'stripper',240,4);assert.ok(p.stripped&&!p.damaged);count+=2;
p=start('repair');L.action(p,'accept');assert.ok(!p.accepted);L.action(p,'trim');L.action(p,'gauge:12');L.drop(p,'stripper',240,4);L.action(p,'accept');assert.ok(p.accepted&&p.trimmed&&!p.damaged);count+=2;
p=start('wire-nut');L.action(p,'tug');assert.ok(!p.secure);L.drop(p,'wirenut',240,4);L.action(p,'twist');L.action(p,'tug');assert.ok(p.secure);count+=2;
p=start('terminal');L.drop(p,'screwdriver',240,4);L.action(p,'tug');assert.ok(!p.secure);L.action(p,'twist');L.drop(p,'screwdriver',240,4);L.action(p,'tug');assert.ok(p.secure);count+=2;
p=start('fish-feed');L.drop(p,'fish',0,110);assert.ok(!p.fished);count++;
for(const target of [[-60,-50],[-60,60],[0,110]])L.drop(p,'fish',...target);
assert.ok(p.fished);L.action(p,'attach');L.drop(p,'pull',-60,60);assert.ok(p.snagged&&!p.pulled);count+=2;
L.action(p,'backoff');L.action(p,'wrap');for(const target of [[-60,60],[-60,-50],[-60,-140]])L.drop(p,'pull',...target);
assert.ok(p.pulled&&p.recovered);count++;
assert.ok(!L.safeSegment([-60,-50],[100,60]));assert.ok(L.safeSegment([-60,-50],[-60,60]));count+=2;
p=start('fish-plan');L.drop(p,'fish',-60,-50);assert.ok(!p.fishIndex);count++;
console.log('Passed '+count+' cable assertions: 20 parts, 18 activities, preparation/connection sequences, fishing path and snag recovery.');
