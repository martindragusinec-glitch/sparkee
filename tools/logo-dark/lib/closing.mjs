// Offset (dilate by t) + morphological closing (radius r) of the union of fill polygons.
// usage: node closing.mjs polys.json x0 y0 x1 y1 res t r out.json
import fs from 'fs';
const [,, pf, X0, Y0, X1, Y1, RES, T, RR, OUT] = process.argv;
const polys = JSON.parse(fs.readFileSync(pf));
const x0=+X0,y0=+Y0,x1=+X1,y1=+Y1,res=+RES,t=+T,r=+RR;
const nx=Math.round((x1-x0)/res)+1, ny=Math.round((y1-y0)/res)+1;
function bucketize(segs,B){const bk=new Map();for(const s of segs){const i0=Math.floor(Math.min(s[0],s[2])/B),i1=Math.floor(Math.max(s[0],s[2])/B),j0=Math.floor(Math.min(s[1],s[3])/B),j1=Math.floor(Math.max(s[1],s[3])/B);for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=i*100000+j;if(!bk.has(k))bk.set(k,[]);bk.get(k).push(s);}}return bk;}
function dseg(px,py,s){const dx=s[2]-s[0],dy=s[3]-s[1];const L=dx*dx+dy*dy;let u=L?((px-s[0])*dx+(py-s[1])*dy)/L:0;u=Math.max(0,Math.min(1,u));const qx=s[0]+u*dx-px,qy=s[1]+u*dy-py;return qx*qx+qy*qy;}
function mindist(bk,B,px,py,maxd){let best=maxd*maxd;const R=Math.ceil(maxd/B);const bi=Math.floor(px/B),bj=Math.floor(py/B);for(let a=bi-R;a<=bi+R;a++)for(let b=bj-R;b<=bj+R;b++){const L=bk.get(a*100000+b);if(!L)continue;for(const s of L){const d=dseg(px,py,s);if(d<best)best=d;}}return Math.sqrt(best);}
// inside mask via scanline (union of even-odd polygons)
const inside=new Uint8Array(nx*ny);
for(let j=0;j<ny;j++){const py=y0+j*res;for(const p of polys){const xs=[];for(let i=0,k=p.length-1;i<p.length;k=i++){const a=p[i],b=p[k];if((a[1]>py)!=(b[1]>py))xs.push((b[0]-a[0])*(py-a[1])/(b[1]-a[1])+a[0]);}xs.sort((a,b)=>a-b);for(let m=0;m+1<xs.length;m+=2){let i0=Math.ceil((xs[m]-x0)/res),i1=Math.floor((xs[m+1]-x0)/res);i0=Math.max(0,i0);i1=Math.min(nx-1,i1);for(let i=i0;i<=i1;i++)inside[j*nx+i]=1;}}}
const segs=[];for(const p of polys)for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];segs.push([a[0],a[1],b[0],b[1]]);}
const B1=1.0,bk1=bucketize(segs,B1);
const cap=t+r+1;
const sd=new Float64Array(nx*ny);
for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const idx=j*nx+i;if(inside[idx]){sd[idx]=-1;continue;}sd[idx]=mindist(bk1,B1,x0+i*res,y0+j*res,cap);}
function march(F,level){const out=[];const v=(i,j)=>F[j*nx+i]-level;const ip=(ax,ay,av,bx,by,bv)=>{const u=av/(av-bv);return[ax+(bx-ax)*u,ay+(by-ay)*u];};
 for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){const a=v(i,j),b=v(i+1,j),c=v(i+1,j+1),d=v(i,j+1);const X=x0+i*res,Y=y0+j*res,X2=X+res,Y2=Y+res;const pts=[];
  if((a<0)!=(b<0))pts.push(ip(X,Y,a,X2,Y,b));if((b<0)!=(c<0))pts.push(ip(X2,Y,b,X2,Y2,c));if((c<0)!=(d<0))pts.push(ip(X2,Y2,c,X,Y2,d));if((d<0)!=(a<0))pts.push(ip(X,Y2,d,X,Y,a));
  if(pts.length==2)out.push(pts);else if(pts.length==4){out.push([pts[0],pts[1]]);out.push([pts[2],pts[3]]);}}return out;}
function chain(out){const k2=p=>p[0].toFixed(6)+','+p[1].toFixed(6);const adj=new Map();out.forEach((s,idx)=>{for(const p of s){const k=k2(p);if(!adj.has(k))adj.set(k,[]);adj.get(k).push(idx);}});const used=new Uint8Array(out.length);const lines=[];
 for(let s0=0;s0<out.length;s0++){if(used[s0])continue;used[s0]=1;let line=[out[s0][0],out[s0][1]];for(const dir of[1,0]){for(;;){const end=dir?line[line.length-1]:line[0];const c=(adj.get(k2(end))||[]).filter(x=>!used[x]);if(!c.length)break;const s=out[c[0]];used[c[0]]=1;const nx_=k2(s[0])==k2(end)?s[1]:s[0];if(dir)line.push(nx_);else line.unshift(nx_);}}lines.push(line);}return lines;}
const isoT=march(sd,t);
let result={t, r, isoT:chain(isoT)};
if(r>0){const isoA=march(sd,t+r);const bk2=bucketize(isoA.map(s=>[s[0][0],s[0][1],s[1][0],s[1][1]]),0.5);
 const e=new Float64Array(nx*ny);
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const idx=j*nx+i;const s=sd[idx];if(s>t+r){e[idx]=-1;continue;}if(s<=t){e[idx]=r+1;continue;}e[idx]=mindist(bk2,0.5,x0+i*res,y0+j*res,r+1);}
 // closing boundary: e == r  (points with e>=r are in closed set)
 const F2=new Float64Array(nx*ny);for(let k=0;k<F2.length;k++)F2[k]=-e[k]; // want level where -e = -r
 result.isoClose=chain(march(F2,-r));}
fs.writeFileSync(OUT,JSON.stringify(result));
console.log('grid',nx,ny,'isoT',result.isoT.map(l=>l.length).join(' '),'close',(result.isoClose||[]).map(l=>l.length).join(' '));
