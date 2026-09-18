const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const store=new Map();
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
let poiData=[
 {id:'r2-fuel',name:'R2 Fuel',category:'Cây xăng',routeId:'R-002',gpsRankEligible:true,lat:10.1,lng:106},
 {id:'rx-fuel',name:'RX Fuel',category:'Cây xăng',routeId:'R-X',gpsRankEligible:true,lat:10.11,lng:106},
 {id:'global-stop',name:'Global Stop',category:'Trạm dừng',gpsRankEligible:true,lat:10.12,lng:106}
];
const context={console,Math,JSON,Number,String,Boolean,localStorage,lastFix:{lat:10,lng:106,accuracy:10,speed:0,heading:null,at:Date.now()},window:null,pois:()=>poiData};
context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync('rc2-engine-v3.js','utf8'),context,{filename:'rc2-engine-v3.js'});
assert.equal(context.DiDauEngine.version,'3.1.0-rc2');
localStorage.setItem('d1-route','R-002');
let rec=context.DiDauEngine.DrivingAdvisor.recommendations();
assert(rec.items.some(x=>x.id==='r2-fuel'));
assert(!rec.items.some(x=>x.id==='rx-fuel'));
assert(rec.items.some(x=>x.id==='global-stop'));
localStorage.setItem('d1-route','R-X');
rec=context.DiDauEngine.DrivingAdvisor.recommendations();
assert(rec.items.some(x=>x.id==='rx-fuel'));
assert(!rec.items.some(x=>x.id==='r2-fuel'));
assert.equal(rec.routeContext.routeId,'R-X');
const driving=fs.readFileSync('rc2-driving.js','utf8');
assert(!driving.includes("p.routeId==='R-002'"));
assert(driving.includes('DiDauEngine'));
console.log('CORE ENGINE V3.1 MULTI-ROUTE ARCHITECTURE: PASS');
