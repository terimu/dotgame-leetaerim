const fs=require('fs');
exports.read=f=>fs.readFileSync(f,'utf8');
exports.blocks=t=>{const r=[];const re=/^([^\n]*)\n```\n([\s\S]*?)\n```/gm;let m;while((m=re.exec(t)))r.push({label:m[1].trim(),lines:m[2].split('\n')});return r;};
exports.palette=t=>{const p={};for(const m of t.matchAll(/^\| (\d) \| `([^`]*)` \| ([^|]*) \|/gm))p[m[1]]={hex:m[2],name:m[3].trim()};return p;};
