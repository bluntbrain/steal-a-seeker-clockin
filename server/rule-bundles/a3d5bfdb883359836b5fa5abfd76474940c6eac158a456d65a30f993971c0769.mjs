// server/replay.ts
import { z } from "zod";

// src/game/level.ts
var PATROLS = [
  [{ x: 3.7, y: 10.5 }, { x: 6.6, y: 10.5 }, { x: 6.6, y: 7.6 }, { x: 4.3, y: 7.6 }, { x: 4.3, y: 10.5 }],
  [{ x: 7.3, y: 4.2 }, { x: 10.5, y: 4.2 }, { x: 10.5, y: 7.1 }, { x: 7.3, y: 7.1 }]
];
var SECURITY = { alarmBaseSpeed: 1.4, alarmMaxSpeed: 1.8, alarmRampSeconds: 30, decoySeconds: 6, decoyHearing: 9, decoyRange: 4.4 };
function alarmSpeed(seconds) {
  "worklet";
  return seconds < 0 ? 1 : SECURITY.alarmBaseSpeed + (SECURITY.alarmMaxSpeed - SECURITY.alarmBaseSpeed) * Math.min(1, seconds / SECURITY.alarmRampSeconds);
}
var GUARD_TUNING = { speed: 1.05, range: 3.7, halfAngle: Math.PI / 5, spotSeconds: 0.8, forgetSeconds: 0.55, pauseSeconds: 0.7 };
var original = {
  id: "quiet-pickup-v1",
  width: 12,
  height: 20,
  spawn: { x: 2.2, y: 17.6 },
  phone: { x: 8.9, y: 5.8 },
  exit: { x: 8.3, y: 1.25, w: 2.3, h: 1.6 },
  targetSeconds: 60,
  hardLimitSeconds: 120,
  blockers: [
    { x: 0, y: 0, w: 12, h: 0.7, kind: "wall" },
    { x: 0, y: 19.3, w: 12, h: 0.7, kind: "wall" },
    { x: 0, y: 0, w: 0.7, h: 20, kind: "wall" },
    { x: 11.3, y: 0, w: 0.7, h: 20, kind: "wall" },
    { x: 1.3, y: 2.2, w: 2.4, h: 2, kind: "rack" },
    { x: 4.8, y: 3.7, w: 1.5, h: 3.3, kind: "rack" },
    { x: 1.5, y: 7.2, w: 2.4, h: 2, kind: "crate" },
    { x: 7.1, y: 8.4, w: 2.6, h: 1.8, kind: "crate" },
    { x: 4.5, y: 11, w: 1.5, h: 3, kind: "rack" },
    { x: 8.2, y: 13.1, w: 2.1, h: 2.3, kind: "crate" },
    { x: 1.3, y: 12.6, w: 1.7, h: 2, kind: "crate" },
    { x: 5, y: 16.2, w: 2.4, h: 1.5, kind: "crate" }
  ]
};
var TUNING = {
  step: 1 / 30,
  radius: 0.26,
  walkSpeed: 3.2,
  carrySpeed: 2.6,
  acceleration: 30,
  friction: 38,
  dashSpeed: 8,
  dashDuration: 0.2,
  dashCooldown: 2,
  dashCost: 20,
  pickupRadius: 1.15,
  pickupHold: 0.4,
  extractHold: 1
};
var boundary = original.blockers.filter((b) => b.kind === "wall");
var crate = (x, y, w, h) => ({ x, y, w, h, kind: "crate" });
var rack = (x, y, w, h) => ({ x, y, w, h, kind: "rack" });
var patrol = (route, speed = 1.05, range = 3.7) => ({ route, speed, range, halfAngle: Math.PI / 5, spotSeconds: 0.8, pauseSeconds: 0.7 });
var LEVELS = {
  practice: { ...original, mission: "practice", title: "Quiet Pickup", number: 1, briefing: "Find the phone, stop and hold TAKE. Carry it to the mint exit. One guard watches the pickup lane. Taking the phone raises the alarm. Use a decoy, then dash to the exit.", patrols: [{ ...patrol([{ x: 7, y: 7.5 }, { x: 10.5, y: 7.5 }], 0.75, 2.8), spotSeconds: 1.1 }], floorColor: "#263938" },
  "cone-lesson": {
    id: "cone-lesson-v1",
    mission: "cone-lesson",
    title: "Cone Lesson",
    number: 2,
    width: 12,
    height: 20,
    spawn: { x: 2, y: 17.6 },
    phone: { x: 9.3, y: 4.1 },
    exit: { x: 1.2, y: 1.2, w: 2.5, h: 1.8 },
    targetSeconds: 90,
    hardLimitSeconds: 180,
    briefing: "Two robots cover the central rack and the lower lane. Its amber cone stops at cover. Wait for it to turn, then cross the open lane.",
    floorColor: "#2d3c42",
    blockers: [...boundary, rack(4.5, 7.8, 2.8, 4.4), crate(1.6, 12.5, 1.8, 2), crate(8.4, 13.7, 2, 2.3), crate(8.3, 6.6, 2.1, 1.3), rack(4.8, 2.7, 1.6, 2.7)],
    patrols: [patrol([{ x: 3.7, y: 12.9 }, { x: 7.9, y: 12.9 }, { x: 7.9, y: 8.5 }, { x: 7.9, y: 6 }, { x: 3.7, y: 6 }], 0.95, 3.4)]
  },
  "battery-dash": {
    id: "battery-dash-v1",
    mission: "battery-dash",
    title: "Battery Dash",
    number: 3,
    width: 12,
    height: 20,
    spawn: { x: 2, y: 17.7 },
    phone: { x: 9.4, y: 3.1 },
    exit: { x: 8.1, y: 16.8, w: 2.5, h: 1.8 },
    targetSeconds: 120,
    hardLimitSeconds: 240,
    briefing: "Bring the phone back down the east lane. Dash across the exposed stretch, or take the longer route behind the racks. Empty charge still lets you walk.",
    floorColor: "#344039",
    blockers: [...boundary, rack(4.5, 3, 1.8, 3.8), rack(4.5, 8.7, 1.8, 4), rack(4.5, 14.7, 1.8, 2.9), crate(1.3, 7.3, 1.8, 2.2), crate(1.3, 12, 1.8, 2.2), crate(8.6, 5.6, 1.8, 1.8), crate(8.6, 12.6, 1.8, 1.8)],
    patrols: [patrol([{ x: 7.3, y: 8.4 }, { x: 10.6, y: 8.4 }, { x: 10.6, y: 11.4 }, { x: 7.3, y: 11.4 }], 1.15, 3.8)]
  },
  "crossing-signals": {
    id: "crossing-signals-v1",
    mission: "crossing-signals",
    title: "Crossing Signals",
    number: 4,
    width: 12,
    height: 20,
    spawn: { x: 2, y: 17.7 },
    phone: { x: 9.5, y: 3 },
    exit: { x: 1.25, y: 1.1, w: 2.4, h: 1.8 },
    targetSeconds: 150,
    hardLimitSeconds: 300,
    briefing: "Two patrols cover different crossings. The central crates make a waiting pocket. Cross one lane at a time; rushing both is harder.",
    floorColor: "#29384c",
    blockers: [...boundary, crate(1.6, 13.9, 2.3, 1.5), crate(8.1, 14.1, 2.3, 1.4), rack(4.8, 10.2, 2.4, 2.7), crate(4.8, 6.4, 2.4, 1.8), rack(1.5, 4.6, 1.6, 3.2), rack(8.7, 5.5, 1.6, 2.4)],
    patrols: [patrol([{ x: 1.1, y: 13.4 }, { x: 10.9, y: 13.4 }, { x: 10.9, y: 16.1 }, { x: 1.1, y: 16.1 }], 1.1, 3.3), patrol([{ x: 3.8, y: 4 }, { x: 10.5, y: 4 }, { x: 10.5, y: 2 }, { x: 3.8, y: 2 }], 1, 3.3)]
  },
  "sweep-window": {
    id: "sweep-window-v1",
    mission: "sweep-window",
    title: "Sweep Window",
    number: 5,
    width: 12,
    height: 20,
    spawn: { x: 2, y: 17.5 },
    phone: { x: 9.4, y: 2.5 },
    exit: { x: 1.2, y: 1.15, w: 2.5, h: 1.8 },
    targetSeconds: 150,
    hardLimitSeconds: 300,
    briefing: "The tower scanner sweeps across the roof. Wait behind a shelter, then move while its beam turns away. The beam cannot see through cover.",
    floorColor: "#26394b",
    blockers: [...boundary, crate(1.5, 13.4, 2.1, 1.5), crate(5.2, 14.8, 2.2, 1.6), rack(4.6, 9.1, 1.5, 2.5), crate(8.6, 10.8, 1.9, 1.5), crate(7.8, 5.9, 2.6, 1.5), rack(3.5, 3.8, 1.5, 2.5)],
    patrols: [{ ...patrol([{ x: 6.6, y: 6.4 }, { x: 6.6, y: 6.4 }], 0, 7.5), kind: "scanner", halfAngle: Math.PI / 13, spotSeconds: 1.1, sweep: { angle: Math.PI / 2, amplitude: 1.25, period: 8 } }]
  },
  "narrow-crossing": {
    id: "narrow-crossing-v1",
    mission: "narrow-crossing",
    title: "Narrow Crossing",
    number: 6,
    width: 12,
    height: 20,
    spawn: { x: 2, y: 17.5 },
    phone: { x: 9.4, y: 2.5 },
    exit: { x: 8.2, y: 16.8, w: 2.5, h: 1.8 },
    targetSeconds: 180,
    hardLimitSeconds: 360,
    briefing: "Two gates alternate across the middle of the roof. Mint means open; amber means wait. The gates wait for you to clear the doorway before closing.",
    floorColor: "#263b40",
    blockers: [...boundary, rack(0.7, 9.4, 1.1, 1.2), rack(4, 9.4, 4, 1.2), rack(10.2, 9.4, 1.1, 1.2), crate(4.5, 13.8, 2.8, 2), crate(4.4, 5, 2.4, 2.3), crate(1.3, 4.4, 1.6, 2.2)],
    gates: [{ box: { x: 1.8, y: 9.4, w: 2.2, h: 1.2, kind: "wall" }, period: 8, openSeconds: 3.8, phase: 0 }, { box: { x: 8, y: 9.4, w: 2.2, h: 1.2, kind: "wall" }, period: 8, openSeconds: 3.8, phase: 4 }],
    patrols: [patrol([{ x: 7.4, y: 7.5 }, { x: 10.6, y: 7.5 }, { x: 10.6, y: 4 }, { x: 7.4, y: 4 }], 0.85, 3)]
  },
  "false-footsteps": {
    id: "false-footsteps-v1",
    mission: "false-footsteps",
    title: "False Footsteps",
    number: 7,
    width: 12,
    height: 20,
    spawn: { x: 2, y: 17.5 },
    phone: { x: 9.5, y: 3 },
    exit: { x: 1.2, y: 1.1, w: 2.5, h: 1.8 },
    targetSeconds: 180,
    hardLimitSeconds: 360,
    decoys: 2,
    briefing: "Throw a decoy in the direction you face. Nearby robots investigate the sound, search there, then return. Use the opening or take the long route behind cover.",
    floorColor: "#283c48",
    blockers: [...boundary, rack(4.3, 12.8, 2, 3.7), crate(7.8, 13.4, 2.5, 1.6), rack(4.3, 7.2, 2, 3.4), crate(8.1, 6.1, 2.2, 1.7), crate(1.4, 5.4, 2, 2.3), rack(4.3, 2.8, 1.7, 2.5)],
    patrols: [{ ...patrol([{ x: 7.2, y: 12 }, { x: 10.6, y: 12 }, { x: 10.6, y: 9 }, { x: 7.2, y: 9 }], 1.1, 4), investigates: true, hearing: 6.5 }]
  },
  "warden-gate": {
    id: "warden-gate-v1",
    mission: "warden-gate",
    title: "Warden Gate",
    number: 8,
    width: 12,
    height: 20,
    spawn: { x: 2, y: 17.5 },
    phone: { x: 9.3, y: 4.4 },
    exit: { x: 1.2, y: 1.1, w: 2.5, h: 1.8 },
    targetSeconds: 210,
    hardLimitSeconds: 420,
    decoys: 2,
    briefing: "The Warden is slow, with a longer view. Lure it away from the exit. A dash also makes noise, so save it for the escape.",
    floorColor: "#343944",
    blockers: [...boundary, crate(1.4, 12.9, 2.2, 2), rack(5.1, 12.6, 1.7, 3.5), crate(8.3, 10.1, 2.1, 2), rack(4.7, 6.2, 1.8, 3), crate(7.7, 6.2, 2.7, 1.5), rack(4.8, 2, 1.4, 1.9)],
    patrols: [{ ...patrol([{ x: 3.8, y: 4.5 }, { x: 7, y: 4.5 }, { x: 7, y: 1.2 }, { x: 3.8, y: 1.2 }], 0.65, 4.7), kind: "warden", spotSeconds: 1.1, investigates: true, hearing: 8 }]
  },
  "power-trade": {
    id: "power-trade-v1",
    mission: "power-trade",
    title: "Power Trade",
    number: 9,
    width: 12,
    height: 20,
    spawn: { x: 2, y: 17.5 },
    phone: { x: 9.3, y: 2.4 },
    exit: { x: 1.2, y: 16.8, w: 2.5, h: 1.8 },
    targetSeconds: 180,
    hardLimitSeconds: 360,
    briefing: "Power A opens the west door. Power B opens the east door and turns on its scanner. Stop on a switch and press ACT to change circuits. There is a switch on each side.",
    floorColor: "#333d40",
    blockers: [...boundary, rack(0.7, 9.4, 1.1, 1.2), rack(4.2, 9.4, 3.8, 1.2), rack(10.2, 9.4, 1.1, 1.2), crate(4.8, 14.6, 2.4, 1.6), rack(4.5, 3.8, 1.5, 3.8), crate(8.2, 4.8, 2.1, 1.5), crate(1.3, 6.4, 1.7, 1.6)],
    gates: [{ box: { x: 1.8, y: 9.4, w: 2.4, h: 1.2, kind: "wall" }, period: 1, openSeconds: 0, phase: 0, mode: "power", power: 0 }, { box: { x: 8, y: 9.4, w: 2.2, h: 1.2, kind: "wall" }, period: 1, openSeconds: 0, phase: 0, mode: "power", power: 1 }],
    switches: [{ x: 8.8, y: 12.3, kind: "power" }, { x: 8.8, y: 7.5, kind: "power" }],
    patrols: [{ ...patrol([{ x: 6.9, y: 5.6 }, { x: 6.9, y: 5.6 }], 0, 6.8), kind: "scanner", activePower: 1, halfAngle: Math.PI / 14, spotSeconds: 1.1, sweep: { angle: 0, amplitude: 1.3, period: 8 } }]
  },
  "two-targets": {
    id: "two-targets-v1",
    mission: "two-targets",
    title: "Two Targets",
    number: 10,
    width: 12,
    height: 20,
    spawn: { x: 2, y: 17.5 },
    phone: { x: 2.2, y: 2.5 },
    targets: [{ x: 2.2, y: 2.5 }, { x: 9.5, y: 3 }],
    exit: { x: 7.2, y: 16.8, w: 2.5, h: 1.8 },
    targetSeconds: 240,
    hardLimitSeconds: 480,
    decoys: 2,
    briefing: "Recover two phones, one at a time. Deliver the first before collecting the second. The alarm starts on the first pickup and stays on between deliveries. Each phone has its own charge.",
    floorColor: "#30374a",
    blockers: [...boundary, rack(4.7, 9.2, 2, 4.1), crate(1.4, 12.1, 1.8, 2), crate(8.5, 11.8, 1.9, 2), rack(4.5, 2.3, 1.6, 2.5), crate(1.5, 6.5, 1.8, 1.7), crate(8.6, 6.8, 1.8, 1.7)],
    patrols: [{ ...patrol([{ x: 3.8, y: 7.8 }, { x: 7.9, y: 7.8 }, { x: 7.9, y: 5.6 }, { x: 3.8, y: 5.6 }], 0.95, 3.6), investigates: true, alertAfterDelivery: true }]
  },
  "silent-circuit": {
    id: "silent-circuit-v1",
    mission: "silent-circuit",
    title: "Silent Circuit",
    number: 11,
    width: 12,
    height: 20,
    spawn: { x: 2, y: 17.5 },
    phone: { x: 9.3, y: 2.3 },
    exit: { x: 1.2, y: 16.8, w: 2.5, h: 1.8 },
    targetSeconds: 210,
    hardLimitSeconds: 420,
    decoys: 2,
    briefing: "Relay pads open their nearby door for nine seconds. Use the pads on both sides for the return trip. A clean run is optional: use a decoy if the investigating patrol blocks your crossing.",
    floorColor: "#293e43",
    blockers: [...boundary, rack(0.7, 11.8, 1.8, 1.1), rack(4.8, 11.8, 6.5, 1.1), rack(0.7, 6.6, 6.8, 1.1), rack(9.8, 6.6, 1.5, 1.1), crate(4.8, 8.3, 1.5, 1.5), crate(4.9, 2.9, 1.7, 2), crate(6.4, 15.2, 2.3, 1.6)],
    gates: [{ box: { x: 2.5, y: 11.8, w: 2.3, h: 1.1, kind: "wall" }, period: 1, openSeconds: 0, phase: 0, mode: "relay", relay: 0 }, { box: { x: 7.5, y: 6.6, w: 2.3, h: 1.1, kind: "wall" }, period: 1, openSeconds: 0, phase: 0, mode: "relay", relay: 1 }],
    switches: [{ x: 3.6, y: 14, kind: "relay", channel: 0, duration: 9 }, { x: 3.6, y: 10.1, kind: "relay", channel: 0, duration: 9 }, { x: 8.6, y: 8.5, kind: "relay", channel: 1, duration: 9 }, { x: 8.6, y: 4.9, kind: "relay", channel: 1, duration: 9 }],
    patrols: [{ ...patrol([{ x: 6.9, y: 10.5 }, { x: 10.6, y: 10.5 }, { x: 10.6, y: 8.5 }, { x: 6.9, y: 8.5 }], 0.85, 3), investigates: true }]
  },
  "last-vault": {
    id: "last-vault-v1",
    mission: "last-vault",
    title: "The Last Vault",
    number: 12,
    width: 12,
    height: 20,
    spawn: { x: 2, y: 17.5 },
    phone: { x: 9.5, y: 2.2 },
    targets: [{ x: 9.5, y: 2.2 }, { x: 2.6, y: 2.5 }],
    exit: { x: 8.2, y: 16.8, w: 2.5, h: 1.8 },
    targetSeconds: 240,
    hardLimitSeconds: 480,
    decoys: 2,
    briefing: "Two deliveries finish the job. Switch circuits to choose a crossing, watch the scanner, then use the relay to open the inner vault. The Warden hears decoys and dashes.",
    floorColor: "#363a40",
    blockers: [...boundary, rack(0.7, 11, 1.1, 1.1), rack(4.2, 11, 3.8, 1.1), rack(10.2, 11, 1.1, 1.1), rack(5.5, 0.7, 0.8, 6.5), rack(0.7, 5.8, 1.1, 1.1), rack(4.2, 5.8, 1.3, 1.1), crate(7.7, 6.8, 2.7, 1.4), crate(8.5, 3.9, 1.8, 1.5), crate(1.3, 15, 1.6, 1.5), crate(3.1, 15, 0.8, 3), crate(9.2, 13.6, 1.2, 1.3)],
    gates: [{ box: { x: 1.8, y: 11, w: 2.4, h: 1.1, kind: "wall" }, period: 1, openSeconds: 0, phase: 0, mode: "power", power: 0 }, { box: { x: 8, y: 11, w: 2.2, h: 1.1, kind: "wall" }, period: 1, openSeconds: 0, phase: 0, mode: "power", power: 1 }, { box: { x: 1.8, y: 5.8, w: 2.4, h: 1.1, kind: "wall" }, period: 1, openSeconds: 0, phase: 0, mode: "relay", relay: 0 }],
    switches: [{ x: 8.3, y: 14, kind: "power" }, { x: 8.9, y: 9.5, kind: "power" }, { x: 3, y: 8.3, kind: "relay", channel: 0, duration: 9 }, { x: 3, y: 4.5, kind: "relay", channel: 0, duration: 9 }],
    patrols: [{ ...patrol([{ x: 7, y: 5.6 }, { x: 7, y: 5.6 }], 0, 6), kind: "scanner", activePower: 1, halfAngle: Math.PI / 14, spotSeconds: 1.2, sweep: { angle: 0, amplitude: 1.4, period: 9 } }, { ...patrol([{ x: 4.5, y: 14 }, { x: 7.2, y: 14 }, { x: 7.2, y: 18 }, { x: 4.5, y: 18 }], 0.65, 3.8), kind: "warden", investigates: true, hearing: 7, alertAfterDelivery: true }]
  },
  "night-shift": { ...original, id: "legacy-night-shift-v1", mission: "night-shift", title: "Night Shift", number: 0, briefing: "Original two-patrol test room. This is a separate practice room, outside campaign progression.", patrols: PATROLS.map((route) => patrol(route)), floorColor: "#263938" }
};
var CAMPAIGN_IDS = ["practice", "cone-lesson", "battery-dash", "crossing-signals", "sweep-window", "narrow-crossing", "false-footsteps", "warden-gate", "power-trade", "two-targets", "silent-circuit", "last-vault"];
for (const id of CAMPAIGN_IDS) {
  const l = LEVELS[id];
  l.id = l.id + "-security-v2";
  l.decoys = l.number >= 9 ? 3 : 2;
  for (const guard of l.patrols) {
    if (guard.kind !== "scanner") {
      guard.investigates = true;
      guard.hearing = SECURITY.decoyHearing;
    }
    guard.alertAfterDelivery = false;
  }
  if (l.number >= 2) l.patrols.push({ ...patrol(l.number <= 5 ? [{ x: 10.85, y: 3 }, { x: 10.85, y: 17.5 }] : [{ x: 2, y: 18.6 }, { x: 10.6, y: 18.6 }], 0.95, 3.2), spotSeconds: 1, investigates: true, hearing: SECURITY.decoyHearing });
  if (l.number >= 6) l.patrols.push({ ...patrol(l.mission === "last-vault" ? [{ x: 7, y: 1.25 }, { x: 10.6, y: 1.25 }] : [{ x: 1.2, y: 1.25 }, { x: 10.6, y: 1.25 }], 0.85, 3), spotSeconds: 1, investigates: true, hearing: SECURITY.decoyHearing });
  l.briefing += " Alarm: guards move 40% faster as soon as you take a phone, rising to 80% faster after 30 seconds. Decoys beep for six seconds; mobile guards within nine tiles investigate.";
}
var MISSIONS = CAMPAIGN_IDS.map((id) => ({ id, title: LEVELS[id].title, label: `${String(LEVELS[id].number).padStart(2, "0")} \xB7 ${LEVELS[id].title}` }));
var LEVEL = LEVELS.practice;
function getLevel(id) {
  "worklet";
  return LEVELS[id];
}

