(()=>{
  'use strict';
  const finite=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
  const rad=x=>x*Math.PI/180, deg=x=>x*180/Math.PI, norm=x=>((Number(x)%360)+360)%360;
  const distanceKm=(a,b)=>{const R=6371,dLat=rad(Number(b.lat)-Number(a.lat)),dLon=rad(Number(b.lng)-Number(a.lng));const s=Math.sin(dLat/2)**2+Math.cos(rad(Number(a.lat)))*Math.cos(rad(Number(b.lat)))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(s)))};
  const bearing=(a,b)=>{const y=Math.sin(rad(Number(b.lng)-Number(a.lng)))*Math.cos(rad(Number(b.lat)));const x=Math.cos(rad(Number(a.lat)))*Math.sin(rad(Number(b.lat)))-Math.sin(rad(Number(a.lat)))*Math.cos(rad(Number(b.lat)))*Math.cos(rad(Number(b.lng)-Number(a.lng)));return norm(deg(Math.atan2(y,x)))};
  const angleDiff=(a,b)=>Math.abs(((norm(a)-norm(b)+540)%360)-180);
  const classify=p=>{const s=`${p.category||''} ${p.subcategory||''}`.toLowerCase();if(/cây xăng|xăng dầu|petrol|fuel/.test(s))return'Cây xăng';if(/trạm dừng|điểm dịch vụ|rest stop/.test(s))return'Trạm dừng';if(/ăn|quán ăn|ẩm thực|food/.test(s))return'Ăn uống';if(/lưu trú|khách sạn|nhà nghỉ|villa|resort|hotel/.test(s))return'Lưu trú';if(/tham quan|vui chơi|du lịch|tâm linh|di tích|bảo tàng/.test(s))return'Tham quan';return'Khác'};
  const priority={'Cây xăng':0,'Trạm dừng':1,'Ăn uống':2,'Lưu trú':3,'Tham quan':4,'Khác':9};

  const RouteContext={
    getRouteId(){
      if(typeof currentRouteId!=='undefined'&&currentRouteId)return currentRouteId;
      const stored=localStorage.getItem('d1-route');if(stored)return stored;
      if(typeof routeData!=='undefined'&&Array.isArray(routeData?.routes)&&routeData.routes[0]?.id)return routeData.routes[0].id;
      return null;
    },
    getRoute(){const id=this.getRouteId();return typeof routeById==='function'&&id?routeById(id):null},
    getStage(){return localStorage.getItem('d1-discovery-stage')||'Tất cả'},
    snapshot(){const route=this.getRoute();return{routeId:this.getRouteId(),route,stage:this.getStage()}}
  };

  const GpsService={
    health(){return typeof window.getGpsHealth==='function'?window.getGpsHealth():null},
    fix(){const h=this.health();if(h)return h.usable?h.fix:null;try{return lastFix||JSON.parse(localStorage.getItem('d1-last-gps')||'null')}catch{return null}},
    snapshot(){const health=this.health(),fix=health?health.fix:this.fix();return{health,fix}}
  };

  const PoiRepository={
    all(){return typeof pois==='function'?pois():[]},
    eligible({routeId=null,stage='Tất cả'}={}){
      return this.all().filter(p=>p.gpsRankEligible!==false&&finite(p.lat)&&finite(p.lng))
        .filter(p=>!routeId||!p.routeId||p.routeId===routeId)
        .filter(p=>stage==='Tất cả'||!p.corridorStage||p.corridorStage===stage);
    }
  };

  const DrivingAdvisor={
    recommendations(options={}){
      const route=RouteContext.snapshot();
      const gps=GpsService.snapshot(),health=gps.health,origin=gps.fix;
      if(health&&!health.usable)return{items:[],mode:`GPS_${health.status}`,heading:null,speed:null,gpsHealth:health,routeContext:route};
      if(!origin||!finite(origin.lat)||!finite(origin.lng))return{items:[],mode:'NO_GPS',heading:null,speed:null,gpsHealth:health,routeContext:route};
      const heading=finite(origin.heading)?norm(origin.heading):null;
      const speed=finite(origin.speed)?Number(origin.speed):null;
      const moving=Boolean(health?health.directional:(heading!==null&&speed!==null&&speed>=1.5));
      const radius=Math.min(100,Math.max(5,Number(options.radiusKm??localStorage.getItem('d1-discovery-radius'))||50));
      const maxItems=Math.max(1,Math.min(20,Number(options.maxItems)||5));
      const items=PoiRepository.eligible({routeId:route.routeId,stage:route.stage})
        .map(p=>{const d=distanceKm(origin,p),b=bearing(origin,p),delta=moving?angleDiff(heading,b):null;return{...p,driveGroup:classify(p),driveDistance:d,driveBearing:b,headingDelta:delta}})
        .filter(p=>p.driveDistance<=radius)
        .filter(p=>!moving||p.headingDelta<=80)
        .sort((a,b)=>{const pa=priority[a.driveGroup]??9,pb=priority[b.driveGroup]??9;if(pa!==pb)return pa-pb;if(moving&&a.headingDelta!==b.headingDelta)return a.headingDelta-b.headingDelta;return a.driveDistance-b.driveDistance}).slice(0,maxItems);
      const mode=moving?'MOVING_FORWARD':health?.status==='HEADING_UNSTABLE'?'GPS_HEADING_UNSTABLE':health?.status==='DIRECTION_RECOVERING'?'GPS_DIRECTION_RECOVERING':'GPS_NO_HEADING';
      return{items,mode,heading,speed,gpsHealth:health,routeContext:route};
    }
  };

  const AlertEngine={
    key:'d1-proactive-alert-state',
    serviceGroups:['Cây xăng','Trạm dừng'],
    read(){try{return JSON.parse(localStorage.getItem(this.key)||'{}')}catch{return{}}},
    write(v){localStorage.setItem(this.key,JSON.stringify(v))},
    reset(){localStorage.removeItem(this.key)},
    bucket(d){return d<=10?10:d<=20?20:d<=30?30:null},
    evaluate(){
      const rec=DrivingAdvisor.recommendations(),state=this.read(),next={...state},events=[];
      for(const item of rec.items||[]){const level=this.bucket(Number(item.driveDistance));if(!level)continue;const id=String(item.id||item.name||'poi'),prev=Number(state[id]||0);if(prev===level)continue;if(prev&&level>prev)continue;next[id]=level;events.push({type:'PROXIMITY',level,group:item.driveGroup,name:item.name,distanceKm:item.driveDistance,corridorStage:item.corridorStage||null,lat:item.lat,lng:item.lng,routeId:rec.routeContext?.routeId||null})}
      const services=(rec.items||[]).filter(x=>this.serviceGroups.includes(x.driveGroup));
      const serviceGap=rec.mode==='MOVING_FORWARD'&&services.length===0,gapKey=`__service_gap__:${rec.routeContext?.routeId||'none'}`;
      if(serviceGap&&!state[gapKey]){next[gapKey]=Date.now();events.push({type:'SERVICE_GAP',level:null,group:'Dịch vụ',name:'Phía trước chưa có cây xăng/trạm dừng đủ điều kiện trong phạm vi hiện tại',distanceKm:null,routeId:rec.routeContext?.routeId||null})}
      if(!serviceGap&&state[gapKey])delete next[gapKey];
      this.write(next);return{mode:rec.mode,events,serviceGap,routeContext:rec.routeContext};
    }
  };

  const DrivingSession={
    key:'d1-driving-rest-state',thresholdMs:2*60*60*1000,resetStopMs:15*60*1000,movingSpeed:1.5,
    read(){try{return JSON.parse(localStorage.getItem(this.key)||'{}')}catch{return{}}},write(v){localStorage.setItem(this.key,JSON.stringify(v))},reset(){localStorage.removeItem(this.key)},
    migrate(s){const next={...s};if(next.startedAt&&!finite(next.accumulatedMs)){const end=Number(next.lastMovingAt||next.startedAt);next.accumulatedMs=Math.max(0,end-Number(next.startedAt))}return next},
    update(){
      const now=Date.now(),health=GpsService.health(),gps=health?health.fix:GpsService.fix(),state=this.migrate(this.read());
      const speedKnown=health?Boolean(health.speedKnown):finite(gps?.speed),speed=speedKnown?Number(gps.speed):null,paused=health?(!health.usable||!speedKnown):!speedKnown,moving=!paused&&speed>=this.movingSpeed;let next={...state};
      if(paused){if(next.startedAt)next.lastSampleAt=now}
      else if(moving){if(!next.startedAt)next={startedAt:now,accumulatedMs:0,lastSampleAt:now,lastMovingAt:now};else if(next.stoppedAt){if(now-next.stoppedAt>=this.resetStopMs)next={startedAt:now,accumulatedMs:0,lastSampleAt:now,lastMovingAt:now};else{delete next.stoppedAt;next.lastSampleAt=now;next.lastMovingAt=now}}else{const sample=Number(next.lastSampleAt||next.lastMovingAt||now);next.accumulatedMs=Math.max(0,Number(next.accumulatedMs)||0)+Math.max(0,now-sample);next.lastSampleAt=now;next.lastMovingAt=now}}
      else if(next.startedAt){if(!next.stoppedAt){const sample=Number(next.lastSampleAt||next.lastMovingAt||now);next.accumulatedMs=Math.max(0,Number(next.accumulatedMs)||0)+Math.max(0,now-sample);next.stoppedAt=now}if(now-next.stoppedAt>=this.resetStopMs)next={}}
      this.write(next);return{state:next,elapsed:Math.max(0,Number(next.accumulatedMs)||0),moving,paused,speed,gps,gpsHealth:health};
    },
    nearestRest(){return (DrivingAdvisor.recommendations().items||[]).filter(x=>x.driveGroup==='Trạm dừng').sort((a,b)=>a.driveDistance-b.driveDistance)[0]||null},
    evaluate(){const session=this.update(),state=session.state,due=session.elapsed>=this.thresholdMs,already=Boolean(state.restReminderIssued);let issued=false;if(due&&!already){state.restReminderIssued=Date.now();this.write(state);issued=true}return{...session,due,issued,nearestRest:this.nearestRest(),thresholdMs:this.thresholdMs}}
  };

  const EngineV3={version:'3.0.0-rc2',RouteContext,GpsService,PoiRepository,DrivingAdvisor,AlertEngine,DrivingSession,geo:{distanceKm,bearing,angleDiff},poi:{classify,priority}};
  window.DiDauEngine=EngineV3;
})();
