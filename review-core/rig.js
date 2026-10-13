import {liveArt,paintedRig} from './live-art.js?v=harbor-r7-9416ef3';
// One coordinate contract for the rendered rod and its line. All values are CSS pixels.
const rotate=(x,y,a)=>({x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)});
export function boatRig({x,y,t,scale=1,phase,caught=0,reduced=false}){
 if(reduced)t=0;const hauling=phase==='up',landing=phase==='landing',load=Math.max(0,Math.min(1,caught/3));
 const lift=landing?Math.sin(t*6)*.10:hauling?Math.sin(t*6)*.035:Math.sin(t*1.7)*.01;
 const personAngle=-.035-load*.06+lift,boatAngle=Math.sin(t*1.3)*.011,bob=Math.sin(t*1.7)*2,bend=load*15+(hauling?Math.sin(t*6)*3:0);
 const painted=liveArt.boat&&liveArt.base&&liveArt.arms,p=painted?paintedRig({t,phase,caught,reduced}).tip:null;
 const handSpace=rotate(p?p.x:117,p?p.y:-54+bend,personAngle),hullSpace=rotate(handSpace.x-(p?0:39),handSpace.y-(p?0:15),boatAngle);
 return {t,hauling,landing,load,lift,personAngle,boatAngle,bob,bend,tip:{x:x+hullSpace.x*scale,y:y+bob+hullSpace.y*scale}};
}
export function lineCurve(tip,hook){return {start:tip,control:{x:(tip.x+hook.x)*.5,y:tip.y+(hook.y-tip.y)*.55},end:hook};}
