const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+__dirname+'/cena.html');
const ts=process.argv.slice(3).map(Number);const out=process.argv[2];
for(const t of ts){await p.evaluate(t=>draw(t),t);await p.screenshot({path:`${out}/f_${t.toFixed(2)}.jpg`,type:'jpeg',quality:80})}
console.log('errors:',errs.slice(0,5));await b.close()})();
