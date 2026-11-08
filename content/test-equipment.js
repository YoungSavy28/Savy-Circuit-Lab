/* content/test-equipment.js - Lesson 2: Electrical test equipment (11 parts).
   Instruments live on the workbench: multimeter (dmm), clamp meter, proving unit, megohmmeter and a cable to test.
   Hidden faults you can put in a preset: bulb {dead:true}, wire {open:true}, switch {stuck:true}, meter {bad:true}, cable {ir: megohms}. */
(function () {
const P = (id, type, x, y, rot, extra) => Object.assign({ id, type, x, y, rot: rot || 0 },
  type === 'battery' ? { v: 9, state: 'ok' } : type === 'bulb' ? { state: 'ok' } : type === 'switch' ? { closed: false } : type === 'dmm' ? { mode: 'V', fuse: 'ok' } : type === 'megger' ? { tv: 500, testing: false } : type === 'cable' ? { ir: 500 } : {}, extra || {});
const W = (n, a, b, c, extra) => Object.assign({ id: 'w' + n, a, b, c: c || 'r' }, extra || {});
const ST = (parts, wires) => ({ parts, wires: wires || [] });
const near = (a, b, t) => Math.abs(a - b) <= t;
const DMM = s => s.meters;

/* the basic loop: battery (1), switch (2), bulb (3) */
const loopParts = closed => [P(1, 'battery', 500, 520), P(2, 'switch', 500, 140, 0, { closed: !!closed }), P(3, 'bulb', 800, 330, 1)];
const loopWires = [W(1, '1:0', '2:0'), W(2, '2:1', '3:0'), W(3, '3:1', '1:1', 'k')];
const across = (m, type) => m.across.some(a => a.type === type);

/* ---- clamp part: two bulbs, a junction so there is one "main" wire, and a switch on the second branch ---- */
const clampParts = sw => [P(1, 'battery', 500, 560), P(6, 'junction', 500, 400), P(2, 'bulb', 280, 300, 1), P(3, 'switch', 740, 220, 1, { closed: !!sw }), P(4, 'bulb', 740, 400, 1)];
const clampWires = [W(0, '1:0', '6:0'), W(1, '6:0', '2:0'), W(2, '6:0', '3:0'), W(3, '3:1', '4:0'), W(4, '2:1', '1:1', 'k'), W(5, '4:1', '1:1', 'k')];

/* ---- live-dead-live layout: loop + proving unit + meter ---- */
const ldlParts = (locked, closed) => loopParts(closed).map(p => p.id === 2 ? Object.assign(p, { locked: !!locked, label: 'Disconnect' }) : p).concat([P(4, 'dmm', 200, 250, 0, { label: 'Meter' }), P(6, 'prover', 200, 440)]);
const ldlDead = ST(ldlParts(true, false).concat([]), loopWires.concat([W(4, '4:0', '3:0'), W(5, '4:1', '3:1', 'k')]));

COURSE.add({
  id: 'test-equipment', title: 'Electrical test equipment',
  blurb: 'Multimeters, clamp meters, megohmmeters, the live-dead-live check and lockout/tagout, plus finding hidden faults. Practise on a simulated bench with real procedures.',
  parts: [

  /* ---------------- 1. overview (reading) ---------------- */
  {
    id: 'test-equipment-1', title: 'Why we test, and which tool does what', mins: 6, bench: false,
    goal: 'Know what each test instrument is for, and why you always test before you touch.',
    body: '<p>You cannot see, hear or smell electricity, so the only way to know a circuit is dead is to <b>test it</b> with an instrument you have proven works. This lesson uses simplified battery-level circuits. The habits are the real ones, but <b>your instructor and employer rules always come first</b>; this is general guidance, not a procedure to follow on real equipment.</p>',
    learn: [
      '<b>Multimeter:</b> measures <b>volts</b> (across a part), <b>amps</b> (in series with a part), <b>ohms</b> and <b>continuity</b> (on dead circuits only).',
      '<b>Clamp meter:</b> reads current in a conductor by clamping around it, with no need to open the circuit.',
      '<b>Proving unit:</b> a known live source. It proves your meter works <b>before and after</b> you test for "dead".',
      '<b>Megohmmeter ("megger"):</b> applies a high test voltage to check <b>insulation resistance</b> in megohms. A multimeter cannot do this job.',
      '<b>Live-dead-live:</b> prove the meter on a known live source, test the circuit you want dead, then prove the meter again. Never skip it.',
      '<b>Lockout/tagout:</b> turn the power off, lock the switch open, tag it, then test. A switch you cannot see is not a switch you can trust.'
    ],
    tasks: [],
    quiz: [
      { q: 'Which instrument checks the <b>insulation</b> of a cable?', o: ['Clamp meter', 'Multimeter in volts mode', 'Megohmmeter', 'Proving unit'], a: 2, why: 'A megger puts a high test voltage on the insulation and reads its resistance in megohms. A multimeter\'s tiny test current cannot reveal most insulation problems.' },
      { q: 'You read 0 V on a circuit you want to be dead. What have you actually shown?', o: ['It is dead, for certain', 'It is dead only if your meter is known to be working', 'It is probably live', 'Nothing, volts mode is wrong'], a: 1, why: 'A broken meter, blown fuse or bad lead also reads 0. That is why you prove the meter on a known live source before and after the test.' }
    ],
    help: ''
  },

  /* ---------------- 2. DC volts ---------------- */
  {
    id: 'test-equipment-volts', title: 'Multimeter 1: measuring voltage', mins: 10, tools: ['dmm'],
    goal: 'Measure DC voltage by connecting the meter across a part, and read what the sign means.',
    learn: [
      'Voltage is measured <b>across</b> a part: red lead on one side, black lead on the other. The meter is in <b>parallel</b>.',
      'Red lead = the <b>V Ω A</b> jack, black lead = <b>COM</b>. Red on the more positive point reads <b>positive</b>; swap them and you get a <b>minus sign</b>. Nothing is damaged.',
      'A lit bulb has the full supply voltage across it (9 V here). An <b>open switch</b> also has the full supply voltage across it, because it is the thing holding the current back.',
      'A voltmeter is a very high resistance (this lab uses 10 MΩ) so it hardly disturbs the circuit.',
      'Select the meter to pick a mode. Your meter is set to <b>DC volts</b>.'
    ],
    tasks: [
      { id: 't1', text: 'Wire the meter\'s <b>red lead to the battery +</b> and <b>black lead to −</b> (any wire colour works for test leads). Read about <b>+9 V</b>.', check: s => DMM(s).some(m => m.mode === 'V' && m.connected && m.v > 8) },
      { id: 't2', text: 'Swap the two leads. The reading goes <b>negative</b>.', check: s => DMM(s).some(m => m.mode === 'V' && m.connected && m.v < -8) },
      { id: 't3', text: 'Move the leads across the <b>lit bulb</b>. Read about 9 V.', check: s => s.lit >= 1 && DMM(s).some(m => m.mode === 'V' && across(m, 'bulb') && Math.abs(m.v) > 8) },
      { id: 't4', text: 'Open the switch so the bulb goes dark, then put the leads across the <b>switch</b>. Read about 9 V.', check: s => s.lit === 0 && s.switches.some(w => !w.closed) && DMM(s).some(m => m.mode === 'V' && across(m, 'switch') && Math.abs(m.v) > 8) }
    ],
    hint: 'To move a lead: click its wire and press Delete, then drag a new wire from the meter terminal to the new spot. Drag from the small circle on the meter\'s left (red) or right (black) side.',
    help: 'Give yourself the parts, then wire the meter with two test leads. Click the switch to open or close it.',
    start: ST(loopParts(true).concat([P(4, 'dmm', 160, 330)]), loopWires),
    answer: ST(loopParts(true).concat([P(4, 'dmm', 160, 330)]), loopWires.concat([W(4, '4:0', '1:0'), W(5, '4:1', '1:1', 'k')])),
    quiz: [
      { q: 'To measure the voltage across a bulb, the meter goes…', o: ['in series, in the gap in the circuit', 'in parallel, across the bulb', 'around one wire', 'only on a dead circuit'], a: 1, why: 'Voltage is the difference between two points, so you touch the meter to both sides of the part: in parallel.' },
      { q: 'The display shows <b>−9.0 V</b>. What is the most likely reason?', o: ['The battery is backwards inside', 'The leads are reversed from what you expected', 'The meter is broken', 'The circuit is shorted'], a: 1, why: 'The minus sign only means the red lead is on the more negative point. Swap the leads and it reads +9.0 V.' }
    ]
  },

  /* ---------------- 3. DC amps ---------------- */
  {
    id: 'test-equipment-amps', title: 'Multimeter 2: measuring current', mins: 10, tools: ['dmm'],
    goal: 'Measure current by putting the meter in series, and see why amps mode across a source blows the fuse.',
    learn: [
      'Current is measured <b>in series</b>: open the circuit and let the current flow <b>through</b> the meter. The meter completes the loop.',
      'In amps mode the meter is almost a plain wire (about 0.01 Ω here). Put it across a battery and you have made a <b>short circuit</b> through the meter.',
      'Meters protect themselves with a <b>fuse</b>. This lab\'s fuse blows above <b>10 A</b>. Real meters have fused amp jacks and can still be damaged by a wrong hook-up.',
      'Wrong jack or wrong mode is the classic mistake: <b>amps mode is for in series only</b>.',
      'Select the meter, then pick <b>DC amps</b> before you connect anything.'
    ],
    tasks: [
      { id: 't1', text: 'Delete one wire, then route both loose ends <b>through the meter</b> so it sits in the loop. The bulb stays lit and the meter reads about <b>0.9 A</b>.', check: s => s.lit >= 1 && DMM(s).some(m => m.mode === 'A' && m.connected && Math.abs(m.v) > 0.7) },
      { id: 't2', text: 'Add a <b>second bulb in parallel</b> with the first. The meter now reads about <b>1.8 A</b>.', check: s => s.lit >= 2 && DMM(s).some(m => m.mode === 'A' && Math.abs(m.v) > 1.5) },
      { id: 't3', text: 'On purpose: put the meter in amps mode <b>straight across the battery</b>. The fuse pops. (Simulated: it costs one click.)', check: (s, m) => { if (s.blownFuses >= 1) m.f = true; return !!m.f; } },
      { id: 't4', text: '<b>Disconnect the meter from the battery</b> (delete its leads), then select it and press <b>Replace fuse</b>.', check: (s, m) => !!m.f && s.blownFuses === 0 }
    ],
    hint: 'For task 1: delete the wire between the bulb and the battery −. Wire the bulb to the meter\'s black lead (COM), and the meter\'s red lead to the battery −. Current just has to flow through the meter.',
    help: 'Set the meter to DC amps first. Build the loop so the current passes through the meter.',
    start: ST(loopParts(true).concat([P(4, 'dmm', 160, 400, 0, { mode: 'A' })]), loopWires),
    answer: ST(loopParts(true).concat([P(4, 'dmm', 160, 400, 0, { mode: 'A' })]), [W(1, '1:0', '2:0'), W(2, '2:1', '3:0'), W(3, '3:1', '4:1', 'k'), W(4, '4:0', '1:1', 'k')]),
    quiz: [
      { q: 'You connect an ammeter <b>across</b> a 9 V battery. What happens?', o: ['It reads 9 A', 'It reads 0 A', 'A huge current flows and the fuse blows', 'Nothing, the battery limits it'], a: 2, why: 'In amps mode the meter is nearly a wire, so it shorts the battery. The current is far above the fuse rating and the fuse blows.' },
      { q: 'Why does a clamp meter often beat a multimeter for current?', o: ['It is more accurate', 'It never needs batteries', 'You do not have to open the circuit', 'It also measures volts'], a: 2, why: 'A clamp meter reads the magnetic field around a conductor, so you never break the circuit. Part 5 covers it.' }
    ]
  },

  /* ---------------- 4. ohms + continuity ---------------- */
  {
    id: 'test-equipment-ohms', title: 'Multimeter 3: ohms and continuity', mins: 12, tools: ['dmm'],
    goal: 'Measure resistance and check continuity, only on circuits that are dead.',
    learn: [
      '<b>Ohms</b> and <b>continuity</b> work by the meter sending its <b>own</b> tiny current. If the circuit has voltage on it, the reading is wrong. Here the meter refuses and shows <b>LIVE!</b>.',
      'A good <b>wire or closed switch</b> is close to 0 Ω. An <b>open</b> path reads <b>OL</b> (over limit, too big to measure).',
      '<b>Continuity</b> mode adds a beep for a low-resistance path. This lab beeps below about 30 Ω and shows a yellow screen. Use the <b>Beep</b> button for sound.',
      'A bulb you can read with ohms: the 10 Ω bulb reads <b>10 Ω</b>. A burnt filament reads <b>OL</b> even though the bulb looks fine from outside.',
      'Continuity only says "there is a path", not that the path is good under load.'
    ],
    tasks: [
      { id: 't1', text: 'Leave the switch <b>closed</b> (power on). Set <b>Ohms</b> and put the leads across the bulb. The meter shows <b>LIVE!</b>: never measure ohms on a live circuit.', check: s => DMM(s).some(m => (m.mode === 'R' || m.mode === 'C') && m.live) },
      { id: 't2', text: '<b>Open the switch</b> (power off), keep Ohms mode and measure across the bulb: about <b>10 Ω</b>.', check: s => DMM(s).some(m => m.mode === 'R' && m.connected && !m.live && near(m.ohms, 10, 0.6)) },
      { id: 't3', text: 'Switch to <b>Continuity</b> and test across the bulb. The screen lights up (beep): there is a path.', check: s => DMM(s).some(m => m.mode === 'C' && m.beep) },
      { id: 't4', text: 'With the switch still open, test <b>across the switch</b> in continuity. It shows <b>OL</b>: open.', check: s => DMM(s).some(m => m.mode === 'C' && across(m, 'switch') && m.text === 'OL') }
    ],
    hint: 'Open the switch by clicking it. Check the meter mode chips after you select the meter (Ohms, then Continuity).',
    help: 'Use Ohms and Continuity only when the circuit is dead.',
    start: ST(loopParts(true).concat([P(4, 'dmm', 160, 330, 0, { mode: 'R' })]), loopWires),
    answer: null,
    quiz: [
      { q: 'Why must a circuit be <b>dead</b> before you measure resistance?', o: ['Ohms mode is slower on live circuits', 'The meter sends its own test current, so outside voltage ruins the reading and can damage the meter', 'Batteries have no resistance', 'It is only a style rule'], a: 1, why: 'Resistance is found from the meter\'s own tiny current. Voltage from the circuit swamps it, so the reading means nothing.' },
      { q: 'A continuity test across a switch shows <b>OL</b>. The switch is…', o: ['closed and good', 'open (no path)', 'shorted', 'live'], a: 1, why: 'OL means no measurable path. For a switch in the OFF position that is exactly right. In the ON position it should show a number near 0 Ω.' }
    ]
  },

  /* ---------------- 5. clamp meter ---------------- */
  {
    id: 'test-equipment-clamp', title: 'Clamp meter', mins: 8, tools: ['clamp'],
    goal: 'Read the current in a wire without opening the circuit, and see how it splits and adds.',
    learn: [
      'A clamp meter reads the <b>magnetic field</b> around <b>one</b> conductor. Open the jaw, clamp around a single wire, read the current. No breaking the circuit.',
      'Clamp around <b>one conductor only</b>. In real cable the go and return currents cancel, so clamping around both reads about zero.',
      'This lab\'s clamp reads DC. Many real clamp meters are <b>AC only</b>; use the type that matches your circuit.',
      'Currents <b>add</b> at a junction: the main wire carries the sum of the branch currents (0.9 A + 0.9 A = 1.8 A here).',
      'Drag the clamp so its ring sits on a wire. The reading shows on the clamp\'s screen.'
    ],
    tasks: [
      { id: 't1', text: 'Add a <b>clamp meter</b> and drag its ring onto the <b>wire from the battery +</b> (the main feed). Read about <b>0.9 A</b>.', check: s => s.clamps.some(c => c.on && c.I > 0.5) },
      { id: 't2', text: '<b>Close the switch</b> so the second bulb joins. The main wire now reads about <b>1.8 A</b>.', check: s => s.lit >= 2 && s.clamps.some(c => c.on && c.I > 1.5) },
      { id: 't3', text: 'Move the clamp onto <b>one branch wire</b>. With both bulbs lit it reads about <b>0.9 A</b>: half the main.', check: s => s.lit >= 2 && s.clamps.some(c => c.on && near(c.I, 0.89, 0.12)) }
    ],
    hint: 'The short wire from the battery + to the junction dot is the main wire. The wires from the junction to each bulb are the branches.',
    help: 'Drag the clamp by its body. When the ring is over a wire it snaps onto it.',
    start: ST(clampParts(false), clampWires), answer: null,
    quiz: [
      { q: 'Two branches carry 0.9 A each. What does a clamp on the <b>main</b> wire read?', o: ['0.9 A', '1.8 A', '0.45 A', '0 A'], a: 1, why: 'Currents add where wires join. 0.9 + 0.9 = 1.8 A in the main wire.' },
      { q: 'You clamp around <b>both</b> wires of a two-wire cable. The reading is about…', o: ['double', 'zero (the currents cancel)', 'the same as one wire', 'the voltage'], a: 1, why: 'Current goes out one conductor and returns on the other in the opposite direction, so the magnetic fields cancel. Always clamp one conductor.' }
    ]
  },

  /* ---------------- 6. live-dead-live ---------------- */
  {
    id: 'test-equipment-ldl', title: 'Live-dead-live: proving it is dead', mins: 14, tools: ['dmm', 'prover'],
    goal: 'Lock out the switch, then prove the circuit dead with the live-dead-live check.',
    body: '<p>General practice (see OSHA 29 CFR 1910.333(b) on electrical lockout and verification, and your employer\'s procedure): lock out and tag the energy source, then use test equipment to confirm the parts are de-energized, and <b>check the test equipment works immediately before and after</b> the test. Follow your own instructor and employer first; this bench is a simplified model.</p>',
    learn: [
      '<b>1. Lock out and tag.</b> Open the disconnect, put a padlock and tag on it. Select the switch and press <b>🔒 Lock out &amp; tag</b>. A locked switch cannot be moved.',
      '<b>2. LIVE:</b> prove your meter on the <b>proving unit</b>. It must read about 9 V.',
      '<b>3. DEAD:</b> test the circuit you want dead. The load should read about <b>0 V</b>.',
      '<b>4. LIVE again:</b> prove the meter on the proving unit once more. If it still reads 9 V, the 0 V was real.',
      'Notice: even locked out, the <b>supply side</b> of the disconnect is still live. The lock protects the load side.',
      'Use the same meter for all three readings. Move the leads by deleting a lead wire and drawing a new one.'
    ],
    tasks: [
      { id: 't1', text: '<b>Lock out.</b> Open the switch (bulb goes dark), select it and press <b>Lock out &amp; tag</b>.', check: s => s.switches.some(w => !w.closed && w.locked) },
      { id: 't2', text: '<b>LIVE:</b> wire the meter (volts mode) across the <b>proving unit</b>. It reads about <b>9 V</b>.', check: (s, m) => { if (DMM(s).some(x => x.mode === 'V' && x.onProver && x.connected && x.v > 8)) m.p1 = true; return !!m.p1; } },
      { id: 't3', text: '<b>DEAD:</b> with the lock on, move the leads <b>across the bulb (the load)</b>. It reads about <b>0 V</b>.', check: (s, m) => { if (m.p1 && s.switches.some(w => !w.closed && w.locked) && DMM(s).some(x => x.mode === 'V' && across(x, 'bulb') && Math.abs(x.v) < 0.5)) m.dead = true; return !!m.dead; } },
      { id: 't4', text: '<b>LIVE again:</b> put the leads back on the proving unit. Still about <b>9 V</b>, so the meter was working the whole time.', check: (s, m) => !!m.dead && DMM(s).some(x => x.mode === 'V' && x.onProver && x.connected && x.v > 8) }
    ],
    hint: 'Click a lead wire and press Delete, then drag a new one. Order matters: prove, test, prove. The checks only count in that order.',
    help: 'You start with a live, working circuit. Work through the four steps in order.',
    start: ST(ldlParts(false, true), loopWires), answer: ldlDead,
    quiz: [
      { q: 'Why prove the meter <b>after</b> the dead test too?', o: ['To wear out the batteries', 'In case the meter failed during the test and gave a false 0 V', 'The standard says three is lucky', 'To check the proving unit'], a: 1, why: 'A meter can fail (or a lead can come loose) during the test. A second proof shows it was working the whole time.' },
      { q: 'The disconnect is open and locked. The wire <b>on the supply side</b> of it is…', o: ['dead, because the switch is off', 'still live', 'dead after a minute', 'grounded automatically'], a: 1, why: 'Opening a disconnect only dead-ends the <b>load</b> side. The supply side stays connected to the source and stays live.' }
    ]
  },

  /* ---------------- 7. the meter lies ---------------- */
  {
    id: 'test-equipment-lies', title: 'When the meter lies', mins: 8, tools: ['dmm', 'prover'],
    goal: 'Catch a broken meter before it tells you a live circuit is dead.',
    body: '<p>This circuit is <b>live</b> (the bulb is lit). Two meters sit on the bench. One of them is faulty and always reads 0 V. You cannot tell by looking. Prove each one on the proving unit.</p>',
    learn: [
      'A failed meter does not warn you. It simply shows <b>0.00 V</b>, which looks exactly like a dead circuit.',
      'That is the whole reason for the proving step: <b>a reading is only as good as the meter that made it</b>.',
      'If a meter fails the proof on a known live source, <b>stop using it</b> and tag it for repair.',
      'This is a simulation: real meters can also fail with blown fuses, damaged leads, flat batteries or the wrong jack.'
    ],
    tasks: [
      { id: 't1', text: 'Put <b>Meter 1</b> (volts) across the <b>proving unit</b>. What does it read?', check: s => DMM(s).some(m => m.id === 4 && m.mode === 'V' && m.onProver && m.connected) },
      { id: 't2', text: 'Meter 1 reads 0 on a known 9 V source, so it is <b>faulty</b>. Prove <b>Meter 2</b> on the proving unit: about <b>9 V</b>.', check: s => DMM(s).some(m => m.id === 5 && m.mode === 'V' && m.onProver && m.v > 8) },
      { id: 't3', text: 'Use the <b>good meter</b> across the lit bulb. About <b>9 V</b>: the circuit is <b>live</b>, as the lit bulb says.', check: s => DMM(s).some(m => m.id === 5 && m.mode === 'V' && across(m, 'bulb') && Math.abs(m.v) > 8) }
    ],
    hint: 'Use one meter at a time on the proving unit. Move leads by deleting a lead wire and drawing a new one.',
    help: 'Two meters, one proving unit, one live circuit.',
    start: ST(loopParts(true).concat([P(4, 'dmm', 160, 220, 0, { label: 'Meter 1', bad: true }), P(5, 'dmm', 160, 400, 0, { label: 'Meter 2' }), P(6, 'prover', 160, 540)]), loopWires), answer: null,
    quiz: [
      { q: 'Meter 1 shows 0.00 V on the proving unit. What should you do?', o: ['Use it anyway, 0 V means safe', 'Stop using it and get a working meter', 'Turn the circuit off and keep going', 'Increase the test voltage'], a: 1, why: 'The proving unit is known to be 9 V, so a 0 reading proves the meter is faulty. Do not trust any reading from it.' }
    ]
  },

  /* ---------------- 8. backfeed ---------------- */
  {
    id: 'test-equipment-backfeed', title: 'Backfeed: the other source', mins: 10, tools: ['dmm'],
    goal: 'Find a second source that keeps a "dead" load live, and lock out both.',
    body: '<p>Some circuits can be fed from <b>more than one place</b>: a standby generator, solar panels, a second panel, or a control circuit from another source. Opening the main switch does not make those loads dead. This bench has a <b>Main</b> supply and a <b>Backup</b> supply feeding the same bulb.</p>',
    learn: [
      '<b>Backfeed</b> means power reaches a "dead" circuit from a different direction than you expected.',
      'Always test <b>after</b> you open and lock out the main switch. A bulb that stays lit tells you another source is present.',
      '<b>Lock out every source</b>, not only the obvious one.',
      'Then run the full live-dead-live check (part 6) before touching anything.'
    ],
    tasks: [
      { id: 't1', text: 'Open the <b>Main switch</b> and lock it out. The bulb <b>stays lit</b>: something else is feeding it.', check: s => s.lit >= 1 && s.switches.some(w => w.id === 2 && !w.closed && w.locked) },
      { id: 't2', text: 'Put the meter across the bulb. It reads about <b>9 V</b>, so the "dead" load is <b>live</b>.', check: s => s.switches.some(w => w.id === 2 && w.locked) && DMM(s).some(m => m.mode === 'V' && across(m, 'bulb') && Math.abs(m.v) > 8) },
      { id: 't3', text: 'Open and lock out the <b>Backup switch</b> too. The bulb goes dark.', check: s => s.lit === 0 && s.switches.length === 2 && s.switches.every(w => !w.closed && w.locked) },
      { id: 't4', text: 'Test the bulb again: now about <b>0 V</b>. Both sources are locked out.', check: s => s.switches.every(w => !w.closed && w.locked) && DMM(s).some(m => m.mode === 'V' && across(m, 'bulb') && Math.abs(m.v) < 0.5) }
    ],
    hint: 'Select a switch, then press the 🔒 lock button. The switch must be open before you can lock it.',
    help: 'Two sources, two switches, one load.',
    start: ST([P(1, 'battery', 260, 140, 2, { label: 'Main supply' }), P(2, 'switch', 520, 140, 0, { closed: true, label: 'Main switch' }), P(3, 'battery', 260, 500, 2, { label: 'Backup supply' }), P(4, 'switch', 520, 500, 0, { closed: true, label: 'Backup switch' }), P(5, 'bulb', 800, 320, 1, { label: 'Load' }), P(6, 'dmm', 300, 320, 0, { label: 'Meter' })],
      [W(1, '1:0', '2:0'), W(2, '2:1', '5:0'), W(3, '3:0', '4:0'), W(4, '4:1', '5:0'), W(5, '5:1', '1:1', 'k'), W(6, '5:1', '3:1', 'k')]), answer: null,
    quiz: [
      { q: 'You open and lock the main switch, but the load\'s light stays on. The most likely cause is…', o: ['the switch is broken', 'a second source is feeding the load', 'the bulb is special', 'the meter is wrong'], a: 1, why: 'A load that stays energized with the main off is being fed from somewhere else: a backup source, a second panel, solar, or a back-fed control circuit.' }
    ]
  },

  /* ---------------- 9. megohmmeter ---------------- */
  {
    id: 'test-equipment-megger', title: 'The megohmmeter (megger)', mins: 14, tools: ['megger', 'cable', 'dmm'],
    goal: 'Use a megohmmeter to test cable insulation, and see why a multimeter cannot.',
    body: '<p>Insulation is supposed to be an almost-perfect <b>non</b>-conductor. As it ages, gets wet or gets damaged, it leaks. The leak is tiny, millionths of an amp, so you need a <b>high test voltage</b> and an instrument that reads <b>megohms</b>. General guidance (see Megger\'s <i>A Stitch in Time</i> insulation testing guide, and the instrument and cable maker\'s specifications): the limits come from the standard, manufacturer or employer. This lab uses <b>1 MΩ</b> as a simple example pass line.</p>',
    learn: [
      'A megger applies a <b>test voltage</b> (here 250, 500 or 1000 V) between the conductor and the earth/sheath, and reads the insulation resistance in <b>MΩ</b>.',
      'The reading <b>climbs</b> as the insulation charges up. Let the test run until it settles, then read it.',
      '<b>Only on a dead, isolated conductor.</b> Disconnect it from loads, disconnect the supply, prove dead first. If the leads see live voltage this meter refuses and shows <b>LIVE!</b>.',
      'A high test voltage can hurt: treat the cable as live while testing and <b>discharge</b> it afterwards (real cables hold a charge).',
      'A multimeter in ohms mode cannot find insulation faults at this level: it applies a few volts and often just shows <b>OL</b> on a cable that is not healthy.',
      'Simplifications here: the leakage values are hidden settings, pass/fail is one number, and real tests use temperature, time and polarisation-index rules.'
    ],
    tasks: [
      { id: 't1', text: 'Set the megger to <b>500 V</b>. Wire its <b>LINE</b> lead to <b>Cable 1\'s conductor</b> and <b>EARTH</b> to the cable\'s earth end. Press <b>Start test</b> and let the reading settle.', check: s => s.meggers.some(m => m.tv === 500 && m.done && !m.live && m.across.some(a => a.id === 1)) },
      { id: 't2', text: 'Test <b>Cable 2</b> the same way. Compare the two readings.', check: s => s.meggers.some(m => m.done && !m.live && m.across.some(a => a.id === 2)) },
      { id: 't3', text: 'Put a <b>multimeter in Ohms</b> across Cable 1. It shows <b>OL</b>: it cannot see what the megger just measured.', check: s => DMM(s).some(m => m.mode === 'R' && m.connected && m.text === 'OL' && m.across.some(a => a.id === 1)) },
      { id: 't4', text: 'Wire the <b>battery across a cable</b> (it is now live), then start the megger test. It refuses: <b>LIVE!</b>', check: (s, m) => { if (s.meggers.some(g => g.testing && g.live)) m.l = true; return !!m.l; } }
    ],
    hint: 'Each cable has two ends: the left end is the conductor, the right end the earth/sheath. Wire the megger\'s left terminal to one and the right terminal to the other. Select the megger to change voltage and start the test.',
    help: 'Two cables with hidden insulation condition. Wire, test, compare.',
    start: ST([P(1, 'cable', 760, 160, 0, { ir: 500, label: 'Cable 1' }), P(2, 'cable', 760, 320, 0, { ir: 0.3, label: 'Cable 2' }), P(3, 'megger', 300, 240), P(4, 'battery', 300, 480), P(5, 'dmm', 300, 80, 0, { mode: 'R' })]), answer: null,
    quiz: [
      { q: 'Cable 2 reads <b>0.30 MΩ</b> and the example pass line is 1 MΩ. The cable is…', o: ['fine', 'below the line: investigate or replace it', 'impossible to read', 'better than Cable 1'], a: 1, why: 'Low insulation resistance means current is leaking. Under the 1 MΩ example line it needs attention. Use the real limit from your standard or employer.' },
      { q: 'Why not test insulation with a multimeter in ohms mode?', o: ['It is illegal', 'It only applies a few volts, so many insulation faults never show up', 'It reads in the wrong unit', 'It is too accurate'], a: 1, why: 'Insulation problems can stay hidden at a few volts. A megger tests at hundreds of volts and reads in MΩ.' }
    ]
  },

  /* ---------------- 10. troubleshooting ---------------- */
  {
    id: 'test-equipment-trouble', title: 'Troubleshooting challenge', mins: 15, tools: ['dmm'], numbers: false,
    goal: 'Use your meter to find two hidden faults and fix them.',
    body: '<p>Three bulbs run in parallel from one battery. Only <b>one</b> is lit. Two have hidden faults you cannot see. The on-screen numbers are turned off for this challenge, so your meter has to do the work.</p>',
    learn: [
      'A dark bulb with <b>full voltage across it</b> and no current: the bulb itself is open (burnt filament).',
      'A dark bulb with <b>0 V across it</b>: the break is somewhere else in that branch, a wire, a switch or a connection. Test <b>across the suspected break</b> and you read the full supply voltage.',
      'Work in order: <b>look, measure, decide, fix, re-test</b>. Never swap parts blindly.',
      'When you fix one, check the other: there may be more than one fault.',
      'Fixes here: select a bulb, wire or switch and press the <b>Swap in a new …</b> button.'
    ],
    tasks: [
      { id: 't1', text: 'Put the meter (volts) <b>across a dark bulb</b> and take a reading.', check: s => DMM(s).some(m => m.mode === 'V' && m.connected && across(m, 'bulb')) },
      { id: 't2', text: 'Find the bulb that is open and <b>swap in a new bulb</b>.', check: s => s.bulbs.length >= 3 && s.bulbs.every(b => !b.dead) },
      { id: 't3', text: 'Find the second fault (hint: measure across a wire) and fix it. <b>All three bulbs lit.</b>', check: s => s.lit >= 3 && s.hidden === 0 }
    ],
    hint: 'Bulb 3 is the open bulb (9 V across it, no light). The other dark bulb has 0 V across it, so measure across the wire that feeds it: that is where the full voltage appears.',
    help: 'Use the meter, then use the Swap-in-new buttons.',
    start: ST([P(1, 'battery', 500, 540), P(2, 'bulb', 260, 340, 1), P(3, 'bulb', 500, 340, 1, { dead: true }), P(4, 'bulb', 760, 340, 1), P(5, 'junction', 760, 200), P(6, 'dmm', 160, 140)],
      [W(1, '1:0', '2:0'), W(2, '1:0', '3:0'), W(3, '1:0', '5:0', 'r', { open: true }), W(4, '5:0', '4:0'), W(5, '2:1', '1:1', 'k'), W(6, '3:1', '1:1', 'k'), W(7, '4:1', '1:1', 'k')]), answer: null,
    quiz: [
      { q: 'A dark bulb has <b>9 V across it</b> and no current. The fault is…', o: ['a broken wire elsewhere', 'the bulb itself (open filament)', 'the battery', 'the meter'], a: 1, why: 'Full supply voltage across a part that passes no current means that part is the open one. Swap the bulb.' },
      { q: 'A dark bulb has <b>0 V across it</b>, but 9 V appears across one wire in its branch. The fault is…', o: ['the bulb', 'that wire (it is open)', 'the other bulbs', 'the battery'], a: 1, why: 'The voltage drops across the open part. Across the open wire you read the whole supply, and the bulb gets none.' }
    ]
  },

  /* ---------------- 11. safety + other tools (reading) ---------------- */
  {
    id: 'test-equipment-safety', title: 'Safety ratings and the other tools', mins: 8, bench: false,
    goal: 'Know the safety rules for meters and what the non-contact tester, receptacle tester and solenoid tester are for.',
    body: '<p>These tools are described, not simulated: they are mostly AC tools and this lab is battery-level DC. General guidance only; your employer and instructor come first. Sources: OSHA 29 CFR 1910.333 (electrical work practices), Fluke\'s "What is Continuity?" learning article, and Megger\'s <i>A Stitch in Time</i> guide.</p>',
    learn: [
      '<b>Meter category (CAT) rating:</b> a meter is rated for the places it is safe to use (CAT II, III, IV) and a maximum voltage. Use a meter rated for the circuit, not just any meter.',
      '<b>Leads and fuses:</b> use the leads that came with the meter, inspect them, and never use a meter with cracked insulation or an unknown fuse.',
      '<b>Non-contact voltage tester:</b> a pen that beeps or glows near AC voltage. Good for a quick check, <b>not</b> proof a circuit is dead. It can miss shielded or weak signals. Always confirm with a proven meter.',
      '<b>Receptacle (outlet) tester:</b> a plug-in tester with lights that show common wiring faults such as open ground, reversed polarity or open neutral. It does <b>not</b> prove an outlet is safe or code compliant.',
      '<b>Solenoid tester ("wiggy"):</b> a two-probe tester that loads the circuit slightly and shows approximate voltage with a needle, a buzz and a vibration. It tells you voltage is present; it is not a precise meter.',
      '<b>PPE and procedure:</b> insulated gloves and tools where required, one hand when you can, lockout/tagout, live-dead-live, and a second person when your procedure says so.',
      '<b>Not modelled in this lab:</b> jack and range selection, meter accuracy and "ghost" voltages, AC measurements, and arc-flash hazards. Learn those in class.'
    ],
    tasks: [],
    quiz: [
      { q: 'A non-contact voltage tester stays silent near a wire. What does that prove?', o: ['The wire is dead', 'Nothing for certain: confirm with a proven meter', 'The wire is grounded', 'The breaker is off'], a: 1, why: 'Non-contact testers can miss voltage. Treat silence as "no alarm", then verify with a proven meter.' },
      { q: 'A receptacle tester shows all lights correct. What can you conclude?', o: ['The outlet meets code and is safe to touch inside', 'The common wiring faults it checks for are not present, and nothing more', 'The circuit is dead', 'The ground is perfect'], a: 1, why: 'It only checks a few wiring conditions. It does not prove the circuit is dead or the outlet is code compliant.' },
      { q: 'Before trusting a meter reading of 0 V on a lockout, you…', o: ['do nothing', 'prove the meter on a known live source, test, then prove it again', 'replace the meter batteries', 'ask the meter to beep'], a: 1, why: 'That is live-dead-live. The reading is only as good as the meter.' }
    ]
  }
  ]
});
})();