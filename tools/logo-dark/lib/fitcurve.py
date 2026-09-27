"""Schneider cubic Bezier fitting with fixed end tangents (G1 joins)."""
import math
def sub(a,b): return (a[0]-b[0],a[1]-b[1])
def add(a,b): return (a[0]+b[0],a[1]+b[1])
def mul(a,s): return (a[0]*s,a[1]*s)
def dot(a,b): return a[0]*b[0]+a[1]*b[1]
def norm(a):
    l=math.hypot(*a); return (a[0]/l,a[1]/l)
def dist(a,b): return math.hypot(a[0]-b[0],a[1]-b[1])
def bez(c,t):
    mt=1-t
    return (mt**3*c[0][0]+3*mt*mt*t*c[1][0]+3*mt*t*t*c[2][0]+t**3*c[3][0],
            mt**3*c[0][1]+3*mt*mt*t*c[1][1]+3*mt*t*t*c[2][1]+t**3*c[3][1])
def bez_d1(c,t):
    mt=1-t
    return (3*(mt*mt*(c[1][0]-c[0][0])+2*mt*t*(c[2][0]-c[1][0])+t*t*(c[3][0]-c[2][0])),
            3*(mt*mt*(c[1][1]-c[0][1])+2*mt*t*(c[2][1]-c[1][1])+t*t*(c[3][1]-c[2][1])))
def bez_d2(c,t):
    return (6*((1-t)*(c[2][0]-2*c[1][0]+c[0][0])+t*(c[3][0]-2*c[2][0]+c[1][0])),
            6*((1-t)*(c[2][1]-2*c[1][1]+c[0][1])+t*(c[3][1]-2*c[2][1]+c[1][1])))
def chord_params(pts):
    u=[0.0]
    for i in range(1,len(pts)): u.append(u[-1]+dist(pts[i],pts[i-1]))
    return [x/u[-1] for x in u]
def generate(pts,u,t0,t1):
    P0,P3=pts[0],pts[-1]; th2=mul(t1,-1)
    C=[[0,0],[0,0]]; X=[0,0]
    for p,t in zip(pts,u):
        mt=1-t; b0=mt**3; b1=3*mt*mt*t; b2=3*mt*t*t; b3=t**3
        A1=mul(t0,b1); A2=mul(th2,b2)
        C[0][0]+=dot(A1,A1); C[0][1]+=dot(A1,A2); C[1][1]+=dot(A2,A2)
        tmp=sub(p, add(mul(P0,b0+b1), mul(P3,b2+b3)))
        X[0]+=dot(A1,tmp); X[1]+=dot(A2,tmp)
    C[1][0]=C[0][1]
    det=C[0][0]*C[1][1]-C[0][1]*C[1][0]
    seg=dist(P0,P3)
    if abs(det)>1e-12:
        a1=(X[0]*C[1][1]-X[1]*C[0][1])/det; a2=(C[0][0]*X[1]-C[1][0]*X[0])/det
    else: a1=a2=seg/3
    eps=1e-6*seg
    if a1<eps or a2<eps: a1=a2=seg/3
    return (P0, add(P0,mul(t0,a1)), add(P3,mul(th2,a2)), P3)
def max_err(c,pts,u):
    m=0; idx=len(pts)//2
    for i,(p,t) in enumerate(zip(pts,u)):
        d=dist(bez(c,t),p)
        if d>m: m=d; idx=i
    return m,idx
def reparam(c,pts,u):
    out=[]
    for p,t in zip(pts,u):
        q=bez(c,t); d1=bez_d1(c,t); d2=bez_d2(c,t)
        num=(q[0]-p[0])*d1[0]+(q[1]-p[1])*d1[1]
        den=d1[0]**2+d1[1]**2+(q[0]-p[0])*d2[0]+(q[1]-p[1])*d2[1]
        out.append(min(1,max(0,t-num/den)) if abs(den)>1e-12 else t)
    return out
def fit(pts,t0,t1,err,depth=0):
    if len(pts)==2:
        s=dist(pts[0],pts[1])/3
        return [(pts[0],add(pts[0],mul(t0,s)),sub(pts[1],mul(t1,s)),pts[1])]
    u=chord_params(pts)
    c=generate(pts,u,t0,t1); e,i=max_err(c,pts,u)
    if e<err: return [c]
    if e<err*6:
        for _ in range(20):
            u=reparam(c,pts,u); c=generate(pts,u,t0,t1); e,i=max_err(c,pts,u)
            if e<err: return [c]
    i=max(1,min(len(pts)-2,i))
    tc=norm(sub(pts[min(i+3,len(pts)-1)],pts[max(i-3,0)]))
    return fit(pts[:i+1],t0,tc,err,depth+1)+fit(pts[i:],tc,t1,err,depth+1)
