(()=>{
  'use strict';
  const KEYS={
    route:'d1-route',routeSource:'d1-route-source',users:'d1-users',session:'d1-session',geometry:'d1-geometry-overrides',traces:'d1-segment-traces',pois:'d1-pois',audit:'d1-audit',lastGps:'d1-last-gps'
  };
  const JsonStore={
    read(key,fallback){try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}},
    write(key,value){localStorage.setItem(key,JSON.stringify(value));return value},
    remove(key){localStorage.removeItem(key)},
    text(key,fallback=null){const v=localStorage.getItem(key);return v===null?fallback:v},
    setText(key,value){if(value===null||value===undefined)localStorage.removeItem(key);else localStorage.setItem(key,String(value));return value}
  };
  const RouteStore={
    getSelectedId(){return JsonStore.text(KEYS.route,'R-001')},
    setSelectedId(id,source='manual'){JsonStore.setText(KEYS.route,id);JsonStore.setText(KEYS.routeSource,source);return id},
    getSource(){return JsonStore.text(KEYS.routeSource,'unknown')}
  };
  const AccountStore={
    users(){return JsonStore.read(KEYS.users,[])},
    setUsers(v){return JsonStore.write(KEYS.users,Array.isArray(v)?v:[])},
    session(){return JsonStore.read(KEYS.session,null)},
    setSession(v){if(v)return JsonStore.write(KEYS.session,v);JsonStore.remove(KEYS.session);return null}
  };
  const GeometryStore={
    overrides(){return JsonStore.read(KEYS.geometry,{})},
    setOverrides(v){return JsonStore.write(KEYS.geometry,v||{})},
    traces(){return JsonStore.read(KEYS.traces,{})},
    setTraces(v){return JsonStore.write(KEYS.traces,v||{})}
  };
  const PoiStore={
    all(){return JsonStore.read(KEYS.pois,[])},
    setAll(v){return JsonStore.write(KEYS.pois,Array.isArray(v)?v:[])},
    count(){return this.all().length}
  };
  const AuditStore={
    all(){return JsonStore.read(KEYS.audit,[])},
    append(action,target,detail={}){const list=this.all();const s=AccountStore.session();list.unshift({at:Date.now(),actor:s?.email||'local',role:s?.role||'guest',action,target,detail});JsonStore.write(KEYS.audit,list.slice(0,500));return list[0]},
    clear(){JsonStore.remove(KEYS.audit)}
  };
  const GpsStore={
    last(){return JsonStore.read(KEYS.lastGps,null)},
    setLast(fix){return JsonStore.write(KEYS.lastGps,fix)},
    clear(){JsonStore.remove(KEYS.lastGps)}
  };
  const AppServices={version:'3.1.0-rc2',KEYS,JsonStore,RouteStore,AccountStore,GeometryStore,PoiStore,AuditStore,GpsStore};
  window.DiDauServices=AppServices;
})();
