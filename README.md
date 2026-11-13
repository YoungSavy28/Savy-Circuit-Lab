# Savy Circuit Lab

Learn electrical circuits by wiring them. Watch an animated demo, build the circuit yourself on a workbench, and see the bulbs light up with live volts and amps.

## Run it
No install, no server, no API key. Put all the files in one folder and **double-click `index.html`**.
(Or run `python -m http.server 8000` in the folder and open http://localhost:8000.)

## Files
| File | What it is |
|---|---|
| `index.html` | Landing page (scroll-lit neon sign, about, lesson plan) |
| `learn.html` | The lessons and workbench |
| `lab.css` | Styles for the workbench and lessons |
| `sim.js` | The circuit engine and editor (nodal analysis, wiring, flow animation) |
| `course.js` | The course registry: the list of lesson files, "coming soon" cards, free build |
| `content/circuits.js` | **Lesson 1: Electric circuits** (6 parts). Edit its text, goals and quizzes here |
| `content/_template.js` | Copy this to start your next lesson |
| `learn.js` | Course map, part panel, self-checking goals, saved progress, guided demo |

## How the course is organised
**Course → Lessons → Parts.** A lesson is a big topic from class (Lesson 1 is Electric circuits). Each lesson is split into short parts, and a part can have a demo, things to learn, goals that check themselves, and a quiz.

### Adding a new lesson after you learn something new
1. Copy `content/_template.js` to `content/<name>.js` (for example `content/wire-sizes.js`).
2. Fill in the title, a one-line blurb, and its parts. The template shows both kinds of part:
   - a **reading-only** part (`bench: false`, no workbench): good for code rules, safety, tools
   - a **workbench** part with goals the app checks
3. Open `course.js` and add the name to the list: `const FILES = ['circuits', 'wire-sizes'];`

The landing page, course map, next-part buttons and progress bar all update on their own. Part ids must be unique, so start them with the lesson id (`wire-sizes-1`, `wire-sizes-2`).

## Using the workbench
- **Add** a part from the toolbar, drag it by its body to move it.
- **Wire**: pick **Red +** or **Black −** in the toolbar (or press W), then drag from one small circle (terminal) to another. On a touch screen, tap one terminal, then tap another.
- **Polarity matters:** red wires belong on the positive side and black on the negative side. Joining red to black, putting a black wire on the + side (or red on the − side), or wiring + straight to − is a short circuit and the battery blows. Select it and press Replace battery after you fix the wiring.
- Click a **switch** to open or close it. Select a part to rotate it, delete it, change a battery's voltage, or unscrew a bulb.
- **Numbers** shows volts and amps. **Flow** shows current moving along the wires.
- Progress and your build for each lesson save in the browser.

## How the simulator works
Every terminal is a node. Wires and closed switches are 0.01 Ω, bulbs are 10 Ω, and batteries are ideal sources with 0.05 Ω internal resistance. Node voltages come from nodal analysis (Gaussian elimination), so series, parallel and mixed circuits work with any number of bulbs. A bulb burns out above 2.5x its rated power, and a wire joining a battery's + and − is flagged as a short circuit.

Battery-level DC only. Real building wiring can kill: practise on real circuits only with training, supervision, and the power locked out.

## Test equipment (Lesson 2: Electrical test equipment)
Part types you can use in any lesson's `start`/`answer` states: `dmm` (multimeter: `mode` V/A/R/C, `fuse`, `bad`), `clamp`, `prover` (known 9 V source), `megger` (`tv`, `testing`), `cable` (`ir` = hidden insulation in megohms).
Hidden faults: bulb `dead:true`, wire `open:true`, switch `stuck:true`. A switch can be `locked:true` (padlock). Any part can show a `label`.
Per-part options in a lesson file: `tools: ['dmm','clamp','prover','megger','cable']` (which Test buttons appear), `numbers:false` (hide on-screen volts/amps), `hint:'...'` (collapsible hint).
Task checks get `stats.meters`, `stats.meggers`, `stats.clamps`, `stats.switches[].locked`, `stats.hidden`, `stats.blownFuses`. Each meter has `across` (parts it is directly across), `onProver`, `live`, `v`, `text`.

## Boxes and devices (Lesson 3)
Thirteen short parts introduce box identification and selection, followed by ten
hands-on activities on the original SVG workbench: wire a receptacle feed, add
grounding pigtails, repair crossed conductors, wire a switch, complete its neutral
and ground, operate the light, branch a junction box, finish its splices, route
conductors through a pull box, and bond the pull box. A final inspection quiz
reviews the finished assembly.

Wires attach directly to colored screw terminals on the receptacle, switch and
light socket. The metal enclosure has a separate grounding/bonding screw.
The supply is drawn as a cable with stripped conductor ends. Junction-box
connections land on connectors inside the open box.

Each activity has its own demo, starting components/wires, answer, goals and saved
workspace. Drag components by their bodies; select a conductor function and drag
between terminal circles. Click switches to operate them. Undo, deletion,
rotation, zoom, fit and touch tap-to-connect use the same editor as earlier lessons.

The new component types and connection checks live in `boxes-wiring.js` and
integrate with `sim.js`. These are connection models, not mains-voltage or AC
power calculations. Existing battery and test-equipment lessons keep their
original numerical solver. Fixture glow is a teaching indicator.

Live wiring goals update as connections change. Building-wiring parts require
all goals and answered quizzes. Each step saves separately in browser storage.

Run dependency-free checks with Node.js:

```sh
node tests/boxes-wiring.cjs
```