// src/game/geometry.ts
function intersectsBox(x, y, b, radius = TUNING.radius) {
  "worklet";
  const cx = Math.max(b.x, Math.min(x, b.x + b.w)), cy = Math.max(b.y, Math.min(y, b.y + b.h));
  return (x - cx) * (x - cx) + (y - cy) * (y - cy) < radius * radius - 1e-8;
}
function blockedBy(x, y, boxes) {
  "worklet";
  for (let i = 0; i < boxes.length; i++) if (intersectsBox(x, y, boxes[i])) return true;
  return false;
}

// src/game/navigation.ts
var RADIUS = TUNING.radius;
function blocked(x, y, level) {
  "worklet";
  for (const b of level.blockers) if (intersectsBox(x, y, b, RADIUS)) return true;
  return false;
}
function walkableSegment(a, b, level) {
  "worklet";
  const steps = Math.max(1, Math.ceil(Math.hypot(a.x - b.x, a.y - b.y) / 0.08));
  for (let i = 0; i <= steps; i++) if (blocked(a.x + (b.x - a.x) * i / steps, a.y + (b.y - a.y) * i / steps, level)) return false;
  return true;
}
function findPath(from, to, level) {
  "worklet";
  if (walkableSegment(from, to, level)) return [{ ...to }];
  const width = Math.round(level.width * 2) + 1, height = Math.round(level.height * 2) + 1;
  const anchor = (point) => {
    const x = Math.round(point.x * 2), y = Math.round(point.y * 2);
    let best = -1, distance = Infinity;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy, p = { x: xx / 2, y: yy / 2 }, d = Math.hypot(p.x - point.x, p.y - point.y);
      if (xx < 0 || xx >= width || yy < 0 || yy >= height || d >= distance || !walkableSegment(point, p, level)) continue;
      best = yy * width + xx;
      distance = d;
    }
    return best;
  };
  const start = anchor(from), end = anchor(to);
  if (start < 0 || end < 0) return [];
  const previous = Array(width * height).fill(-1), queue = [start];
  previous[start] = start;
  for (let index = 0; index < queue.length && previous[end] === -1; index++) {
    const n = queue[index], x = n % width, y = Math.floor(n / width);
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const xx = x + dx, yy = y + dy, next = yy * width + xx;
      if (xx < 0 || xx >= width || yy < 0 || yy >= height || previous[next] !== -1) continue;
      if (!walkableSegment({ x: x / 2, y: y / 2 }, { x: xx / 2, y: yy / 2 }, level)) continue;
      previous[next] = n;
      queue.push(next);
    }
  }
  if (previous[end] === -1) return [];
  const raw = [{ ...to }];
  for (let n = end; ; n = previous[n]) {
    raw.unshift({ x: n % width / 2, y: Math.floor(n / width) / 2 });
    if (n === start) break;
  }
  const result = [];
  let last = from;
  for (let i = 0; i < raw.length; ) {
    let furthest = i;
    for (let j = i + 1; j < raw.length; j++) {
      if (walkableSegment(last, raw[j], level)) furthest = j;
    }
    result.push(raw[furthest]);
    last = raw[furthest];
    i = furthest + 1;
  }
  return result;
}

