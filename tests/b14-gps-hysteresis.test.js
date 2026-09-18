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
const context={console,Math,JSON,Number,String,Boolean,Date:FakeDate,localStorage,lastFix:null,window:null};
context.window=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('rc2-gps-health.js','utf8'),context,{filename:'rc2-gps-health.js'});

let seq=0;
const fix=({accuracy=15,speed=10,heading=0,age=0,lat=10,lng=106}={})=>{
  seq+=1;
  context.lastFix={lat,lng,accuracy,speed,heading,at:now-age+seq};
  return context.getGpsHealth();
};
const next=(ms=1000)=>{now+=ms};

// 1) Clean start is immediately usable; repeated reads of the same sample do not create fake samples.
context.resetGpsHealth();
let h=fix();
assert.equal(h.status,'VALID');
assert.equal(h.usable,true);
assert.equal(h.directional,true);
const repeated=context.getGpsHealth();
assert.equal(repeated.status,'VALID');

// 2) Poor accuracy blocks immediately, but recovery needs 3 distinct good samples.
next();h=fix({accuracy:180});
assert.equal(h.status,'POOR_ACCURACY');
assert.equal(h.usable,false);
next();h=fix();
assert.equal(h.status,'RECOVERING');
assert.equal(h.goodStreak,1);
assert.equal(h.usable,false);
const same=context.getGpsHealth();
assert.equal(same.goodStreak,1);
next();h=fix();
assert.equal(h.status,'RECOVERING');
assert.equal(h.goodStreak,2);
next();h=fix();
assert.equal(h.goodStreak,3);
assert.equal(h.usable,true);
assert.equal(h.directional,false);
assert.equal(h.directionLocked,true);

// 3) Direction is re-enabled only after 3 stable heading samples after recovery.
next();h=fix();
assert.equal(h.directionGoodStreak,2);
assert.equal(h.directional,false);
next();h=fix();
assert.equal(h.directionGoodStreak,3);
assert.equal(h.directionLocked,false);
assert.equal(h.directional,true);

// 4) A sharp heading jump locks directional filtering immediately.
next(1000);h=fix({heading:200});
assert.equal(h.status,'HEADING_UNSTABLE');
assert.equal(h.usable,true);
assert.equal(h.directional,false);
assert.equal(h.directionLocked,true);
next(1000);h=fix({heading:2});
assert.equal(h.directional,false);
assert.equal(h.directionGoodStreak,1);
next(1000);h=fix({heading:4});
assert.equal(h.directional,false);
assert.equal(h.directionGoodStreak,2);
next(1000);h=fix({heading:6});
assert.equal(h.directional,true);
assert.equal(h.directionLocked,false);

// 5) Stale GPS blocks immediately and then requires clean recovery samples.
context.resetGpsHealth();
context.lastFix={lat:10,lng:106,accuracy:15,speed:10,heading:0,at:now-21000};
h=context.getGpsHealth();
assert.equal(h.status,'STALE');
assert.equal(h.usable,false);
next();h=fix();assert.equal(h.status,'RECOVERING');
next();h=fix();assert.equal(h.status,'RECOVERING');
next();h=fix();assert.equal(h.usable,true);
assert.equal(h.goodStreak,3);

// 6) speed=null remains unknown and never becomes a false standstill value.
context.resetGpsHealth();
next();h=fix({speed:null,heading:null});
assert.equal(h.status,'VALID');
assert.equal(h.speedKnown,false);
assert.equal(h.moving,false);
assert.equal(h.fix.speed,null);
assert.equal(h.directional,false);

console.log('B14 GPS HYSTERESIS SIMULATION: PASS');
