export type Box = { x: number; y: number; w: number; h: number; kind: 'wall' | 'crate' | 'rack' };
// World units are tiles. Art, collision and test routes share this single definition.
export const LEVEL = {
  id: 'quiet-pickup-v1', width: 12, height: 20,
  spawn: { x: 2.2, y: 17.6 }, phone: { x: 8.9, y: 5.8 },
  exit: { x: 8.3, y: 1.25, w: 2.3, h: 1.6 }, targetSeconds: 60, hardLimitSeconds: 120,
  blockers: [
    { x: 0, y: 0, w: 12, h: .7, kind: 'wall' },
    { x: 0, y: 19.3, w: 12, h: .7, kind: 'wall' },
    { x: 0, y: 0, w: .7, h: 20, kind: 'wall' },
    { x: 11.3, y: 0, w: .7, h: 20, kind: 'wall' },
    { x: 1.3, y: 2.2, w: 2.4, h: 2.0, kind: 'rack' },
    { x: 4.8, y: 3.7, w: 1.5, h: 3.3, kind: 'rack' },
    { x: 1.5, y: 7.2, w: 2.4, h: 2, kind: 'crate' },
    { x: 7.1, y: 8.4, w: 2.6, h: 1.8, kind: 'crate' },
    { x: 4.5, y: 11.0, w: 1.5, h: 3.0, kind: 'rack' },
    { x: 8.2, y: 13.1, w: 2.1, h: 2.3, kind: 'crate' },
    { x: 1.3, y: 12.6, w: 1.7, h: 2.0, kind: 'crate' },
    { x: 5.0, y: 16.2, w: 2.4, h: 1.5, kind: 'crate' },
  ] as Box[],
};
export const TUNING = {
  step: 1 / 30, radius: .26, walkSpeed: 3.2, carrySpeed: 2.6,
  acceleration: 30, friction: 38, dashSpeed: 8, dashDuration: .2,
  dashCooldown: 2, dashCost: 20, pickupRadius: 1.15, pickupHold: .4, extractHold: 1,
};