// src/game/guards.ts
function makeGuards(mission) {
  "worklet";
  return getLevel(mission).patrols.map(({ route, range, halfAngle, spotSeconds, kind, sweep, activePower }) => ({ x: route[0].x, y: route[0].y, px: route[0].x, py: route[0].y, angle: sweep ? sweep.angle : Math.atan2(route[1].y - route[0].y, route[1].x - route[0].x), target: 1, wait: 0, exposure: 0, seesPlayer: false, range, halfAngle, spotSeconds, clock: 0, active: activePower === void 0 || activePower === 0, kind: kind ?? "patrol", lureId: 0, lureAttemptId: 0, lureRetryAt: 0, mode: "patrol", path: [], pathIndex: 0, searchLeft: 0, searchAngle: 0, lastSeen: { ...route[0] } }));
}
function sightDistance(x, y, dx, dy, limit, level = LEVEL) {
  "worklet";
  let nearest = limit;
  for (let i = 0; i < level.blockers.length; i++) {
    const b = level.blockers[i];
    let enter = 0, leave = nearest;
    if (Math.abs(dx) < 1e-9) {
      if (x < b.x || x > b.x + b.w) continue;
    } else {
      const a = (b.x - x) / dx, c = (b.x + b.w - x) / dx;
      enter = Math.max(enter, Math.min(a, c));
      leave = Math.min(leave, Math.max(a, c));
    }
    if (Math.abs(dy) < 1e-9) {
      if (y < b.y || y > b.y + b.h) continue;
    } else {
      const a = (b.y - y) / dy, c = (b.y + b.h - y) / dy;
      enter = Math.max(enter, Math.min(a, c));
      leave = Math.min(leave, Math.max(a, c));
    }
    if (enter <= leave && leave >= 0) nearest = Math.max(0, enter);
  }
  return nearest;
}
function sees(guard, x, y, level = LEVEL) {
  "worklet";
  const dx = x - guard.x, dy = y - guard.y, d = Math.hypot(dx, dy);
  if (d > guard.range) return false;
  if (d < 1e-6) return true;
  if (d > 0.5 && (dx * Math.cos(guard.angle) + dy * Math.sin(guard.angle)) / d < Math.cos(guard.halfAngle)) return false;
  return sightDistance(guard.x, guard.y, dx / d, dy / d, d, level) >= d - 1e-7;
}
function destination(g, point, level, mode) {
  "worklet";
  const path = findPath(g, point, level);
  if (!path.length) return false;
  g.path = path;
  g.pathIndex = 0;
  g.mode = mode;
  g.wait = 0;
  return true;
}
function updateGuards(guards, x, y, dt, level = getLevel("night-shift"), noise, security) {
  "worklet";
  for (let i = 0; i < guards.length; i++) {
    const g = guards[i], spec = level.patrols[i], route = spec.route;
    g.px = g.x;
    g.py = g.y;
    const multiplier = alarmSpeed(security?.alarmSeconds ?? -1);
    g.clock += dt * (spec.kind === "scanner" ? multiplier : 1);
    g.active = spec.activePower === void 0 || spec.activePower === (security?.power ?? 0);
    if (!g.active) {
      g.seesPlayer = false;
      g.exposure = 0;
      continue;
    }
    const speed = spec.speed * multiplier * (spec.alertAfterDelivery && (security?.delivered ?? 0) > 0 ? 1.25 : 1);
    if (spec.investigates && spec.kind !== "scanner" && noise && !sees(g, x, y, level) && Math.hypot(noise.x - g.x, noise.y - g.y) <= (noise.kind === "decoy" ? SECURITY.decoyHearing : spec.hearing ?? 6)) {
      if (noise.kind !== "decoy" || g.lureId !== noise.id && (g.lureAttemptId !== noise.id || g.clock >= g.lureRetryAt)) {
        g.lureAttemptId = noise.id ?? 0;
        g.lureRetryAt = g.clock + 1;
        if (destination(g, noise, level, "investigate")) {
          g.lureId = noise.kind === "decoy" ? noise.id ?? 0 : 0;
          g.exposure = 0;
        }
      }
    }
    if (spec.kind === "scanner" && spec.sweep) {
      g.angle = spec.sweep.angle + Math.sin(g.clock / spec.sweep.period * Math.PI * 2) * spec.sweep.amplitude;
    } else if (g.exposure === 0) {
      if (g.mode === "search") {
        if (noise?.kind === "decoy" && g.lureId === noise.id) g.searchLeft = Math.max(g.searchLeft, noise.ttl ?? 0);
        g.searchLeft -= dt;
        g.angle = g.searchAngle + Math.sin(g.clock * 3) * 0.8;
        if (g.searchLeft <= 0 && !destination(g, route[g.target], level, "return")) g.searchLeft = 1;
      } else if (g.mode === "investigate" || g.mode === "return") {
        const p = g.path[g.pathIndex];
        if (p) {
          const dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy), travel = Math.min(d, speed * dt), next = { x: d ? g.x + dx / d * travel : g.x, y: d ? g.y + dy / d * travel : g.y };
          if (walkableSegment(g, next, level)) {
            if (d > 1e-3) g.angle = Math.atan2(dy, dx);
            g.x = next.x;
            g.y = next.y;
            if (d <= travel + 1e-8) g.pathIndex++;
          } else {
            g.lureId = 0;
            g.mode = "search";
            g.searchLeft = 1;
            g.searchAngle = g.angle;
          }
        }
        if (g.pathIndex >= g.path.length) {
          if (g.mode === "return") {
            g.lureId = 0;
            g.mode = "patrol";
            g.target = (g.target + 1) % route.length;
            g.wait = spec.pauseSeconds;
          } else {
            g.mode = "search";
            g.searchLeft = 2.5;
            g.searchAngle = g.angle;
          }
        }
      } else if (g.wait > 0) g.wait = Math.max(0, g.wait - dt);
      else {
        const p = route[g.target], dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy), travel = speed * dt;
        if (!walkableSegment(g, { x: d ? g.x + dx / d * Math.min(d, travel) : g.x, y: d ? g.y + dy / d * Math.min(d, travel) : g.y }, level)) {
          g.wait = 0.2;
        } else if (d <= travel) {
          g.x = p.x;
          g.y = p.y;
          g.target = (g.target + 1) % route.length;
          g.wait = spec.pauseSeconds;
        } else {
          g.angle = Math.atan2(dy, dx);
          g.x += dx / d * travel;
          g.y += dy / d * travel;
        }
      }
    }
    const visible = sees(g, x, y, level);
    if (spec.investigates) {
      if (visible) g.lastSeen = { x, y };
      else if (g.seesPlayer) {
        g.lureId = 0;
        destination(g, g.lastSeen, level, "investigate");
      }
    }
    g.seesPlayer = visible;
    g.exposure = visible ? Math.min(1, g.exposure + dt / g.spotSeconds) : Math.max(0, g.exposure - dt / GUARD_TUNING.forgetSeconds);
  }
}

