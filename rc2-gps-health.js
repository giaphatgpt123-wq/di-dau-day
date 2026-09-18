(()=>{
  'use strict';
  const STALE_MS=20000;
  const MAX_DRIVING_ACCURACY=120;
  const MOVING_SPEED=1.5;
  const HEADING_JUMP_DEG=100;
  const HEADING_JUMP_WINDOW_MS=4000;
  const RECOVERY_GOOD_SAMPLES=3;
  const DIRECTION_GOOD_SAMPLES=3;
  let lastStableHeading=null;
  let lastStableHeadingAt=0;
  let lastSampleKey=null;
  let recoveryRequired=false;
  let goodStreak=0;
  let directionLocked=false;
  let directionGoodStreak=0;
  let lastEffectiveStatus='NO_GPS';
  const finite=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
  const norm=x=>((Number(x)%360)+360)%360;
  const angleDiff=(a,b)=>Math.abs(((norm(a)-norm(b)+540)%360)-180);
  const rawFix=()=>lastFix||(()=>{try{return JSON.parse(localStorage.getItem('d1-last-gps')||'null')}catch{return null}})();
  const sampleKey=fix=>fix&&`${finite(fix.at)?Number(fix.at):'na'}|${fix.lat}|${fix.lng}|${fix.accuracy}|${fix.speed}|${fix.heading}`;
  const isNewSample=fix=>{const key=sampleKey(fix);if(key===lastSampleKey)return false;lastSampleKey=key;return true};
  function rawHealth(){
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
      }
    }
    const sanitized={...fix,speed,heading:headingStable?heading:null};
    if(moving&&headingKnown&&!headingStable)return{status:'HEADING_UNSTABLE',usable:true,directional:false,fix:sanitized,ageMs,speedKnown,moving,headingStable:false,reason:'Hướng GPS biến động bất thường'};
    return{status:'VALID',usable:true,directional:moving&&heading!==null,fix:sanitized,ageMs,speedKnown,moving,headingStable:true,reason:null};
  }
  function health(){
    const raw=rawHealth();
    const fresh=isNewSample(raw.fix);
    if(['NO_GPS','STALE','POOR_ACCURACY'].includes(raw.status)){
      recoveryRequired=true;
      goodStreak=0;
      lastEffectiveStatus=raw.status;
      if(raw.status!=='NO_GPS'){directionLocked=true;directionGoodStreak=0;}
      return{...raw,rawStatus:raw.status,recovering:false,goodStreak,directionLocked,directionGoodStreak};
    }
    if(raw.status==='HEADING_UNSTABLE'){
      directionLocked=true;
      directionGoodStreak=0;
      lastEffectiveStatus='HEADING_UNSTABLE';
      return{...raw,rawStatus:raw.status,recovering:recoveryRequired,goodStreak,directionLocked,directionGoodStreak};
    }
    if(fresh&&recoveryRequired)goodStreak+=1;
    if(recoveryRequired&&goodStreak<RECOVERY_GOOD_SAMPLES){
      lastEffectiveStatus='RECOVERING';
      return{...raw,status:'RECOVERING',usable:false,directional:false,rawStatus:'VALID',recovering:true,goodStreak,directionLocked:true,directionGoodStreak,reason:`Đang xác nhận GPS ổn định ${goodStreak}/${RECOVERY_GOOD_SAMPLES}`};
    }
    if(recoveryRequired&&goodStreak>=RECOVERY_GOOD_SAMPLES){
      recoveryRequired=false;
      directionLocked=true;
      directionGoodStreak=0;
    }
    if(raw.moving&&raw.fix?.heading!==null){
      if(directionLocked){
        if(fresh)directionGoodStreak+=1;
        if(directionGoodStreak>=DIRECTION_GOOD_SAMPLES){
          directionLocked=false;
          directionGoodStreak=DIRECTION_GOOD_SAMPLES;
          lastStableHeading=raw.fix.heading;
          lastStableHeadingAt=finite(raw.fix.at)?Number(raw.fix.at):Date.now();
        }
      }else if(fresh){
        lastStableHeading=raw.fix.heading;
        lastStableHeadingAt=finite(raw.fix.at)?Number(raw.fix.at):Date.now();
      }
    }else if(!raw.moving){
      directionGoodStreak=0;
    }
    const directional=Boolean(raw.directional&&!directionLocked);
    lastEffectiveStatus=directionLocked&&raw.moving?'DIRECTION_RECOVERING':'VALID';
    return{...raw,status:lastEffectiveStatus,rawStatus:'VALID',usable:true,directional,recovering:false,goodStreak,directionLocked,directionGoodStreak,reason:directionLocked&&raw.moving?`Đang xác nhận hướng ổn định ${directionGoodStreak}/${DIRECTION_GOOD_SAMPLES}`:null};
  }
  window.getGpsHealth=health;
  window.getUsableGpsFix=()=>{const h=health();return h.usable?h.fix:null};
  window.resetGpsHealth=()=>{lastStableHeading=null;lastStableHeadingAt=0;lastSampleKey=null;recoveryRequired=false;goodStreak=0;directionLocked=false;directionGoodStreak=0;lastEffectiveStatus='NO_GPS'};
  window.GPS_HEALTH_LIMITS={STALE_MS,MAX_DRIVING_ACCURACY,MOVING_SPEED,HEADING_JUMP_DEG,HEADING_JUMP_WINDOW_MS,RECOVERY_GOOD_SAMPLES,DIRECTION_GOOD_SAMPLES};
})();
