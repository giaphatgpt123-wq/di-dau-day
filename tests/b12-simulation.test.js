const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

let now=1_000_000;
class FakeDate extends Date{static now(){return now}}
const store=new Map();
const localStorage={
  getItem:k=>store.has(k)?store.get(k):null,
  setItem:(k,v)=>store.set(k,String(v)),
  removeItem:k=>store.delete(k),
  clear:()=>store.clear()
};
let poiData=[];
const context={
  console,
  Math,
  JSON,
  Number,
  String,
  Boolean,
  Date:FakeDate,
  localStorage,
  lastFix:null,
  view:'test',
  document:{getElementById:()=>null},
  window:null,
  pois:()=>poiData,
  setInterval:()=>0,
  clearInterval:()=>{},
  encodeURIComponent
};
context.window=context;
vm.createContext(context);
for(const file of ['rc2-driving.js','rc2-proactive.js','rc2-driver-rest.js']){
  vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}

const setGps=(lat,lng,speed,heading)=>{context.lastFix={lat,lng,speed,heading};};
const setPois=()=>{
  poiData=[
    {id:'fuel-north',name:'Fuel North',category:'Cây xăng',routeId:'R-002',gpsRankEligible:true,lat:10.269,lng:106,corridorStage:'Mỹ Tho'},
    {id:'rest-north',name:'Rest North',category:'Trạm dừng',routeId:'R-002',gpsRankEligible:true,lat:10.20,lng:106,corridorStage:'Mỹ Tho'},
    {id:'food-north',name:'Food North',category:'Quán ăn',routeId:'R-002',gpsRankEligible:true,lat:10.12,lng:106,corridorStage:'Mỹ Tho'},
    {id:'fuel-south',name:'Fuel South',category:'Cây xăng',routeId:'R-002',gpsRankEligible:true,lat:9.90,lng:106,corridorStage:'Bến Lức'},
    {id:'unverified',name:'Unverified',category:'Cây xăng',routeId:'R-002',gpsRankEligible:false,lat:10.05,lng:106,corridorStage:'Mỹ Tho'}
  ];
};
setPois();
localStorage.setItem('d1-discovery-radius','50');
localStorage.setItem('d1-discovery-stage','Tất cả');

// 1) Standstill -> no directional assumption.
setGps(10,106,0,null);
let rec=context.getDrivingRecommendations();
assert.equal(rec.mode,'GPS_NO_HEADING');
assert(rec.items.some(x=>x.id==='fuel-south'));
assert(!rec.items.some(x=>x.id==='unverified'));

// 2) Moving north -> backward POI removed.
setGps(10,106,10,0);
rec=context.getDrivingRecommendations();
assert.equal(rec.mode,'MOVING_FORWARD');
assert(rec.items.some(x=>x.id==='fuel-north'));
assert(!rec.items.some(x=>x.id==='fuel-south'));

// 3) Proximity alert transitions 30 -> 20 -> 10 and does not repeat.
context.resetProactiveAlerts();
let p=context.getProactiveAlertState();
assert(p.events.some(e=>e.type==='PROXIMITY'&&e.name==='Fuel North'&&e.level===30));
setGps(10.09,106,10,0);
p=context.getProactiveAlertState();
assert(p.events.some(e=>e.name==='Fuel North'&&e.level===20));
setGps(10.18,106,10,0);
p=context.getProactiveAlertState();
assert(p.events.some(e=>e.name==='Fuel North'&&e.level===10));
p=context.getProactiveAlertState();
assert(!p.events.some(e=>e.name==='Fuel North'));

// 4) Service gap alerts once, clears when service returns, then may alert again.
context.resetProactiveAlerts();
poiData=[{id:'food-only',name:'Food only',category:'Quán ăn',routeId:'R-002',gpsRankEligible:true,lat:10.25,lng:106}];
setGps(10,106,10,0);
p=context.getProactiveAlertState();
assert.equal(p.serviceGap,true);
assert.equal(p.events.filter(e=>e.type==='SERVICE_GAP').length,1);
p=context.getProactiveAlertState();
assert.equal(p.events.filter(e=>e.type==='SERVICE_GAP').length,0);
setPois();
p=context.getProactiveAlertState();
assert.equal(p.serviceGap,false);
poiData=[{id:'food-only',name:'Food only',category:'Quán ăn',routeId:'R-002',gpsRankEligible:true,lat:10.25,lng:106}];
p=context.getProactiveAlertState();
assert.equal(p.events.filter(e=>e.type==='SERVICE_GAP').length,1);

// 5) Driver rest time counts moving time only; a short stop does not add drive time.
setPois();
context.resetDrivingRestSession();
setGps(10,106,10,0);
let r=context.getDrivingRestState();
assert.equal(r.elapsed,0);
now+=60*60*1000;
r=context.getDrivingRestState();
assert.equal(r.elapsed,60*60*1000);
setGps(10,106,0,null);
now+=1;
r=context.getDrivingRestState();
const elapsedAtStop=r.elapsed;
now+=10*60*1000;
r=context.getDrivingRestState();
assert.equal(r.elapsed,elapsedAtStop);
setGps(10,106,10,0);
r=context.getDrivingRestState();
assert.equal(r.elapsed,elapsedAtStop);
now+=60*60*1000;
r=context.getDrivingRestState();
assert(r.elapsed>=2*60*60*1000);
assert.equal(r.due,true);
assert.equal(r.issued,true);
r=context.getDrivingRestState();
assert.equal(r.issued,false);

// 6) Stop for 15 minutes -> reset driving session.
setGps(10,106,0,null);
now+=1;
r=context.getDrivingRestState();
now+=15*60*1000;
r=context.getDrivingRestState();
assert.equal(r.elapsed,0);
assert.equal(r.due,false);
assert.equal(Boolean(r.state.startedAt),false);

console.log('B12 END-TO-END DRIVING SIMULATION: PASS');
