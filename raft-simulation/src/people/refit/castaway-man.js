// The castaway man: the Farm lad from Moon Faire, refitted for the raft.
// Same face, hat and build; the fair-day waistcoat and buttons give way to a
// sailcloth vest laced with cord, a rope belt with a sheath knife, trousers
// cut off at the shin and feet bound in canvas.
export default {
  id: 'castaway-man',
  name: 'Castaway',
  base: 'farm-lad',           // whose face, skin colour and proportions he keeps
  person() {
    const PERSON = {
      name: 'Castaway',
      height: 0.98,
      build: [1.03, 1.0],
      skin: '#d3a17f',
      colors: {
        torso: '#d8c9a3', sleeve: '#d8c9a3', forearm: 'skin', legs: '#5d6f73',
        boots: { color: '#b9a888', rough: 1 },
        soles: '#6e5740',
      },
      parts: {
        shirt: { color: '#d8c9a3', rough: 0.9 },
        vest: { color: '#8a6f4a', rough: 0.95 },
        kerchief: { color: '#a8452f', rough: 0.85 },
        rope: { color: '#b89a62', rough: 1 },
        sheath: { color: '#5a3a24', rough: 0.6 },
        hair: '#c9a66b',
        straw: { color: '#dcbc68', rough: 0.95, pattern: { kind: 'hoops', color: '#b8953f', n: 10 } },
        band: { color: '#6b4a2e', rough: 0.8 },
        cuff: { color: '#4c5c60', rough: 1 },
      },
      face(F) {
        F.lips('#b88a78', 0.7); F.brows('#a8845a', 0.85, 19); F.eyes('#5d7a8a', 0.65);
        F.blush('#c8654f', 0.22); F.freckles(70, '#9a5a3a', 0.55);
      },
      make(K) {
        // a loose shirt, its tail out over the hips
        K.shell('shirt', [[1.305, 0.147, 0.090, 0.098], [1.27, 0.147, 0.124, 0.102], [1.225, 0.148, 0.146, 0.104], [1.16, 0.148, 0.146, 0.104], [1.06, 0.150, 0.140, 0.106], [0.95, 0.162, 0.136, 0.118], [0.87, 0.176, 0.134, 0.129], [0.80, 0.181, 0.135, 0.133]], K.w.torso, { n: 28 });
        // a short open vest cut from sailcloth, ending at the waist
        K.panel('vest', [[1.345, 0.086, 0.070, 0.076], [1.335, 0.135, 0.090, 0.096], [1.31, 0.157, 0.102, 0.108], [1.27, 0.157, 0.135, 0.112], [1.225, 0.158, 0.157, 0.114], [1.16, 0.158, 0.157, 0.114], [1.08, 0.160, 0.152, 0.116], [1.03, 0.161, 0.150, 0.117]], 24, 336, K.w.torso, { n: 28 });
        // a rope belt, two turns, knotted at his left hip with a short end hanging
        K.shell('rope', [[1.012, 0.163, 0.151, 0.119], [0.992, 0.166, 0.152, 0.121], [0.972, 0.168, 0.151, 0.123]], K.w.torso, { n: 28 });
        K.ball('rope', [0.150, 0.985, 0.075], [0.024, 0.022, 0.022], K.w.torso);
        K.tube('rope', [[0.156, 0.975, 0.082], [0.166, 0.92, 0.088], [0.170, 0.86, 0.086]], [0.011, 0.010, 0.012], K.w.torso);
        // a sheath knife on the right hip
        K.tube('sheath', [[-0.168, 0.985, 0.045], [-0.176, 0.90, 0.05], [-0.178, 0.82, 0.05]], [0.022, 0.02, 0.012], K.w.hips);
        K.ball('sheath', [-0.166, 1.02, 0.045], [0.016, 0.03, 0.014], K.w.hips);
        // the kerchief at his throat
        K.shell('kerchief', [[1.39, 0.058, 0.058, 0.058], [1.36, 0.067, 0.067, 0.064], [1.335, 0.076, 0.074, 0.068]], K.w.torso, { n: 20 });
        K.ball('kerchief', [0, 1.338, 0.080], [0.017, 0.014, 0.014], K.w.torso);
        K.tube('kerchief', [[0.004, 1.335, 0.086], [0.010, 1.305, 0.104], [0.016, 1.272, 0.134]], [0.010, 0.009, 0.006], K.w.torso);
        // sleeves rolled above the elbow
        K.tube('shirt', [[0.203, 1.10, -0.008], [0.209, 1.078, -0.008], [0.215, 1.056, -0.008]], [0.056, 0.061, 0.056], K.w.bone('uarmL'));
        K.tube('shirt', [[-0.203, 1.10, -0.008], [-0.209, 1.078, -0.008], [-0.215, 1.056, -0.008]], [0.056, 0.061, 0.056], K.w.bone('uarmR'));
        // trousers cut off at the shin: a ragged turn-up on each leg
        K.tube('cuff', [[0.085, 0.335, 0.0], [0.085, 0.31, 0.0], [0.085, 0.285, 0.0]], [0.050, 0.054, 0.050], K.w.bone('shinL'));
        K.tube('cuff', [[-0.085, 0.335, 0.0], [-0.085, 0.31, 0.0], [-0.085, 0.285, 0.0]], [0.050, 0.054, 0.050], K.w.bone('shinR'));
        // sandy hair and the straw hat
        K.panel('hair', [[1.615, 0.080, 0.094, 0.094], [1.56, 0.081, 0.094, 0.097], [1.51, 0.078, 0.088, 0.094], [1.475, 0.068, 0.074, 0.086]], 66, 294, K.w.head, { n: 22 });
        K.shell('straw', [[1.705, 0.066, 0.078, 0.078], [1.692, 0.082, 0.096, 0.095], [1.65, 0.090, 0.106, 0.104], [1.604, 0.092, 0.110, 0.108]], K.w.head, { n: 26, capFirst: true });
        K.shell('straw', [[1.604, 0.090, 0.108, 0.106], [1.600, 0.140, 0.154, 0.156, 0, -0.006], [1.604, 0.185, 0.194, 0.200, 0, -0.012], [1.618, 0.220, 0.224, 0.234, 0, -0.016]], K.w.head, { n: 32 });
        K.shell('band', [[1.636, 0.099, 0.116, 0.114], [1.610, 0.101, 0.119, 0.117]], K.w.head, { n: 26 });
      },
    };
    return PERSON;
  },
};
