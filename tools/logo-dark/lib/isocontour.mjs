// usage: node isocontour.mjs polys.json x0 y0 x1 y1 res t out.json
import fs from 'fs';
const [,, pf, X0, Y0, X1, Y1, RES, T, OUT] = process.argv;
const polys = JSON.parse(fs.readFileSync(pf));
const x0=+X0,y0=+Y0,x1=+X1,y1=+Y1,res=+RES,t=+T;
const nx=Math.round((x1-x0)/res)+1, ny=Math.round((y1-y0)/res)+1;
// segments + bucket
const segs=[]; for(const p of polys){ for(let i=0;i<p.length;i++){ const a=p[i], b=p[(i+1)%p.length]; segs.push([a[0],a[1],b[0],b[1]]);} }
const B=1.0, bk=new Map(); const key=(i,j)=>i*100000+j;
for(const s of segs){ const i0=Math.floor(Math.min(s[0],s[2])/B), i1=Math.floor(Math.max(s[0],s[2])/B), j0=Math.floor(Math.min(s[1],s[3])/B), j1=Math.floor(Math.max(s[1],s[3])/B);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=key(i,j); if(!bk.has(k))bk.set(k,[]); bk.get(k).push(s);} }
function dseg(px,py,s){const dx=s[2]-s[0],dy=s[3]-s[1];const L=dx*dx+dy*dy;let u=L?((px-s[0])*dx+(py-s[1])*dy)/L:0;u=Math.max(0,Math.min(1,u));const qx=s[0]+u*dx-px,qy=s[1]+u*dy-py;return qx*qx+qy*qy;}
function inside(px,py){ // nonzero union of polys (each poly even-odd)
  for(const p of polys){ let c=false; for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j]; if(((a[1]>py)!=(b[1]>py)) && (px < (b[0]-a[0])*(py-a[1])/(b[1]-a[1])+a[0])) c=!c;} if(c) return true;} return false;}
const R=Math.ceil((t+0.5)/B);
const F=new Float64Array(nx*ny);
for(let j=0;j<ny;j++){ const py=y0+j*res; for(let i=0;i<nx;i++){ const px=x0+i*res;
  let best=1e18; const bi=Math.floor(px/B), bj=Math.floor(py/B);
  for(let a=bi-R;a<=bi+R;a++)for(let b=bj-R;b<=bj+R;b++){const L=bk.get(key(a,b)); if(!L)continue; for(const s of L){const d=dseg(px,py,s); if(d<best)best=d;}}
  let d=Math.sqrt(best); if(d>t+0.4) d=t+0.4; if(d<t+0.4 && inside(px,py)) d=-d; F[j*nx+i]=d-t; }}
// marching squares -> segments
const out=[]; const v=(i,j)=>F[j*nx+i];
function interp(ax,ay,av,bx,by,bv){const u=av/(av-bv);return [ax+(bx-ax)*u, ay+(by-ay)*u];}
for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){
  const a=v(i,j),b=v(i+1,j),c=v(i+1,j+1),d=v(i,j+1);
  const X=x0+i*res,Y=y0+j*res,X2=X+res,Y2=Y+res;
  const pts=[];
  if((a<0)!=(b<0)) pts.push(interp(X,Y,a,X2,Y,b));
  if((b<0)!=(c<0)) pts.push(interp(X2,Y,b,X2,Y2,c));
  if((c<0)!=(d<0)) pts.push(interp(X2,Y2,c,X,Y2,d));
  if((d<0)!=(a<0)) pts.push(interp(X,Y2,d,X,Y,a));
  if(pts.length==2) out.push(pts); else if(pts.length==4){out.push([pts[0],pts[1]]);out.push([pts[2],pts[3]]);}
}
// chain segments into polylines
const k2=p=>p[0].toFixed(5)+','+p[1].toFixed(5);
const adj=new Map(); out.forEach((s,idx)=>{for(const p of s){const k=k2(p); if(!adj.has(k))adj.set(k,[]); adj.get(k).push(idx);}});
const used=new Uint8Array(out.length); const lines=[];
for(let s0=0;s0<out.length;s0++){ if(used[s0])continue; used[s0]=1; let line=[out[s0][0],out[s0][1]];
  for(const dir of [1,0]){ let guard=0; while(guard++<1e6){ const end= dir? line[line.length-1]: line[0]; const cands=(adj.get(k2(end))||[]).filter(x=>!used[x]); if(!cands.length)break; const s=out[cands[0]]; used[cands[0]]=1; const nxt = k2(s[0])==k2(end)? s[1]: s[0]; if(dir) line.push(nxt); else line.unshift(nxt);} }
  lines.push(line);}
fs.writeFileSync(OUT, JSON.stringify(lines));
console.log('grid',nx,ny,'lines',lines.length, lines.map(l=>l.length).join(' '));
