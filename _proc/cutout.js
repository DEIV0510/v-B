const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = 'C:/Users/Lenovo/Desktop/V&B';
const OUT = 'C:/Users/Lenovo/Desktop/PROYECTOS-CLAUDE/vb-performance/assets/img/model';
const PROC = 'C:/Users/Lenovo/Desktop/PROYECTOS-CLAUDE/vb-performance/_proc/preview';
function p(...a){ return path.join(...a); }
fs.mkdirSync(OUT, {recursive:true});
fs.mkdirSync(PROC, {recursive:true});

const DEST_BG = [5, 5, 5]; // var(--c-void) — every .figure container's own background

function dilate(mask, w, h, iters){
  let cur = mask;
  for (let iter=0; iter<iters; iter++){
    const next = Uint8Array.from(cur);
    for (let y=0;y<h;y++){
      const row = y*w;
      for (let x=0;x<w;x++){
        const i = row+x;
        if (cur[i]) continue;
        if ((x>0&&cur[i-1]) || (x<w-1&&cur[i+1]) || (y>0&&cur[i-w]) || (y<h-1&&cur[i+w])) next[i]=1;
      }
    }
    cur = next;
  }
  return cur;
}

function floodFillFromBorder(mask, w, h){
  const n = w*h;
  const visited = new Uint8Array(n);
  const queue = new Int32Array(n);
  let qh=0, qt=0;
  function tryPush(x,y){
    if (x<0||y<0||x>=w||y>=h) return;
    const i = y*w+x;
    if (visited[i] || !mask[i]) return;
    visited[i]=1; queue[qt++]=i;
  }
  for (let x=0;x<w;x++){ tryPush(x,0); tryPush(x,h-1); }
  for (let y=0;y<h;y++){ tryPush(0,y); tryPush(w-1,y); }
  while (qh<qt){
    const i = queue[qh++];
    const x = i % w, y = (i / w) | 0;
    tryPush(x+1,y); tryPush(x-1,y); tryPush(x,y+1); tryPush(x,y-1);
  }
  return visited;
}

