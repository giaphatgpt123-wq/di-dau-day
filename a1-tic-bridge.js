(function(){
'use strict';
const KEY='a1-tic-package-v1';
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{"manifest":null,"pois":[]}')}catch{return{manifest:null,pois:[]}}};
const rad=x=>x*Math.PI/180;
function km(a,b){const R=6371.0088,d1=rad(b.lat-a.lat),d2=rad(b.lng-a.lng),p1=rad(a.lat),p2=rad(b.lat);const h=Math.sin(d1/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(d2/2)**2;return 2*R*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))}
function nearby(fix,{category=null,radiusKm=20,limit=20}={}){return read().pois.filter(p=>p.status==='VERIFIED'&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&(!category||p.category===category)).map(p=>({...p,distance_km:km(fix,p)})).filter(p=>p.distance_km<=radiusKm).sort((a,b)=>a.distance_km-b.distance_km).slice(0,limit)}
function nav(p){return{googleMaps:`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`,geo:`geo:${p.lat},${p.lng}?q=${p.lat},${p.lng}`}}
function importPackage(pkg){if(!pkg||pkg.manifest?.schema!=='a1-poi-v1'||!Array.isArray(pkg.pois))throw new Error('INVALID_A1_TIC_PACKAGE');localStorage.setItem(KEY,JSON.stringify(pkg));return pkg.manifest}
window.A1TicBridge={read,nearby,nav,importPackage,version:()=>read().manifest?.version||null};
})();