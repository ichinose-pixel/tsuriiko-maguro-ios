// Original procedural artwork. Shared by title, live fishing and catch journal.
// Anatomy remains layered so tail, fins, arms, rod and hull move independently.
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function shape(c,draw,fill,stroke=null,width=.025){c.beginPath();draw(c);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke();}}
function oval(c,x,y,rx,ry,fill){shape(c,p=>p.ellipse(x,y,rx,ry,0,0,TAU),fill);}
function grad(c,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);for(const [n,col] of stops)g.addColorStop(n,col);return g;}
function stroke(c,pts,color,width){shape(c,p=>{pts.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));},null,color,width);}

export function drawFish(c,x,y,type,t,scale,dir,known,species,reduced){
 const sp=species[type],z=sp.size*scale,kind=sp.shape;
 if(reduced)t=0;
 const h={slender:.22,striped:.30,bonito:.35,longfin:.35,bigeye:.43,sickle:.39,barrel:.46}[kind];
 const dark=['#14627b','#164a69','#154563','#1a4368','#233c62','#19456b','#173552'][type];
 const fin=type===5?'#ecc448':type===3?'#739aaf':'#356b86';
 c.save();c.translate(x,y);c.rotate(Math.sin(t*3.4)*.025);c.scale(dir*z,z);c.transform(1,Math.sin(t*3.4)*.012,0,1,0,0);
 const body=p=>{if(type===0){p.moveTo(1,.005);p.bezierCurveTo(.65,-.19,-.29,-.23,-.76,-.045);p.lineTo(-.76,.045);p.bezierCurveTo(-.25,.18,.65,.23,1,.005);p.closePath();return;}if(type===6){p.moveTo(.95,.035);p.bezierCurveTo(.76,-.42,.16,-.59,-.30,-.34);p.quadraticCurveTo(-.6,-.17,-.75,-.07);p.lineTo(-.75,.07);p.bezierCurveTo(-.27,.39,.36,.57,.81,.24);p.lineTo(.95,.035);p.closePath();return;}p.moveTo(.98,.012);p.bezierCurveTo(.80,-h*.78,.36,-h*1.22,-.10,-h*.97);p.bezierCurveTo(-.39,-h*.86,-.60,-h*.30,-.75,-.085);p.lineTo(-.75,.085);p.bezierCurveTo(-.42,h*.50,-.21,h*1.03,.16,h);p.bezierCurveTo(.61,h*.91,.87,h*.44,.98,.012);p.closePath();};
 // Caudal peduncle and flexible crescent tail, rather than a triangular cutout.
 c.save();c.translate(-.72,0);c.rotate(Math.sin(t*7)*.19);c.scale(1,.88+Math.cos(t*7)*.12);
 shape(c,p=>{p.moveTo(.06,-.07);p.bezierCurveTo(-.12,-.11,-.29,-.39,-.47,-.52);p.bezierCurveTo(-.41,-.32,-.23,-.14,-.15,0);p.bezierCurveTo(-.24,.16,-.40,.32,-.47,.51);p.bezierCurveTo(-.28,.40,-.11,.12,.06,.075);p.closePath();},known?grad(c,0,-.45,0,.45,[[0,type===5?'#fff090':'#78a8b9'],[.48,fin],[1,dark]]):'#43657a',known?dark:null,.018);if(known){for(const side of [-1,1])for(let j=0;j<3;j++)stroke(c,[[.00,side*.045],[-.22-j*.06,side*(.19+j*.10)]],'#c9dcd933',.008);}c.restore();
 // Fin membranes pivot subtly; rays remain visible in the enlarged journal.
 c.save();c.translate(.04,-h*.90);c.rotate(Math.sin(t*4.1)*.035);c.translate(-.04,h*.90);
 // Dorsal fin has a curved leading edge and a soft trailing membrane.
 shape(c,p=>{p.moveTo(-.18,-h*.91);p.bezierCurveTo(-.09,-h-.06,.04,-h-.30,.14,-h-.29);p.bezierCurveTo(.10,-h-.10,.23,-h*.90,.34,-h*.85);p.closePath();},known?grad(c,0,-h-.3,0,-h,[[0,'#91b4c3'],[1,dark]]):'#43657a',known?dark:null,.014);
 if(known)for(let j=0;j<5;j++)stroke(c,[[-.12+j*.08,-h*.90],[.08+j*.018,-h-.23+j*.036]],'#bdd0cb55',.009);c.restore();
 if(type===5){
  shape(c,p=>{p.moveTo(-.36,-h*.69);p.bezierCurveTo(-.47,-h-.03,-.72,-h-.33,-.90,-h-.34);p.bezierCurveTo(-.68,-h-.08,-.63,-h*.72,-.51,-h*.49);p.closePath();},known?'#f7d34b':'#43657a',known?'#bc9131':null,.015);
  shape(c,p=>{p.moveTo(-.27,h*.76);p.bezierCurveTo(-.41,h+.07,-.68,h+.25,-.80,h+.23);p.bezierCurveTo(-.54,h*.82,-.51,h*.54,-.43,h*.51);p.closePath();},known?'#f0c541':'#43657a');
 }
 const silver=grad(c,0,-h,0,h,[[0,dark],[.18,'#356879'],[.39,'#7caab9'],[.53,'#d2e0d9'],[.66,'#f1f1db'],[.85,'#bdcfc6'],[1,'#7396a7']]);
 shape(c,body,known?silver:'#43657a',known?'#1e4c64':null,.018);
 if(known){
  c.save();c.beginPath();body(c);c.clip();
  // Lit shoulder and a silver flank: volume stays visible at mobile size.
  const sheen=c.createRadialGradient(.28,-h*.30,.02,.23,-h*.15,.72);sheen.addColorStop(0,'#ffffff7a');sheen.addColorStop(1,'#ffffff00');c.fillStyle=sheen;c.fillRect(-.7,-h,1.8,h*2);
  shape(c,p=>{p.moveTo(-.58,.016);p.bezierCurveTo(-.13,-.008,.48,.04,.85,.00);},null,type===5?'#e9cd58':'#cce9e7',.019);
  if(type===0)for(let i=0;i<7;i++)oval(c,-.43+i*.14,-.035,.021,.021,'#264d64');
  if(kind==='striped')for(let i=0;i<7;i++){const xx=-.37+i*.115;shape(c,p=>{p.moveTo(xx,-h*.8);p.bezierCurveTo(xx+.11,-h*.71,xx-.035,-h*.44,xx+.085,-h*.22);},null,'#163f5fb0',.028);}
  if(kind==='bonito')for(let i=0;i<4;i++){const yy=.06+i*.063;shape(c,p=>{p.moveTo(-.41,yy);p.bezierCurveTo(-.08,yy+.05,.18,yy+.08,.46,yy-.03);},null,'#2b556ab8',.025);}
  // Fine scales are reserved for large portraits; moving play fish keep a clean silhouette.
  if(z>70){for(let row=0;row<4;row++)for(let i=0;i<15;i++){const xx=-.51+i*.072+(row%2)*.035,yy=-h*.2+row*h*.23;shape(c,p=>{p.moveTo(xx,yy);p.quadraticCurveTo(xx+.024,yy+.022,xx+.045,yy);},null,'#fffce81d',.007);}}
  if(type===6||type===5)for(let i=0;i<8;i++){const xx=-.46+i*.1,yy=h*(.34+Math.sin(i*.75)*.07);stroke(c,[[xx,yy],[xx+.016,yy+.033]],type===5?'#e1ce8055':'#788f9e55',.013);}
  shape(c,p=>{p.moveTo(-.65,-h*.17);p.bezierCurveTo(-.24,-h*.74,.25,-h*.82,.58,-h*.48);},null,'#91b4bf66',.015);
  c.restore();
  // Gill cover follows the head curvature; eye sits above a small mouth.
  shape(c,p=>{p.moveTo(.47,-h*.63);p.bezierCurveTo(.35,-.04,.43,h*.55,.56,h*.67);},null,'#36647bb3',.025);
  shape(c,p=>{p.moveTo(.51,-h*.55);p.bezierCurveTo(.43,-.035,.49,h*.40,.60,h*.48);},null,'#edf7ed99',.012);
  shape(c,p=>{p.moveTo(.83,.09);p.quadraticCurveTo(.93,.08,.97,.018);},null,'#20465b',.018);
 }
 // Articulated pectoral fin: albacore's long fin remains a distinct silhouette.
 const flutter=Math.sin(t*5.5)*.09;
 c.save();c.translate(.40,.04);c.rotate(flutter);
 shape(c,p=>{p.moveTo(0,0);p.bezierCurveTo(-.13,.05,kind==='longfin'?-.70:-.22,kind==='longfin'?.52:.31,kind==='longfin'?-.95:-.41,kind==='longfin'?.46:.29);p.bezierCurveTo(kind==='longfin'?-.60:-.25,.15,-.13,-.055,0,0);},known?grad(c,0,0,-.3,.3,[[0,'#a1c6cd'],[.6,fin],[1,dark]]):'#43657a',known?dark:null,.012);if(known){for(let j=0;j<3;j++)stroke(c,[[0,0],[kind==='longfin'?-.64-j*.09:-.25-j*.05,kind==='longfin'?.26+j*.06:.17+j*.04]],'#d3ded43d',.008);}c.restore();
 if(type>=2)for(let i=0;i<5;i++){const xx=-.32-i*.08,yy=h*(.77-i*.105);for(const side of [-1,1])shape(c,p=>{p.moveTo(xx,side*yy);p.quadraticCurveTo(xx-.025,side*(yy+.095),xx-.095,side*(yy+.083));p.lineTo(xx-.068,side*(yy-.025));},known?(type===5?'#f7d85a':'#9fb8b8'):'#43657a',null);}
 const eye=kind==='bigeye'?.077:type>=3?.046:.060;
 oval(c,.73,-h*.20,eye*1.28,eye*1.12,known?'#71867e':'#43657a');oval(c,.74,-h*.22,eye,eye,known?'#f9f1ca':'#43657a');if(known){oval(c,.755,-h*.22,eye*.64,eye*.74,'#112f42');oval(c,.77,-h*.24,eye*.22,eye*.22,'#fffef3');}
 c.restore();
}

