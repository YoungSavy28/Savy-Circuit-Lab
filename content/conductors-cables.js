/* Lesson 4: isolated specimens, cable tools and a wall-fishing model. */
(function(){
  'use strict';
  const Q=(q,o,a,why)=>({q,o,a,why});
  const task=(id,text,check)=>({id,text,check:s=>!!s.cable&&check(s.cable),live:true});
  const sample=(operation,props={})=>({parts:[Object.assign({id:1,type:'cablebench',x:500,y:300,rot:0,operation,cableType:'nmb',construction:'solid'},props)],wires:[]});
  const activity=(id,title,goal,operation,start,finish,learn,tasks,quiz=[])=>({
    id:'cables-'+id,title,goal,mins:6,workbench:'cables',numbers:false,learn,tasks,quiz,
    help:'Use the labeled controls on the workbench. Drag a tool by its handle onto the highlighted cable area. In wall exercises, drag the tape tip from one ring to the next. Undo and Reset workspace let you try again.',
    hint:learn[learn.length-1],start:sample(operation,start),answer:sample(operation,finish),
    demo:[
      {text:'<b>'+title+'.</b> '+goal,state:sample(operation,start),ms:5500},
      {text:learn[0],state:sample(operation,start),ms:6000},
      {text:'This is the target state for this part. Press <b>Try it yourself</b>, then use the tools and controls to meet the goals.',state:sample(operation,finish),ms:6500}
    ]
  });
  const reading=(id,title,goal,learn,quiz,body)=>({id:'cables-'+id,title,goal,mins:5,bench:false,learn,quiz,tasks:[],body});
  const typeQuiz=Q('Which marking is the strongest basis for deciding where a cable may be used?', ['The jacket color alone','The actual cable type/listing plus applicable local rules','Whether it fits the hole','The brand name alone'],1,'Cable color is not an installation approval. Check the printed marking, listing, wiring method and local requirements.');
  const fishReady={surveyed:true,routeChosen:true,fishIndex:3,fished:true};
  const pulled=Object.assign({},fishReady,{attached:true,tapered:true,pullIndex:3,pulled:true});
  COURSE.add({
    id:'conductors-cables',title:'Conductors, cables & cable fishing',
    blurb:'Explore seven wiring materials, cut and strip practice specimens, secure screw terminals and wire nuts, and fish a cable through a wall model.',
    parts:[
      activity('anatomy','Explore a cable and its layers','Identify jacket, insulation and conductor; compare solid and stranded.','explore',{},
        {layers:{jacket:true,insulation:true,conductor:true},constructions:{solid:true,stranded:true},construction:'stranded',layer:'conductor'},[
          'Click <b>Jacket</b>, <b>Insulation</b> and <b>Conductor</b> on the cutaway. The cable assembly and each insulated conductor are different things.',
          'Solid means one metal conductor. Stranded means several fine wires together form one conductor; it does not mean several separate circuits.',
          'Tool scales and terminal listings distinguish solid and stranded. Choose the scale and termination approved for the actual material.',
          'Click both construction choices. These drawings are simplified cutaways, not product dimensions.'
        ],[task('layers','Inspect all three layers.',p=>['jacket','insulation','conductor'].every(k=>p.layers?.[k])),task('construction','Compare solid and stranded conductor views.',p=>p.constructions?.solid&&p.constructions?.stranded)]),
      activity('types','Compare seven cable and conductor types','Explore NM-B, UF-B, MC, individual building wire, data cable, coax and flexible cord.','explore',{},
        {visited:{nmb:true,ufb:true,mc:true,thwn:true,cat6:true,coax:true,soow:true},cableType:'mc'},[
          'Select each sample across the top. Look at the jacket, armor, shielding, pairs and exposed ends.',
          '<b>NM-B:</b> dry indoor cable where permitted. <b>UF-B:</b> cable identified for underground applications, including direct burial under applicable rules.',
          '<b>MC:</b> insulated conductors inside metal armor. Verify the specific cable and fittings; armor alone does not establish wet-location suitability.',
          '<b>THHN/THWN-2:</b> an individual conductor, typically part of a raceway wiring method. Read its actual insulation markings.',
          '<b>Cat 6</b> and <b>coax</b> serve compatible communications systems. <b>SOOW</b> is flexible cord for permitted uses, not a general substitute for permanent building cable.',
          'The sample colors are illustrations. Cable color, conductor size and appearance alone do not establish where a product may be installed.'
        ],[task('samples','View all seven wiring-material samples.',p=>['nmb','ufb','mc','thwn','cat6','coax','soow'].every(k=>p.visited?.[k]))],[typeQuiz]),
      reading('markings','Read the jacket and wire legend','Read size, conductor count, material and insulation type before selecting tools.',[
        '<b>12/2 with ground</b> in this lesson means two insulated #12 conductors plus an equipment grounding conductor. The ground is additional to the two insulated conductors.',
        'Within the AWG size range shown here, a smaller gauge number means a larger conductor. #12 is larger than #14. This alone is not an ampacity calculation.',
        '<b>CU</b> means copper. Aluminum and copper-clad conductors need devices and methods identified for their materials.',
        'Read insulation/wet-location, temperature and cable-type markings. Do not assume THHN alone is a wet-location rating or that conductors removed from NM-B become individually listed raceway wires.',
        'Choose conductor size with the circuit design, protective device, terminals, environment and applicable adjustment rules. This beginner lesson does not size a real circuit.'
      ],[
        Q('How many insulated conductors are in the lesson example marked 12/2 with ground?',['One','Two, plus a separate grounding conductor','Three plus another ground','Twelve'],1,'The /2 identifies two insulated conductors. The equipment ground is additional.'),
        Q('Which conductor is larger?',['#14 AWG','#12 AWG','They are always equal','Size comes only from jacket color'],1,'In this AWG range, a smaller gauge number identifies a larger conductor.')
      ]),
      activity('dry-selection','Choose cable for a dry indoor example','Choose the cable described by the approved plan for this scenario.','select',{required:'nmb'},
        {required:'nmb',cableType:'nmb',confirmed:true},[
          'Scenario: the approved plan specifically calls for <b>NM-B</b> in a dry indoor dwelling location where that wiring method is permitted.',
          'This is a material-recognition exercise, not a statement that NM-B is permitted in every building or every NYC installation.',
          'Select NM-B, read its label and press <b>Use this cable</b>.'
        ],[task('choose','Select and confirm NM-B for the stated plan.',p=>p.confirmed&&p.cableType==='nmb')]),
      activity('underground-selection','Choose the underground cable','Recognize a cable identified for the stated underground application.','select',{required:'ufb'},
        {required:'ufb',cableType:'ufb',confirmed:true},[
          'Scenario: the plan calls for a <b>UF-B</b> underground feeder/branch cable, with burial method and protection specified separately.',
          'Choosing the cable is only one step. Cover depth, mechanical protection, entries, ampacity and local approval still need to be established for a real installation.',
          'Select UF-B and press <b>Use this cable</b>. NM-B is not the replacement in this scenario.'
        ],[task('choose','Select and confirm UF-B.',p=>p.confirmed&&p.cableType==='ufb')]),
      activity('raceway-selection','Choose conductors for a raceway','Distinguish individual building wire from a complete cable assembly.','select',{required:'thwn'},
        {required:'thwn',cableType:'thwn',confirmed:true},[
          'Scenario: the approved raceway design calls for individually marked <b>THHN/THWN-2</b> copper conductors.',
          'Use the actual product marking for its environment. Do not strip NM-B and treat its unmarked internal conductors as separately listed building wire.',
          'Select THHN/THWN-2 and confirm. The raceway, conductor count/fill, pulling limits and equipment ground still require a complete design.'
        ],[task('choose','Choose individually marked THHN/THWN-2.',p=>p.confirmed&&p.cableType==='thwn')]),
      activity('measure','Measure and mark before cutting','Mark a 30 cm practice blank on the ruler.','measure',{}, {mark:30},[
          'Use the ruler on the specimen and click the <b>30 cm</b> mark. Measure the required route and planned preparation allowance before a real cut.',
          'The 30 cm target is just this exercise. It is not a prescribed conductor length for an electrical box.',
          'Keep enough material for the specified terminations and service allowance; do not leave the run under tension.'
        ],[task('mark','Mark 30 cm on the practice ruler.',p=>p.mark===30)]),
      activity('cut','Cut the cable with the correct tool','Drag the cable cutter onto your measured mark.','cut',{mark:30},{mark:30,cut:true},[
          'Drag the <b>cable cutter</b> by its handle onto the highlighted 30 cm mark. The model then shows the cut specimen.',
          'Use cutters rated for the actual cable material and size. Do not use a cable cutter on steel armor unless it is specifically rated for that task.',
          'Real practice: isolate and verify dead, protect your eyes, keep fingers clear and support the offcut. These tools are for an isolated specimen.'
        ],[task('cut','Make a square cut at the measured mark.',p=>p.cut&&p.mark===30)]),
      activity('conductor-cut','Cut an individual wire','Use the cutting jaws on a combination wire stripper.','cut',
        {cableType:'thwn',mark:30,acceptStripperCut:true}, {cableType:'thwn',mark:30,acceptStripperCut:true,cut:true},[
          'This is one #12 copper conductor. Drag the combination wire stripper onto the marked cut using its cutting-jaw function.',
          'A combination stripper can have separate cutting jaws and gauge-sized stripping holes. Use the correct part of the tool for each task.',
          'The model assumes this tool is rated for the specimen. Actual tool capacity controls which conductor materials and sizes it can cut.'
        ],[task('cut','Cut the single conductor with the combination stripper.',p=>p.cut&&p.cableType==='thwn')]),
      activity('jacket','Remove the outer jacket','Open the sheath while leaving conductor insulation intact.','jacket',{cut:true},{cut:true,depth:'shallow',jacketRemoved:true},[
          'Choose <b>Controlled depth</b>, then drag the <b>jacket ripper</b> to the cable end. The cutaway reveals the conductors.',
          'The tool opens the outer sheath; it should not cut through individual conductor insulation. Peel away loosened jacket and inspect underneath.',
          'Use the tool and technique intended for the actual cable. UF-B and armored cable can need different preparation methods from this NM-B specimen.',
          'If you choose a deep cut, the model flags damage. Reset and use controlled depth; never hide damaged insulation inside the box.'
        ],[task('jacket','Remove jacket without damaging the inner insulation.',p=>p.jacketRemoved&&!p.damaged)]),
      activity('strip','Strip a conductor with a wire stripper','Match the gauge and example strip length, then remove insulation.','strip',{jacketRemoved:true},
        {jacketRemoved:true,gauge:12,stripLength:12,stripped:true},[
          'This specimen is <b>#12 solid copper</b>. Choose the #12 SOLID stripper hole and <b>12 mm</b>, the strip gauge printed on this example terminal.',
          'Drag the <b>wire stripper</b> onto the highlighted black conductor end. The copper appears when the insulation is removed.',
          'A smaller hole can nick copper; an oversized hole may not remove the insulation. Stranded wire uses the appropriate stranded scale.',
          'Strip length comes from the actual device or connector instructions. Twelve millimeters is an example, not a universal rule.'
        ],[task('strip','Expose the correct length of clean, undamaged copper.',p=>p.stripped&&!p.damaged&&p.gauge===12&&p.stripLength===12)]),
      activity('repair','Inspect and repair a nicked conductor','Reject the damaged end, trim it back, strip again and inspect.','repair',
        {jacketRemoved:true,stripped:true,damaged:true,gauge:14,stripLength:12},
        {jacketRemoved:true,stripped:true,damaged:false,trimmed:true,gauge:12,stripLength:12,accepted:true},[
          'The red mark shows a nick in the copper. Pressing <b>Inspect / accept</b> must not approve this damaged specimen.',
          'Use <b>Trim damaged end</b>, choose #12 SOLID and the example 12 mm strip gauge, then drag the wire stripper onto the new end.',
          'Inspect again: no nicked metal, cut strands or damaged insulation should be accepted. Replace the run if adequate sound material is not available.'
        ],[task('repair','Trim, restrip and accept the clean end.',p=>p.trimmed&&p.accepted&&!p.damaged)]),
      activity('armor','Prepare an armored cable end','Use an armor-cutting tool rather than cutting blindly through metal and conductors.','armor',
        {cableType:'mc'}, {cableType:'mc',depth:'shallow',armorOpened:true,jacketRemoved:true},[
          'Choose <b>Controlled depth</b> and drag the <b>armor cutter</b> to the MC cable end.',
          'An armor-cutting tool opens the metal sheath while protecting the insulated conductors. Follow the exact tool/cable instructions; the model does not prescribe blade depth or a universal number of turns.',
          'Remove sharp scrap, inspect insulation and select fittings identified for the specific cable. MC and AC grounding constructions are not interchangeable assumptions.'
        ],[task('armor','Open the armor without damaging the conductors.',p=>p.armorOpened&&!p.damaged)]),
      activity('wire-nut','Join wires with a twist-on connector','Place, tighten and inspect a wire-nut connection on prepared ends.','terminate',
        {jacketRemoved:true,stripped:true}, {jacketRemoved:true,stripped:true,nutPlaced:true,twisted:true,secure:true},[
          'Drag the <b>twist-on connector</b> onto the prepared wire ends. Then use <b>Tighten connector</b> and <b>Tug / inspect</b>.',
          'Actual connectors specify conductor material, size, count, strip length and any pre-twisting requirement. Jacket color or cap color alone does not establish compatibility.',
          'The model checks the sequence, not actual torque or grip. Inspect that no unintended bare copper is exposed and each conductor is retained.',
          'A splice belongs inside an appropriate accessible enclosure. A connector is not a substitute for a junction box.'
        ],[task('connector','Place and tighten the connector, then pass the simulated tug check.',p=>p.nutPlaced&&p.twisted&&p.secure)]),
      activity('terminal','Secure wire to a terminal screw','Form the conductor loop, tighten the screw and inspect the connection.','terminal',
        {jacketRemoved:true,stripped:true}, {jacketRemoved:true,stripped:true,looped:true,screwTight:true,secure:true},[
          'For this modeled loop-under-screw terminal, use <b>Form clockwise loop</b>, drag the <b>screwdriver</b> to the brass screw, then select <b>Tug / inspect</b>.',
          'This loop method is not universal. Pressure plates, back-wire clamps and other terminals follow their own instructions and wire requirements.',
          'Use the terminal manufacturer strip gauge and specified tightening torque. This simulation cannot verify real torque or connection quality.'
        ],[task('screw','Form, secure and inspect the screw-terminal connection.',p=>p.looped&&p.screwTight&&p.secure)]),
      activity('fish-plan','Survey the wall and choose a route','Identify the destination, existing utilities and an approved passage.','fish-plan',{},
        {surveyed:true,routeChosen:true},[
          'Select <b>Survey / isolate</b>, then <b>Choose clear route</b>. The model contains studs, a pipe, an existing approved opening and an outlet opening.',
          'In real work, establish isolation and locate services before opening or fishing a wall. A nonconductive rod or tape does not make energized work safe.',
          'This exercise uses an existing approved passage through the blocking. It does not authorize drilling framing, cutting fire barriers or working around unknown utilities.',
          'Plan access and protection first. Restore required fire/smoke and air sealing with an appropriate system after installation.'
        ],[task('survey','Survey/isolate and choose the clear route.',p=>p.surveyed&&p.routeChosen)]),
      activity('fish-feed','Guide fish tape to the outlet opening','Drag the tape tip through each target ring without hitting the wall obstruction.','fish-feed',
        {surveyed:true,routeChosen:true}, fishReady,[
          'Drag the fish-tape tip to the next ring. Feed down the left passage, through the existing opening, then into the outlet opening.',
          'The path is checked, so jumping through blocking or outside the stud bay is rejected. Keep the tip clear of the pipe.',
          'Use hand feeding as directed by the actual tool. Never use fish tape on or near live circuits, and stop if resistance suggests an obstruction.'
        ],[task('feed','Reach the outlet opening by the approved route.',p=>p.fished)]),
      activity('fish-pull','Attach and pull the cable','Prepare a smooth joint and pull the cable back through the wall.','fish-pull',fishReady,pulled,[
          'Use <b>Attach cable</b> and <b>Tape tapered joint</b>. Drag the attached tip back through the rings toward the reel.',
          'Prepare the leader connection as the tool and cable instructions require. A smooth tapered joint reduces snagging; do not leave an exposed hook or bulky shoulder.',
          'Feed slack, avoid kinks and protect entries. For conduit, use a pulling lubricant only when compatible with the cable and tool instructions.',
          'Do not exceed cable pulling-tension or bend limits. Those values depend on the product and route; this model checks the path only.'
        ],[task('pull','Attach, taper and pull the cable completely through.',p=>p.attached&&p.tapered&&p.pulled)]),
      activity('snag','Recover from a snag','Stop the pull, back off, correct the joint and pull again.','snag',
        Object.assign({},fishReady,{attached:true,snagged:true}), Object.assign({},pulled,{relieved:true,recovered:true}),[
          'The starting joint has snagged. Select <b>Stop / back off</b> before trying to move it again.',
          'Correct the joint using <b>Tape tapered joint</b>, then guide it back through the rings. Do not force a stuck pull.',
          'Real snag recovery may require removing the pull, inspecting for damage, clearing the route and choosing another access method. More force is not a safe default.'
        ],[task('recover','Back off, correct the joint and finish the pull.',p=>p.recovered&&p.pulled)]),
      reading('finish','Protect and inspect the completed run','Check entry protection, support, bends and restoration before termination.',[
        'Inspect the full accessible jacket and every prepared conductor end. Reject cuts, crushed areas, missing strands and other damage.',
        'Use the box fittings, bushings or grommets required for the wiring method. Keep cable sheath and individual conductor insulation where the applicable assembly requires them.',
        'Support and secure cables as the wiring method and local rules require without crushing the jacket. Protect exposed runs and locations vulnerable to fasteners.',
        'Observe the cable manufacturer bend and pulling limits. Avoid sharp bends, staples driven too tight, kinks and excessive pulling tension.',
        'Keep required splices accessible, use suitable enclosures, verify box space, and restore required fire/smoke sealing. Obtain qualified inspection for real installation work.'
      ],[
        Q('A cable snags while being pulled. What should you do first?',['Pull much harder','Use powered equipment regardless of the fish-tape instructions','Stop and investigate/back off safely','Ignore jacket damage'],2,'Stop the pull and correct the cause. Do not force a hung-up fish tape.'),
        Q('The insulation is stripped, but the copper is nicked. What should happen?',['Hide it under tape','Accept it if the light works','Reject and reprepare sound material or replace as needed','Tighten the screw harder'],2,'Nicked copper or damaged strands are defects. A working load does not prove a sound connection.')
      ],'<details><summary>References and lesson scope</summary><p>See the <a href="https://www.southwire.com/building-wire-selector/technical-document" target="_blank" rel="noopener noreferrer">Southwire material selector</a>, <a href="https://cabletechsupport.southwire.com/en/tile/30/cable/48699/?country=US" target="_blank" rel="noopener noreferrer">NM-B guidance</a>, <a href="https://www.southwire.com/wire-cable/building-wire/simpull-sup-sup-thhn-thwn-2-copper/p/SPEC10000" target="_blank" rel="noopener noreferrer">building-wire markings</a>, and <a href="https://data.kleintools.com/sites/all/product_assets/documents/instructions/klein/Fishtape_Digital_Instructions.pdf" target="_blank" rel="noopener noreferrer">Klein fish-tape instructions</a>. These isolated models teach recognition and procedure; real installations require the exact product instructions, applicable local rules and appropriate training.</p></details>')
    ]
  });
})();
