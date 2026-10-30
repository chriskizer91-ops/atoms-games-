import * as THREE from 'three';
import {
  plankTexture, barkTexture, ropeTexture, clothTexture, coconutTexture, barrelTexture,
} from './textures.js';

// Shared physically based materials, built once on first use.
let M = null;

export function materials() {
  if (M) return M;
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0, ...o });
  const planks = [0, 1, 2, 3].map((v) => {
    const t = plankTexture(v);
    return std({ map: t.map, bumpMap: t.bump, bumpScale: 1.4, roughness: 0.86 });
  });
  const bark = barkTexture();
  const rope = ropeTexture();
  const cloth = clothTexture();
  cloth.repeat.set(3, 3);
  const barrel = barrelTexture();
  M = {
    planks,
    chewed: planks.map((m) => {
      const c = m.clone();
      c.color.setRGB(0.62, 0.52, 0.44);
      return c;
    }),
    bark: std({ map: bark.map, bumpMap: bark.bump, bumpScale: 2.5, roughness: 0.92, vertexColors: true }),
    rope: std({ map: rope, roughness: 0.95 }),
    cloth: std({ map: cloth, color: 0xa89878, roughness: 0.97 }),
    clothDark: std({ map: cloth, color: 0x7d6f55, roughness: 0.97 }),
    skin: std({ color: 0xb07452, roughness: 0.68 }),
    metal: std({ color: 0xaab2b8, metalness: 0.85, roughness: 0.32 }),
    darkMetal: std({ color: 0x3b4044, metalness: 0.7, roughness: 0.5 }),
    stone: std({ color: 0x77797a, roughness: 0.85, flatShading: true }),
    handle: std({ map: planks[2].map, bumpMap: planks[2].bumpMap, bumpScale: 1, color: 0xd9c2a0, roughness: 0.7 }),
    barrel: std({ map: barrel, roughness: 0.8 }),
    coconut: std({ map: coconutTexture(), roughness: 0.95 }),
    leaf: std({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.65 }),
    stem: std({ color: 0x8a6d3e, roughness: 0.8 }),
    plastic: [
      std({ color: 0x8fd0ea, roughness: 0.18, transparent: true, opacity: 0.72 }),
      std({ color: 0x9bd8b8, roughness: 0.18, transparent: true, opacity: 0.72 }),
      std({ color: 0xe8eef0, roughness: 0.3 }),
    ],
    plasticSolid: [std({ color: 0xe7b93c, roughness: 0.45 }), std({ color: 0x3f8f6d, roughness: 0.45 }), std({ color: 0xd3553f, roughness: 0.45 })],
    caps: [std({ color: 0x2f6fb0, roughness: 0.4 }), std({ color: 0xe1503e, roughness: 0.4 }), std({ color: 0xf2f2f2, roughness: 0.4 })],
    float: std({ color: 0xf06a2a, roughness: 0.45 }),
    floatBand: std({ color: 0xf4efe4, roughness: 0.5 }),
  };
  return M;
}
