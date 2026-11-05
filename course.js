/* course.js - the course registry.
   Structure:  COURSE -> Lessons (big topics) -> Parts (short steps inside a lesson).

   TO ADD A NEW LESSON LATER:
     1. Copy content/_template.js to content/<your-name>.js and fill it in.
     2. Add '<your-name>' to the FILES list below (no .js).
   That's it. The landing page, course map, progress bar and navigation all update by themselves. */
(function () {
  const FILES = ['circuits'];                 // <- add new lesson files here, in the order you learned them

  const C = window.COURSE = {
    title: 'Savy Circuit Lab',
    lessons: [],
    // Shown as "coming soon" cards. Replace or delete these as you add real lessons.
    upcoming: ['To be announced'],
    files: FILES
  };
  C.add = function (lesson) { lesson.parts.forEach(p => { p.lesson = lesson; }); C.lessons.push(lesson); };
  C.allParts = () => C.lessons.reduce((a, l) => a.concat(l.parts), []);
  C.sandbox = {
    id: 'sandbox', sandbox: true, title: 'Free build', mins: 0, lesson: null,
    goal: 'No rules. Add as many bulbs, batteries and switches as you like, and try anything.',
    learn: ['Add as many bulbs as you want: a bigger circuit is just more parts and more wires.', 'Use <b>Junction</b> parts when you want several wires to meet at one point.', 'Turn <b>Numbers</b> on to see volts and amps. Try mixing series and parallel.'],
    tasks: [], start: { parts: [], wires: [] }, answer: null, quiz: []
  };
  C.find = id => id === 'sandbox' ? C.sandbox : C.allParts().find(p => p.id === id);
  FILES.forEach(f => document.write('<script src="content/' + f + '.js"><\/script>'));
})();
