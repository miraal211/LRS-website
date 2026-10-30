const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const http=require('node:http');
const {once}=require('node:events');
const fs=require('node:fs');

async function launch(port=0) {
  const {pathToFileURL}=require('node:url');
  const {startServer}=await import(pathToFileURL(path.resolve(__dirname,'../scripts/serve.mjs')).href);
  const server=await startServer(Number(port),{quiet:true});
  return {child:server,url:`http://127.0.0.1:${server.address().port}`};
}
async function stop(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
test('launch configuration has file-first defaults and valid workspace targets',()=>{
  const root=path.resolve(__dirname,'..');
  const config=JSON.parse(fs.readFileSync(path.join(root,'.vscode/launch.json'),'utf8'));
  for(const c of config.configurations){
    const target=c.file||c.program;
    assert.ok(fs.existsSync(target.replace('${workspaceFolder}',root)));
  }
  assert.equal(config.configurations[0].url,undefined);
  assert.equal(config.configurations[0].file,'${workspaceFolder}/site/index.html');
  const action=config.configurations[2].serverReadyAction;
  assert.ok(new RegExp(action.pattern).test('LRS ready at http://127.0.0.1:8000'));
});
test('server serves pages/assets using its module-relative site directory',async()=>{
  const {child,url}=await launch();
  try{
    for(const route of ['/','/mosque/timings/','/events/sacred-retreat-2/index.html','/assets/css/styles.css','/assets/js/app.js','/assets/media/lums-mosque.jpg','/assets/vendor/gsap.min.js','/assets/vendor/ScrollTrigger.min.js','/assets/js/experience.js','/assets/js/prayer-engine.js','/assets/css/cinematic.css']){
      const response=await fetch(url+route);assert.equal(response.status,200,route);assert.ok((await response.arrayBuffer()).byteLength>0);
    }
    assert.match(await (await fetch(url)).text(),/The Three/);
    assert.equal((await fetch(url+'/not-a-page')).status,404);
    assert.equal((await fetch(url+'/.vscode/launch.json')).status,403);
    assert.equal((await fetch(url,{method:'POST'})).status,405);
    const head=await fetch(url,{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
  }finally{await stop(child);}
});
test('occupied port falls back to an available port rather than failing',async()=>{
  const busy=http.createServer();busy.listen(0,'127.0.0.1');await once(busy,'listening');
  let child;
  try{
    const port=busy.address().port;
    const running=await launch(port);child=running.child;
    assert.notEqual(new URL(running.url).port,String(port));
    assert.equal((await fetch(running.url)).status,200);
  }finally{if(child)await stop(child);await new Promise(resolve=>busy.close(resolve));}
});

test('video and fonts have correct MIME types; video seeking supports byte ranges',async()=>{
  const {child,url}=await launch();
  try{
    const response=await fetch(url+'/assets/media/campus-film.mp4',{headers:{Range:'bytes=0-99'}});
    assert.equal(response.status,206);assert.equal(response.headers.get('content-type'),'video/mp4');
    assert.match(response.headers.get('content-range'),/^bytes 0-99\/\d+$/);assert.equal((await response.arrayBuffer()).byteLength,100);
    const suffix=await fetch(url+'/assets/media/campus-film.mp4',{headers:{Range:'bytes=-50'}});
    assert.equal(suffix.status,206);assert.equal((await suffix.arrayBuffer()).byteLength,50);
    const invalid=await fetch(url+'/assets/media/campus-film.mp4',{headers:{Range:'bytes=999999999-'}});assert.equal(invalid.status,416);
    const font=await fetch(url+'/assets/fonts/font-0.ttf',{method:'HEAD'});assert.equal(font.headers.get('content-type'),'font/ttf');
  }finally{await stop(child);}
});
