const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
let now=1_000_000;
class FakeDate extends Date{static now(){return now}}
const store=new Map();
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
let poiData=[{id:'fuel-north',name:'Fuel North',category:'Cây xăng',routeId:'R-002',gpsRankEligible:true,lat:10.2,lng:106}];
const context={console,Math,JSON,Number,String,Boolean,Date:FakeDate,localStorage,lastFix:null,view:'test',document:{getElementById:()=>null},window:null,pois:()=>poiData,setInterval:()=>0,clearInterval:()=>{},encodeURIComponent};
context.window=context;vm.createContext(context);
for(const file of ['rc2-gps-health.js','rc2-driving.js','rc2-driver-rest.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
let seq=0;
const fix=(o={})=>{seq+=1;context.lastFix={lat:10,lng:106,accuracy:20,speed:10,heading:0,at:now+seq,...o};};

// no GPS
context.lastFix=null;localStorage.removeItem('d1-last-gps');
assert.equal(context.getGpsHealth().status,'NO_GPS');
assert.equal(context.getDrivingRecommendations().items.length,0);

// stale GPS
fix({at:now-21000});
assert.equal(context.getGpsHealth().status,'STALE');
assert.equal(context.getDrivingRecommendations().mode,'GPS_STALE');

// poor accuracy
fix({accuracy:180});
assert.equal(context.getGpsHealth().status,'POOR_ACCURACY');
assert.equal(context.getDrivingRecommendations().mode,'GPS_POOR_ACCURACY');

// null speed -> usable position but no directional assumption and rest timer pauses.
// Reset health because this scenario validates null-speed semantics independently of B14 recovery hysteresis.
context.resetGpsHealth();
fix({speed:null,heading:null});
let h=context.getGpsHealth();
assert.equal(h.status,'VALID');assert.equal(h.speedKnown,false);assert.equal(h.directional,false);
assert.equal(context.getDrivingRecommendations().mode,'GPS_NO_HEADING');
context.resetDrivingRestSession();
let r=context.getDrivingRestState();assert.equal(r.paused,true);assert.equal(r.elapsed,0);
now+=30*60*1000;r=context.getDrivingRestState();assert.equal(r.elapsed,0);assert.equal(Boolean(r.state.stoppedAt),false);

// valid moving fix
fix({speed:10,heading:0});context.resetGpsHealth();
h=context.getGpsHealth();assert.equal(h.status,'VALID');assert.equal(h.directional,true);
assert.equal(context.getDrivingRecommendations().mode,'MOVING_FORWARD');

// implausible heading jump within four seconds -> suppress directional filtering
now+=1000;fix({speed:10,heading:170});
h=context.getGpsHealth();assert.equal(h.status,'HEADING_UNSTABLE');assert.equal(h.directional,false);
assert.equal(context.getDrivingRecommendations().mode,'GPS_HEADING_UNSTABLE');

// B14 recovery: after the jump window, direction remains locked until 3 distinct stable samples.
now+=5000;fix({speed:10,heading:170});
h=context.getGpsHealth();assert.equal(h.directional,false);assert.equal(h.directionLocked,true);
now+=1000;fix({speed:10,heading:172});h=context.getGpsHealth();assert.equal(h.directional,false);
now+=1000;fix({speed:10,heading:174});h=context.getGpsHealth();assert.equal(h.directional,true);assert.equal(h.status,'VALID');

// GPS loss pauses an active driving session rather than resetting it
context.resetDrivingRestSession();
fix({speed:10,heading:174});r=context.getDrivingRestState();
now+=60*60*1000;fix({speed:10,heading:174});r=context.getDrivingRestState();assert(r.elapsed>=60*60*1000);
const elapsed=r.elapsed;
now+=25000;context.lastFix={...context.lastFix,at:now-25000};r=context.getDrivingRestState();assert.equal(r.paused,true);assert.equal(r.elapsed,elapsed);assert.equal(Boolean(r.state.stoppedAt),false);

console.log('B13 GPS FAULT SIMULATION: PASS');
