(()=>{
  'use strict';
  const S=()=>window.DiDauServices||null;
  const data=()=>typeof routeData!=='undefined'&&routeData?routeData:{routes:[],summary:{}};
  const geometry=()=>typeof geometryBase!=='undefined'&&geometryBase?geometryBase:{nodes:[],summary:{}};
  const norm=(s='')=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const rad=x=>Number(x)*Math.PI/180;
  const distanceKm=(a,b)=>{const R=6371,dLat=rad(Number(b.lat)-Number(a.lat)),dLon=rad(Number(b.lng)-Number(a.lng)),v=Math.sin(dLat/2)**2+Math.cos(rad(Number(a.lat)))*Math.cos(rad(Number(b.lat)))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(v)))};
  const pointSegKm=(p,a,b)=>{const lat0=rad(p.lat),kx=111.320*Math.cos(lat0),ky=110.574,px=(p.lng-a.lng)*kx,py=(p.lat-a.lat)*ky,bx=(b.lng-a.lng)*kx,by=(b.lat-a.lat)*ky,den=bx*bx+by*by,t=den?Math.max(0,Math.min(1,(px*bx+py*by)/den)):0;return Math.hypot(px-t*bx,py-t*by)};
  const RouteDomain={
    byId(id){const routes=data().routes||[];return routes.find(r=>r.id===id)||routes[0]||null},
    selected(){const id=S()?.RouteStore?.getSelectedId?.()||(typeof currentRouteId!=='undefined'?currentRouteId:null);return this.byId(id)},
    segmentBlocked(segment){return /CHẶN|KHÔNG DÙNG|TƯƠNG LAI/.test(`${segment?.status||''} ${segment?.role||''}`)},
    state(route){const eligible=(route?.segments||[]).filter(s=>!this.segmentBlocked(s)),states=eligible.map(s=>GeometryDomain.edgeState(s)),active=states.filter(x=>x.state==='ACTIVE_TRACE').length,ready=states.filter(x=>['ACTIVE_TRACE','NODE_GEOMETRY_READY'].includes(x.state)).length;let state='DRAFT';if(active===eligible.length&&eligible.length)state='ACTIVE';else if(active>0)state='PARTIAL_ACTIVE';else if(ready>0)state='GEOMETRY_READY';return{state,active,eligible:eligible.length,ready}},
    qa(){const counts=GeometryDomain.counts(),eligible=(data().routes||[]).flatMap(r=>r.segments||[]).filter(s=>!this.segmentBlocked(s)),active=eligible.filter(s=>GeometryDomain.edgeState(s).state==='ACTIVE_TRACE').length;return{qa005:counts.approved===53?'PASS':counts.approved>0?'PARTIAL':'BLOCKED',qa010:eligible.length&&active===eligible.length?'PASS':active>0?'PARTIAL':'BLOCKED',approved:counts.approved,active,eligible:eligible.length}}
  };
  const GeometryDomain={
    overrides(){return S()?.GeometryStore?.overrides?.()||{}},
    traces(){return S()?.GeometryStore?.traces?.()||{}},
    mergedNodes(){const ov=this.overrides();return (geometry().nodes||[]).map(n=>({...n,lat:null,lng:null,accuracy:null,status:'PENDING_COORDINATE',approval:'PENDING_ADMIN_APPROVAL',...(ov[n.id]||{})}))},
    counts(){const nodes=this.mergedNodes();return{approved:nodes.filter(x=>x.status==='APPROVED_GEOMETRY').length,captured:nodes.filter(x=>x.status==='FIELD_CAPTURED').length,pending:nodes.filter(x=>x.status==='PENDING_COORDINATE').length}},
    nodeForName(name,approvedOnly=true){const key=norm(name),list=this.mergedNodes().filter(n=>!approvedOnly||n.status==='APPROVED_GEOMETRY');return list.find(n=>norm(n.name)===key)||list.find(n=>norm(n.name).includes(key)||key.includes(norm(n.name)))||null},
    traceFor(id){return this.traces()[id]||null},
    edgeState(segment){if(RouteDomain.segmentBlocked(segment))return{state:'BLOCKED_POLICY',reason:segment.status};const t=this.traceFor(segment.id);if(t?.status==='APPROVED_TRACE'&&Array.isArray(t.points)&&t.points.length>=2)return{state:'ACTIVE_TRACE',reason:`${t.points.length} điểm GPS`};if(t?.status==='FIELD_TRACE')return{state:'PENDING_TRACE_APPROVAL',reason:`${t.points?.length||0} điểm`};const a=this.nodeForName(segment.from),b=this.nodeForName(segment.to);if(a&&b)return{state:'NODE_GEOMETRY_READY',reason:'Đủ 2 nút, chưa có trace được duyệt'};if(a||b)return{state:'PARTIAL_GEOMETRY',reason:'Mới có 1 nút'};return{state:'PENDING_GEOMETRY',reason:'Thiếu geometry'}},
    distanceToTrace(fix,trace){let best=Infinity;const pts=trace?.points||[];for(let i=0;i<pts.length-1;i++)best=Math.min(best,pointSegKm(fix,pts[i],pts[i+1]));return best},
    recognizeRoute(fix){
      if(!fix||!Number.isFinite(Number(fix.lat))||!Number.isFinite(Number(fix.lng)))return null;
      const candidates=[];
      for(const route of data().routes||[])for(const segment of route.segments||[]){const trace=this.traceFor(segment.id);if(trace?.status==='APPROVED_TRACE'&&trace.points?.length>=2)candidates.push({route,segment,distance:this.distanceToTrace(fix,trace),source:'APPROVED_TRACE'})}
      candidates.sort((a,b)=>a.distance-b.distance);
      if(candidates.length){const best=candidates[0],second=candidates[1],margin=second?second.distance-best.distance:99;let confidence='THẤP';if(Number(fix.accuracy)<=40&&best.distance<=0.2&&margin>=0.1)confidence='CAO';else if(Number(fix.accuracy)<=80&&best.distance<=1)confidence='TRUNG BÌNH';return{...best,confidence,margin}}
      const nodeCandidates=[];
      for(const route of data().routes||[])for(const segment of route.segments||[])for(const node of [this.nodeForName(segment.from),this.nodeForName(segment.to)].filter(Boolean))nodeCandidates.push({route,segment,distance:distanceKm(fix,node),source:'APPROVED_NODE',node});
      nodeCandidates.sort((a,b)=>a.distance-b.distance);
      if(!nodeCandidates.length)return null;
      const best=nodeCandidates[0],second=nodeCandidates[1],margin=second?second.distance-best.distance:99;let confidence='THẤP';if(Number(fix.accuracy)<=40&&best.distance<=0.2&&margin>=0.1)confidence='CAO';else if(Number(fix.accuracy)<=80&&best.distance<=1)confidence='TRUNG BÌNH';return{...best,confidence,margin};
    }
  };
  const Domain={version:'3.2.0-rc2',RouteDomain,GeometryDomain,geo:{distanceKm,pointSegKm},norm};
  window.DiDauRouteGeometry=Domain;
  // Compatibility facade: UI/legacy bootstrap calls these names, but implementations live here.
  try{
    routeById=id=>RouteDomain.byId(id);
    mergedNodes=()=>GeometryDomain.mergedNodes();
    geomCounts=()=>GeometryDomain.counts();
    nodeForName=(name,approvedOnly=true)=>GeometryDomain.nodeForName(name,approvedOnly);
    segmentBlocked=s=>RouteDomain.segmentBlocked(s);
    traceFor=id=>GeometryDomain.traceFor(id);
    edgeState=s=>GeometryDomain.edgeState(s);
    routeState=r=>RouteDomain.state(r);
    qaState=()=>RouteDomain.qa();
    distanceKm=(a,b)=>Domain.geo.distanceKm(a,b);
    pointSegKm=(p,a,b)=>Domain.geo.pointSegKm(p,a,b);
    distanceToTrace=(f,t)=>GeometryDomain.distanceToTrace(f,t);
    recognizeRoute=f=>GeometryDomain.recognizeRoute(f);
  }catch(_){/* tests may not expose legacy bindings */}
})();