// src/game/simulation.ts
function gateWantsClosed(g, elapsed, power, timers) {
  "worklet";
  return g.mode === "power" ? g.power !== power : g.mode === "relay" ? (timers[g.relay ?? 0] ?? 0) <= 0 : (elapsed + g.phase) % g.period >= g.openSeconds;
}
function initialState(mission = "practice") {
  "worklet";
  const level = getLevel(mission);
  return {
    x: level.spawn.x,
    y: level.spawn.y,
    px: level.spawn.x,
    py: level.spawn.y,
    vx: 0,
    vy: 0,
    facing: 2,
    walked: 0,
    carrying: false,
    battery: 100,
    pickup: 0,
    extraction: 0,
    elapsed: 0,
    ticks: 0,
    dashLeft: 0,
    cooldown: 0,
    dashX: 0,
    dashY: -1,
    dashSeen: 0,
    status: "playing",
    dashes: 0,
    score: 0,
    bumps: 0,
    securityAlarm: false,
    alarmSeconds: 0,
    thefts: 0,
    decoyFeedback: "none",
    decoyFeedbackLeft: 0,
    power: 0,
    relayTimers: [0, 0],
    interactSeen: false,
    activations: 0,
    delivered: 0,
    deliveryBatteries: [],
    decoysLeft: level.decoys ?? 0,
    toolSeen: 0,
    decoy: { x: 0, y: 0, ttl: 0, id: 0 },
    mission,
    guards: makeGuards(mission),
    alert: 0,
    caughtBy: -1,
    spotted: false,
    closedGates: (level.gates ?? []).map((g) => gateWantsClosed(g, 0, 0, [0, 0])),
    blockers: [...level.blockers, ...(level.gates ?? []).filter((g) => gateWantsClosed(g, 0, 0, [0, 0])).map((g) => g.box)]
  };
}
function idleInput() {
  "worklet";
  return { x: 0, y: 0, interact: false, dash: 0 };
}
function targetPhone(s) {
  "worklet";
  const level = getLevel(s.mission);
  return level.targets?.[Math.min(s.delivered, level.targets.length - 1)] ?? level.phone;
}
function targetCount(s) {
  "worklet";
  return getLevel(s.mission).targets?.length ?? 1;
}
function nearPhone(s) {
  "worklet";
  const phone = targetPhone(s);
  return s.status === "playing" && !s.carrying && Math.hypot(s.x - phone.x, s.y - phone.y) <= TUNING.pickupRadius;
}
function nearSwitch(s) {
  "worklet";
  const switches = getLevel(s.mission).switches ?? [];
  for (let i = 0; i < switches.length; i++) if (Math.hypot(s.x - switches[i].x, s.y - switches[i].y) < 0.95) return i;
  return -1;
}
function inExit(s) {
  "worklet";
  const e = getLevel(s.mission).exit;
  return s.x >= e.x && s.x <= e.x + e.w && s.y >= e.y && s.y <= e.y + e.h;
}
function decoyLanding(s, input = idleInput()) {
  "worklet";
  const dirs = [[0, 1], [-1, 0], [0, -1], [1, 0]], m = Math.hypot(input.x, input.y), dx = m > 0.05 ? input.x / m : dirs[s.facing][0], dy = m > 0.05 ? input.y / m : dirs[s.facing][1];
  let distance = 0;
  for (let d = 0.2; d <= SECURITY.decoyRange + 0.01; d += 0.2) {
    if (s.blockers.some((b) => intersectsBox(s.x + dx * d, s.y + dy * d, b, 0.4))) break;
    distance = d;
  }
  return { x: s.x + dx * distance, y: s.y + dy * distance, distance };
}
function updateGates(s) {
  "worklet";
  const level = getLevel(s.mission), gates = level.gates;
  if (!gates) return;
  let changed = false;
  for (let i = 0; i < gates.length; i++) {
    const gate = gates[i], wantsClosed = gateWantsClosed(gate, s.elapsed, s.power, s.relayTimers);
    const occupied = intersectsBox(s.x, s.y, gate.box, 0.4) || s.guards.some((g) => intersectsBox(g.x, g.y, gate.box, 0.45));
    const closed = wantsClosed && (s.closedGates[i] || !occupied);
    if (closed !== s.closedGates[i]) {
      s.closedGates[i] = closed;
      changed = true;
    }
  }
  if (changed) s.blockers = [...level.blockers, ...gates.filter((_, i) => s.closedGates[i]).map((g) => g.box)];
}
function approach(value, target, amount) {
  "worklet";
  return value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);
}
function move(s, dx, dy) {
  "worklet";
  const count = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.1));
  const sx = dx / count, sy = dy / count;
  for (let i = 0; i < count; i++) {
    if (!blockedBy(s.x + sx, s.y, s.blockers)) s.x += sx;
    else s.bumps++;
    if (!blockedBy(s.x, s.y + sy, s.blockers)) s.y += sy;
    else s.bumps++;
  }
}
function step(s, input, dt = TUNING.step) {
  "worklet";
  if (s.status !== "playing") return;
  s.px = s.x;
  s.py = s.y;
  s.elapsed += dt;
  s.ticks++;
  s.relayTimers = s.relayTimers.map((t) => Math.max(0, t - dt));
  updateGates(s);
  if (!input.interact) s.interactSeen = false;
  if (s.securityAlarm) s.alarmSeconds += dt;
  s.decoyFeedbackLeft = Math.max(0, s.decoyFeedbackLeft - dt);
  s.cooldown = Math.max(0, s.cooldown - dt);
  s.decoy.ttl = Math.max(0, s.decoy.ttl - dt);
  let noise;
  const magnitude = Math.hypot(input.x, input.y), divisor = Math.max(1, magnitude);
  const ix = input.x / divisor, iy = input.y / divisor;
  if (magnitude > 0.05) {
    s.facing = Math.abs(ix) > Math.abs(iy) ? ix < 0 ? 1 : 3 : iy < 0 ? 2 : 0;
  }
  if (input.dash !== s.dashSeen) {
    s.dashSeen = input.dash;
    if (s.carrying && s.battery >= TUNING.dashCost && s.cooldown <= 0 && s.dashLeft <= 0) {
      const dirs = [[0, 1], [-1, 0], [0, -1], [1, 0]];
      s.dashX = magnitude > 0.05 ? ix / Math.hypot(ix, iy) : dirs[s.facing][0];
      s.dashY = magnitude > 0.05 ? iy / Math.hypot(ix, iy) : dirs[s.facing][1];
      s.battery -= TUNING.dashCost;
      s.dashes++;
      noise = { x: s.x, y: s.y, kind: "dash" };
      s.dashLeft = TUNING.dashDuration;
      s.cooldown = TUNING.dashCooldown;
    }
  }
  if ((input.tool ?? 0) !== s.toolSeen) {
    s.toolSeen = input.tool ?? 0;
    if (s.decoysLeft > 0) {
      const landing = decoyLanding(s, input), distance = landing.distance;
      if (distance >= 0.6) {
        s.decoy = { x: landing.x, y: landing.y, ttl: SECURITY.decoySeconds, id: s.decoy.id + 1 };
        s.decoysLeft--;
        s.decoyFeedback = "thrown";
      } else s.decoyFeedback = "blocked";
      s.decoyFeedbackLeft = 3;
    } else {
      s.decoyFeedback = "empty";
      s.decoyFeedbackLeft = 3;
    }
  }
  const speed = s.carrying ? TUNING.carrySpeed : TUNING.walkSpeed;
  const accel = magnitude > 0.05 ? TUNING.acceleration : TUNING.friction;
  s.vx = approach(s.vx, ix * speed, accel * dt);
  s.vy = approach(s.vy, iy * speed, accel * dt);
  if (s.dashLeft > 0) {
    const duration = Math.min(dt, s.dashLeft);
    move(s, s.dashX * TUNING.dashSpeed * duration, s.dashY * TUNING.dashSpeed * duration);
    s.dashLeft = Math.max(0, s.dashLeft - dt);
  } else move(s, s.vx * dt, s.vy * dt);
  s.walked += Math.hypot(s.x - s.px, s.y - s.py);
  const switchIndex = nearSwitch(s);
  if (input.interact && !s.interactSeen && switchIndex >= 0 && Math.hypot(s.vx, s.vy) < 0.2) {
    const pad = getLevel(s.mission).switches[switchIndex];
    if (pad.kind === "power") s.power = s.power === 0 ? 1 : 0;
    else s.relayTimers[pad.channel ?? 0] = pad.duration ?? 9;
    s.interactSeen = true;
    s.activations++;
    updateGates(s);
  }
  if (input.interact && switchIndex < 0 && nearPhone(s) && Math.hypot(s.vx, s.vy) < 0.2) {
    s.pickup += dt;
    if (s.pickup + 1e-8 >= TUNING.pickupHold) {
      s.carrying = true;
      s.securityAlarm = true;
      s.thefts++;
      s.battery = 100;
      s.pickup = 0;
      s.cooldown = 0;
    }
  } else s.pickup = 0;
  if (s.decoy.ttl > 0) noise = { ...s.decoy, kind: "decoy" };
  updateGuards(s.guards, s.x, s.y, dt, { ...getLevel(s.mission), blockers: s.blockers }, noise, { power: s.power, delivered: s.delivered, alarmSeconds: s.securityAlarm && getLevel(s.mission).number > 0 ? s.alarmSeconds : -1 });
  s.alert = 0;
  for (let i = 0; i < s.guards.length; i++) {
    s.alert = Math.max(s.alert, s.guards[i].exposure);
    if (s.guards[i].seesPlayer) s.spotted = true;
    if (s.guards[i].exposure >= 1 - 1e-8) {
      s.caughtBy = i;
      s.status = "caught";
      s.vx = 0;
      s.vy = 0;
      s.px = s.x;
      s.py = s.y;
      s.extraction = 0;
      return;
    }
  }
  if (s.carrying && inExit(s) && s.dashLeft === 0) {
    s.extraction += dt;
    if (s.extraction + 1e-8 >= TUNING.extractHold) {
      s.deliveryBatteries.push(s.battery);
      s.delivered++;
      s.vx = 0;
      s.vy = 0;
      s.px = s.x;
      s.py = s.y;
      s.extraction = 0;
      if (s.delivered >= targetCount(s)) {
        s.status = "won";
        s.score = 1e4 + 2e3 * (targetCount(s) - 1) + 20 * s.battery + 5 * Math.max(0, Math.floor(getLevel(s.mission).targetSeconds - s.elapsed));
      } else {
        s.carrying = false;
      }
    }
  } else s.extraction = 0;
  if (s.status === "playing" && s.elapsed + 1e-8 >= getLevel(s.mission).hardLimitSeconds) {
    s.status = "timeout";
    s.vx = 0;
    s.vy = 0;
    s.px = s.x;
    s.py = s.y;
  }
}

