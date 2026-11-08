// usage: node split_glb.mjs in.glb outdir name  -> outdir/name_geo.glb + texture files + name.json manifest
import fs from 'fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const [inPath, outDir, name] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inPath);
const root = doc.getRoot();
const man = { name, textures: {} };
for (const mat of root.listMaterials()) {
  for (const [slot, g, s] of [['map', 'getBaseColorTexture', 'setBaseColorTexture'], ['normalMap', 'getNormalTexture', 'setNormalTexture'], ['emissiveMap', 'getEmissiveTexture', 'setEmissiveTexture']]) {
    const t = mat[g](); if (!t) continue;
    const ext = t.getMimeType() === 'image/png' ? 'png' : 'jpg';
    const f = `${name}_${slot}.${ext}`;
    if (!man.textures[slot]) { fs.writeFileSync(`${outDir}/${f}`, Buffer.from(t.getImage())); man.textures[slot] = f; }
    mat[s](null);
  }
}
for (const t of root.listTextures()) t.dispose();
if (process.argv[5] !== "keep-anims") for (const a of root.listAnimations()) a.dispose();
await io.write(`${outDir}/${name}_geo.glb`, doc);
fs.writeFileSync(`${outDir}/${name}.manifest.json`, JSON.stringify(man));
console.log(name, JSON.stringify(man.textures));
