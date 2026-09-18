(()=>{
  'use strict';
  const STALE_MS=20000;
  const MAX_DRIVING_ACCURACY=120;
  const MOVING_SPEED=1.5;
  const HEADING_JUMP_DEG=100;
  const HEADING_JUMP_WINDOW_MS=4000;
  let lastStableHeading=null;
  let lastStableHeadingAt=0;
  const finite=v=>Number.isFinite(Number(v));
  const norm=x=>((Number(x)%360)+360)%360;
  const angleDiff=(a,b)=>Math.abs(((norm(a)-norm(b)+540)%360)-180);
  const rawFix=()=>lastFix||(()=>{try{return JSON.parse(localStorage.getItem('d1-last-gps')||'null')}catch{return null}})();
  function health(){
    const fix=rawFix();
    if(!fix||!finite(fix.lat)||!finite(fix.lng))return{status:'NO_GPS',usable:false,fix:null,ageMs:null,reason:'Chưa có GPS hợp lệ'};
    const at=finite(fix.at)?Number(fix.at):0;
    const ageMs=at?Math.max(0,Date.now()-at):Infinity;
    if(ageMs>STALE_MS)return{status:'STALE',usable:false,fix,ageMs,reason:'GPS đã cũ'};
    const accuracy=finite(fix.accuracy)?Number(fix.accuracy):Infinity;
    if(accuracy>MAX_DRIVING_ACCURACY)return{status:'POOR_ACCURACY',usable:false,fix,ageMs,reason:`Sai số GPS ${Math.round(accuracy)} m`};
    const speedKnown=finite(fix.speed)&&Number(fix.speed)>=0;
    const speed=speedKnown?Number(fix.speed):null;
    const moving=speedKnown&&speed>=MOVING_SPEED;
    const headingKnown=finite(fix.heading)&&Number(fix.heading)>=0;
    let heading=headingKnown?norm(fix.heading):null;
    let headingStable=true;
    if(moving&&heading!==null){
      if(lastStableHeading!==null&&at&&lastStableHeadingAt&&at-lastStableHeadingAt>=0&&at-lastStableHeadingAt<=HEADING_JUMP_WINDOW_MS&&angleDiff(heading,lastStableHeading)>HEADING_JUMP_DEG){
        headingStable=false;
      }else{
        lastStableHeading=heading;
        lastStableHeadingAt=at||Date.now();
      }
    }
    const sanitized={...fix,speed,heading:headingStable?heading:null};
    if(moving&&headingKnown&&!headingStable)return{status:'HEADING_UNSTABLE',usable:true,directional:false,fix:sanitized,ageMs,speedKnown,moving,reason:'Hướng GPS biến động bất thường'};
    return{status:'VALID',usable:true,directional:moving&&heading!==null,fix:sanitized,ageMs,speedKnown,moving,reason:null};
  }
  window.getGpsHealth=health;
  window.getUsableGpsFix=()=>{const h=health();return h.usable?h.fix:null};
  window.resetGpsHealth=()=>{lastStableHeading=null;lastStableHeadingAt=0};
  window.GPS_HEALTH_LIMITS={STALE_MS,MAX_DRIVING_ACCURACY,MOVING_SPEED,HEADING_JUMP_DEG,HEADING_JUMP_WINDOW_MS};
})();
