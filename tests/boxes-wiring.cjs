const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const dir = __dirname + '/../';
const context = { window: {}, document: { write() {} } };
vm.createContext(context);
const run = p => vm.runInContext(fs.readFileSync(dir + p, 'utf8'), context, { filename: p });
run('course.js'); context.COURSE = context.window.COURSE;
for (const f of context.COURSE.files) run('content/' + f + '.js');
run('boxes-wiring.js');
const { validate } = context.window.BoxWiring;
assert.equal(context.COURSE.lessons.length, 3);
assert.equal(new Set(context.COURSE.allParts().map(p => p.id)).size, context.COURSE.allParts().length);
const lesson = context.COURSE.lessons[2];
assert.equal(lesson.parts.length, 7);
let count = 0;
for (const p of lesson.parts) {
  assert.equal(context.COURSE.find(p.id), p);
  assert.equal(p.lesson, lesson);
  for (const q of p.quiz) {
    assert.ok(Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length);
    assert.equal(new Set(q.o).size, q.o.length);
  }
  if (!p.wiring) continue;
  const s = p.wiring, answer = s.answer.map(w => w.slice());
  assert.equal(validate(s, answer).ok, true, s.id + ': answer accepted'); count++;
  assert.equal(validate(s, []).ok, false, s.id + ': empty rejected'); count++;
  assert.equal(validate(s, answer.filter(w => !w.includes('bond'))).ok, false, s.id + ': missing box bond rejected'); count++;
  assert.equal(validate(s, answer.slice(1)).ok, false, s.id + ': incomplete rejected'); count++;
  const wrongColor = answer.map(w => w.slice()); wrongColor[0][2] = 'g';
  assert.equal(validate(s, wrongColor).ok, false, s.id + ': incorrect conductor rejected'); count++;
  assert.equal(validate(s, answer.concat([['feed-h', 'feed-n', 'h']])).ok, false, s.id + ': added short rejected'); count++;
  assert.equal(validate(s, [['feed-h','feed-n','h']]).ok, false, s.id + ': hot-neutral cross rejected'); count++;
  assert.equal(validate(s, [['feed-n','bond','n']]).ok, false, s.id + ': neutral-ground cross rejected'); count++;
  assert.equal(validate(s, answer.concat([answer[0]])).ok, false, s.id + ': duplicate rejected'); count++;
  assert.equal(validate(s, [['unknown', 'bond', 'g']]).ok, false, s.id + ': unknown terminal rejected'); count++;
  if (s.id === 'switch') {
    const reverse = answer.map(w => w.map(v => v === 'sw-a' ? 'sw-b' : v === 'sw-b' ? 'sw-a' : v));
    assert.equal(validate(s, reverse).ok, true, 'reversed mechanical switch terminals accepted'); count++;
    assert.equal(validate(s, [['feed-h','light-h','h']]).ok, false, 'bypassed switch rejected'); count++;
  }
}
console.log('Passed registry/schema checks and ' + count + ' wiring validation cases.');
