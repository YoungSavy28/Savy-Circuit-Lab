/* content/_template.js - COPY THIS FILE to start a new lesson.
   1. Save a copy as content/<name>.js     (example: content/wire-sizes.js)
   2. Add '<name>' to the FILES list in course.js
   3. Fill in the lesson and its parts below. Delete what you don't need.

   A LESSON is a big topic. It is split into PARTS (short steps). Every part can have:
     goal   one sentence
     learn  bullet points (HTML allowed)
     body   optional paragraph(s) of HTML shown under the goal
     demo   optional animated walkthrough on the workbench (see content/circuits.js, part 1)
     tasks  goals that check themselves while the student builds on the workbench
     quiz   multiple-choice questions with an explanation
     bench  set to false for reading-only parts (no workbench), e.g. code rules or tool safety
   Part ids must be unique across the whole course, so start them with your lesson id. */
COURSE.add({
  id: 'my-lesson', title: 'My next lesson',
  blurb: 'One or two sentences that show on the landing page card.',
  parts: [

    /* ---- A reading-only part (no workbench). The part is complete once every quiz question is answered. ---- */
    {
      id: 'my-lesson-1', title: 'First part', mins: 5, bench: false,
      goal: 'What the student should understand after this part.',
      body: '<p>Optional paragraph of explanation. You can use <b>bold</b>, lists, and links.</p>',
      learn: [
        'Key idea number one.',
        'Key idea number two.'
      ],
      tasks: [],
      quiz: [
        { q: 'A question?', o: ['Wrong', 'Right', 'Wrong', 'Wrong'], a: 1, why: 'Why the answer is right.' }
      ]
    },

    /* ---- A part that uses the workbench ----
       start:  parts placed when the student presses "Give me the parts"  { parts:[...], wires:[...] }
       answer: a finished circuit shown by "Show me the answer" (use null to hide the button)
       tasks:  check(stats, memory) returns true when the goal is met. 'stats' has:
               stats.bulbs [{b: brightness 0-1, lit, state:'ok'|'off'|'blown', V, I, P}], stats.lit, stats.off, stats.blown,
               stats.batteries, stats.switches [{closed}], stats.wires, stats.shorts, stats.sel (type of selected part)
               'memory' is an object you can write to when a goal needs "first this, then that". */
    {
      id: 'my-lesson-2', title: 'Build something', mins: 10,
      goal: 'Light one bulb.',
      learn: ['A short fact about what they are about to build.'],
      start: { parts: [], wires: [] },
      answer: null,
      tasks: [
        { id: 't1', text: 'Light a bulb.', check: s => s.lit >= 1 }
      ],
      quiz: []
    }

  ]
});