export function drawBoat(c,{x,y,t,scale=1,phase,caught,reduced,alpha=1}){
 if(reduced)t=0;const hauling=phase==='up',landing=phase==='landing';const load=clamp(caught/3,0,1),lift=landing?Math.sin(t*6)*.10:hauling?Math.sin(t*6)*.035:Math.sin(t*1.7)*.01;
 c.save();c.globalAlpha=alpha;c.translate(x,y+Math.sin(t*1.7)*2);c.scale(scale,scale);c.rotate(Math.sin(t*1.3)*.011);
 oval(c,1,27,123,9,'#08678250');
 // Far rail and deck rim establish a readable three-quarter boat volume.
 shape(c,p=>{p.moveTo(-117,-8);p.bezierCurveTo(-69,-26,57,-25,126,-7);p.bezierCurveTo(78,11,-63,17,-117,-8);p.closePath();},'#e7ece0','#3d7182',1.1);
 shape(c,p=>{p.moveTo(-101,-7);p.bezierCurveTo(-57,-19,52,-18,107,-7);p.bezierCurveTo(45,7,-62,8,-101,-7);p.closePath();},'#a8c4c5');
 stroke(c,[[-106,-11],[-106,-33],[-79,-39],[-53,-37]],'#e6f4ed',2.4);stroke(c,[[-80,-12],[-80,-39]],'#b5d1d2',2);
 // Cabin roof, shaded side and front are separate surfaces.
 shape(c,p=>{p.moveTo(12,-16);p.lineTo(14,-77);p.quadraticCurveTo(16,-84,23,-83);p.lineTo(63,-77);p.lineTo(83,-16);p.closePath();},grad(c,12,-78,82,-10,[[0,'#fffdf0'],[.7,'#e7f0e9'],[1,'#a9c8ce']]),'#7494a0',1);
 shape(c,p=>{p.moveTo(62,-76);p.lineTo(76,-71);p.lineTo(96,-17);p.lineTo(83,-16);p.closePath();},'#c1d8d9');
 shape(c,p=>{p.moveTo(22,-69);p.lineTo(50,-65);p.lineTo(55,-35);p.lineTo(22,-37);p.closePath();},grad(c,20,-70,53,-30,[[0,'#173e5c'],[.6,'#377c95'],[1,'#74b6c5']]),'#dce9e3',2);
 shape(c,p=>{p.moveTo(59,-64);p.lineTo(69,-61);p.lineTo(80,-31);p.lineTo(63,-32);p.closePath();},'#2a6684','#eff6ee',2);
 stroke(c,[[27,-66],[41,-64],[27,-47]],'#b6e1df77',2);stroke(c,[[41,-66],[44,-36]],'#e4f2e9',2.5);
 shape(c,p=>{p.moveTo(6,-78);p.quadraticCurveTo(5,-86,14,-87);p.lineTo(69,-80);p.quadraticCurveTo(74,-78,77,-73);p.lineTo(12,-78);p.closePath();},'#f7faf0','#63899b',1.4);
 stroke(c,[[10,-79],[76,-72]],'#20516a',4);stroke(c,[[38,-23],[52,-23]],'#7e9ca6',2);
 oval(c,66,-23,4.5,4.5,'#355e77');oval(c,66,-23,2.7,2.7,'#9bc3ce');
 stroke(c,[[93,-8],[93,-42],[116,-35],[117,-7]],'#eff7ed',2.4);stroke(c,[[91,-23],[116,-19]],'#c4dddc',1.7);
 stroke(c,[[77,-71],[77,-102]],'#7599a8',2);shape(c,p=>{p.moveTo(78,-99);p.quadraticCurveTo(90,-104,106,-94+Math.sin(t*3)*2);p.lineTo(78,-88);p.closePath();},'#f7c747');
 // Bent legs, padded lifejacket, face and articulated arms form one angler.
 c.save();c.translate(-39,-15);c.rotate(-.035-load*.06+lift);
 stroke(c,[[-10,-1],[-20,14],[-24,21]],'#1c3b58',11);stroke(c,[[7,-1],[16,11],[11,21]],'#234a65',11);stroke(c,[[-29,23],[-16,23]],'#122e44',7);stroke(c,[[7,23],[22,23]],'#122e44',7);
 shape(c,p=>{p.moveTo(-17,-37);p.quadraticCurveTo(-23,-30,-19,-5);p.quadraticCurveTo(-3,2,15,-8);p.lineTo(12,-36);p.quadraticCurveTo(-2,-45,-17,-37);p.closePath();},grad(c,-20,-36,14,-4,[[0,'#ffdd70'],[.6,'#edae3c'],[1,'#cc7e28']]),'#bc812d',1);
 shape(c,p=>{p.roundRect(-15,-33,11,28,4);p.roundRect(1,-35,11,27,4);},'#ffd964');stroke(c,[[-2,-37],[-2,-6]],'#35536b',2);stroke(c,[[-14,-25],[-5,-25]],'#fff1af',3);stroke(c,[[2,-27],[11,-27]],'#fff1af',3);stroke(c,[[-15,-11],[12,-14]],'#3a5970',3);oval(c,-1,-12,3,3,'#c3d7d4');
 shape(c,p=>{p.moveTo(-10,-42);p.lineTo(-9,-51);p.lineTo(3,-51);p.lineTo(7,-39);p.quadraticCurveTo(-2,-35,-10,-42);},'#d69262');
 shape(c,p=>{p.moveTo(-17,-60);p.bezierCurveTo(-18,-72,0,-77,9,-66);p.quadraticCurveTo(12,-58,16,-55);p.lineTo(10,-52);p.quadraticCurveTo(8,-41,-3,-42);p.quadraticCurveTo(-18,-43,-17,-60);},grad(c,-13,-67,10,-42,[[0,'#ffe0b4'],[.6,'#ecb37e'],[1,'#cf875d']]),'#ca8a61',.6);
 oval(c,-15,-55,3,4,'#e3a779');stroke(c,[[4,-61],[9,-60]],'#273e50',1.5);oval(c,8,-57,1.2,1.6,'#223b4b');stroke(c,[[4,-47],[9,-49]],'#8d543f',1);stroke(c,[[-10,-46],[-6,-43],[0,-42]],'#875d48',1.4);
 shape(c,p=>{p.moveTo(-20,-63);p.quadraticCurveTo(-19,-78,-4,-79);p.quadraticCurveTo(11,-79,12,-66);p.closePath();},grad(c,0,-79,0,-62,[[0,'#4290a6'],[1,'#16516f']]),'#184761',.8);
 shape(c,p=>{p.moveTo(-24,-63);p.quadraticCurveTo(-8,-67,17,-63);p.quadraticCurveTo(24,-60,15,-57);p.quadraticCurveTo(-12,-57,-24,-61);p.closePath();},'#216c87','#174b63',1);stroke(c,[[-12,-73],[-3,-75],[5,-71]],'#a8d4d655',1.5);
 const pull=hauling?Math.sin(t*7)*3:landing?Math.sin(t*6)*6:0;
 stroke(c,[[10,-32],[24,-24-pull],[36,-38-pull]],'#b67f58',9);stroke(c,[[10,-34],[24,-27-pull],[36,-39-pull]],'#f0bd88',6);stroke(c,[[-15,-30],[-2,-18],[27,-32-pull]],'#b77e53',9);stroke(c,[[-15,-32],[-2,-21],[27,-34-pull]],'#f1c18f',6);oval(c,36,-39-pull,4.7,4.5,'#ffe0ae');oval(c,27,-34-pull,4,4,'#f4c992');
 // Rod tension bends continuously; no separate title-only illustration.
 const bend=load*15+(hauling?Math.sin(t*6)*3:0);shape(c,p=>{p.moveTo(26,-32-pull);p.bezierCurveTo(57,-111-pull,102,-104,117,-54+bend);},null,'#153d55',3);shape(c,p=>{p.moveTo(29,-41-pull);p.bezierCurveTo(59,-108-pull,101,-99,115,-56+bend);},null,'#bed3c9',.9);
 stroke(c,[[25,-29-pull],[31,-44-pull]],'#765b3e',5);oval(c,29,-32-pull,6,6,'#19435d');oval(c,29,-32-pull,4,4,'#d3e6dd');stroke(c,[[28,-32-pull],[22,-27-pull]],'#527a89',2);
 c.restore();
 // Near gunwale covers the feet naturally and gives the hull a rounded volume.
 shape(c,p=>{p.moveTo(-121,-6);p.bezierCurveTo(-69,4,64,7,128,-11);p.bezierCurveTo(116,11,94,28,61,33);p.bezierCurveTo(-5,41,-78,30,-105,17);p.quadraticCurveTo(-115,8,-121,-6);p.closePath();},grad(c,0,-8,0,34,[[0,'#fffdf0'],[.46,'#e8eee3'],[1,'#99bec8']]),'#336f88',1);
 shape(c,p=>{p.moveTo(-111,5);p.bezierCurveTo(-38,20,61,23,117,2);p.lineTo(110,10);p.bezierCurveTo(38,34,-46,26,-104,13);p.closePath();},'#e87742');
 shape(c,p=>{p.moveTo(-101,18);p.bezierCurveTo(-47,32,48,37,101,20);p.quadraticCurveTo(79,36,50,36);p.quadraticCurveTo(-48,40,-89,25);p.closePath();},'#215675');
 shape(c,p=>{p.moveTo(-120,-6);p.bezierCurveTo(-38,11,70,9,129,-11);},null,'#fffdf0',4);
 for(let i=0;i<3;i++)oval(c,34+i*18,14-i*.5,3.2,2.5,'#356e87');
 for(let i=0;i<7;i++)oval(c,-85+i*27,6+Math.sin(i*.5)*3,.9,.9,'#7b9c9c');
 stroke(c,[[-104,9],[-90,17]],'#fffcebaa',1);stroke(c,[[77,20],[94,13]],'#8bafb255',1);
 // Rubber fender and rope cast a small shadow against the near gunwale.
 stroke(c,[[-75,1],[-75,13]],'#c5bea1',1.2);shape(c,p=>p.roundRect(-81,10,11,22,5),'#203e4d');shape(c,p=>p.roundRect(-78,12,4,17,2),'#4e707c');
 c.fillStyle='#22516b';c.font='800 12px system-ui';c.textAlign='center';c.save();c.translate(-25,15);c.rotate(.045);c.fillText('釣りいこ！',0,0);c.restore();
 shape(c,p=>{p.moveTo(-114,29);p.bezierCurveTo(-67,36,55,47,109,28);},null,'#e6ffffb0',2);c.restore();
}
