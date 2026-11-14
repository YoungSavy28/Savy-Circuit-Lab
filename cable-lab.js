/* Hands-on cable preparation and fishing in the existing SVG workbench. */
(function(root){
  'use strict';
  const catalog={
    nmb:{name:'NM-B',color:'#e9cc55',label:'12/2 WITH GROUND · CU · NM-B',use:'Dry indoor branch-circuit cable where the local wiring rules permit it.'},
    ufb:{name:'UF-B',color:'#899296',label:'12/2 WITH GROUND · CU · UF-B',use:'A cable identified for underground feeder/branch use, including direct burial under applicable rules.'},
    mc:{name:'MC',color:'#aeb9c3',label:'12 AWG CU · TYPE MC · CHECK LISTING',use:'Insulated conductors in interlocked armor. The exact cable listing controls permitted locations.'},
    thwn:{name:'THHN/THWN-2',color:'#d44a40',label:'12 AWG CU · THHN/THWN-2',use:'An individual insulated conductor for an approved raceway system. Read the actual wet-location marking.'},
    cat6:{name:'Cat 6',color:'#49a9dc',label:'CAT 6 · 4 PAIR · VERIFY FIRE RATING',use:'Twisted-pair data cable. Its communications, pathway and fire ratings matter; it is not branch-circuit power cable.'},
    coax:{name:'Coax',color:'#44536d',label:'RG-6 · 75 OHM · CHECK LISTING',use:'A shielded center-conductor cable for compatible RF/video systems.'},
    soow:{name:'SOOW cord',color:'#39453c',label:'12/3 SOOW · FLEXIBLE CORD',use:'Flexible cord for permitted equipment uses. It is not a general replacement for permanent building wiring.'}
  };
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const box=[-410,-245,820,490], terms=[];
  const route=[[-60,-140],[-60,-50],[-60,60],[0,110]];
  const clone=s=>JSON.parse(JSON.stringify(s));
  const text=(x,y,t,cls='cl-text')=>'<text class="'+cls+'" x="'+x+'" y="'+y+'">'+esc(t)+'</text>';
  function button(action,label,x,y,w=115,on=false){
    const toggle=/^(type:|layer:|gauge:|length:|depth:|mark:|solid$|stranded$)/.test(action);
    return '<g class="cl-button'+(on?' on':'')+'" role="button" aria-label="'+esc(label)+'"'+(toggle?' aria-pressed="'+on+'"':'')+' tabindex="0" data-cable-action="'+action+'"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="30" rx="7"/>'+text(x+w/2,y+20,label,'cl-button-label')+'</g>';
  }

  function tool(kind,x,y){
    if(kind==='wirenut')return '<g class="cl-tool" data-cable-tool="wirenut" role="button" aria-label="Drag wire nut" transform="translate('+x+','+y+')"><path class="cl-wire-nut" d="M-13 -45 h26 l15 55 h-56z"/><path class="cl-nut-ridges" d="M-9 -35 l-8 35 M0 -35 v35 M9 -35 l8 35"/>'+text(0,40,'Twist-on connector','cl-tool-label')+'<rect class="cl-tool-hit" x="-35" y="-55" width="70" height="104"/></g>';
    if(kind==='screwdriver')return '<g class="cl-tool" data-cable-tool="screwdriver" role="button" aria-label="Drag screwdriver" transform="translate('+x+','+y+')"><path d="M0 -60 V3" stroke="#b9c6d8" stroke-width="7"/><rect class="cl-driver-handle" x="-13" y="-3" width="26" height="52" rx="9"/>'+text(0,69,'Screwdriver','cl-tool-label')+'<rect class="cl-tool-hit" x="-28" y="-70" width="56" height="133"/></g>';
    let shape='';
    if(kind==='cutter')shape='<path class="cl-tool-steel" d="M-13 -27 Q-35 -50 -22 -58 L0 -35 L22 -58 Q35 -50 13 -27 L4 -15z"/>';
    else if(kind==='ripper')shape='<rect class="cl-tool-steel" x="-16" y="-49" width="32" height="45" rx="8"/><path d="M-10 -35 h20 M-4 -47 v13" stroke="#192435" stroke-width="4"/>';
    else if(kind==='armor')shape='<rect class="cl-tool-steel" x="-29" y="-42" width="58" height="35" rx="8"/><circle class="cl-armor-wheel" cx="0" cy="-38" r="14"/><path d="M0 -51 v-17 h22" stroke="#c3cbd5" stroke-width="5" fill="none"/>';
    else shape='<path class="cl-tool-steel" d="M-20 -55 h14 l6 28 6 -28 h14 l-10 43 h-20z"/><circle cx="0" cy="-23" r="6" fill="#16202e"/>';
    return '<g class="cl-tool" data-cable-tool="'+kind+'" role="button" aria-label="Drag '+kind+'" transform="translate('+x+','+y+')">'+shape+'<path class="cl-tool-handle" d="M-6 -12 L-20 32 M6 -12 L20 32"/><circle cx="0" cy="-11" r="6" fill="#93a4b7"/>'+text(0,55,kind==='armor'?'Armor cutter':kind==='ripper'?'Jacket ripper':kind==='stripper'?'Wire stripper':'Cable cutter','cl-tool-label')+'<rect class="cl-tool-hit" x="-37" y="-72" width="74" height="132"/></g>';
  }
  function cable(p){
    const c=catalog[p.cableType]||catalog.nmb, open=p.jacketRemoved||p.operation==='explore'||p.operation==='select', single=p.cableType==='thwn';
    let h='<rect class="cl-cable-shadow" x="-292" y="11" width="576" height="59" rx="20"/>';
    const end=p.cut&&p.operation==='cut'?0:open?75:280;
    h+='<rect x="-280" y="20" width="'+(end+280)+'" height="42" rx="'+(single?20:9)+'" fill="'+c.color+'" stroke="#b4becd" stroke-width="2"/>';
    if(p.cableType==='mc')for(let x=-270;x<end;x+=13)h+='<path d="M'+x+' 20 l-13 42" stroke="#5e6978" stroke-width="4"/>';
    h+=text(-115,47,c.name,'cl-jacket-label');
    if(open){
      const colors=p.cableType==='cat6'?['#dc853a','#5ca2dd','#7bb96a','#99817a']:p.cableType==='coax'?['#d0b18f']:single?['#d44a40']:['#27313e','#e5e9ed','#64bd8b'];
      colors.forEach((color,i)=>{const y=colors.length===1?40:4+i*(70/(colors.length-1));h+='<path d="M75 40 Q105 40 125 '+y+' H260" fill="none" stroke="#8793a5" stroke-width="13"/><path d="M75 40 Q105 40 125 '+y+' H260" fill="none" stroke="'+color+'" stroke-width="10"/>';
        if(p.cableType==='cat6')h+='<path d="M125 '+(y-4)+' q10 12 20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="white" stroke-width="2"/>';
        if(i===0&&(p.stripped||p.operation==='explore')){
          const strands=p.construction==='stranded'||p.cableType==='soow';
          h+='<path d="M230 '+y+' H275" stroke="#cf8c4e" stroke-width="'+(strands?10:7)+'"/>';
          if(strands)for(let j=-3;j<=3;j+=2)h+='<path d="M230 '+(y+j)+' H275" stroke="#edba7b" stroke-width="1"/>';
          if(p.damaged)h+='<path d="M249 '+(y-6)+' l-5 10 l9 -4" stroke="#ff5e64" stroke-width="3" fill="none"/>';
        }
      });
    }
    h+=text(0,115,c.label,'cl-legend');
    return h;
  }
  function markup(p){
    let h='<rect class="cl-work-surface" x="-405" y="-240" width="810" height="480" rx="17"/>';
    if(p.operation.startsWith('fish')||p.operation==='snag')return h+wall(p);
    h+=text(0,-208,p.operation==='explore'?'Cable sample bench':p.operation==='select'?'Choose a wiring material':'Cable preparation bench','cl-heading');
    if(['explore','select'].includes(p.operation)){
      Object.entries(catalog).forEach(([k,c],i)=>{h+=button('type:'+k,c.name,-390+i*111,-184,105,p.cableType===k);});
      h+=cable(p)+text(0,155,(catalog[p.cableType]||catalog.nmb).use,'cl-caption');
      if(p.operation==='explore'){
        h+=button('layer:jacket','Jacket',-215,-105,105,p.layer==='jacket')+button('layer:insulation','Insulation',-102,-105,112,p.layer==='insulation')+button('layer:conductor','Conductor',18,-105,115,p.layer==='conductor');
        h+=button('solid','Solid',-125,185,110,p.construction!=='stranded')+button('stranded','Stranded',5,185,110,p.construction==='stranded');
      }else h+=button('confirm','Use this cable',-90,185,180);
      return h;
    }
    if(p.operation==='terminate'||p.operation==='terminal'){
      h+=tool(p.operation==='terminate'?'wirenut':'screwdriver',0,-90);
      h+=button('twist',p.operation==='terminate'?'Tighten connector':'Form clockwise loop',-210,170,200,p.twisted||p.looped);
      h+=button('tug','Tug / inspect',25,170,155,p.secure);
      h+=text(0,-180,p.operation==='terminate'?'Drag the connector onto the prepared wire ends.':'Place the conductor loop on the terminal screw, then use the screwdriver.','cl-caption');
    }
    if(p.operation==='measure'||p.operation==='cut'){
      h+='<path d="M-280 83 H280" stroke="#bd9e54" stroke-width="3"/>';
      for(let i=0;i<=60;i+=10){const x=-280+i*(560/60);h+='<path d="M'+x+' 80 v15" stroke="#e3c988" stroke-width="2"/>'+button('mark:'+i,String(i)+' cm',x-30,106,60,p.mark===i);}
      if(p.mark!==undefined){const x=-280+p.mark*(560/60);h+='<path class="cl-mark" d="M'+x+' 12 V72"/>';}
      h+=text(0,175,'Practice blank: target length 30 cm. This is a measurement exercise.','cl-caption');
    }
    if(['cut','jacket','strip','repair','armor'].includes(p.operation)){
      h+=tool('cutter',-310,-85)+tool('ripper',-105,-85)+tool('stripper',105,-85)+tool('armor',310,-85);
      if(['strip','repair'].includes(p.operation)){
        h+=text(-205,155,'Stripper hole / SOLID copper','cl-caption');
        [10,12,14].forEach((g,i)=>{h+=button('gauge:'+g,'#'+g+' AWG',-365+i*100,172,95,p.gauge===g);});
        [8,12,20].forEach((v,i)=>{h+=button('length:'+v,v+' mm',-25+i*100,172,95,p.stripLength===v);});
        h+=text(125,155,'Example device strip gauge: 12 mm','cl-caption');
      }
      if(p.operation==='jacket'||p.operation==='armor')h+=button('depth:shallow','Controlled depth',-155,168,155,p.depth==='shallow')+button('depth:deep','Deep cut',15,168,130,p.depth==='deep');
      if(p.operation==='repair')h+=button('trim','Trim damaged end',-140,-185,175)+button('accept','Inspect / accept',55,-185,160);
      if(p.operation==='cut')h+='<circle class="cl-drop-zone" cx="0" cy="40" r="30"/>'+text(0,-175,'Drag the cable cutter onto the 30 cm mark.','cl-caption');
      if(p.operation==='jacket'||p.operation==='armor')h+='<circle class="cl-drop-zone" cx="75" cy="40" r="30"/>'+text(0,-175,p.operation==='armor'?'Drag the armor cutter to the cable end.':'Drag the jacket ripper to the cable end.','cl-caption');
      if(p.operation==='strip'||p.operation==='repair')h+='<circle class="cl-drop-zone" cx="240" cy="4" r="26"/>'+text(0,-175,'Choose the gauge and strip length, then drag the stripper onto the black lead.','cl-caption');
    }
    h+=cable(p);
    if(p.operation==='terminate'){
      h+='<path d="M175 -10 Q210 -10 245 4" fill="none" stroke="#d18d51" stroke-width="7"/>';
      if(p.nutPlaced)h+='<path class="cl-wire-nut" d="M240 -12 h22 l12 44 h-46z"/>';
      h+='<circle class="cl-drop-zone" cx="240" cy="4" r="27"/>';
    }
    if(p.operation==='terminal'){
      h+='<rect class="cl-terminal-block" x="211" y="-22" width="69" height="54" rx="5"/><circle class="cl-brass-screw" cx="240" cy="4" r="15"/><path d="M232 12 l16 -16" stroke="#72551e" stroke-width="3"/>';
      if(p.looped)h+='<path d="M205 4 H222 A18 18 0 1 0 242 -14" stroke="#d89457" stroke-width="6" fill="none"/>';
    }
    h+=text(0,227,p.message||'Use the tools on this isolated practice specimen.','cl-feedback');
    return h;
  }
  function wall(p){
    let h=text(0,-209,'Fish a cable through an existing wall','cl-heading');
    h+='<rect class="cl-wall" x="-148" y="-160" width="296" height="310" rx="2"/><rect class="cl-stud" x="-164" y="-174" width="24" height="350"/><rect class="cl-stud" x="140" y="-174" width="24" height="350"/><path class="cl-stud" d="M-140 -10 h58 v20 h-58z M-38 -10 h178 v20 h-178z"/>';
    h+='<path class="cl-pipe" d="M100 -100 V78"/>'+text(235,-20,'Existing pipe','cl-caption')+text(-270,0,'Approved opening','cl-caption');
    h+='<rect class="cl-outlet-opening" x="-33" y="88" width="66" height="63" rx="5"/><rect class="cl-box" x="-25" y="95" width="50" height="49" rx="3"/>';
    h+='<circle class="cl-reel" cx="-60" cy="-165" r="28"/><circle cx="-60" cy="-165" r="15" fill="#18202e"/>';
    h+=button('survey','Survey / isolate',-390,-153,155,p.surveyed)+button('route','Choose clear route',-390,-111,155,p.routeChosen);
    h+=button('attach','Attach cable',210,90,160,p.attached)+button('wrap','Tape tapered joint',210,131,160,p.tapered)+button('backoff','Stop / back off',210,172,160,p.relieved);
    const i=p.fishIndex||0, drawn=route.slice(0,i+1);
    if(p.tip)drawn.push(p.tip);
    if(drawn.length)h+='<path class="cl-fishtape" d="M-60 -165 '+drawn.map(q=>'L'+q[0]+' '+q[1]).join(' ')+'"/>';
    if(p.attached){
      const pull=p.pullIndex||0, pts=route.slice(Math.max(0,route.length-1-pull));
      h+='<path class="cl-pulled-cable" d="M240 65 L0 110 '+pts.slice().reverse().map(q=>'L'+q[0]+' '+q[1]).join(' ')+'"/>';
      h+='<rect x="185" y="54" width="70" height="22" rx="7" fill="#dfc459"/>';
      if(p.tapered)h+='<path d="M0 110 l36 -7 v14z" fill="#a0a8b4"/>';
    }
    const draggingPull=p.fished&&p.attached;
    const tip=draggingPull?route[Math.max(0,3-(p.pullIndex||0))]:route[i];
    h+='<g data-cable-drag="'+(draggingPull?'pull':'fish')+'" role="button" aria-label="'+(draggingPull?'Drag attached cable toward reel':'Drag fish tape tip')+'"><circle class="cl-tip" cx="'+tip[0]+'" cy="'+tip[1]+'" r="13"/><circle class="cl-tip-hit" cx="'+tip[0]+'" cy="'+tip[1]+'" r="23"/></g>';
    const target=draggingPull?route[Math.max(0,2-(p.pullIndex||0))]:route[Math.min(3,i+1)];
    if(!p.pulled)h+='<circle class="cl-drop-zone" cx="'+target[0]+'" cy="'+target[1]+'" r="21"/>';
    h+=text(0,202,p.message||'Survey the route, then drag the fish tape tip to the next ring.','cl-feedback');
    return h;
  }
  function action(p,a){
    if(a.startsWith('type:')){p.cableType=a.split(':')[1];p.visited=Object.assign({},p.visited,{[p.cableType]:true});p.confirmed=false;p.message=catalog[p.cableType].use;}
    else if(a.startsWith('layer:')){p.layer=a.split(':')[1];p.layers=Object.assign({},p.layers,{[p.layer]:true});p.message={jacket:'Outer jacket: protects the complete cable assembly.',insulation:'Insulation: separates an individual conductor from other conductive parts.',conductor:'Copper conductor: the metal current path. Inspect it for damage.'}[p.layer];}
    else if(a==='twist'){if(p.operation==='terminate'){p.twisted=!!p.nutPlaced;p.message=p.twisted?'Connector tightened per its instructions. Tug and inspect each conductor.':'Place the connector over the prepared conductors first.';}else{p.looped=true;p.message='Clockwise conductor loop formed around the terminal. Use the screwdriver next.';}}
    else if(a==='tug'){p.secure=p.operation==='terminate'?!!p.nutPlaced&&!!p.twisted:!!p.looped&&!!p.screwTight;p.message=p.secure?'Connection retained during the simulated tug check. Inspect for exposed copper and follow the actual product instructions.':'Connection is not secure yet. Complete the connector or screw steps.';}
    else if(a==='solid'||a==='stranded'){p.construction=a;p.constructions=Object.assign({},p.constructions,{[a]:true});p.message=a==='solid'?'Solid: one metal conductor.':'Stranded: multiple fine wires form one conductor. Use its correct tool scale and terminal listing.';}
    else if(a==='confirm'){p.confirmed=p.cableType===p.required;p.message=p.confirmed?'Material matches this scenario. Still verify the exact listing and local rules.':'That material does not match this scenario. Read the task and jacket marking.';}
    else if(a.startsWith('mark:')){p.mark=Number(a.split(':')[1]);p.message=p.mark===30?'30 cm marked. Select the cable cutter in the next step.':'Check the ruler: the target is 30 cm.';}
    else if(a.startsWith('gauge:'))p.gauge=Number(a.split(':')[1]);
    else if(a.startsWith('length:'))p.stripLength=Number(a.split(':')[1]);
    else if(a.startsWith('depth:'))p.depth=a.split(':')[1];
    else if(a==='trim'){p.damaged=false;p.stripped=false;p.trimmed=true;p.message='Damaged end removed. Select #12 SOLID and the example device length, then strip again.';}
    else if(a==='accept'){p.accepted=!!p.stripped&&!p.damaged&&p.stripLength===12;p.message=p.accepted?'Clean copper and correct exposure: accepted for this practice specimen.':'Reject this end: trim damaged copper and prepare it again.';}
    else if(a==='survey'){p.surveyed=true;p.message='Model surveyed: power isolated, utilities identified, destination and existing approved opening confirmed.';}
    else if(a==='route'){p.routeChosen=!!p.surveyed;p.message=p.routeChosen?'Use the left passage through the existing opening. Keep clear of the pipe.':'Survey and isolate before choosing a route.';}
    else if(a==='attach'){p.attached=!!p.fished;p.message=p.attached?'Cable attached to the leader. Make a smooth tapered joint before pulling.':'First guide the fish tape to the outlet opening.';}
    else if(a==='wrap'){if(p.attached){p.tapered=true;p.message='Smooth taped joint prepared. Drag the attached leader back toward the reel.';}else p.message='Attach the cable before wrapping the joint.';}
    else if(a==='backoff'){p.relieved=!!p.snagged;p.snagged=false;p.message=p.relieved?'Pull stopped and backed off. Correct the joint and route before trying again.':'Use this when a pull snags. Never force it.';}
  }
  function safeSegment(a,b){
    const steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/4);
    for(let i=0;i<=steps;i++){
      const t=steps?i/steps:0,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;
      if(x < -117 || x > 117 || y < -150 || y > 142)return false;
      if(y>=-12&&y<=12&&Math.abs(x+60)>20)return false;
      if(x>=80&&x<=115&&y>=-110&&y<=88)return false;
    }return true;
  }
  function drop(p,tool,x,y,trail=[]){
    if(tool==='fish'||tool==='pull'){
      if(!p.surveyed||!p.routeChosen){p.message='Stop: survey, isolate and choose the route before feeding.';return;}
      if(tool==='pull'&&(!p.tapered||p.snagged)){p.snagged=true;p.message='The joint snagged. Stop and back off; prepare a smooth joint. Do not force the pull.';return;}
      const index=tool==='pull'?3-(p.pullIndex||0):(p.fishIndex||0), next=tool==='pull'?index-1:index+1;
      if(next<0||next>3)return;
      const path=[route[index]].concat(trail,[[x,y]]);
      if(!path.slice(1).every((q,i)=>safeSegment(path[i],q))){p.message='Blocked route: keep inside the bay and use the existing opening. Do not force or drill blindly.';return;}
      if(Math.hypot(x-route[next][0],y-route[next][1])>26){p.message='Guide the tip to the next ring, one section at a time.';return;}
      if(tool==='fish'){p.fishIndex=next;p.fished=next===3;p.message=p.fished?'Fish tape reached the outlet opening. Attach the cable.':'Section fed. Continue to the next ring.';}
      else{p.pullIndex=(p.pullIndex||0)+1;p.pulled=p.pullIndex===3;p.message=p.pulled?'Cable pulled through. Inspect the jacket and finish the entry protection before use.':'Steady pull. Keep the joint clear and feed without kinks.';if(p.pulled&&p.relieved)p.recovered=true;}
      return;
    }
    if(tool==='wirenut'||tool==='screwdriver'){if(Math.hypot(x-240,y-4)>48){p.message='Place the connector or driver on the highlighted wire joint or terminal screw.';return;}if(tool==='wirenut'&&p.operation==='terminate'){p.nutPlaced=true;p.message='Connector placed over both prepared ends. Tighten according to its instructions.';}else if(tool==='screwdriver'&&p.operation==='terminal'){p.screwTight=!!p.looped;p.message=p.screwTight?'Terminal screw secured for the model. Real terminals require their specified torque.':'Form the correct loop before tightening.';}return;}
    const target=p.operation==='cut'?[0,40]:tool==='cutter'?[0,40]:tool==='ripper'||tool==='armor'?[75,40]:[240,4];
    if(Math.hypot(x-target[0],y-target[1])>48){p.message='Place the working jaws on the highlighted cable section.';return;}
    if(p.operation==='cut'&&(tool==='cutter'||(tool==='stripper'&&p.acceptStripperCut))){if(p.mark===30){p.cut=true;p.message='Cable cut square at the measured mark.';}else p.message='Measure and mark 30 cm before cutting.';}
    else if(p.operation==='jacket'&&tool==='ripper'){
      if(p.depth==='shallow'){p.jacketRemoved=true;p.message='Jacket opened with conductor insulation intact. Peel away the loosened jacket; inspect underneath.';}else{p.damaged=true;p.message='Too deep: inner insulation was damaged. Reset and use controlled depth.';}
    }else if(p.operation==='armor'&&tool==='armor'){
      if(p.depth==='shallow'){p.armorOpened=true;p.jacketRemoved=true;p.message='Armor opened without damaging insulation. Remove sharp scrap and use the fittings required for this exact cable.';}else{p.damaged=true;p.message='Excess depth damages the inner conductors. Reset and use the tool setting for the cable.';}
    }else if(['strip','repair'].includes(p.operation)&&tool==='stripper'){
      if(p.gauge===14){p.damaged=true;p.message='The #14 hole is too small for this #12 solid conductor: copper nicked. Trim back or reset.';}
      else if(p.gauge!==12)p.message='The selected hole did not strip cleanly. Use the correct SOLID gauge marking.';
      else if(p.stripLength!==12)p.message='Match the 12 mm strip gauge printed on this example device; other devices can differ.';
      else{p.stripped=true;p.message=p.damaged?'The nick is still present. Trim the damaged section before accepting.':'Insulation removed to the example strip gauge. Inspect the copper before accepting.';}
    }else p.message='Use the tool intended for this material and operation.';
  }
  function stats(p){return clone(p);}
  root.CableLab={catalog,terms,box,markup,action,drop,stats,safeSegment,route};
})(window);
