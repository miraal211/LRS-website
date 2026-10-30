// Optional local development server. No dependencies; Node.js 18+.
import http from 'node:http';
import {readFile, stat, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = await realpath(fileURLToPath(new URL('../site/', import.meta.url)));
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2','.ttf':'font/ttf','.mp4':'video/mp4','.pdf':'application/pdf'};
export async function startServer(requestedPort = 8000, {quiet = false} = {}) {
if (!Number.isInteger(requestedPort) || requestedPort < 0 || requestedPort > 65535) {
  throw new RangeError('PORT must be an integer between 0 and 65535.');
}
const insideRoot = file => file === root || file.startsWith(root + path.sep);
const server = http.createServer(async (req,res) => {
  const finish = (code,text) => {res.writeHead(code,{'Content-Type':'text/plain; charset=utf-8'});res.end(req.method === 'HEAD' ? undefined : text);};
  if (!['GET','HEAD'].includes(req.method)) {res.setHeader('Allow','GET, HEAD');return finish(405,'Method not allowed');}
  try {
    // Strip queries before decoding so encoded characters remain file-path data.
    let pathname;
    try { pathname = decodeURIComponent(req.url.split('?')[0]); }
    catch { return finish(400,'Invalid URL encoding'); }
    if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').some(part=>part.startsWith('.'))) return finish(403,'Forbidden');
    let file = path.resolve(root,'.'+pathname);
    if (!insideRoot(file)) return finish(403,'Forbidden');
    let info = await stat(file);
    if (info.isDirectory()) {
      if (!pathname.endsWith('/')) {res.writeHead(302,{Location:pathname+'/'});return res.end();}
      file = path.join(file,'index.html');
    }
    file = await realpath(file);
    if (!insideRoot(file)) return finish(403,'Forbidden');
    const content = await readFile(file);
    const headers={'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
    // Media seeking uses standard single byte ranges, including suffix requests.
    if (req.headers.range && req.method === 'GET') {
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!match || (!match[1] && !match[2])) {res.writeHead(416,{...headers,'Content-Range':`bytes */${content.length}`});return res.end();}
      let start=match[1]?Number(match[1]):Math.max(0,content.length-Number(match[2]));
      let end=match[1]?(match[2]?Math.min(Number(match[2]),content.length-1):content.length-1):content.length-1;
      if (!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=content.length||end<start) {res.writeHead(416,{...headers,'Content-Range':`bytes */${content.length}`});return res.end();}
      const slice=content.subarray(start,end+1);
      res.writeHead(206,{...headers,'Content-Length':slice.length,'Content-Range':`bytes ${start}-${end}/${content.length}`});return res.end(slice);
    }
    res.writeHead(200,{...headers,'Content-Length':content.length});
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return finish(404,'Page not found. Open / to return to the LRS homepage.');
    console.error('Unable to serve request:',error.message);finish(500,'Unable to read this file.');
  }
});
return new Promise((resolve,reject)=>{
  let usedFallback = false;
  server.on('error',error=>{
    if (error.code === 'EADDRINUSE' && !usedFallback) {
      usedFallback=true;
      if (!quiet) console.log(`Port ${requestedPort} is busy; choosing an available local port.`);
      server.listen(0,'127.0.0.1');
    } else reject(error);
  });
  server.once('listening',()=>{
    if (!quiet) {
      console.log(`LRS ready at http://127.0.0.1:${server.address().port}`);
      console.log('Keep this process running while using localhost. Press Ctrl+C to stop.');
    }
    resolve(server);
  });
  server.listen(requestedPort,'127.0.0.1');
});
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const server = await startServer(process.env.PORT === undefined ? 8000 : Number(process.env.PORT));
    for (const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>{server.close();server.closeAllConnections();});
  } catch(error) {console.error('Server could not start:',error.message);process.exitCode=1;}
}
