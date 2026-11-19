const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
await p.goto('file://'+__dirname+'/cena.html');
const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','video_mudo.mp4'],{stdio:['pipe','inherit','inherit']});
const N=900;for(let f=0;f<N;f++){await p.evaluate(t=>draw(t),f/30);const buf=await p.screenshot({type:'jpeg',quality:95});
 if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(f%150==0)console.log('frame',f)}
ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();console.log('ok')})();
