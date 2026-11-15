// The castaway woman: the Pie seller from Moon Faire, refitted for the raft.
// Same face, headscarf and sturdy build; the ankle-length skirt and apron
// (which dragged when she swam) give way to a belted tunic over breeches
// rolled below the knee, bare forearms and feet bound in canvas.
export default {
  id: 'castaway-woman',
  name: 'Castaway',
  base: 'pie-seller',
  person() {
    const PERSON = {
      name: 'Castaway',
      height: 0.94, build: [1.08, 1.06], head: [1.04, 0.97, 1],
      skin: '#8a5a44',
      colors: { torso: '#3e6d73', sleeve: '#3e6d73', forearm: 'skin', legs: '#6b5a48', boots: { color: '#b9a888', rough: 1 }, soles: '#6e5740' },
      parts: {
        tunic: { color: '#3e6d73', rough: 0.95 },
        sash: { color: '#c0603a', rough: 0.9 },
        rope: { color: '#b89a62', rough: 1 },
        pouch: { color: '#7a5a3a', rough: 0.7 },
        cuff: { color: '#5a4b3c', rough: 1 },
        hair: '#3a2c26',
        kerchief: { color: '#d9b25a', pattern: { kind: 'dots', color: '#f0deb0', n: 6 } },
      },
      face(F) { F.lips('#8a5548', 0.7); F.brows('#2c211c', 0.85, 17); F.eyes('#4a3524', 0.6); F.lines(0.35); },
      make(K) {
        // the top of her tunic is the close-fitting body itself; below the sash its skirt flares to mid-thigh
        K.shell('tunic', [[1.06, 0.122, 0.098, 0.094], [1.00, 0.148, 0.118, 0.122], [0.92, 0.172, 0.138, 0.146], [0.82, 0.190, 0.154, 0.164], [0.74, 0.200, 0.164, 0.174], [0.70, 0.204, 0.168, 0.178]], K.w.skirt, { n: 28 });
        // short sleeves rolled above the elbow
        K.tube('tunic', [[0.203, 1.10, -0.008], [0.209, 1.078, -0.008], [0.215, 1.056, -0.008]], [0.056, 0.061, 0.056], K.w.bone('uarmL'));
        K.tube('tunic', [[-0.203, 1.10, -0.008], [-0.209, 1.078, -0.008], [-0.215, 1.056, -0.008]], [0.056, 0.061, 0.056], K.w.bone('uarmR'));
        // a wide sash wound twice round the waist, knotted at her right hip with two short ends
        K.shell('sash', [[1.095, 0.132, 0.110, 0.106], [1.06, 0.134, 0.112, 0.108], [1.02, 0.152, 0.126, 0.128]], K.w.torso, { n: 28 });
        K.ball('sash', [-0.128, 1.045, 0.070], [0.030, 0.028, 0.026], K.w.torso);
        K.tube('sash', [[-0.134, 1.03, 0.078], [-0.150, 0.95, 0.092], [-0.158, 0.87, 0.096]], [0.016, 0.018, 0.022], K.w.hips);
        K.tube('sash', [[-0.126, 1.03, 0.086], [-0.128, 0.96, 0.110], [-0.126, 0.90, 0.118]], [0.014, 0.016, 0.019], K.w.hips);
        // a pouch on a cord at her left hip
        K.ball('pouch', [0.178, 0.93, 0.06], [0.036, 0.048, 0.030], K.w.hips);
        K.tube('rope', [[0.150, 1.03, 0.072], [0.172, 0.99, 0.066], [0.178, 0.965, 0.06]], [0.006, 0.006, 0.006], K.w.hips);
        // breeches rolled below the knee
        K.tube('cuff', [[0.085, 0.40, 0.0], [0.085, 0.375, 0.0], [0.085, 0.35, 0.0]], [0.052, 0.057, 0.052], K.w.bone('shinL'));
        K.tube('cuff', [[-0.085, 0.40, 0.0], [-0.085, 0.375, 0.0], [-0.085, 0.35, 0.0]], [0.052, 0.057, 0.052], K.w.bone('shinR'));
        // dark hair close to the head, with a bun at the back
        K.panel('hair', [[1.640, 0.030, 0.040, 0.040, 0, -0.010], [1.615, 0.066, 0.078, 0.082], [1.560, 0.079, 0.092, 0.096], [1.500, 0.078, 0.086, 0.094], [1.450, 0.066, 0.070, 0.086]], 62, 298, K.w.head, { n: 22 });
        K.ball('hair', [0, 1.505, -0.105], [0.046, 0.044, 0.040], K.w.head);
        // a headscarf over the top of the head, tied under the bun
        K.panel('kerchief', [[1.662, 0.012, 0.014, 0.014, 0, 0.004], [1.648, 0.050, 0.060, 0.062], [1.615, 0.074, 0.092, 0.090], [1.575, 0.084, 0.103, 0.100], [1.545, 0.086, 0.100, 0.102]], -62, 242, K.w.head, { n: 26 });
        K.panel('kerchief', [[1.662, 0.012, 0.014, 0.014, 0, 0.004], [1.648, 0.050, 0.060, 0.062], [1.615, 0.074, 0.092, 0.090], [1.575, 0.084, 0.103, 0.100], [1.545, 0.086, 0.100, 0.102]], 238, 300, K.w.head, { n: 8 });
      },
    };
    return PERSON;
  },
};
