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

  const EngineV3={version:'3.0.0-rc2',RouteContext,GpsService,PoiRepository,DrivingAdvisor,geo:{distanceKm,bearing,angleDiff},poi:{classify,priority}};
  window.DiDauEngine=EngineV3;
})();
