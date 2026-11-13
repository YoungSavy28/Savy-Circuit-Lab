/* Lesson 3: boxes and devices. Diagrams represent de-energized training boards,
   not installation plans. Each wiring net lists terminals that must be connected. */
(function () {
  'use strict';
  const node = (id, label, kind, hub) => ({ id, label, kind, hub: !!hub });
  const supply = () => ({ title: 'Supply cable · isolated', nodes: [
    node('feed-h', 'Black · hot', 'h'), node('feed-n', 'White · neutral', 'n'), node('feed-g', 'Bare/green · ground', 'g')
  ] });
  const ground = () => node('bond', 'Metal box · bonding screw', 'g');
  const splice = (id, label, kind) => node(id, label + ' · connector', kind, true);
  const q = (question, options, answer, why) => ({ q: question, o: options, a: answer, why });
  const part = (id, title, goal, learn, quiz, extra) => Object.assign({
    id: 'boxes-' + id, title, goal, mins: 5, bench: false, learn, tasks: [], quiz
  }, extra || {});
  COURSE.add({
    id: 'boxes', title: 'Outlet, device, pull & junction boxes',
    blurb: 'Identify the right box, then practice receptacle, switch, splice and pull-box wiring on four interactive training boards.',
    parts: [
      part('1', 'What does each box do?', 'Tell a box, an outlet and a wiring device apart.', [
        'An <b>outlet</b> is a point where power is taken to supply equipment. A receptacle outlet and a lighting outlet are examples. Outlet does not just mean the plug-in device.',
        'A <b>receptacle</b> is the device a plug fits into. A <b>device box</b> mounts a device such as a receptacle or switch and encloses its connections.',
        'An <b>outlet box</b> encloses connections at an outlet. A box at a light may also support the fixture when listed and rated for that purpose.',
        'A <b>junction box</b> encloses splices or branching connections. A <b>pull box</b> provides access and space for pulling conductors through a raceway.',
        'These names describe uses, not four mutually exclusive shapes. A suitable box can serve more than one purpose. A pull box can contain splices when its listing, size and applicable rules permit.'
      ], [
        q('Which is a wiring device rather than the enclosure around it?', ['A blank junction-box cover', 'A receptacle', 'A pull box', 'A box knockout'], 1, 'The receptacle is the plug-in device. The box encloses and supports the appropriate assembly.'),
        q('A connection point supplying a ceiling light is what kind of point?', ['Never an outlet', 'A ground fault', 'A lighting outlet', 'Always a receptacle'], 2, 'An outlet can supply lighting equipment; it does not have to accept a plug.'),
        q('What is the main purpose of a pull box?', ['Increase voltage', 'Replace a breaker', 'Provide access for pulling conductors', 'Eliminate grounding'], 2, 'A pull box helps route and pull conductors. It does not change voltage or provide overcurrent protection.')
      ], { body: '<p><b>Lesson 3 · Identify → choose → connect → inspect.</b> Start with the names, then wire four diagram exercises. All boards are de-energized concepts; they do not simulate 120 V power.</p>' }),
      part('2', 'Choose the box and cover', 'Choose by purpose, location, capacity and support rating.', [
        '<b>Single-gang</b> commonly holds one switch or one duplex receptacle. Gang refers to device positions, not the number of plug openings. Multi-gang boxes accommodate multiple devices.',
        'Square boxes can serve as junction boxes or accept suitable device rings/covers. Round or octagonal boxes are common at lighting outlets. Shape alone does not establish a support rating.',
        '<b>New-work</b> boxes are generally secured before the wall finish; <b>old-work</b> boxes are designed for appropriate existing-wall applications. Follow the product mounting instructions.',
        'Choose a box and cover suitable for the environment and wiring method. A plastic box is not automatically suitable outdoors; metal boxes need an effective grounding/bonding path.',
        '<b>Box fill</b> is about permitted space for conductors and applicable devices, clamps and grounding allowances. Pull-box sizing may require different rules. Do not choose a box only because the wires physically fit.',
        'Use a matching cover or faceplate, suitable fittings at entries, and closures for unused openings. Keep access to junction and pull-box contents; do not bury the cover behind permanent wall finish.',
        'Fan support requires a box/support assembly identified for the fan and its load. Exact sizing and installation rules depend on the adopted code and the product instructions.'
      ], [
        q('A single duplex receptacle has two plug openings. How many device positions does it normally occupy?', ['One gang', 'Two gangs', 'Three gangs', 'Four gangs'], 0, 'A duplex receptacle is one device mounted in one gang.'),
        q('Which is the best basis for selecting a ceiling-fan box?', ['It is round', 'It is metal', 'It is identified for fan support and the intended load', 'It has an unused knockout'], 2, 'The support assembly must be suitable for the fan. Shape and material alone are not enough.'),
        q('Which box selection needs correction?', ['A suitable device box with the matching faceplate', 'A junction box with its cover buried behind drywall', 'A listed enclosure selected for a wet location', 'A properly supported box with adequate capacity'], 1, 'Connections must remain accessible for inspection and maintenance.')
      ]),
      part('3', 'Wire a receptacle outlet box', 'Connect hot, neutral and grounding paths without mixing them.', [
        'This board shows one ordinary common-feed receptacle with intact tabs in a <b>metal box</b>. It does not represent GFCI, split-feed or multiwire branch-circuit wiring.',
        'Connect the identified hot to the <b>brass</b> terminal and the identified neutral to the <b>silver</b> terminal. Green is the equipment grounding terminal.',
        'Use the ground connector to join the incoming equipment ground, a pigtail to the receptacle grounding terminal and a pigtail bonding the metal box.',
        'Keep neutral separate from the equipment ground in this branch-circuit box. Grounding is a fault path, not the normal load-current return.',
        'In the trainer, choose a conductor, then select two labeled terminals. Only connector nodes accept multiple wires. Wire labels identify function as well as color.'
      ], [
        q('Where does the neutral connect on this ordinary receptacle?', ['Green grounding screw', 'Metal box only', 'Brass screw', 'Silver screw'], 3, 'The neutral goes to silver. Brass is hot; green is equipment ground.'),
        q('Why is there a grounding pigtail to the metal box?', ['To carry normal load current', 'To bond the enclosure into the equipment grounding path', 'To turn ground into neutral', 'To increase voltage'], 1, 'Bonding connects exposed metal to the equipment grounding path so a fault can be cleared by protective equipment.')
      ], { mins: 8, wiring: {
        id: 'receptacle', title: 'Outlet box · common-feed receptacle',
        note: 'Connect all five paths. The connector represents a listed multiport splice connector; terminal positions are schematic.',
        groups: [supply(), { title: 'Inside the metal outlet box', nodes: [
          node('rec-h', 'Receptacle · brass / hot', 'h'), node('rec-n', 'Receptacle · silver / neutral', 'n'),
          node('rec-g', 'Receptacle · green / ground', 'g'), splice('g-splice', 'Ground splice', 'g'), ground()
        ] }],
        nets: [['feed-h', 'rec-h'], ['feed-n', 'rec-n'], ['feed-g', 'g-splice', 'rec-g', 'bond']],
        answer: [['feed-h','rec-h','h'], ['feed-n','rec-n','n'], ['feed-g','g-splice','g'], ['g-splice','rec-g','g'], ['g-splice','bond','g']]
      } }),
      part('4', 'Wire a switch device box', 'Put a basic single-pole switch in the hot path, with neutral and ground kept separate.', [
        'This example brings the supply and the cable to a light into the switch box. The light is a labeled destination, not an energized simulator.',
        'For this basic mechanical single-pole switch, one brass terminal receives supply hot and the other goes to the light hot (<b>switched hot</b>). The two brass terminals are interchangeable.',
        'The supply neutral joins the neutral going to the light using a connector. It does not connect to either brass terminal on this mechanical switch.',
        'Join the equipment grounds and bond the switch, the metal box and the grounding conductor continuing to the light.',
        'Smart switches, illuminated devices, three-way switches and other equipment can have different terminals. Follow the instructions for the actual device.'
      ], [
        q('Which conductor should this basic switch interrupt?', ['The equipment ground', 'Only the neutral', 'The hot conductor', 'All grounds and neutrals together'], 2, 'Switching the hot controls the load while keeping neutral and equipment grounding functions separate.'),
        q('Where does neutral go in this board?', ['Through a neutral splice to the light', 'To the switch grounding screw', 'To the metal box bond screw', 'To either brass switch terminal'], 0, 'This basic mechanical switch has no neutral terminal. The neutral continues to the light.')
      ], { mins: 10, wiring: {
        id: 'switch', title: 'Device box · single-pole switch and light',
        note: 'Use Hot for the supply lead and Switched hot for the switch-to-light lead. Either brass switch terminal can be the supply side.',
        groups: [supply(), { title: 'Inside the metal device box', nodes: [
          node('sw-a', 'Switch · brass terminal 1', 'switch'), node('sw-b', 'Switch · brass terminal 2', 'switch'),
          node('sw-g', 'Switch · green / ground', 'g'), splice('n-splice', 'Neutral splice', 'n'),
          splice('g-splice', 'Ground splice', 'g'), ground()
        ] }, { title: 'Cable to light · destination', nodes: [
          node('light-h', 'Light · switched hot', 'sh'), node('light-n', 'Light · neutral', 'n'), node('light-g', 'Light · ground', 'g')
        ] }],
        nets: [['feed-h','sw-a'], ['sw-b','light-h'], ['feed-n','n-splice','light-n'], ['feed-g','g-splice','sw-g','bond','light-g']],
        alternatives: [[['feed-h','sw-b'], ['sw-a','light-h'], ['feed-n','n-splice','light-n'], ['feed-g','g-splice','sw-g','bond','light-g']]],
        answer: [['feed-h','sw-a','h'], ['sw-b','light-h','sh'], ['feed-n','n-splice','n'], ['n-splice','light-n','n'],
          ['feed-g','g-splice','g'], ['g-splice','sw-g','g'], ['g-splice','bond','g'], ['g-splice','light-g','g']]
      } }),
      part('5', 'Wire a junction box', 'Branch one circuit using separate connectors for hot, neutral and ground.', [
        'A junction box protects a connection point. In this simplified board, one supply cable branches into two outgoing cables on the <b>same circuit</b>.',
        'Join the three identified hot conductors at the hot connector. Join the three neutrals separately at the neutral connector.',
        'Join the equipment grounds at the ground connector and add a bonding pigtail to the metal box.',
        'A connector node stands for a listed connector with enough ports and suitable conductor size/material ratings. It does not mean you may place several wires under an ordinary screw.',
        'Actual work also requires correct box fill, fittings, conductor preparation, connector instructions and an accessible matching cover. Do not join unrelated circuits just because their wires share a color.'
      ], [
        q('In this same-circuit junction box, which group belongs in one connector?', ['Supply hot plus the two outgoing hots', 'Hot plus neutral', 'Neutral plus all equipment grounds', 'Every conductor in the box'], 0, 'This hot connector distributes the one supply hot to the two outgoing hot conductors.'),
        q('Why use separate hot, neutral and ground splice groups?', ['Only for appearance', 'To save a cover', 'They perform different electrical functions and must not be tied together here', 'To make all wires hot'], 2, 'Joining these groups would create unintended paths, including faults or objectionable current on grounding parts.')
      ], { mins: 10, wiring: {
        id: 'junction', title: 'Junction box · two outgoing branches',
        note: 'Make each splice group separately, including the metal-box bond. This board represents branches of one circuit.',
        groups: [supply(), { title: 'Inside the metal junction box', nodes: [
          splice('h-splice','Hot splice','h'), splice('n-splice','Neutral splice','n'), splice('g-splice','Ground splice','g'), ground()
        ] }, { title: 'Outgoing cable A', nodes: [node('a-h','A · hot','h'), node('a-n','A · neutral','n'), node('a-g','A · ground','g')] },
        { title: 'Outgoing cable B', nodes: [node('b-h','B · hot','h'), node('b-n','B · neutral','n'), node('b-g','B · ground','g')] }],
        nets: [['feed-h','h-splice','a-h','b-h'], ['feed-n','n-splice','a-n','b-n'], ['feed-g','g-splice','a-g','b-g','bond']],
        answer: [['feed-h','h-splice','h'], ['h-splice','a-h','h'], ['h-splice','b-h','h'],
          ['feed-n','n-splice','n'], ['n-splice','a-n','n'], ['n-splice','b-n','n'],
          ['feed-g','g-splice','g'], ['g-splice','a-g','g'], ['g-splice','b-g','g'], ['g-splice','bond','g']]
      } }),
      part('6', 'Route through a pull box', 'Keep conductor paths continuous and include the metal-box bond.', [
        'This box gives access for pulling conductors through raceways. In this exercise, hot and neutral pass through without a splice.',
        'Draw a continuous hot path from entry to exit and a separate continuous neutral path. The endpoint buttons mark the same conductor at opposite sides, not terminal screws inside the box.',
        'The equipment grounding path continues and bonds the metal enclosure. This exercise explicitly uses a grounding connector and a box-bonding pigtail.',
        'Pull boxes are not restricted to pass-through conductors in every situation. Splices may be allowed when the enclosure, conductor space and applicable rules permit them.',
        'Physical pull-box selection also depends on conductor/raceway size, pull direction and bending space. This diagram does not calculate box dimensions or pulling tension.'
      ], [
        q('Does this pull box require a hot or neutral splice?', ['Yes, every box requires one', 'No, these conductors pass through continuously', 'Only if the cover is metal', 'Only if the neutral is white'], 1, 'The hot and neutral in this scenario are continuous conductors, not splice connections.'),
        q('What is still required for the metal enclosure in this exercise?', ['Bond it into the equipment grounding path', 'Connect it to hot', 'Use it as the neutral return', 'Remove the cover permanently'], 0, 'The metal enclosure is bonded to the equipment grounding path.')
      ], { mins: 7, wiring: {
        id: 'pull', title: 'Pull box · continuous hot and neutral',
        note: 'Hot and neutral lines mean continuous conductors. The only connector shown is for the grounding path and box bond.',
        groups: [{ title: 'Raceway entry', nodes: [node('feed-h','Entry · hot','h'),node('feed-n','Entry · neutral','n'),node('feed-g','Entry · ground','g')] },
          { title: 'Inside the metal pull box', nodes: [splice('g-splice','Ground connection','g'),ground()] },
          { title: 'Raceway exit', nodes: [node('exit-h','Exit · hot','h'),node('exit-n','Exit · neutral','n'),node('exit-g','Exit · ground','g')] }],
        nets: [['feed-h','exit-h'], ['feed-n','exit-n'], ['feed-g','g-splice','exit-g','bond']],
        answer: [['feed-h','exit-h','h'],['feed-n','exit-n','n'],['feed-g','g-splice','g'],['g-splice','exit-g','g'],['g-splice','bond','g']]
      } }),
      part('7', 'Inspect the finished assembly', 'Identify problems a wiring diagram alone cannot approve.', [
        '<b>Electrical paths:</b> correct device terminals, separate hot/neutral/ground functions, connected equipment grounding path and metal-box bond.',
        '<b>Mechanical assembly:</b> suitable box capacity, secure support, suitable entry fittings, closed unused openings, and conductors protected from sharp edges.',
        '<b>Enclosure:</b> matching cover or faceplate, access for maintenance, and a box/cover assembly appropriate for the environment.',
        '<b>Actual installation:</b> follow the adopted local code and the exact manufacturer instructions, including conductor ratings and terminal torque. A passing diagram exercise is not installation approval.',
        'Before real work, obtain training and supervision, isolate and lock out the supply as applicable, and verify absence of voltage with appropriate test equipment. These boards teach connection relationships only.'
      ], [
        q('The receptacle works, but its metal box is not bonded. Is that acceptable?', ['Yes, operation proves safety', 'Yes, if the cover is painted', 'No, the grounding/bonding defect needs correction', 'Yes, because neutral is present'], 2, 'A working load does not prove the enclosure has the required fault-current path.'),
        q('A conductor enters through a sharp opening without suitable protection. What needs attention?', ['Only the wire color', 'Protection against abrasion and the suitable entry fitting', 'Increasing supply voltage', 'Removing the box bond'], 1, 'The entry must protect conductor insulation, using fittings appropriate to the wiring method.'),
        q('You pass all four wiring boards. What have you demonstrated?', ['A permit for live work', 'A complete box-fill calculation', 'The required torque of every product', 'Understanding of the simplified connection relationships'], 3, 'The trainer does not verify physical construction, code compliance or safe real-world installation.')
      ], { body: '<details><summary>Source references and scope</summary><p>General enclosure principles: <a href="https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.405" target="_blank" rel="noopener noreferrer">OSHA 1926.405(b), (e)</a>. Device terminal examples: <a href="https://leviton.com/content/dam/leviton/residential/product_documents/instruction_sheet/15a-receptacle-instruction-sheet.pdf" target="_blank" rel="noopener noreferrer">Leviton receptacle instructions</a> and <a href="https://leviton.com/content/dam/leviton/commercial-industrial/product_documents/instruction_sheet/SB-000-05621-21M-W.pdf" target="_blank" rel="noopener noreferrer">Leviton single-pole switch instructions</a>. Box selection examples: <a href="https://hubbellcdn.com/ohwassets/HCI/RACO/Catalog/Hubbell_RTB_Catalog2.pdf" target="_blank" rel="noopener noreferrer">Hubbell RACO catalog</a>. These references do not replace the applicable local code or the instructions for a selected product.</p></details>' })
    ]
  });
})();