/** Returns {data, info, w, h, ch, visited} — visited[i]=1 means pixel i is background. */
async function computeMask(inputPath, {bg, threshold, pocketReach, pocketThreshold, pocketZones}) {
  const { data, info } = await sharp(inputPath).raw().ensureAlpha().toBuffer({resolveWithObject:true});
  const w = info.width, h = info.height, ch = info.channels;
  const n = w*h;
  const [br,bgg,bb] = bg;
  const isBgCandidate = new Uint8Array(n);
  for (let i=0;i<n;i++){
    const idx = i*ch;
    const dr = Math.abs(data[idx]-br), dg = Math.abs(data[idx+1]-bgg), db = Math.abs(data[idx+2]-bb);
    isBgCandidate[i] = Math.max(dr,dg,db) <= threshold ? 1 : 0;
  }

  let visited = floodFillFromBorder(isBgCandidate, w, h);

  if (pocketReach > 0){
    // Pockets can use a looser colour threshold than the main border flood-fill
    // (a shadowed gap is rarely as pure as the lit backdrop) — safe here only
    // because acceptance is ALSO restricted to known gap zones below.
    const pocketCandidate = pocketThreshold && pocketThreshold !== threshold
      ? (() => {
          const m = new Uint8Array(n);
          for (let i=0;i<n;i++){
            const idx = i*ch;
            const dr = Math.abs(data[idx]-br), dg = Math.abs(data[idx+1]-bgg), db = Math.abs(data[idx+2]-bb);
            m[i] = Math.max(dr,dg,db) <= pocketThreshold ? 1 : 0;
          }
          return m;
        })()
      : isBgCandidate;

    const zones = pocketZones ? pocketZones.map(([x0,y0,x1,y1]) => [x0*w,y0*h,x1*w,y1*h]) : null;
    function inAnyZone(minX,minY,maxX,maxY){
      if (!zones) return true;
      return zones.some(([zx0,zy0,zx1,zy1]) => minX>=zx0-4 && maxX<=zx1+4 && minY>=zy0-4 && maxY<=zy1+4);
    }

    for (let pass=0; pass<8; pass++){
      const visitedNear = dilate(visited, w, h, pocketReach);
      const compVisited = new Uint8Array(n);
      let changed = false;
      for (let start=0; start<n; start++){
        if (visited[start] || compVisited[start] || !pocketCandidate[start]) continue;
        const comp = [];
        let nearBorder = false;
        let minX=w,minY=h,maxX=0,maxY=0;
        let ch2=0, ct2=0;
        const compQueue = new Int32Array(n);
        compQueue[ct2++] = start; compVisited[start] = 1;
        while (ch2 < ct2){
          const i = compQueue[ch2++];
          comp.push(i);
          if (visitedNear[i]) nearBorder = true;
          const x = i % w, y = (i / w) | 0;
          if (x<minX) minX=x; if (x>maxX) maxX=x; if (y<minY) minY=y; if (y>maxY) maxY=y;
          const nbrs = [[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
          for (const [nx,ny] of nbrs){
            if (nx<0||ny<0||nx>=w||ny>=h) continue;
            const ni = ny*w+nx;
            if (visited[ni] || compVisited[ni] || !pocketCandidate[ni]) continue;
            compVisited[ni] = 1; compQueue[ct2++] = ni;
          }
        }
        if (nearBorder && inAnyZone(minX,minY,maxX,maxY)){ for (const i of comp) visited[i] = 1; changed = true; }
      }
      if (!changed) break;
    }
  }

  return {data, info, w, h, ch, isBgCandidate, visited};
}

async function finish(job, data, info, visited, choke, blur){
  const w = info.width, h = info.height, ch = info.channels;
  const n = w*h;
  if (choke > 0) visited = dilate(visited, w, h, choke);

  const alphaMask = Buffer.alloc(n);
  for (let i=0;i<n;i++) alphaMask[i] = visited[i] ? 0 : 255;
  const alphaBuf = await sharp(alphaMask, {raw:{width:w,height:h,channels:1}}).blur(blur).extractChannel(0).raw().toBuffer();

  // Alpha-composite onto the destination's own opaque background colour BY
  // HAND (plain arithmetic, no sharp alpha pipeline involved) — the exported
  // file ends up strictly 3-channel with no alpha at all, so there is nothing
  // left for any renderer to mis-handle: the "removed" pixels simply ARE that
  // background colour, for good.
  const rgb = Buffer.alloc(n*3);
  for (let i=0;i<n;i++){
    const idx = i*ch;
    const a = alphaBuf[i] / 255;
    rgb[i*3]   = Math.round(data[idx]   * a + DEST_BG[0] * (1-a));
    rgb[i*3+1] = Math.round(data[idx+1] * a + DEST_BG[1] * (1-a));
    rgb[i*3+2] = Math.round(data[idx+2] * a + DEST_BG[2] * (1-a));
  }

  const composed = await sharp(rgb, {raw:{width:w,height:h,channels:3}}).png().toBuffer();
  const trimmed = await sharp(composed).trim({threshold:10}).toBuffer();
  return trimmed;
}

async function run(){
  fs.mkdirSync(p(PROC), {recursive:true});

  // --- black & merlot: fully reliable via colour alone (dark garment vs white bg) ---
  const black  = await computeMask(p(SRC,'negra.png'),     {bg:[254,254,254], threshold:20, pocketReach:110});
  const merlot = await computeMask(p(SRC,'vinotinto.png'), {bg:[254,254,254], threshold:20, pocketReach:110});

  // --- white: no colour threshold safely separates the true gap from fold
  // highlights on a white garment (both sit in the same brightness range), so
  // colour-based pocket recovery kept either leaving the gap closed or eating
  // speckled holes in the fabric. Instead: keep the tight (7) flood-fill for
  // everything colour can safely tell apart, then force-fill the two gap
  // pockets geometrically — an ellipse inset well inside the bounding box
  // measured off the black photo (same shoot/pose/framing), so it can never
  // reach the fabric edge regardless of what colour is under it.
  const white = await computeMask(p(SRC,'blanca.png'), {bg:[254,254,254], threshold:7, pocketReach:0});
  function fillEllipse(mask, w, h, [x0,y0,x1,y1]){
    const cx = (x0+x1)/2*w, cy = (y0+y1)/2*h;
    const rx = (x1-x0)/2*w, ry = (y1-y0)/2*h;
    const minX = Math.floor((x0)*w), maxX = Math.ceil((x1)*w);
    const minY = Math.floor((y0)*h), maxY = Math.ceil((y1)*h);
    for (let y=minY; y<=maxY; y++){
      for (let x=minX; x<=maxX; x++){
        if (x<0||y<0||x>=w||y>=h) continue;
        const nx = (x-cx)/rx, ny = (y-cy)/ry;
        if (nx*nx + ny*ny <= 1) mask[y*w+x] = 1;
      }
    }
  }
  // boxes inset ~5% inside the measured negra.png gap bounds
  fillEllipse(white.visited, white.w, white.h, [0.664, 0.349, 0.783, 0.533]);
  fillEllipse(white.visited, white.w, white.h, [0.218, 0.361, 0.355, 0.528]);

  // --- seated: already has real, pre-cut alpha from the source PNG ---
  const seatedRaw = await sharp(p(SRC,'sentado.png')).raw().ensureAlpha().toBuffer({resolveWithObject:true});
  const seatedVisited = new Uint8Array(seatedRaw.info.width * seatedRaw.info.height);
  for (let i=0;i<seatedVisited.length;i++) seatedVisited[i] = seatedRaw.data[i*seatedRaw.info.channels+3] < 10 ? 1 : 0;

  const jobs = [
    {out:'cutout-black.webp',  m: black,  choke:2, blur:1.4},
    {out:'cutout-merlot.webp', m: merlot, choke:2, blur:1.4},
    {out:'cutout-white.webp',  m: white,  choke:3, blur:1.4},
    {out:'cutout-seated.webp', m: {data:seatedRaw.data, info:seatedRaw.info, visited:seatedVisited}, choke:0, blur:1.0},
  ];

  for (const j of jobs){
    const buf = await finish(j, j.m.data, j.m.info, j.m.visited, j.choke, j.blur);
    const meta = await sharp(buf).metadata();
    console.log(j.out, 'trimmed to', meta.width+'x'+meta.height);
    const targetW = Math.min(meta.width, 1100);
    await sharp(buf).resize({width: targetW, kernel:'lanczos3'}).sharpen({sigma:0.5}).webp({quality:95, effort:6}).toFile(p(OUT, j.out));
    await sharp(buf).resize({width: Math.min(targetW,700), kernel:'lanczos3'}).png().toFile(p(PROC, j.out.replace('.webp','.png')));
  }
  console.log('CUTOUT DONE');
}
run().catch(e=>{ console.error(e); process.exit(1); });
