// Keyboard + mouse state. Pointer lock when the browser allows it; otherwise
// the view turns with plain mouse movement and when the cursor nears an edge.

const MOVE_KEYS = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  jump: ['Space'],
  sprint: ['ShiftLeft', 'ShiftRight'],
};

export function createInput(canvas) {
  const down = new Set();
  const pressed = new Set();
  const state = {
    lookX: 0,
    lookY: 0,
    mouse: [false, false, false],
    clicked: [false, false, false],
    released: [false, false, false],
    wheel: 0,
    locked: false,
    freeLook: false,
    cursor: { x: 0.5, y: 0.5, inside: false },
    enabled: false,
  };
  const listeners = { lockChange: [] };

  window.addEventListener('keydown', (e) => {
    if (!state.enabled) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
    if (!down.has(e.code)) pressed.add(e.code);
    down.add(e.code);
  });
  window.addEventListener('keyup', (e) => down.delete(e.code));
  window.addEventListener('blur', () => {
    down.clear();
    state.mouse = [false, false, false];
  });

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('mousedown', (e) => {
    if (!state.enabled) return;
    state.mouse[e.button] = true;
    state.clicked[e.button] = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (state.mouse[e.button]) state.released[e.button] = true;
    state.mouse[e.button] = false;
  });
  window.addEventListener('mousemove', (e) => {
    if (!state.enabled) return;
    if (state.locked || state.freeLook) {
      // Some browsers report one huge jump when the lock engages; ignore it.
      if (Math.abs(e.movementX) < 300 && Math.abs(e.movementY) < 300) {
        state.lookX += e.movementX;
        state.lookY += e.movementY;
      }
    }
    const r = canvas.getBoundingClientRect();
    state.cursor.x = (e.clientX - r.left) / r.width;
    state.cursor.y = (e.clientY - r.top) / r.height;
  });
  canvas.addEventListener('mouseenter', () => (state.cursor.inside = true));
  canvas.addEventListener('mouseleave', () => (state.cursor.inside = false));
  canvas.addEventListener('wheel', (e) => {
    if (!state.enabled) return;
    e.preventDefault();
    state.wheel += Math.sign(e.deltaY);
  }, { passive: false });

  document.addEventListener('pointerlockchange', () => {
    state.locked = document.pointerLockElement === canvas;
    listeners.lockChange.forEach((f) => f(state.locked));
  });

  return {
    state,
    isDown: (code) => down.has(code),
    wasPressed: (code) => pressed.has(code),
    move(name) {
      return MOVE_KEYS[name].some((k) => down.has(k));
    },
    movePressed(name) {
      return MOVE_KEYS[name].some((k) => pressed.has(k));
    },
    onLockChange(f) {
      listeners.lockChange.push(f);
    },
    async lock() {
      try {
        const r = canvas.requestPointerLock({ unadjustedMovement: false });
        if (r && r.then) await r;
        state.freeLook = false;
        return true;
      } catch (err) {
        // Pointer lock refused (embedded frames, some browsers): fall back.
        state.freeLook = true;
        return false;
      }
    },
    unlock() {
      if (document.pointerLockElement) document.exitPointerLock();
    },
    // Forget held keys and buttons (opening a menu mid-stride).
    clear() {
      down.clear();
      state.mouse = [false, false, false];
    },
    // Called once per frame after everything has read this frame's input.
    endFrame(dt) {
      pressed.clear();
      state.clicked = [false, false, false];
      state.released = [false, false, false];
      state.lookX = 0;
      state.lookY = 0;
      state.wheel = 0;
    },
    // Edge turning for free-look mode.
    edgeTurn() {
      if (!state.freeLook || !state.cursor.inside) return 0;
      const x = state.cursor.x;
      if (x < 0.08) return -(0.08 - x) / 0.08;
      if (x > 0.92) return (x - 0.92) / 0.08;
      return 0;
    },
  };
}
