/* content/circuits.js - Lesson 1: Electric circuits (6 parts). Edit text here; the app builds itself from this file.
   Battery terminals: index 0 is "+", index 1 is "-". Bulbs and switches: 0 = left, 1 = right (before rotation). */
(function () {
const P = (id, type, x, y, rot, extra) => Object.assign({ id, type, x, y, rot: rot || 0 }, type === 'battery' ? { v: 9 } : type === 'bulb' ? { state: 'ok' } : type === 'switch' ? { closed: false } : {}, extra || {});
const W = (n, a, b) => ({ id: 'w' + n, a, b });
const ST = (parts, wires) => ({ parts, wires: wires || [] });

/* ---- reusable layouts (unwired "parts" and wired "answer") ---- */
const seriesParts = [P(1, 'battery', 500, 140), P(2, 'bulb', 760, 300, 1), P(3, 'bulb', 500, 480), P(4, 'bulb', 240, 300, 1)];
const seriesWires = [W(1, '1:1', '2:0'), W(2, '2:1', '3:1'), W(3, '3:0', '4:1'), W(4, '4:0', '1:0')];
const parParts = n => [P(1, 'battery', 500, 120)].concat(Array.from({ length: n }, (_, i) => P(2 + i, 'bulb', 500, n === 2 ? 280 + 160 * i : 260 + 120 * i)));
const parWires = n => { const w = []; for (let i = 0; i < n; i++) { w.push(W(2 * i + 1, '1:0', (2 + i) + ':0')); w.push(W(2 * i + 2, '1:1', (2 + i) + ':1')); } return w; };
const mixParts = [P(1, 'battery', 500, 120), P(2, 'bulb', 500, 260), P(3, 'bulb', 340, 420), P(4, 'bulb', 660, 420)];
const mixWires = [W(1, '1:0', '2:0'), W(2, '1:1', '2:1'), W(3, '1:0', '3:0'), W(4, '1:1', '4:1'), W(5, '3:1', '4:0')];
const loopParts = [P(1, 'battery', 500, 140), P(2, 'bulb', 800, 300, 1)];

/* ---- helpers used by task checks ---- */
const near = (a, b, t) => Math.abs(a - b) <= t;
const sorted = s => s.bulbs.map(b => b.b).sort((x, y) => x - y);
const allLit = s => s.bulbs.length > 0 && s.lit === s.bulbs.length;

COURSE.add({
  id: 'circuits', title: 'Electric circuits',
  blurb: 'How electricity flows, and how series and parallel circuits behave. Wire real circuits, watch them light up, and read the volts and amps.',
  parts: [
  {
    id: 'circuits-1', title: 'The complete circuit', mins: 10,
    goal: 'Understand that electricity only flows around a closed loop, and wire your first working circuit.',
    demo: [
      { state: ST(loopParts), hl: [], ms: 6500, text: 'Meet the two parts. The battery is the <b>source</b>: it pushes. The bulb is the <b>load</b>: it uses the energy and turns it into light. Nothing connects them yet, so the bulb is dark.' },
      { state: ST(loopParts, [W(1, '1:1', '2:0')]), hl: ['1:0', '2:1'], ms: 7000, text: 'Wire one side with a <b>black</b> wire from the battery\'s − terminal. The pulsing circles are the two open ends. With only one wire there is no way back to the battery, so this is an <b>open circuit</b> and nothing flows.' },
      { state: ST(loopParts, [W(1, '1:1', '2:0'), W(2, '2:1', '1:0')]), hl: [], ms: 7500, text: 'Connect the last two ends with a <b>red</b> wire back to the + terminal. The loop is <b>complete</b>: current flows and the bulb lights. The glowing dots show the current moving.' },
      { state: ST(loopParts, [W(1, '1:1', '2:0'), W(2, '2:1', '1:0')]), hl: ['1:0'], ms: 8000, text: 'Follow the dots. Conventional current leaves the battery\'s <b>+</b> terminal, travels through the bulb, and returns to the <b>−</b> terminal. It never "gets used up"; the energy is, the charge goes around.' },
      { state: ST(loopParts, [W(1, '1:1', '2:0')]), hl: ['1:0', '2:1'], ms: 7500, text: 'Cut the loop anywhere (a broken wire, a loose terminal, an open switch) and the current stops <b>everywhere</b> in the circuit, not just at the break.' },
      { state: ST(loopParts, [W(1, '1:1', '2:0'), W(2, '2:1', '1:0')]), hl: [], ms: 7000, text: 'That is the whole idea: <b>source, load, and a complete path back</b>. Now it is your turn to build one.' }
    ],
    learn: [
      'A circuit is a <b>loop</b>: source (battery) → load (bulb) → back to the source.',
      'Conventional current flows out of the battery\'s <b>+</b> terminal, through the load, and into <b>−</b>.',
      'The <b>load</b> turns electrical energy into something useful: light, heat, motion.',
      'Wire colors matter: <b>red is positive (+)</b>, <b>black is negative (−)</b>. Part 2 shows what happens if you mix them.',
      'An <b>open circuit</b> has a break, so no current flows anywhere in the loop.',
      'A wire straight from + to − with no load is a <b>short circuit</b>. In real life that means heat and fire.'
    ],
    tasks: [
      { id: 't1', text: 'Add a <b>battery</b> and a <b>light bulb</b> from the toolbar.', check: s => s.batteries >= 1 && s.bulbs.length >= 1 },
      { id: 't2', text: 'Pick <b>Red +</b> and drag from the battery\'s + terminal to the bulb. Pick <b>Black −</b> and drag from the other bulb terminal back to the battery\'s −. <b>Light the bulb.</b>', check: s => s.lit >= 1 },
      { id: 't3', text: 'Break the loop: click a wire, press <b>Delete</b>, and watch the bulb go dark.', check: (s, m) => { if (s.lit >= 1) m.lit = true; return !!m.lit && s.bulbs.length >= 1 && s.lit === 0 && s.wires >= 1; } }
    ],
    help: 'Pick a wire color in the toolbar (red = +, black = −), then drag from one small circle (a terminal) to another. On a touch screen, tap one terminal and then the other. Press W to switch colors.',
    start: ST([]), answer: ST(loopParts, [W(1, '1:1', '2:0'), W(2, '2:1', '1:0')]),
    quiz: [
      { q: 'A bulb is wired to only <b>one</b> terminal of a battery. What happens?', o: ['It glows dimly', 'Nothing: the loop is not complete', 'It glows brighter than normal', 'The battery drains quickly'], a: 1, why: 'Current needs a complete path out of one terminal and back into the other. With one connection there is no return path.' },
      { q: 'Outside the battery, conventional current flows…', o: ['from − to + through the load', 'from + through the load to −', 'in both directions at once', 'only through the wires, not the bulb'], a: 1, why: 'By convention, current leaves the + terminal, flows through the load, and returns to the − terminal.' }
    ]
  },

      {
        id: 'circuits-polarity', title: 'Positive, negative, and what blows up', mins: 10,
        goal: 'Learn wire polarity: red is positive, black is negative, and mixing them destroys the battery.',
        learn: [
          '<b>Red wires are positive (+).</b> They run from the battery\'s + terminal toward the load.',
          '<b>Black wires are negative (−).</b> They run from the load back to the battery\'s − terminal.',
          'Between two loads in series a wire is neither side, so pick one color, but never put a red and a black wire on the same connection.',
          '<b>Never let positive touch negative.</b> A red wire joined to a black wire, a red wire on the negative side, or + wired straight to − is a <b>short circuit</b>. On a real battery that means heat, fire, or an explosion.',
          '<b>Trade note:</b> in building wiring the colors mean something different (black and red are hot, white is neutral, green or bare is ground). Never trust a color alone: check the code and test with a meter.'
        ],
        tasks: [
          { id: 't1', text: 'Wire a bulb correctly: a <b>red</b> wire on the + side and a <b>black</b> wire on the − side. <b>Light it.</b>', check: s => s.lit >= 1 && s.faults.length === 0 && s.wiresRed >= 1 && s.wiresBlack >= 1 },
          { id: 't2', text: 'Make the mistake on purpose: select a wire and press <b>Make it black/red</b> so a red wire sits on the − side, or run a red wire to the − terminal. <b>Watch the battery blow.</b>', check: s => s.blownBat >= 1 },
          { id: 't3', text: 'Fix the wiring, select the battery and press <b>Replace battery</b>, then light the bulb again.', check: (s, m) => { if (s.blownBat >= 1) m.blew = true; return !!m.blew && s.blownBat === 0 && s.lit >= 1 && s.faults.length === 0; } }
        ],
        start: ST(loopParts), answer: ST(loopParts, [W(1, '1:1', '2:0'), W(2, '2:1', '1:0')]),
        quiz: [
          { q: 'Which wire connects to the battery\'s <b>+</b> terminal?', o: ['Red', 'Black', 'Either one', 'Green'], a: 0, why: 'Red is the positive wire and black is the negative wire. Keep them on their own sides.' },
          { q: 'A red (+) wire touches a black (−) wire. What happens?', o: ['Nothing', 'The bulb gets brighter', 'A short circuit: huge current, and the battery blows', 'It turns into a parallel circuit'], a: 2, why: 'Positive and negative joined with no load between them gives a path with almost no resistance. The current is enormous and the battery is destroyed.' }
        ]
      },

  {
    id: 'circuits-2', title: 'Switches: opening and closing the loop', mins: 8,
    goal: 'Use a switch to control a circuit, and learn why where you put it matters.',
    learn: [
      'A switch is a <b>deliberate gap</b> you can open or close. Closed = complete loop. Open = open circuit.',
      'A switch controls a load by being in <b>series</b> with it, in the same loop.',
      'A switch wired <b>across</b> a bulb (in parallel) does the opposite of what you want: closing it shorts the bulb out.',
      '<b>Trade note:</b> in real house wiring the switch breaks the <b>hot</b> (ungrounded) conductor so the fixture is dead when the switch is off.'
    ],
    tasks: [
      { id: 't1', text: 'Build a loop with a <b>battery</b>, a <b>switch</b> and a <b>bulb</b>. Close the switch so the bulb is lit.', check: (s, m) => { const lit = s.lit >= 1 && s.switches.some(x => x.closed); if (lit) m.on = true; return lit; } },
      { id: 't2', text: 'Click the switch to <b>open</b> it. The bulb goes dark.', check: (s, m) => !!m.on && s.switches.length >= 1 && s.switches.every(x => !x.closed) && s.bulbs.length >= 1 && s.lit === 0 && s.wires >= 3 }
    ],
    start: ST([P(1, 'battery', 500, 140), P(2, 'switch', 240, 300, 1), P(3, 'bulb', 760, 300, 1)]),
    answer: ST([P(1, 'battery', 500, 140), P(2, 'switch', 240, 300, 1, { closed: true }), P(3, 'bulb', 760, 300, 1)], [W(1, '1:1', '3:0'), W(2, '3:1', '2:1'), W(3, '2:0', '1:0')]),
    quiz: [
      { q: 'Which switch position turns a bulb off without any side effects?', o: ['In series with the bulb', 'Wired across the bulb', 'Wired across the battery', 'It does not matter'], a: 0, why: 'A series switch opens the only path. Across the bulb it shorts it out, and across the battery it is a short circuit.' },
      { q: 'A switch is wired directly across the battery terminals. Closing it creates…', o: ['a brighter bulb', 'a short circuit', 'a parallel circuit with no effect', 'a safer circuit'], a: 1, why: 'Current takes the path with almost no resistance: a huge current flows, heating the wire and draining the battery.' }
    ]
  },

  {
    id: 'circuits-3', title: 'Series circuits', mins: 12,
    goal: 'Wire several bulbs in a single loop and see how they share the voltage.',
    learn: [
      'In a <b>series</b> circuit there is only <b>one path</b>. The same current flows through every part.',
      'The battery voltage is <b>shared</b>: three identical bulbs on 9 V get 3 V each, so each is dimmer.',
      'More bulbs in series = <b>dimmer</b> bulbs (more total resistance, less current).',
      'If <b>one</b> part fails or is removed, the loop is broken and <b>everything</b> goes out. Old strings of holiday lights worked this way.'
    ],
    tasks: [
      { id: 't1', text: 'Wire <b>three bulbs in series</b> with a 9 V battery so all three glow equally (and dimly).', check: (s, m) => { const o = s.bulbs.length >= 3 && allLit(s) && s.bulbs.every(b => near(b.b, s.bulbs[0].b, 0.03)) && s.bulbs[0].b < 0.6; if (o) m.s3 = true; return o; } },
      { id: 't2', text: 'Select one bulb and press <b>Unscrew bulb</b>. Every bulb goes dark.', check: (s, m) => !!m.s3 && s.off >= 1 && s.lit === 0 && s.bulbs.length >= 3 }
    ],
    start: ST(seriesParts.slice(0, 1).concat([P(2, 'bulb', 760, 300, 1), P(3, 'bulb', 500, 480), P(4, 'bulb', 240, 300, 1)])),
    answer: ST(seriesParts, seriesWires),
    quiz: [
      { q: 'Three identical bulbs are in series on a 9 V battery. About how many volts across <b>each</b> bulb?', o: ['9 V', '4.5 V', '3 V', '27 V'], a: 2, why: 'Series parts share the voltage: 9 V ÷ 3 = 3 V each. Turn on "Numbers" to check it.' },
      { q: 'In a series circuit the <b>current</b> is…', o: ['the same everywhere', 'largest at the battery', 'split between the bulbs', 'zero in the middle bulb'], a: 0, why: 'There is only one path, so every part carries the same current.' }
    ]
  },

  {
    id: 'circuits-4', title: 'Parallel circuits', mins: 12,
    goal: 'Give every bulb its own path to the battery and see why houses are wired this way.',
    learn: [
      'In a <b>parallel</b> circuit each branch connects <b>directly across</b> the battery, so every branch gets the <b>full voltage</b>.',
      'Each bulb is as bright as if it were alone, but the battery supplies the <b>sum</b> of the branch currents.',
      'If one branch opens (a bulb burns out), the other branches <b>keep working</b>.',
      '<b>Trade note:</b> outlets and lights in a building are wired in parallel for exactly this reason. Add more branches and the total current on the circuit grows, which is why breakers exist.'
    ],
    tasks: [
      { id: 't1', text: 'Wire <b>three bulbs in parallel</b> across the battery. All three should glow at full brightness.', check: (s, m) => { const o = s.bulbs.length >= 3 && allLit(s) && s.bulbs.every(b => b.b > 0.9); if (o) m.p3 = true; return o; } },
      { id: 't2', text: 'Unscrew <b>one</b> bulb. The other two stay lit.', check: (s, m) => !!m.p3 && s.off >= 1 && s.lit >= 2 && s.lit === s.bulbs.length - s.off }
    ],
    start: ST(parParts(3)), answer: ST(parParts(3), parWires(3)),
    quiz: [
      { q: 'Three 10 Ω bulbs in parallel on 9 V each draw 0.9 A. How much current does the <b>battery</b> supply?', o: ['0.9 A', '1.8 A', '2.7 A', '0.3 A'], a: 2, why: 'Parallel branch currents add: 0.9 + 0.9 + 0.9 = 2.7 A.' },
      { q: 'One bulb in your house burns out and the others stay on. The lights are wired…', o: ['in series', 'in parallel', 'as a short circuit', 'as an open circuit'], a: 1, why: 'Each bulb has its own path across the supply, so one open branch does not stop the rest.' }
    ]
  },

  {
    id: 'circuits-5', title: 'Read and build a diagram', mins: 15,
    goal: 'Look at a circuit diagram, recognise series and parallel, and build it. Match all four diagrams below.',
    learn: [
      'To read a diagram, find the <b>loops</b>. If a part is alone in its loop with the battery, it sees the full voltage.',
      'Parts that <b>share the same two junction points</b> are in parallel. Parts connected end to end are in series.',
      'A <b>combination</b> circuit has both. Solve the parallel and series pieces one at a time.',
      'Use the 9 V battery and watch the brightness: it tells you how much voltage each bulb gets.'
    ],
    refs: [
      { key: 'A', label: 'A: three in series', state: ST(seriesParts, seriesWires) },
      { key: 'B', label: 'B: two in series, in parallel with one', state: ST(mixParts, mixWires) },
      { key: 'C', label: 'C: two in parallel', state: ST(parParts(2), parWires(2)) },
      { key: 'D', label: 'D: three in parallel', state: ST(parParts(3), parWires(3)) }
    ],
    tasks: [
      { id: 'A', text: 'Build <b>A</b>: three bulbs in series, all lit and dim.', check: s => s.bulbs.length === 3 && allLit(s) && sorted(s)[2] - sorted(s)[0] < 0.04 && sorted(s)[2] < 0.6 },
      { id: 'B', text: 'Build <b>B</b>: one bulb on its own branch (bright) beside two in series (dim).', check: s => { const b = sorted(s); return s.bulbs.length === 3 && allLit(s) && near(b[0], b[1], 0.04) && b[2] > 0.9 && b[1] < 0.6; } },
      { id: 'C', text: 'Build <b>C</b>: two bulbs in parallel, both bright.', check: s => s.bulbs.length === 2 && allLit(s) && sorted(s)[0] > 0.9 },
      { id: 'D', text: 'Build <b>D</b>: three bulbs in parallel, all bright.', check: s => s.bulbs.length === 3 && allLit(s) && sorted(s)[0] > 0.9 }
    ],
    start: ST([]), answer: null,
    quiz: [
      { q: 'In diagram B, which bulb is <b>brightest</b>?', o: ['One of the two in series', 'The bulb alone on its own branch', 'They are all equal', 'The one closest to the battery'], a: 1, why: 'The lone bulb is connected straight across the battery and gets all 9 V. The two in series split 9 V (4.5 V each).' },
      { q: 'How can you tell two bulbs are in <b>parallel</b>?', o: ['They are drawn next to each other', 'They connect to the same two points', 'Current passes through one then the other', 'They are the same brightness'], a: 1, why: 'Parallel parts share both end points, so each has the same voltage across it.' }
    ]
  },

  {
    id: 'circuits-6', title: 'Voltage, current and power', mins: 12,
    goal: 'Read the numbers on a working circuit and use Ohm\'s law to predict them.',
    learn: [
      '<b>Ohm\'s law:</b> V = I × R. Here each bulb is 10 Ω, so 9 V across it gives I = 9 ÷ 10 = <b>0.9 A</b>.',
      '<b>Power:</b> P = V × I (watts). 9 V × 0.9 A = <b>8.1 W</b>, which is a bulb at full brightness.',
      'Double the voltage across a fixed resistance and the power goes up <b>four times</b> (P = V²/R).',
      'Too much power burns a bulb out. Select a bulb to see its live volts, amps and watts.'
    ],
    tasks: [
      { id: 't1', text: 'Light a bulb with one battery, then <b>click the bulb</b> and read its V, A and W.', check: s => s.sel === 'bulb' && s.lit >= 1 },
      { id: 't2', text: 'Overload it: put <b>two batteries in series</b> (+ of one to − of the other) with one bulb. Watch it burn out.', check: s => s.blown >= 1 }
    ],
    start: ST([P(1, 'battery', 500, 140), P(2, 'bulb', 800, 300, 1)]), answer: ST(loopParts, [W(1, '1:1', '2:0'), W(2, '2:1', '1:0')]),
    quiz: [
      { q: '9 V across a 10 Ω bulb. What is the current?', o: ['0.9 A', '1.1 A', '90 A', '9 A'], a: 0, why: 'I = V ÷ R = 9 ÷ 10 = 0.9 A.' },
      { q: 'You double the voltage across the same bulb. The power becomes…', o: ['the same', '2 times', '4 times', '8 times'], a: 2, why: 'P = V²/R. Doubling V quadruples P. That is why 18 V burns out a 9 V bulb.' }
    ]
  }
  ]
});
})();
