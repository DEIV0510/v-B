const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = 'C:/Users/Lenovo/Desktop/V&B';
const OUT = 'C:/Users/Lenovo/Desktop/PROYECTOS-CLAUDE/vb-performance/assets/img';
const PROC = 'C:/Users/Lenovo/Desktop/PROYECTOS-CLAUDE/vb-performance/_proc';

function p(...a){ return path.join(...a); }

async function run() {
  fs.mkdirSync(p(OUT,'brand'), {recursive:true});
  fs.mkdirSync(p(OUT,'model'), {recursive:true});
  fs.mkdirSync(p(OUT,'product'), {recursive:true});
  fs.mkdirSync(p(OUT,'texture'), {recursive:true});
  fs.mkdirSync(p(PROC,'preview'), {recursive:true});

  // ---------- LOGO (transparent) ----------
  const logoTrim = sharp(p(SRC,'logosinfondo.png')).trim({threshold:10});
  const logoMeta = await logoTrim.clone().toBuffer({resolveWithObject:true});
  console.log('logo trimmed size', logoMeta.info.width, logoMeta.info.height);
  // Footer / larger use (~340px display width max -> export at 700px for retina)
  await sharp(logoMeta.data).resize({width:700, kernel:'lanczos3'}).webp({quality:88}).toFile(p(OUT,'brand','logo-full.webp'));

  // Crop just the V3 mark + "V&B" wordline (drop "PERFORMANCE APPAREL" caption) for favicon/loader mark
  const w = logoMeta.info.width, h = logoMeta.info.height;
  const markH = Math.round(h * 0.82); // guess: mark+wordmark ends ~82% down, caption is bottom sliver
  const markTrim = await sharp(logoMeta.data).extract({left:0, top:0, width:w, height:markH})
    .trim({threshold:10}).toBuffer({resolveWithObject:true});
  // Navbar / loader use (~90px display width max -> export at 320px for retina)
  await sharp(markTrim.data).resize({width:320, kernel:'lanczos3'}).webp({quality:88}).toFile(p(OUT,'brand','logo-mark.webp'));
  // Larger mark for loader centerpiece (~160px display -> 480px)
  await sharp(markTrim.data).resize({width:480, kernel:'lanczos3'}).webp({quality:88}).toFile(p(OUT,'brand','logo-mark-lg.webp'));
  await sharp(markTrim.data).png().toFile(p(PROC,'preview','logo-mark-check.png'));

  // Favicon: square canvas, black bg, mark centered
  const CANVAS = 512;
  const markFit = await sharp(p(PROC,'preview','logo-mark-check.png'))
    .resize({width: Math.round(CANVAS*0.8), height: Math.round(CANVAS*0.8), fit:'inside', kernel:'lanczos3'})
    .toBuffer();
  await sharp({create:{width:CANVAS,height:CANVAS,channels:4,background:{r:5,g:5,b:5,alpha:1}}})
    .composite([{input: markFit, gravity:'center'}])
    .png().toFile(p(OUT,'brand','favicon.png'));
  await sharp(p(OUT,'brand','favicon.png')).resize(180,180).png().toFile(p(OUT,'brand','apple-touch-icon.png'));
  await sharp(p(OUT,'brand','favicon.png')).resize(32,32).png().toFile(p(OUT,'brand','favicon-32.png'));

  // Opaque logo (with its own dark vignette bg) for full-bleed brand moments
  await sharp(p(SRC,'LOGO.png')).webp({quality:90}).toFile(p(OUT,'brand','logo-plate.webp'));

  // ---------- PRODUCT flat-lays (native res, mild sharpen, high quality) ----------
  const products = ['camisa.png','camisa2.png','camisa3.png'];
  const productNames = ['tank-black.webp','tank-white.webp','tank-merlot.webp'];
  for (let i=0;i<products.length;i++){
    await sharp(p(SRC,products[i])).sharpen({sigma:0.6}).webp({quality:96, effort:6}).toFile(p(OUT,'product',productNames[i]));
  }

  // ---------- MODEL crops (remove baked-in text zones), wider where safe + sharpened upscale ----------
  const crops = [
    {file:'info.png',  out:'athlete-black-gym.webp',   left:235, top:0,  width:350, height:655, outW:760},
    {file:'info2.png', out:'athlete-merlot-gym.webp',  left:233, top:0,  width:349, height:647, outW:760},
    {file:'info3.png', out:'athlete-white-gym.webp',   left:235, top:0,  width:347, height:647, outW:700},
    {file:'info4.png', out:'athlete-black-outdoor.webp', left:340, top:0, width:277, height:782, outW:700},
    {file:'info5.png', out:'athlete-white-walk.webp', left:270, top:35, width:242, height:615, outW:700},
  ];
  for (const c of crops){
    const img = sharp(p(SRC,c.file)).extract({left:c.left, top:c.top, width:c.width, height:c.height});
    await img.clone().resize({width: c.outW, kernel:'lanczos3'}).sharpen({sigma:1.1, m1:0.8, m2:0.4}).webp({quality:94, effort:6}).toFile(p(OUT,'model', c.out));
    await img.clone().resize({width: Math.min(c.outW, 700), kernel:'lanczos3'}).sharpen({sigma:1.1, m1:0.8, m2:0.4}).png().toFile(p(PROC,'preview', c.out.replace('.webp','.png')));
  }

  // ---------- Detail crops (fabric + chest logo close-up) for feature/editorial sections ----------
  const details = [
    {file:'camisa.png',  out:'detail-black.webp',  left:120, top:140, width:340, height:420},
    {file:'camisa2.png', out:'detail-white.webp',  left:120, top:140, width:340, height:420},
    {file:'camisa3.png', out:'detail-merlot.webp', left:120, top:140, width:340, height:420},
  ];
  for (const d of details){
    const img = sharp(p(SRC,d.file)).extract({left:d.left, top:d.top, width:d.width, height:d.height});
    await img.clone().resize({width: Math.round(d.width*1.8), kernel:'lanczos3'}).sharpen({sigma:0.9}).webp({quality:95, effort:6}).toFile(p(OUT,'product', d.out));
    await img.clone().resize({width: Math.min(Math.round(d.width*1.8),650), kernel:'lanczos3'}).sharpen({sigma:0.9}).png().toFile(p(PROC,'preview', d.out.replace('.webp','.png')));
  }

  console.log('DONE');
}

run().catch(e=>{console.error(e); process.exit(1);});
