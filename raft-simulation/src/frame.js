// The scene is the raft's own frame. The raft sits at the origin with its bow
// toward -z, and everything else (the sea, the islands, the sun and clouds)
// slides and turns past it as the raft travels and steers. That keeps every
// raft-side sum (tiles, tools, the player's feet) simple and exact.
//
// "World" below means the chart: fixed north, the raft at (x, z) on it.
//   scene = Rot(rot) * (world - raft)
// rot is 0 while the bow points north (-z on the chart).

export const FRAME = { x: 0, z: 0, rot: 0, c: 1, s: 0 };

export function setFrame(x, z, rot) {
  FRAME.x = x;
  FRAME.z = z;
  FRAME.rot = rot;
  FRAME.c = Math.cos(rot);
  FRAME.s = Math.sin(rot);
}

const tmp = { x: 0, z: 0 };

// Chart point -> scene point.
export function toScene(wx, wz, out = tmp) {
  const dx = wx - FRAME.x, dz = wz - FRAME.z;
  out.x = dx * FRAME.c - dz * FRAME.s;
  out.z = dx * FRAME.s + dz * FRAME.c;
  return out;
}

// Scene point -> chart point.
export function toWorld(sx, sz, out = tmp) {
  out.x = FRAME.x + sx * FRAME.c + sz * FRAME.s;
  out.z = FRAME.z - sx * FRAME.s + sz * FRAME.c;
  return out;
}

// Directions turn without sliding.
export function dirToScene(wx, wz, out = tmp) {
  out.x = wx * FRAME.c - wz * FRAME.s;
  out.z = wx * FRAME.s + wz * FRAME.c;
  return out;
}

// What a turn of the scene looks like to three.js (rotation.y of anything
// that belongs to the world: an island, the sky dome, the environment map).
export const frameYaw = () => -FRAME.rot;