// server/replay.ts
var replayInput = z.object({ version: z.literal(1), chunks: z.array(z.object({ x: z.number().int().min(-127).max(127), y: z.number().int().min(-127).max(127), buttons: z.number().int().min(0).max(7), ticks: z.number().int().min(1).max(14400) }).strict()).min(1).max(14400) }).strict();
function verifyReplay(mission, input) {
  if (!CAMPAIGN_IDS.includes(mission)) throw new Error("Unknown ranked mission.");
  const replay = replayInput.parse(input), limit = getLevel(mission).hardLimitSeconds * 30, state = initialState(mission);
  let count = 0, dash = 0, tool = 0;
  for (const chunk of replay.chunks) {
    if (count + chunk.ticks > limit) throw new Error("Replay exceeds the mission time limit.");
    if ((chunk.buttons & 6) !== 0 && chunk.ticks !== 1) throw new Error("An action edge must occupy one tick.");
    for (let n = 0; n < chunk.ticks; n++) {
      if (state.status !== "playing") throw new Error("Replay continues after a terminal result.");
      if (chunk.buttons & 2) dash++;
      if (chunk.buttons & 4) tool++;
      step(state, { x: chunk.x / 127, y: chunk.y / 127, interact: !!(chunk.buttons & 1), dash, tool });
      count++;
    }
  }
  return { status: state.status === "playing" ? "incomplete" : state.status, score: state.score, ticks: state.ticks, seconds: state.elapsed, battery: state.battery, delivered: state.delivered, spotted: state.spotted };
}
export {
  replayInput,
  verifyReplay
};
