const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = 'C:/Users/Lenovo/Desktop/V&B';
const OUT = 'C:/Users/Lenovo/Desktop/PROYECTOS-CLAUDE/vb-performance/assets/img/model';
const PROC = 'C:/Users/Lenovo/Desktop/PROYECTOS-CLAUDE/vb-performance/_proc/preview';
function p(...a){ return path.join(...a); }
fs.mkdirSync(OUT, {recursive:true});
fs.mkdirSync(PROC, {recursive:true});

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

async function removeBg(inputPath, {bg, threshold, choke, blur, pocketReach, pocketMinYFrac, alreadyAlpha}) {
  const { data, info } = await sharp(inputPath).raw().ensureAlpha().toBuffer({resolveWithObject:true});
  const w = info.width, h = info.height, ch = info.channels;
  const n = w*h;

  let visited;
  if (alreadyAlpha) {
    // trust existing alpha: background = fully transparent already
    visited = new Uint8Array(n);
    for (let i=0;i<n;i++) visited[i] = data[i*ch+3] < 10 ? 1 : 0;
  } else {
    const [br,bgg,bb] = bg;
    const isBgCandidate = new Uint8Array(n);
    for (let i=0;i<n;i++){
      const idx = i*ch;
      const dr = Math.abs(data[idx]-br), dg = Math.abs(data[idx+1]-bgg), db = Math.abs(data[idx+2]-bb);
      isBgCandidate[i] = Math.max(dr,dg,db) <= threshold ? 1 : 0;
    }

    visited = floodFillFromBorder(isBgCandidate, w, h);

    // Pick up enclosed background pockets (e.g. an armpit gap pinched off where
    // the arm touches the torso) WITHOUT ever walking through fabric: a pocket
    // is accepted only if some part of it sits within `pocketReach` px of the
    // already border-connected background — a deep interior island (a chest
    // logo, or a big near-white blob inside a white garment) sits far from the
    // true background and is correctly left alone.
    if (pocketReach > 0){
      const minY = pocketMinYFrac ? Math.round(h * pocketMinYFrac) : 0;
      // repeat until stable: accepting one pocket can bring a further pocket
      // (chained around a limb) within reach on the next pass
      for (let pass=0; pass<8; pass++){
        const visitedNear = dilate(visited, w, h, pocketReach);
        const compVisited = new Uint8Array(n);
        let changed = false;
        for (let start=0; start<n; start++){
          if (visited[start] || compVisited[start] || !isBgCandidate[start]) continue;
          const comp = [];
          let nearBorder = false;
          let ch2=0, ct2=0;
          const compQueue = new Int32Array(n);
          compQueue[ct2++] = start; compVisited[start] = 1;
          while (ch2 < ct2){
            const i = compQueue[ch2++];
            comp.push(i);
            if (visitedNear[i]) nearBorder = true;
            const x = i % w, y = (i / w) | 0;
            const nbrs = [[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
            for (const [nx,ny] of nbrs){
              if (nx<0||ny<0||nx>=w||ny>=h) continue;
              const ni = ny*w+nx;
              if (visited[ni] || compVisited[ni] || !isBgCandidate[ni]) continue;
              compVisited[ni] = 1; compQueue[ct2++] = ni;
            }
          }
          // only reveal the part of this pocket at/below the safe line — a
          // component that spans past it (e.g. up into a shoulder seam where a
          // fabric highlight sits right against the true background) keeps its
          // upper portion opaque rather than risk eating into the fabric there
          if (nearBorder){
            for (const i of comp){
              const y = (i / w) | 0;
              if (y >= minY){ visited[i] = 1; changed = true; }
            }
          }
        }
        if (!changed) break;
      }
    }

    // choke: dilate background mask inward by `choke` px (shrinks foreground rim)
    if (choke > 0) visited = dilate(visited, w, h, choke);
  }

  const alphaMask = Buffer.alloc(n);
  for (let i=0;i<n;i++) alphaMask[i] = visited[i] ? 0 : 255;

  const rgb = Buffer.alloc(n*3);
  for (let i=0;i<n;i++){ const idx=i*ch; rgb[i*3]=data[idx]; rgb[i*3+1]=data[idx+1]; rgb[i*3+2]=data[idx+2]; }

  const alphaBuf = await sharp(alphaMask, {raw:{width:w,height:h,channels:1}}).blur(blur).extractChannel(0).raw().toBuffer();

  const composed = await sharp(rgb, {raw:{width:w,height:h,channels:3}})
    .joinChannel(alphaBuf, {raw:{width:w,height:h,channels:1}})
    .png().toBuffer();

  // trim to content bbox based on alpha
  const trimmed = await sharp(composed).trim({threshold:10}).toBuffer();
  return trimmed;
}

async function run(){
  const jobs = [
    {file:'negra.png',     out:'cutout-black.webp',   bg:[254,254,254], threshold:20, pocketReach:12, choke:2, blur:1.4},
    {file:'vinotinto.png', out:'cutout-merlot.webp',  bg:[254,254,254], threshold:20, pocketReach:12, choke:2, blur:1.4},
    {file:'blanca.png',    out:'cutout-white.webp',   bg:[254,254,254], threshold:7,  pocketReach:0, choke:3, blur:1.4},
    {file:'sentado.png',   out:'cutout-seated.webp',  alreadyAlpha:true, choke:0, blur:1.0},
  ];
  for (const j of jobs){
    const buf = await removeBg(p(SRC, j.file), j);
    const meta = await sharp(buf).metadata();
    console.log(j.out, 'trimmed to', meta.width+'x'+meta.height);
    const targetW = Math.min(meta.width, 1100);
    await sharp(buf).resize({width: targetW, kernel:'lanczos3'}).webp({quality:95, effort:6}).toFile(p(OUT, j.out));
    await sharp(buf).resize({width: Math.min(targetW,700), kernel:'lanczos3'}).png().toFile(p(PROC, j.out.replace('.webp','.png')));
  }
  console.log('CUTOUT DONE');
}
run().catch(e=>{ console.error(e); process.exit(1); });
