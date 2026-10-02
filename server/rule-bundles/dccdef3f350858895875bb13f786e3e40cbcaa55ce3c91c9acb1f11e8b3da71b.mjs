// src/game/level.ts
var PATROLS = [
  [{ x: 3.7, y: 10.5 }, { x: 6.6, y: 10.5 }, { x: 6.6, y: 7.6 }, { x: 4.3, y: 7.6 }, { x: 4.3, y: 10.5 }],
  [{ x: 7.3, y: 4.2 }, { x: 10.5, y: 4.2 }, { x: 10.5, y: 7.1 }, { x: 7.3, y: 7.1 }]
];
var SECURITY = { alarmBaseSpeed: 2.2, alarmMaxSpeed: 2.8, alarmRampSeconds: 20, reportSeconds: 4, chaseRepathSeconds: 0.45, decoySeconds: 6, decoyHearing: 9, decoyRange: 4.4 };
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
  l.id = l.id + "-security-v3";
  l.decoys = l.number === 12 ? 6 : l.number >= 8 ? 3 : 2;
  for (const guard of l.patrols) {
    if (guard.kind !== "scanner") {
      guard.investigates = true;
      guard.hearing = SECURITY.decoyHearing;
    }
    guard.alertAfterDelivery = false;
  }
  if (l.number >= 2) l.patrols.push({ ...patrol(l.number <= 5 ? [{ x: 10.85, y: 3 }, { x: 10.85, y: 17.5 }] : [{ x: 2, y: 18.6 }, { x: 10.6, y: 18.6 }], 0.95, 3.2), spotSeconds: 1, investigates: true, hearing: SECURITY.decoyHearing });
  if (l.number >= 6) l.patrols.push({ ...patrol(l.mission === "last-vault" ? [{ x: 7, y: 1.25 }, { x: 10.6, y: 1.25 }] : [{ x: 1.2, y: 1.25 }, { x: 10.6, y: 1.25 }], 0.85, 3), spotSeconds: 1, investigates: true, hearing: SECURITY.decoyHearing });
  l.briefing += " Alarm: guards move 120% faster after pickup, rising to 180% faster after 20 seconds. The stolen phone broadcasts your location every four seconds; guards pursue sightings and search the last reported position. Decoys beep for six seconds; mobile guards within nine tiles investigate.";
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
  if ((level.combat?.revision ?? 0) >= 15) {
    const minX = Math.min(a.x, b.x) - RADIUS, maxX = Math.max(a.x, b.x) + RADIUS, minY = Math.min(a.y, b.y) - RADIUS, maxY = Math.max(a.y, b.y) + RADIUS;
    for (const box2 of level.blockers) {
      if (box2.x > maxX || box2.x + box2.w < minX || box2.y > maxY || box2.y + box2.h < minY) continue;
      for (let i = 0; i <= steps; i++) if (intersectsBox(a.x + (b.x - a.x) * i / steps, a.y + (b.y - a.y) * i / steps, box2, RADIUS)) return false;
    }
    return true;
  }
  for (let i = 0; i <= steps; i++) if (blocked(a.x + (b.x - a.x) * i / steps, a.y + (b.y - a.y) * i / steps, level)) return false;
  return true;
}
function findPath(from, to, level) {
  "worklet";
  if (walkableSegment(from, to, level)) return [{ ...to }];
  const width = Math.round(level.width * 2) + 1, height = Math.round(level.height * 2) + 1;
  const anchor = (point2) => {
    const x = Math.round(point2.x * 2), y = Math.round(point2.y * 2);
    let best = -1, distance = Infinity;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy, p = { x: xx / 2, y: yy / 2 }, d = Math.hypot(p.x - point2.x, p.y - point2.y);
      if (xx < 0 || xx >= width || yy < 0 || yy >= height || d >= distance || !walkableSegment(point2, p, level)) continue;
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

// src/game/campaign-layouts.ts
var FORMS = [
  [],
  [[3, 10, 1.2, 5], [3, 10, 4.4, 1.2], [6.2, 10, 1.2, 2.8], [3, 5, 2.4, 2], [7.2, 3.8, 1.3, 3.2], [8.8, 12.8, 1.2, 2], [4.7, 16, 2, 0.7]],
  [[3.2, 11.8, 1.2, 4], [6.5, 8.8, 1.2, 4.2], [3.2, 7.4, 1.2, 2.6], [3.2, 7.4, 2.8, 1.2], [7, 3.2, 2, 2], [2, 3.4, 2, 1.2], [8.8, 15, 1.2, 1.2]],
  [[3, 12, 5.2, 1.1], [3, 12, 1.1, 3], [7.1, 14.5, 1.1, 1.6], [3, 6.6, 1.1, 3.4], [3, 6.6, 4.6, 1.1], [6.5, 4, 1.1, 3.7], [8.9, 8.8, 1, 1.7], [2, 2.7, 2, 1.3]],
  [[3.3, 12.7, 1.2, 3.4], [7.5, 12.7, 1.2, 3.4], [3.3, 6.3, 1.2, 3.8], [7.5, 6.3, 1.2, 3.8], [5.5, 10.4, 1, 1.2], [5.5, 3.2, 1, 2], [1, 9.8, 1, 1.2], [10, 9.8, 1, 1.2]],
  [[4.3, 7.4, 3.3, 5.8], [1.9, 14.3, 2, 1.4], [8.3, 14.3, 1.8, 1.4], [2, 4, 1.8, 1.5], [8.2, 4, 1.8, 1.5], [5, 2.2, 2, 1.1], [1, 9, 1.1, 1.8], [9.9, 9, 1.1, 1.8]],
  [[3.2, 11.4, 1.2, 5], [7.6, 11.4, 1.2, 5], [4.4, 11.4, 1, 1.2], [6.6, 11.4, 1, 1.2], [3.2, 5, 1.2, 3.8], [7.6, 5, 1.2, 3.8], [4.4, 7.6, 1, 1.2], [6.6, 5, 1, 1.2], [5.5, 2.4, 1, 1.2]],
  [[3, 12.4, 1.1, 3.4], [3, 12.4, 3.8, 1.1], [7.9, 12.4, 1.1, 3.4], [5.2, 15, 1.5, 1.1], [3, 5.4, 1.1, 3.6], [3, 5.4, 3.8, 1.1], [7.9, 5.4, 1.1, 3.6], [5.2, 8, 1.5, 1.1], [1, 10.3, 2.5, 0.9], [8.5, 10.3, 2.5, 0.9]],
  [[3.8, 12, 1.1, 3.7], [3.8, 12, 3.4, 1.1], [7.3, 8.2, 1.1, 2.5], [3.3, 7.2, 2.5, 1.1], [1, 10, 1.2, 1.3], [8.6, 14.4, 1.4, 1.1], [3, 3.1, 2.2, 1.5], [8.2, 0.65, 0.8, 4.8]],
  [[3, 12, 1.1, 4.5], [7.9, 12, 1.1, 4.5], [5, 15.5, 2, 1], [3, 6, 1.1, 3.5], [7.9, 6, 1.1, 3.5], [4.1, 6, 2.5, 1.1], [5.2, 9, 1.4, 1.2], [2, 2.4, 2, 1.2], [8, 2.4, 2, 1.2]],
  [[3, 13, 2.4, 2], [7.2, 12.4, 1.3, 3.7], [1, 10.5, 2.5, 1.1], [5.2, 10.5, 2.5, 1.1], [9.2, 10.5, 1.8, 1.1], [3.4, 5, 1.1, 3.5], [3.4, 7.4, 3.8, 1.1], [7.8, 3, 1.2, 3.5], [1.8, 2.5, 2, 1.1]],
  [[3, 13, 4.2, 1.2], [6, 10.5, 1.2, 2.5], [4.2, 9.3, 3, 1.2], [4.2, 6.8, 1.2, 2.5], [2.5, 5.6, 2.9, 1.2], [8.7, 12.8, 1.2, 2.6], [1.2, 9.3, 1.2, 2.3], [8, 4.7, 2, 1.3], [3, 2.2, 1.6, 1.2]]
];
function positions(l, x, y) {
  "worklet";
  const points = [];
  for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) {
    const p = { x: Math.max(1.3, Math.min(10.7, x + xx * 0.7)), y: Math.max(1.3, Math.min(16.4, y + yy * 0.7)) };
    if (walkableSegment(p, p, l)) points.push(p);
  }
  points.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y) || a.y - b.y || a.x - b.x);
  const selected = [];
  for (const p of points) if (selected.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > 0.75)) {
    selected.push(p);
    if (selected.length === 5) break;
  }
  if (!selected.length) throw Error(`No patrol pocket in mission ${l.number}`);
  if (selected.length === 1) selected.push({ ...selected[0] });
  return selected;
}
function applyCampaignLayout(l) {
  "worklet";
  const n = l.number;
  if (n === 1) {
    l.blockers = l.blockers.filter((b) => !(b.x === 0.65 && b.y === 0.65 && b.w === 3.3));
    l.blockers.push({ x: 0.65, y: 0.65, w: 3.3, h: 4.8, kind: "wall" }, { x: 0.65, y: 7, w: 3.3, h: 1.35, kind: "wall" });
    return l;
  }
  l.blockers = [...l.blockers.slice(0, 4), ...FORMS[n - 1].map(([x, y, w, h]) => ({ x, y, w, h, kind: "wall" }))];
  l.spawn = { x: 6, y: 18 };
  l.phone = { x: 10.2, y: 2 };
  l.exit = { x: 5.25, y: 17.9, w: 1.5, h: 1.1 };
  l.targets = void 0;
  l.gates = void 0;
  l.switches = void 0;
  l.exitWindow = void 0;
  l.combat = { version: 2, revision: 9 };
  const specs = n === 2 ? [["scout", 8.8, 13.4], ["drone", 2, 11.2], ["scout", 6, 3]] : n === 3 ? [["scout", 2, 12], ["drone", 9.4, 10], ["scout", 5.4, 5.2], ["scout", 9.5, 2]] : n === 4 ? [["scout", 9.4, 14], ["drone", 2, 10], ["scout", 5.3, 4], ["scout", 9.5, 3]] : n === 5 ? [["drone", 6, 13.2], ["scout", 1.7, 12], ["scout", 10.2, 6], ["scout", 5.8, 2]] : n === 6 ? [["scout", 2, 12], ["drone", 10, 11.5], ["heavy", 6, 5], ["scout", 9.5, 2]] : n === 7 ? [["scout", 2, 14], ["scout", 10, 12], ["sentry", 6, 9.5], ["scout", 2, 3.2], ["scout", 9.8, 2.5]] : n === 8 ? [["scout", 2, 13.3], ["scout", 10, 12], ["scout", 6, 10], ["sentry", 2, 4], ["scout", 9.6, 3]] : n === 9 ? [["scout", 2, 13], ["scout", 9.5, 12], ["sentry", 6.4, 9], ["scout", 2, 3], ["scout", 10.4, 3.5]] : n === 10 ? [["scout", 2, 13], ["scout", 10, 14], ["scout", 6, 11.2], ["sentry", 2, 5], ["scout", 9.6, 4.7], ["sentry", 6, 2.8]] : n === 11 ? [["scout", 2, 15], ["scout", 9.9, 13.5], ["scout", 4.8, 9], ["sentry", 9.4, 8], ["scout", 2, 4.5], ["sentry", 6, 2.6]] : [["scout", 2, 14.6], ["scout", 9.6, 10.5], ["sentry", 2, 8], ["scout", 7.3, 7], ["scout", 2, 3.8], ["warden", 6.8, 2.5]];
  l.patrols = specs.map(([role, x, y], index) => {
    const roam4 = positions(l, x, y);
    return { combatRole: role, route: [roam4[0], roam4[1]], roam: roam4, speed: role === "heavy" || role === "warden" ? 0.58 : n <= 4 ? 0.68 : n <= 8 ? 0.8 : 0.9, range: role === "drone" ? 2.8 : n <= 4 ? 2.9 : n <= 8 ? 3.2 : 3.5, halfAngle: Math.PI / 3.5, spotSeconds: role === "drone" ? 0.7 : 0.3, pauseSeconds: 0.5 + index % 2 * 0.2, investigates: true, ...role === "drone" ? { kind: "scanner" } : role === "warden" ? { kind: "warden" } : {} };
  });
  if (n >= 4 && n <= 6) {
    const [x, y] = n === 4 ? [9.7, 6] : n === 5 ? [1.8, 5] : [1.8, 7];
    const roam4 = positions(l, x, y);
    l.patrols.push({ route: [roam4[0], roam4[1]], roam: roam4, speed: 0.75, range: 2.7, halfAngle: Math.PI / 3.5, spotSeconds: 0.7, pauseSeconds: 0.65, combatRole: "drone", kind: "scanner", investigates: true });
  }
  if (n === 4 || n === 5 || n === 7) {
    const at = { x: 1.5, y: 18.5 };
    l.patrols.push({ route: [at, { x: 3, y: 18.5 }], roam: [at, { x: 3, y: 18.5 }], speed: 0.78, range: 3, halfAngle: Math.PI / 3.5, spotSeconds: 0.4, pauseSeconds: 0.7, combatRole: "scout", reserveAfter: n === 5 || n === 7 ? 15 : 13, investigates: true });
  }
  if (n === 8) l.targets = [{ x: 2, y: 2 }, l.phone];
  if (n === 9) {
    l.switches = [{ x: 2.9, y: 10.4, kind: "power" }];
    l.gates = [{ box: { x: 9, y: 4.65, w: 2.35, h: 0.8, kind: "wall" }, mode: "power", power: 1, period: 10, openSeconds: 5, phase: 0 }];
  }
  if (n === 10) l.exitWindow = { period: 8, openSeconds: 5, phase: 0 };
  l.targetSeconds = n <= 4 ? 75 : n === 8 ? 125 : n >= 10 ? 100 : 90;
  l.hardLimitSeconds = n <= 4 ? 210 : n === 8 ? 270 : 240;
  const tips = ["", "Use the loop to escape the drone. Guards search where they last saw you.", "Break one firing lane, then cross behind cover.", "Scout the return loop before taking the phone.", "Cross at a safe gap. Reinforcements arrive after the pickup alarm.", "Flank the Heavy while its weapon recovers.", "The outside loop is safer. The middle route is shorter.", "Two phones. Clear a route you can use twice.", "Tap the switch, pass the open gate, then collect the phone.", "Wait in cover for the exit to turn mint.", "Break contact between rooms. Nearby guards share sightings.", "Use the bends for cover. Flank the Warden and take the last Seeker."];
  l.briefing = tips[n - 1];
  return l;
}

// src/game/guard-pressure.ts
var PROFILES = [
  { pursuit: 4.1, vision: 5.2, spot: 0.24, aim: 20, recover: 18, damage: 25, report: 24 },
  { pursuit: 4.3, vision: 5.4, spot: 0.22, aim: 18, recover: 17, damage: 25, report: 23 },
  { pursuit: 4.5, vision: 5.6, spot: 0.2, aim: 17, recover: 16, damage: 25, report: 22 },
  { pursuit: 4.6, vision: 5.8, spot: 0.2, aim: 17, recover: 16, damage: 27, report: 22 },
  { pursuit: 4.7, vision: 6, spot: 0.18, aim: 16, recover: 15, damage: 28, report: 21 },
  { pursuit: 4.8, vision: 6.2, spot: 0.18, aim: 16, recover: 15, damage: 30, report: 21 }
];
var RUN_SPEEDS = [2.85, 2.95, 3.05, 3.15, 3.25, 3.35];
var GROUNDED_PROFILES = PROFILES.map((profile, index) => ({ ...profile, pursuit: RUN_SPEEDS[index] }));
function guardPressure(l) {
  "worklet";
  const profiles = (l.combat?.revision ?? 0) >= 12 ? GROUNDED_PROFILES : PROFILES;
  const p = profiles[l.number <= 1 ? 0 : l.number === 2 ? 1 : l.number === 3 ? 2 : l.number <= 6 ? 3 : l.number <= 9 ? 4 : 5];
  return (l.combat?.revision ?? 0) >= 15 ? { ...p, aim: p.aim + 10, recover: p.recover + 8, report: l.number <= 3 ? 36 : 30 } : p;
}
function pressureCombat(l) {
  "worklet";
  return (l.combat?.revision ?? 0) >= 11;
}
function droneReportTicks(l) {
  "worklet";
  return pressureCombat(l) ? guardPressure(l).report : 27;
}

// src/game/heist-layouts.ts
var point = ([x, y]) => {
  "worklet";
  return { x, y };
};
var box = ([x, y, w, h]) => {
  "worklet";
  return { x, y, w, h, kind: "wall" };
};
var LAYOUTS = [
  // Mission 2: left service lane, staggered cover and two right-hand rooms.
  // Doorways stay open floor; the reference's light strips are not closed gates.
  {
    spawn: [2.35, 18.55],
    phone: [2.6, 1.8],
    exit: [2.35, 18.55],
    walls: [
      [4, 0.65, 0.65, 3.4],
      [0.65, 3.4, 1.25, 0.65],
      [3.25, 3.4, 1.4, 0.65],
      [5.3, 6, 5.35, 0.65],
      [5.3, 6, 0.65, 3.1],
      [5.3, 10.25, 0.65, 1.35],
      [5.3, 10.95, 3.5, 0.65],
      [10, 6, 0.65, 3.1],
      [10, 10.25, 0.65, 1.35],
      [5.3, 13.3, 5.35, 0.65],
      [5.3, 15.15, 0.65, 2.6],
      [5.3, 17.1, 5.35, 0.65],
      [10, 13.3, 0.65, 2.65]
    ],
    crates: [
      [6.2, 1.2, 2.5, 0.85],
      [6.2, 2.15, 0.95, 0.95],
      [8.25, 2.15, 0.95, 0.95],
      [7.35, 3.2, 1.85, 0.85],
      [1, 4.95, 1.45, 1.1],
      [2.7, 6.5, 0.95, 0.95],
      [2.7, 8.35, 0.95, 0.95],
      [2.7, 10.2, 0.95, 0.95],
      [0.7, 7.1, 0.85, 1.8],
      [0.7, 10.4, 0.85, 1.35],
      [6.15, 6.95, 0.85, 1.5],
      [8.85, 8.1, 0.75, 1.1],
      [6.15, 10, 0.85, 0.75],
      [2.7, 12.15, 0.95, 0.95],
      [5.3, 12, 0.95, 0.95],
      [8, 11.65, 2.65, 1.3],
      [2.7, 14.25, 0.95, 0.95],
      [2.7, 16.2, 0.95, 0.95],
      [0.7, 14, 0.85, 2.2],
      [6.1, 16, 2.6, 0.85],
      [9, 14.1, 0.8, 0.8],
      [4.2, 18.15, 2.6, 0.8]
    ],
    cast: [
      ["scout", [4.35, 10], [4.35, 7.3], [4.35, 5]],
      ["scout", [8.1, 9.65], [8.1, 7.5], [8.1, 7]],
      ["drone", [5.35, 3], [5.35, 4.7], [8.5, 4.7]]
    ],
    safe: [[4.45, 17.6], [4.45, 14.55], [6.5, 14.6], [8, 15.25], [9.4, 15.55], [10.95, 16.5], [10.95, 9.65], [8, 9.65], [4.35, 9.65], [4.35, 5.9], [4.95, 4.75], [3, 4.5], [2.55, 2.7]],
    back: [[3, 4.5], [4.35, 5.9], [4.35, 11.95], [4.45, 14.55], [4.45, 17.6], [2.35, 18.55]],
    pockets: [[7.8, 15], [4.4, 12.4], [2.1, 17.65]],
    entries: [[10, 4.7]],
    tip: "Use the staggered crates to break sight. The drone reports your position; flank it before crossing the upper yard. Recover the Seeker and return to the service entrance."
  },
  // Mission 3: entry yard, twin laser doorways, hooked spine and upper vault.
  {
    spawn: [6.3, 18.7],
    phone: [9.25, 3.6],
    exit: [6.3, 18.7],
    walls: [
      [0.7, 14.4, 3.9, 0.65],
      [5.95, 14.4, 3.25, 0.65],
      [10.55, 14.4, 0.75, 0.65],
      [7.1, 10.3, 0.85, 4.1],
      [1.4, 1.1, 3.25, 0.8],
      [3.85, 1.1, 0.8, 7.5],
      [3.85, 7.8, 4.25, 0.8],
      [7.3, 7.8, 0.8, 1.9],
      [0.9, 3.1, 2.1, 0.65],
      [0.9, 4.9, 2.1, 1.55],
      [0.9, 7.1, 2.1, 0.65],
      [0.9, 9.5, 2.1, 1.7],
      [0.9, 12.2, 2.1, 0.7],
      [6, 1.1, 5.3, 0.8],
      [7.05, 1.9, 0.9, 0.9],
      [7.05, 3.9, 0.85, 1.7],
      [7.05, 4.95, 4.25, 0.65]
    ],
    crates: [
      [1.5, 1.95, 2.15, 0.9],
      [6, 3.9, 0.9, 1.7],
      [10.15, 2.05, 0.9, 1.7],
      [4.9, 6.65, 2.1, 0.9],
      [9.25, 5.85, 1.8, 2.5],
      [10.2, 8.35, 0.85, 1],
      [4, 8.8, 2.95, 0.8],
      [0.7, 6.55, 1.05, 0.45],
      [1, 11.35, 1.85, 0.65],
      [3.15, 10.65, 0.8, 2.3],
      [6, 11.45, 0.85, 2.65],
      [8.15, 10.35, 0.85, 2.5],
      [10.25, 12.1, 0.85, 2],
      [1.5, 16.15, 1.95, 1.55],
      [5, 17, 0.85, 1.05],
      [7.45, 16.15, 2.1, 1.55],
      [10.35, 15.35, 0.7, 1.1]
    ],
    lasers: [[4.6, 14.65, 1.35, 0.14], [9.2, 14.65, 1.35, 0.14]],
    cast: [
      ["scout", [4.85, 12.7], [4.85, 10.25], [5.6, 10.25]],
      ["scout", [9.65, 11.7], [9.65, 9.7], [8.7, 9.7]],
      ["scout", [3.4, 6.6], [3.4, 4.3], [1.5, 4.3]],
      ["scout", [5.4, 5.7], [5.4, 2.5], [5.4, 1]],
      ["drone", [9, 3.35], [8.8, 4.25], [8.4, 3.35]]
    ],
    safe: [[4.5, 18.5], [4.9, 15.7], [5.25, 14.7], [5.1, 12.2], [4.9, 10.15], [8.65, 10], [8.65, 6.1], [5.35, 6], [5.35, 2.8], [8.7, 3.35], [9.25, 3.6]],
    back: [[8.7, 3.35], [5.35, 2.8], [5.35, 6], [8.65, 6.1], [8.65, 9.7], [9.8, 10], [9.8, 14.7], [9.8, 18], [6.3, 18.7]],
    pockets: [[4.9, 15.7], [1.2, 8.6], [5.1, 10.2]],
    entries: [[1.2, 8.6]],
    tip: "Cross a laser and its alarm flashes for 1.5 seconds. Nearby guards investigate that crossing once. Move behind cover before they arrive; a real sighting starts a full chase."
  },
  // Mission 4: staggered upper lanes, an open four-pillar court and bottom entrance.
  // The reference's green court is walkable floor, not a solid cover island.
  {
    spawn: [7.5, 18.7],
    phone: [7.35, 5.6],
    exit: [7.5, 18.7],
    walls: [
      [1.7, 0.7, 2.15, 0.95],
      [7.2, 0.7, 2.15, 0.95],
      [5.1, 1.05, 0.9, 0.9],
      [1.7, 3.5, 0.85, 2.9],
      [5.1, 3.5, 0.85, 2.9],
      [8.5, 3.5, 0.85, 2.9],
      [1.7, 8.3, 0.9, 0.9],
      [3.95, 8.3, 3.15, 0.9],
      [8.3, 8.3, 0.9, 0.9],
      [1.7, 11.1, 0.85, 2.9],
      [8.5, 11.1, 0.85, 2.9],
      [4, 11.1, 0.9, 0.9],
      [6.2, 11.1, 0.9, 0.9],
      [4, 13.05, 0.9, 0.9],
      [6.2, 13.05, 0.9, 0.9],
      [1.7, 15.9, 0.9, 0.9],
      [3.95, 15.9, 3.15, 0.9],
      [8.5, 15.9, 0.9, 0.9]
    ],
    crates: [
      [0.7, 0.7, 0.7, 1.5],
      [7.2, 1.9, 2.15, 0.95],
      [9.55, 1.05, 0.85, 1.8],
      [2.8, 2.6, 3.15, 0.65],
      [2.8, 3.25, 0.85, 1.4],
      [3.9, 3.5, 0.85, 2.25],
      [6.15, 4.5, 0.8, 2.45],
      [5.1, 6.7, 1.85, 0.75],
      [9.55, 4.5, 0.85, 1.9],
      [7.35, 8.3, 0.7, 0.85],
      [6.25, 9.4, 2.95, 0.7],
      [10.45, 7.5, 0.65, 1.9],
      [1.7, 10.2, 0.85, 0.65],
      [5.15, 13.05, 0.8, 1.75],
      [4, 14.2, 1.95, 0.7],
      [10.3, 12.25, 0.8, 2.85],
      [2.8, 14.95, 2, 0.7],
      [2.8, 15.9, 0.9, 0.9],
      [5.05, 17.05, 2.05, 0.75],
      [0.7, 18.1, 1.1, 1.05],
      [9.2, 18.15, 1.9, 1],
      [10.3, 17.2, 0.8, 0.95]
    ],
    lasers: [[0.7, 13.4, 1, 0.14], [9.35, 11.45, 1.95, 0.14]],
    cast: [
      ["scout", [9.7, 13.8], [7.7, 14.8], [7.5, 14.5]],
      ["scout", [3.3, 10.5], [3.3, 12.45], [5.5, 12.45]],
      ["scout", [7.6, 10.7], [7.6, 12.6], [7.6, 14.6]],
      ["scout", [3.3, 7.4], [3.3, 5.9], [3.3, 4.95]],
      ["scout", [7.55, 6.5], [7.55, 4], [6.5, 3.5]],
      ["drone", [4.35, 2.1], [6.5, 2.1], [6.5, 3.5]]
    ],
    safe: [[8, 18.5], [9.8, 17.6], [9.8, 15.5], [9.75, 11.5], [10, 10.7], [9.75, 9.7], [9.65, 7.15], [7.6, 7.7], [7.35, 5.6]],
    back: [[7.6, 7.7], [3.3, 7.6], [3.3, 10.4], [3.3, 12.4], [3.3, 14.4], [1.15, 14.7], [1.15, 17.5], [3.5, 18.4], [7.5, 18.7]],
    pockets: [[5.55, 12.4], [7.7, 15.3], [3.3, 7.5]],
    entries: [[10.85, 3.4]],
    tip: "Use the staggered cover and central pillars to flank. Side-lane lasers briefly alert nearby guards. Taking the Seeker calls a reinforcement\u2014plan the return to the bottom entrance."
  },
  // Mission 5: twin long walls, a center slot and crate-lined outer lanes.
  // The top of the reference is cropped; an upper cross-link keeps all lanes connected.
  {
    spawn: [5.25, 18.3],
    phone: [5.25, 3.05],
    exit: [5.25, 18.3],
    walls: [
      [3.65, 2, 0.85, 10.1],
      [6, 2, 0.85, 10.1],
      [3.65, 13.4, 3.2, 4.1],
      [3.65, 19, 3.2, 0.3],
      [10.25, 2.6, 1.05, 1.65],
      [10.25, 8.9, 1.05, 1.7],
      [10.25, 15.5, 1.05, 1.7]
    ],
    crates: [
      [2.45, 2, 0.95, 2.15],
      [1.25, 2.65, 0.95, 1.2],
      [2.45, 6.4, 0.95, 2.7],
      [0.7, 10.1, 0.9, 1.85],
      [0.7, 11.45, 1.5, 0.75],
      [2.45, 13.4, 0.95, 3.25],
      [1.25, 14.35, 0.95, 1.8],
      [7.1, 4.15, 1.1, 3.85],
      [7.1, 10.35, 1.1, 1.75],
      [9.15, 1.15, 2.15, 0.85],
      [9.15, 2.25, 0.85, 1.15],
      [10.25, 6.15, 1.05, 2.5],
      [10.25, 13.4, 1.05, 1.85],
      [9.15, 14.35, 0.85, 3.05],
      [10.25, 17.45, 1.05, 0.8],
      [7.1, 18.4, 1.1, 0.65],
      [0.7, 18.25, 1.5, 0.85]
    ],
    lasers: [[0.7, 8.55, 1.75, 0.14]],
    cast: [
      ["scout", [5.25, 9.7], [5.25, 7.5], [5.25, 4.4]],
      ["scout", [2.5, 11.8], [1.95, 9.8], [1.65, 9.2]],
      ["scout", [1.6, 5.3], [1.6, 6.7], [1.6, 7.5]],
      ["scout", [9.2, 10.5], [9.2, 8.8], [9.2, 8.5]],
      ["scout", [9.1, 5.2], [9.1, 4.2], [9.1, 3.8]],
      ["drone", [5.25, 1.15], [7.75, 1.15], [8.4, 2.9]]
    ],
    safe: [[8.6, 18.2], [8.6, 16.8], [8.6, 13], [9.2, 9.2], [9.15, 5.6], [8.7, 3.55], [8.4, 1.25], [5.25, 1.25], [5.25, 3.05]],
    back: [[5.25, 1.25], [2, 1.2], [1, 5], [1.65, 8.55], [1.95, 9.7], [2.65, 12.65], [1, 13.3], [1, 17.4], [3, 18.1], [5.25, 18.3]],
    pockets: [[5.25, 12.7], [8.65, 12.7], [2, 5.25]],
    entries: [[9.35, 12.3]],
    tip: "The twin walls create a narrow center approach and longer crate-lined flanks. The left laser alerts nearby guards once. Recover the Seeker, then circle the large lower block to the entrance."
  },
  // Mission 6: lower U-barrier room, staggered cargo yard and offset upper gallery.
  // Both reference screenshots describe one continuous map; no pickup powers are added.
  {
    spawn: [9.75, 18.6],
    phone: [1.4, 3.6],
    exit: [9.75, 18.6],
    walls: [
      [0.65, 2.5, 1, 0.65],
      [3.05, 2.5, 8.3, 0.65],
      [4.4, 3.15, 0.75, 0.75],
      [9.5, 3.15, 0.75, 0.75],
      [0.65, 5.5, 6.1, 0.65],
      [8.15, 5.5, 3.2, 0.65],
      [4.4, 4.9, 0.75, 0.6],
      [9.5, 4.9, 0.75, 0.6],
      [0.65, 14.2, 4.25, 0.65],
      [6.3, 14.2, 5.05, 0.65],
      [2.5, 14.85, 0.75, 0.65],
      [7.4, 14.85, 0.75, 0.65],
      [2.3, 17.1, 6, 0.65],
      [3, 16.6, 0.65, 0.5],
      [7.2, 16.6, 0.65, 0.5],
      [10.4, 16.3, 0.95, 1.45]
    ],
    crates: [
      [3.3, 0.7, 2.6, 0.8],
      [0.7, 1.65, 0.75, 0.8],
      [8.5, 1.65, 1.8, 0.8],
      [0.7, 4.65, 2.2, 0.75],
      [0.7, 4.05, 0.75, 0.6],
      [8.4, 4.05, 0.85, 1.35],
      [10.45, 4.05, 0.85, 1.35],
      [2, 6.2, 2.35, 0.7],
      [2.85, 6.9, 0.85, 0.6],
      [0.7, 7.65, 0.85, 2.45],
      [1.55, 8.2, 0.65, 1.1],
      [3.2, 7.9, 1.95, 0.9],
      [4.3, 8.8, 1.7, 0.85],
      [5.4, 9.65, 0.6, 1.05],
      [8.4, 6.7, 1.85, 0.85],
      [8.9, 6.2, 0.85, 0.5],
      [8.9, 7.55, 0.85, 0.6],
      [9.5, 9.1, 1.8, 1.8],
      [10.45, 10.9, 0.85, 0.65],
      [1.3, 11.1, 2.3, 0.85],
      [2.15, 10.4, 0.85, 0.7],
      [2.15, 11.95, 0.85, 0.8],
      [6.3, 11.55, 3.2, 0.8],
      [7.15, 10.9, 1.6, 0.65],
      [5.3, 12.25, 3.4, 0.6],
      [6.3, 12.85, 1.45, 0.35],
      [0.7, 13.15, 1.45, 1],
      [9.95, 13.35, 1.35, 0.8],
      [8.4, 14.9, 1.4, 0.65],
      [4, 16.3, 1.6, 0.6],
      [4.4, 17.75, 1.4, 0.65],
      [10.45, 17.75, 0.85, 0.65],
      [6.1, 18.55, 2.15, 0.7]
    ],
    cast: [
      ["scout", [5.5, 15.6], [4.3, 15.6], [4.3, 15.35]],
      ["scout", [2.8, 9.6], [2.8, 8.95], [2.5, 7.65]],
      ["scout", [10.65, 12.55], [10.65, 12.05], [9.9, 12.75]],
      ["heavy", [7.6, 10.2], [7.6, 8.8], [7.15, 8.5]],
      ["heavy", [5.9, 4.25], [7.4, 4.25], [7.4, 4.7]],
      ["scout", [7.3, 1.65], [6.5, 1.65], [6.5, 1.15]],
      ["drone", [4.35, 12.7], [4.35, 11.1], [4.25, 10.45]]
    ],
    safe: [[8.9, 18.4], [9.1, 16], [6.4, 15.6], [5.6, 14.5], [4.4, 13.5], [4.3, 11.7], [6.8, 10.9], [7.4, 8.6], [7.4, 6.7], [7.45, 5.8], [7.1, 4.25], [3.6, 4.25], [1.4, 3.6]],
    back: [[2.35, 4.1], [2.35, 2.75], [2.35, 1.25], [7.3, 1.65], [7.4, 4.25], [7.45, 5.8], [7.4, 8.6], [6.8, 10.9], [4.3, 11.7], [4.4, 13.5], [5.6, 14.5], [4.1, 15.45], [1.45, 16.25], [1.45, 18.5], [3.5, 18.6], [9.75, 18.6]],
    pockets: [[6.2, 16], [4.3, 13.6], [7.1, 7.8], [3.4, 4.2]],
    entries: [[7.5, 3.95]],
    tip: "Circle the lower U-barrier, then weave between the cargo islands. Flank the Heavy\u2019s mint rear panel. The upper gallery has offset openings\u2014recover the Seeker and return to the bottom entrance."
  },
  // Mission 7: stacked cross-walls, two entry gaps and a long central tripwire.
  // The cropped upper edge is closed by our boundary; all side lanes remain linked.
  {
    spawn: [9.85, 18.6],
    phone: [1.2, 3.65],
    exit: [9.85, 18.6],
    walls: [
      [0.65, 1.25, 3.85, 0.8],
      [2.55, 0.65, 0.85, 2.45],
      [5.8, 1.25, 5.55, 0.8],
      [7.05, 0.65, 0.85, 2.45],
      [1.8, 5, 7.2, 0.8],
      [2.55, 4.2, 0.85, 2.7],
      [7.05, 4.2, 0.85, 6.6],
      [0.65, 9, 3.85, 0.8],
      [2.55, 8.1, 0.85, 2.7],
      [5.8, 9, 3.2, 0.8],
      [1.8, 13, 7.2, 0.8],
      [2.55, 12.1, 0.85, 2.1],
      [7.05, 12.1, 0.85, 2.1],
      [1.8, 16, 2.7, 0.8],
      [2.55, 15.2, 0.85, 1.6],
      [5.8, 16, 5.55, 0.8],
      [7.05, 15.2, 0.85, 1.6],
      [10.55, 5, 0.8, 0.8],
      [10.55, 9, 0.8, 0.8],
      [10.55, 13, 0.8, 0.8]
    ],
    crates: [
      [0.7, 2.3, 1.55, 0.75],
      [8, 2.1, 0.85, 0.85],
      [9.2, 0.7, 2.1, 0.5],
      [3.45, 4.05, 2.1, 0.8],
      [10.45, 3.85, 0.85, 0.85],
      [1.8, 5.85, 0.7, 0.85],
      [4.65, 5.85, 2.15, 0.8],
      [5.95, 6.65, 0.85, 1.2],
      [8, 5.85, 0.85, 0.85],
      [0.7, 8, 1.5, 0.8],
      [10.2, 6.85, 1.1, 1.95],
      [3.45, 9.85, 1.05, 0.75],
      [0.7, 9.85, 1.3, 0.75],
      [5.85, 11.15, 0.9, 1.6],
      [6.75, 11.15, 2.1, 0.8],
      [1.8, 13.85, 0.7, 0.85],
      [4.6, 13.85, 1.5, 0.8],
      [10.2, 14.5, 1.1, 1.1],
      [3.45, 15.15, 0.85, 0.8],
      [9.3, 15.05, 2, 0.8],
      [1.8, 17.85, 2, 0.65],
      [10.35, 17.85, 0.95, 0.65],
      [0.7, 18.6, 1.8, 0.7],
      [6.2, 18.55, 2.65, 0.75],
      [7.1, 17.85, 0.85, 0.7]
    ],
    lasers: [[5.2, 6.65, 0.14, 6.35], [0.65, 4.5, 1.9, 0.14]],
    cast: [
      ["scout", [1.15, 15.1], [1.15, 13.4], [1.15, 11.6]],
      ["scout", [9.65, 12.4], [9.65, 10.6], [9.25, 10.6]],
      ["sentry", [4.1, 7.55], [4.85, 7.55], [4.85, 8.25]],
      ["heavy", [9.6, 7.6], [9.6, 6.5], [9.65, 5.75]],
      ["scout", [9.6, 3.4], [9.6, 2.85], [9.3, 2.85]],
      ["drone", [5.15, 2.8], [5.15, 1.1], [4.85, 1.1]]
    ],
    safe: [[5.15, 18.6], [5.15, 16.7], [5.1, 15.25], [9.6, 14.4], [9.65, 12], [9.65, 10.45], [9.65, 7.25], [9.65, 5.4], [9.65, 3.5], [5.9, 3.5], [4.3, 3.5], [1.2, 3.65]],
    back: [[4.3, 3.5], [4.1, 2.8], [5.15, 2.8], [9.65, 3.5], [9.65, 7.25], [9.65, 10.45], [9.65, 12], [9.6, 14.4], [5.1, 15.25], [5.15, 17.4], [5.15, 18.6], [9.85, 18.6]],
    pockets: [[4.1, 11.55], [5.15, 15.6], [9.6, 10.5], [4.2, 3.5]],
    entries: [[1.15, 6.95]],
    tip: "Enter through either lower gap. Cross the long central laser for a shorter route, or flank around the cross-walls using outer cover. Lasers alert nearby guards once; relocate before they arrive. Recover the Seeker in the upper-left pocket and return to the entrance."
  },
  // Mission 8: lower courtyard, laser-divided approach and a central U-room.
  // Side gaps are open passages; both phones must still be brought back separately.
  {
    spawn: [3.5, 18.85],
    phone: [6.2, 9.4],
    second: [5.8, 1.25],
    exit: [3.5, 18.85],
    walls: [
      [1.9, 2, 7.8, 0.8],
      [9, 0.65, 0.7, 2.15],
      [2.8, 4.6, 0.75, 3.5],
      [2.8, 4.6, 2, 0.75],
      [9, 4.6, 0.7, 3.5],
      [8, 4.6, 1.7, 0.75],
      [2.8, 9.5, 0.75, 3.5],
      [9, 9.5, 0.7, 3.5],
      [2.8, 12.3, 6.9, 0.7],
      [0.65, 15, 4.1, 0.75],
      [8.3, 15, 3.05, 0.75],
      [2, 17.8, 0.95, 0.9],
      [4.1, 17.8, 0.95, 0.9],
      [6.15, 17.8, 0.95, 0.9],
      [8.3, 17.8, 0.95, 0.9]
    ],
    crates: [
      [4.1, 2.85, 3, 0.95],
      [10.7, 3.5, 0.6, 1.7],
      [0.7, 5.65, 1, 2],
      [3.75, 6.7, 2.1, 1.4],
      [8.25, 5.35, 0.7, 1.7],
      [1.65, 10.45, 0.9, 2.5],
      [1.65, 13, 1.85, 0.75],
      [7.2, 10.8, 1.8, 1.5],
      [6.2, 11.5, 1, 0.8],
      [10.7, 9.5, 0.6, 1.85],
      [9.6, 14.05, 1.7, 0.85],
      [0.7, 15.85, 2.7, 0.85],
      [0.7, 18.3, 0.9, 1],
      [5, 18.85, 1.5, 0.45],
      [9.4, 17.8, 1.9, 1.3],
      [10.4, 16.8, 0.9, 1]
    ],
    lasers: [[6.55, 13, 0.14, 4.8]],
    cast: [
      ["scout", [1.15, 10], [1.15, 8.8], [1.15, 8.05]],
      ["scout", [10.15, 7.3], [10.15, 5.65], [10.1, 5.6]],
      ["heavy", [6.7, 10.1], [6.7, 8.8], [7.1, 7.7]],
      ["scout", [4.3, 10.55], [5.7, 10.55], [5.7, 9.6]],
      ["drone", [6.5, 4.15], [7.6, 4.15], [7.6, 5.5]],
      ["sentry", [8.75, 14.15], [7.75, 14.15], [7.75, 13.65]]
    ],
    safe: [[3.5, 17.15], [5.4, 16.8], [5.4, 14.3], [1.15, 14.4], [1.15, 8.8], [4.2, 8.8], [6.2, 9.4]],
    back: [[7.8, 9], [8, 8.8], [10.15, 8.8], [10.15, 12.7], [10.15, 13.6], [7.65, 13.8], [7.65, 16.8], [5.4, 17.15], [3.5, 17.15], [3.5, 18.85]],
    pockets: [[5.45, 16.65], [4.2, 8.8], [7.7, 9.6], [1.2, 3.4], [7.5, 1.25]],
    entries: [[1.2, 3.7]],
    tip: "Recover the phone inside the central room, then the phone beyond the upper wall. Both side openings give flanking routes. The courtyard laser briefly alerts nearby guards; the first pickup brings one reinforcement. Return each phone to the bottom entrance."
  },
  // Mission 9: long central aisle, staggered cargo and segmented side galleries.
  // The switch opens the full-width upper vault gate; no side route bypasses it.
  {
    spawn: [6, 18.8],
    phone: [6, 1.25],
    exit: [6, 18.8],
    walls: [
      [0.65, 0.65, 2.55, 2.15],
      [1.7, 3.7, 1.5, 3.2],
      [0.65, 7.9, 2.55, 1.5],
      [1.7, 10.4, 1.5, 5.6],
      [0.65, 17, 2.55, 2.35],
      [8.8, 0.65, 2.55, 3.4],
      [8.8, 5.15, 1.65, 2.6],
      [8.8, 7.75, 0.75, 4.25],
      [8.8, 12, 1.65, 3.2],
      [8.8, 16.3, 2.55, 3.05],
      [5.8, 11.4, 0.85, 0.85]
    ],
    crates: [
      [3.3, 4.45, 0.8, 1.8],
      [5.35, 3.8, 1.85, 1.65],
      [4.5, 7, 1.9, 2.2],
      [6.4, 7.8, 1.25, 1.9],
      [5.5, 9.2, 0.85, 0.7],
      [3.3, 11.75, 0.8, 2.45],
      [7.8, 10.8, 0.8, 2.5],
      [4.5, 15.05, 1.9, 1.6],
      [3.3, 18, 0.9, 1.25],
      [7.85, 17.3, 0.8, 2.05]
    ],
    cast: [
      ["scout", [7.3, 14.6], [6.8, 13.8], [5, 13.8]],
      ["scout", [4.5, 6.2], [7.6, 6.2], [7.6, 4.8]],
      ["heavy", [6.9, 10.5], [7.1, 11.7], [7.1, 12.8]],
      ["scout", [1.1, 10], [1.1, 7.3], [1.1, 4]],
      ["drone", [10.6, 9.3], [10.6, 11.3], [10.6, 11.4]],
      ["sentry", [7.7, 3.3], [5, 3.3], [4.6, 3.3]]
    ],
    safe: [[4, 17.3], [3.8, 16.7], [3.8, 15], [4.4, 14.6], [4.7, 10.5], [6.1, 10.5], [7.3, 10.25], [7.9, 7], [7.8, 3.2], [6, 3.2], [6, 1.25]],
    back: [[4.6, 3.3], [4.6, 6.25], [3.8, 7.4], [1.1, 7.3], [1.1, 10], [3.9, 10], [4.4, 14.6], [7, 14.6], [7, 17.3], [6, 18.8]],
    pockets: [[4, 17.3], [4.7, 10.5], [7.2, 13.7], [4.6, 6.25], [10.6, 10]],
    grates: [[7.7, 8, 0.85, 1.3]],
    tip: "Weave around the cargo islands and activate the central switch to open the upper vault. Side galleries help you flank patrols. The striped shortcut makes noise. Recover the Seeker beyond the gate, then return to the bottom entrance."
  },
  {
    spawn: [2, 18],
    phone: [9.4, 4],
    exit: [9.9, 17.8],
    walls: [[4, 10.5, 3.2, 3.8], [4, 4, 2.5, 3], [8.5, 13.5, 1.8, 1.8], [1.2, 7.7, 1.7, 1.3], [7.8, 1.5, 1.2, 1.1]],
    cast: [["scout", [3.1, 12], [3.1, 10], [2, 10]], ["sentry", [8, 12], [8, 10], [9.8, 10]], ["scout", [3.2, 5.8], [3.2, 3], [5.5, 3]], ["sentry", [7.6, 6.5], [7.6, 4], [9, 3]], ["drone", [10.4, 7], [10.4, 9], [9, 9]]],
    safe: [[1.3, 14.8], [3.2, 9.7], [3.2, 3.1], [7.1, 3.1]],
    back: [[7.5, 7.8], [7.6, 12.7], [7.7, 16.3], [10, 16.3]],
    pockets: [[5.6, 15.5], [9.2, 16.3]],
    entries: [[1.5, 3]],
    grates: [[7.5, 8.1, 1.3, 1.1]],
    tip: "Reach the shelter beside extraction, then cross when its mint lights open. The pickup response will pursue you."
  },
  {
    spawn: [10, 18],
    phone: [2, 3],
    exit: [2, 18],
    walls: [[6.2, 12, 3, 2.6], [2.8, 7.4, 3, 3], [6.2, 2.8, 3, 3.5], [1, 12.5, 2, 1], [9.5, 8.5, 1.6, 1], [3.5, 15.8, 2, 1]],
    cast: [["scout", [5.2, 12.8], [5.2, 11.3], [3.8, 11.3]], ["scout", [10.2, 12.8], [10.2, 11], [9, 10.5]], ["sentry", [7.2, 8], [7.2, 10.2], [8.8, 10.2]], ["scout", [2, 6], [2, 4.7], [1.3, 4.7]], ["drone", [4, 3.3], [4, 5.5], [5, 5.5]], ["sentry", [10.3, 4], [10.3, 2], [9.6, 2]]],
    safe: [[5.8, 17.5], [3, 15], [3.8, 11.4], [6.5, 11.1], [6.6, 7], [5.2, 6.5], [5, 3]],
    back: [[2, 5.7], [1.6, 10.8], [3.6, 11.6], [3.6, 14.6], [2, 16]],
    pockets: [[7.4, 16], [4.3, 12.3]],
    entries: [[10.5, 2]],
    grates: [[6.4, 8.8, 1.2, 1.2]],
    tip: "Break contact between rooms. Nearby enemies join a confirmed chase. They search your last sighting for five seconds before returning to patrol."
  },
  {
    spawn: [6, 18],
    phone: [6, 2.4],
    exit: [10, 18],
    walls: [[4.3, 9.5, 3.3, 4], [4.2, 4.8, 3.6, 2.8], [1.2, 13.5, 1.8, 1.2], [8.8, 14.5, 2.1, 1.2], [1.1, 5.4, 1.8, 2.2], [9.1, 6.5, 1.8, 2], [5.3, 15.4, 1.4, 1.1]],
    cast: [["scout", [3.4, 11], [3.4, 8.4], [2.5, 8.4]], ["sentry", [8.5, 11], [8.5, 13.5], [7.9, 14]], ["warden", [6, 8.4], [8.3, 8.4], [8.3, 4.1], [6, 3.7]], ["scout", [8.7, 3], [8.7, 2], [7.4, 2]], ["drone", [3.3, 4], [3.3, 2], [4.7, 2]]],
    safe: [[3.6, 16.5], [3.5, 13], [3.5, 8], [3.5, 4], [3.5, 1.2], [6, 1.2], [6, 2.4]],
    back: [[8.4, 3.9], [8.4, 8.9], [8.2, 13.8], [7.9, 16.5], [10, 17]],
    pockets: [[6, 14.4], [6, 18]],
    entries: [[2, 2.2], [10.5, 17.7]],
    grates: [[8, 11.5, 0.8, 1.3]],
    tip: "Flank the Warden, interrupt the drone and plan your escape. Taking the last Seeker calls both marked entrances."
  }
];
function applyPressure(l) {
  "worklet";
  l.combat = { version: 2, revision: 16 };
  const p = guardPressure(l);
  for (const g of l.patrols) {
    const heavy = g.combatRole === "heavy" || g.combatRole === "warden", drone = g.combatRole === "drone";
    g.pursuitSpeed = p.pursuit + (drone ? 0.3 : heavy ? -0.45 : 0);
    g.range = p.vision * (drone ? 1 : heavy ? 0.6 : 0.8);
    g.halfAngle = drone ? Math.PI / 3 : (heavy ? 75 : 95) * Math.PI / 360;
    g.spotSeconds = p.spot;
    g.pauseSeconds = 0.2;
    g.speed = heavy ? 0.75 : drone ? 1.15 : 0.9;
  }
  return l;
}
function applyHeistLayout(l) {
  "worklet";
  if (l.number <= 1) {
    const walls = [
      [1.65, 2, 2.2, 3.8],
      [7.1, 2, 0.85, 3.8],
      [7.1, 5, 2.3, 0.8],
      [1.65, 8.1, 8.7, 0.8],
      [1.65, 8.1, 0.85, 1.65],
      [5.65, 8.1, 0.9, 10.3],
      [1.65, 11.3, 8.7, 0.8],
      [9.5, 10, 0.85, 2.1],
      [1.65, 14.5, 8.7, 0.8],
      [1.65, 13, 0.85, 2.3],
      [1.65, 17.7, 8.7, 0.8],
      [9.5, 16.4, 0.85, 2.1]
    ];
    const crates = [
      [4, 3, 1.1, 1.8],
      [8.05, 3.7, 1.25, 1.15],
      [0.72, 3.1, 0.75, 1.55],
      [2.1, 7.05, 1.45, 0.95],
      [6.65, 7.05, 1.75, 0.95],
      [3.25, 9, 1.15, 0.95],
      [6.65, 10.05, 1.15, 1.15],
      [3.4, 13.3, 1.55, 1.1],
      [6.7, 12.2, 1.15, 1.95],
      [3.5, 15.4, 1.4, 2.15],
      [6.7, 16.45, 1.15, 1.15]
    ];
    l.spawn = { x: 3.1, y: 6.6 };
    l.phone = { x: 2.75, y: 16.4 };
    l.exit = { x: 10.05, y: 17.9, w: 1.15, h: 1.15 };
    l.blockers = [...l.blockers.slice(0, 4), ...walls.map(box), ...crates.map((v) => ({ ...box(v), kind: "crate" }))];
    l.gates = void 0;
    l.switches = void 0;
    l.targets = void 0;
    l.exitWindow = void 0;
    const cast = [
      ["drone", [5.7, 2.2], [5.7, 1.8]],
      ["scout", [10.55, 5.7], [10.55, 3], [10, 1.4]],
      ["scout", [2.95, 10.45], [4.8, 10.45]],
      ["scout", [8.6, 9.75], [8.6, 10.5]],
      ["scout", [2.8, 12.85], [4.8, 12.85]],
      ["scout", [8.6, 15.95], [10.7, 15.95]],
      ["scout", [10.75, 9.7], [10.75, 12.8]]
    ];
    l.patrols = cast.map(([role, ...anchors], index) => ({
      combatRole: role,
      route: anchors.map(point),
      ...role === "drone" ? { kind: "scanner" } : {},
      speed: 0.7,
      range: 3.5,
      halfAngle: Math.PI / 3.6,
      spotSeconds: 0.3,
      pauseSeconds: 0.6,
      investigates: true,
      ...index === 6 ? { reserveAfter: 0, pickupWave: 1 } : {}
    }));
    l.encounter = {
      islands: walls.slice(0, 3).map(box),
      grates: [],
      pockets: [{ x: 5.7, y: 6.7 }, { x: 1.15, y: 16.4 }],
      junctions: [{ x: 1.15, y: 6.5 }, { x: 10.75, y: 7 }, { x: 1.15, y: 10.3 }, { x: 10.75, y: 13 }, { x: 1.15, y: 16.4 }],
      routes: { approach: [{ x: 1.15, y: 6.5 }, { x: 1.15, y: 16.4 }, l.phone], escape: [{ x: 1.15, y: 16.4 }, { x: 1.15, y: 19 }, { x: 10.75, y: 19 }], fast: [l.phone] }
    };
    l.targetSeconds = 100;
    l.hardLimitSeconds = 240;
    l.briefing = "Tap a guard to approach and attack with your knife. Use the branching warehouse walls to flank, collect the Seeker and escape along the outer lane.";
    applyPressure(l);
    l.patrols[0].speed = 0;
    return l;
  }
  const plan = LAYOUTS[l.number - 2];
  l.combat = { version: 2, revision: 10 };
  l.spawn = point(plan.spawn);
  l.phone = point(plan.phone);
  const exit = point(plan.exit);
  l.exit = { x: exit.x - 0.65, y: exit.y - 0.55, w: 1.3, h: 1.1 };
  l.blockers = [...l.blockers.slice(0, 4), ...plan.walls.map(box), ...(plan.crates ?? []).map((v) => ({ ...box(v), kind: "crate" }))];
  l.gates = void 0;
  l.switches = void 0;
  l.exitWindow = void 0;
  l.targets = plan.second ? [l.phone, point(plan.second)] : void 0;
  l.patrols = plan.cast.map(([role, ...anchors], index) => {
    const route = anchors.map(point), heavy = role === "heavy" || role === "warden";
    return {
      route,
      roam: route,
      combatRole: role,
      ...role === "drone" ? { kind: "scanner" } : role === "warden" ? { kind: "warden" } : {},
      speed: heavy ? 0.62 : role === "drone" ? 0.95 : 0.72 + (l.number >= 7 ? 0.1 : 0),
      pursuitSpeed: heavy ? 1.9 : l.number <= 3 ? 2.05 : l.number <= 7 ? 2.4 : 2.7,
      range: role === "drone" ? 3.6 : role === "warden" ? 4.8 : heavy ? 4.3 : l.number <= 3 ? 3.5 : l.number <= 6 ? 4 : 4.3,
      halfAngle: role === "drone" ? Math.PI / 4 : Math.PI / 3.6,
      spotSeconds: role === "drone" ? 0.45 : l.number <= 3 ? 0.45 : 0.32,
      pauseSeconds: 0.45 + index % 2 * 0.25,
      investigates: true
    };
  });
  for (const entry of plan.entries ?? []) {
    const p = point(entry);
    l.patrols.push({ route: [p, { x: p.x, y: p.y - 0.5 }], roam: [p, { x: p.x, y: p.y - 0.5 }], combatRole: "scout", reserveAfter: 0, pickupWave: 1, speed: 0.75, pursuitSpeed: 2.6, range: 4.1, halfAngle: Math.PI / 3.6, spotSeconds: 0.35, pauseSeconds: 0.5, investigates: true });
  }
  l.encounter = { islands: plan.walls.slice(0, 2).map(box), grates: (plan.grates ?? []).map(box), ...plan.lasers ? { lasers: plan.lasers.map(box) } : {}, pockets: plan.pockets.map(point), junctions: [...plan.safe, ...plan.back, ...plan.pockets].map(point), routes: { approach: plan.safe.map(point), escape: plan.back.map(point), fast: [l.phone] } };
  if (l.number === 9) {
    l.switches = [{ x: 6.1, y: 10.5, kind: "power" }];
    l.gates = [{ box: { x: 3.2, y: 2.3, w: 5.6, h: 0.5, kind: "wall" }, mode: "power", power: 1, period: 10, openSeconds: 5, phase: 0 }];
  }
  if (l.number === 10) l.exitWindow = { period: 8, openSeconds: 4, phase: 0 };
  l.targetSeconds = l.number <= 3 ? 65 : l.number === 8 ? 115 : l.number <= 7 ? 80 : 95;
  l.hardLimitSeconds = l.number === 8 ? 240 : 210;
  l.briefing = plan.tip;
  return applyPressure(l);
}

// src/game/combat-levels.ts
var names = ["First Pickup", "Blind Corner", "Crossfire", "Loading Lockdown", "Skybridge", "Heavy Watch", "Split Route", "Twin Relay", "Dark Circuit", "Vault Window", "Security Grid", "Last Seeker"];
var lessons = ["Tap to move. Tap a robot to shoot. Take the Seeker and escape.", "Use cover to take the guards one at a time.", "Two firing lanes. Break one before crossing.", "Plan your return before the lockdown.", "Move between shots across the roof.", "Go around the Heavy instead of trading hits.", "Choose the safe route or risk the shorter lane.", "Bring both phones back. Your health must last.", "Tap the switch to open the vault gate.", "The exit opens for three seconds. Watch its light.", "Break the crossfire before taking the phone.", "Disable the Warden or find a way past. Then get out."];
var DENSE_ROOMS = [
  // Mission 2 — staggered barriers, cover pockets and cross-links.
  [
    ".........P",
    ".##.##.##.",
    ".##.##.##.",
    "1......##.",
    ".##.##.##.",
    ".##.##.##.",
    "........1.",
    "##..##..##",
    "##..##..##",
    ".##.......",
    ".##.##.##.",
    ".##.##.##.",
    "....1.....",
    ".##.##.##.",
    ".##.##.##.",
    "....##....",
    "..CC..CC..",
    "Sr.......E"
  ],
  // Mission 3 — staggered barriers, cover pockets and cross-links.
  [
    "P.........",
    "##.##.##..",
    "##.##.##..",
    "....##...2",
    "..##.##.##",
    "..##.##.##",
    ".1........",
    "##.##.##..",
    "##.##.##..",
    "....1..##.",
    "..##.##.##",
    "..##.##.##",
    "........2.",
    ".##.##.##.",
    ".##.##.##.",
    ".##.......",
    ".CC....CC.",
    "Sr......rE"
  ],
  // Mission 4 — staggered barriers, cover pockets and cross-links.
  [
    ".....2...P",
    ".###..###.",
    ".###..###.",
    ".##..1....",
    "##..##..##",
    "##..##..##",
    "..........",
    ".##.##.##.",
    ".##.##.##.",
    "...2...##.",
    "##..##..##",
    "##..##..##",
    ".1........",
    ".###..###.",
    ".###..###.",
    "....##....",
    "..CC..CC..",
    "Sr......rE"
  ],
  // Mission 5 — staggered barriers, cover pockets and cross-links.
  [
    "....P.....",
    ".##.##.##.",
    ".##.##.##.",
    "1...##..2.",
    "..##.##.##",
    "..##.##.##",
    "..........",
    "##..##..##",
    "##..##..##",
    "###.1.....",
    "##.##.##..",
    "##.##.##..",
    ".........2",
    ".##.##.##.",
    ".##.##.##.",
    ".......##.",
    ".CC....CC.",
    "Sr......rE"
  ],
  // Mission 6 — staggered barriers, cover pockets and cross-links.
  [
    ".........P",
    ".###..###.",
    ".###..###.",
    ".##..2....",
    ".##.##.##.",
    ".##.##.##.",
    "1....3...1",
    ".###..###.",
    ".###..###.",
    ".......##.",
    ".##.##.##.",
    ".##.##.##.",
    "....2.....",
    "##..##..##",
    "##..##..##",
    "....##....",
    "..CC..CC..",
    "Sr......rE"
  ],
  // Mission 7 — staggered barriers, cover pockets and cross-links.
  [
    "P....t....",
    "##.##.##..",
    "##.##.##..",
    ".2.....##1",
    "##..##..##",
    "##..##..##",
    "..........",
    "..##.##.##",
    "..##.##.##",
    ".1..##....",
    "##..##..##",
    "##..##..##",
    ".........2",
    ".##.##.##.",
    ".##.##.##.",
    ".##.1...##",
    ".CC....CC.",
    "Sr......rE"
  ],
  // Mission 8 — staggered barriers, cover pockets and cross-links.
  [
    "P........P",
    ".##.##.##.",
    ".##.##.##.",
    ".2..##..2.",
    ".##.##.##.",
    ".##.##.##.",
    "....1.....",
    "##..##..##",
    "##..##..##",
    ".##.......",
    "..##.##.##",
    "..##.##.##",
    ".....1....",
    "##.##.##..",
    "##.##.##..",
    ".......##.",
    "..CC..CC..",
    "Sr......rE"
  ],
  // Mission 9 — staggered barriers, cover pockets and cross-links.
  [
    "......##P.",
    "..##..##..",
    "..##..##3.",
    "..##2.##..",
    "......##..",
    "##..####GG",
    "..........",
    "W#.##.##..",
    "##1##.##..",
    "....##....",
    ".##.##.##.",
    ".##.##.##.",
    ".2........",
    "..##.##.##",
    "..##.##.##",
    ".##..1....",
    ".CC....CC.",
    "Sr..t...rE"
  ],
  // Mission 10 — staggered barriers, cover pockets and cross-links.
  [
    ".........P",
    ".###..###.",
    ".###..###.",
    "2...3..##.",
    ".##.##.##.",
    ".##.##.##.",
    ".........2",
    "##..##..##",
    "##..##..##",
    ".##..1....",
    ".##.##.##.",
    ".##.##.##.",
    "........1.",
    ".###..###.",
    ".###..###.",
    "....##....",
    "..CC..CC..",
    "Sr..t...rE"
  ],
  // Mission 11 — staggered barriers, cover pockets and cross-links.
  [
    "P....t....",
    "..##.##.##",
    "..##.##.##",
    ".##.....2.",
    "##.##.##..",
    "##.##.##..",
    ".2........",
    "##..##..##",
    "##..##..##",
    "...1##....",
    "..##.##.##",
    "..##.##.##",
    "....1.....",
    "##.##.##..",
    "##.##.##..",
    "...3...##.",
    ".CC....CC.",
    "Sr..t...rE"
  ],
  // Mission 12 — staggered barriers, cover pockets and cross-links.
  [
    "....P.....",
    ".###..###.",
    ".###..###.",
    ".##.4...2.",
    "##..##..##",
    "##..##..##",
    ".2...1....",
    "..##.##.##",
    "..##.##.##",
    "..3....###",
    "##..##..##",
    "##..##..##",
    "..1....2..",
    ".###..###.",
    ".###..###.",
    "....##....",
    "..CC..CC..",
    "Sr..t...rE"
  ]
];
function applyDenseLayout(l, n) {
  "worklet";
  const rows = DENSE_ROOMS[n - 2], boxes = l.blockers.slice(0, 4), phones = [], guards = [];
  const open = (x, y) => x >= 0 && x < 10 && y >= 0 && y < 18 && rows[y][x] !== "#" && rows[y][x] !== "C" && rows[y][x] !== "G";
  for (let y = 0; y < 18; y++) for (let x = 0; x < 10; ) {
    const mark = rows[y][x];
    if (mark !== "#" && mark !== "C") {
      x++;
      continue;
    }
    let end = x + 1;
    while (end < 10 && rows[y][end] === mark) end++;
    const prior = boxes.find((b) => b.x === x + 1 && b.w === end - x && b.y + b.h === y + 1 && b.kind === (mark === "C" ? "crate" : "wall"));
    if (prior) prior.h++;
    else boxes.push({ x: x + 1, y: y + 1, w: end - x, h: 1, kind: mark === "C" ? "crate" : "wall" });
    x = end;
  }
  let reserves = 0;
  for (let y = 0; y < 18; y++) for (let x = 0; x < 10; x++) {
    const mark = rows[y][x], at = { x: x + 1.5, y: y + 1.5 };
    if (mark === "S") l.spawn = at;
    if (mark === "P") phones.push(at);
    if (mark === "E") l.exit = { x: at.x - 0.55, y: at.y - 0.5, w: 1.1, h: 1 };
    if (mark === "W") l.switches = [{ ...at, kind: "power" }];
    if (mark === "G" && rows[y][x - 1] !== "G") {
      let width = 1;
      while (rows[y][x + width] === "G") width++;
      l.gates = [{ box: { x: x + 1, y: y + 1, w: width, h: 1, kind: "wall" }, mode: "power", power: 1, period: 10, openSeconds: 5, phase: 0 }];
    }
    if (!"1234rt".includes(mark)) continue;
    const reserve = mark === "r" || mark === "t", role = mark === "4" ? "warden" : mark === "3" ? "heavy" : mark === "2" || mark === "t" ? "sentry" : "scout";
    const directions = [[0, 1], [-1, 0], [0, -1], [1, 0]], rotation = (guards.length + n) % 4;
    let target = at, longest = 0;
    for (let i = 0; i < 4; i++) {
      const [dx, dy] = directions[(i + rotation) % 4];
      let steps = 0;
      while (steps < 3 && open(x + dx * (steps + 1), y + dy * (steps + 1))) steps++;
      if (steps > longest) {
        longest = steps;
        target = { x: at.x + dx * steps, y: at.y + dy * steps };
      }
    }
    guards.push({ combatRole: role, route: [at, target], speed: role === "heavy" || role === "warden" ? 1.05 : role === "sentry" ? 1.2 : 1.45, range: role === "sentry" ? 5.7 : role === "warden" ? 5.5 : 4.8, halfAngle: Math.PI / 3.5, spotSeconds: 0.3, pauseSeconds: 0.3, investigates: true, ...role === "warden" ? { kind: "warden" } : {}, ...reserve ? { reserveAfter: 2.2 + reserves++ * 2.2 } : {} });
  }
  l.blockers = boxes;
  l.patrols = guards;
  l.phone = phones[0];
  l.targets = phones.length > 1 ? phones : void 0;
  const waveTimes = n === 3 ? [3.5, 5.7] : n === 5 ? [4, 7] : n === 7 ? [4, 6.2, 8.4] : null;
  if (waveTimes) {
    let wave = 0;
    for (const guard of l.patrols) if (guard.reserveAfter !== void 0) guard.reserveAfter = waveTimes[wave++];
  }
  if (n === 10) l.patrols[0].route = [{ x: 1.5, y: 3.5 }, { x: 1.5, y: 1.5 }];
  if (n === 11) l.patrols[1].route = [{ x: 9.5, y: 4.5 }, { x: 9.5, y: 6.5 }];
  if (n === 12) l.patrols[4].route = [{ x: 4.5, y: 10.5 }, { x: 6.5, y: 10.5 }];
  l.exitWindow = n === 10 ? { period: 8, openSeconds: 3, phase: 0 } : void 0;
  l.targetSeconds = n === 8 ? 100 : n >= 9 ? 80 : 65;
  l.hardLimitSeconds = n === 8 ? 180 : n >= 9 ? 150 : 120;
}
function applyScoutEncounters(l, n) {
  "worklet";
  const mirror = n === 3 || n === 5;
  const point2 = (x, y) => ({ x: mirror ? 12 - x : x, y });
  const box2 = (x, y, w, h, kind = "wall") => ({ x: mirror ? 12 - x - w : x, y, w, h, kind });
  const upperX = n === 4 ? 4.6 : 4, lowerX = n === 5 ? 4.5 : 4;
  l.blockers = [
    ...l.blockers.slice(0, 4),
    box2(lowerX, 13.2, 2.7, 2),
    box2(upperX, 6, 2.7, 2),
    box2(1, 10, 3.5, 1.2),
    box2(7.5, 10, 3.5, 1.2),
    box2(2.3, 11.2, 0.4, 1.9),
    box2(4.2, 17, 3.2, 0.6),
    box2(1, 2, 2, 2),
    box2(8.6, 2, 2.4, 2),
    box2(5, 2, 1.4, 1.8),
    box2(1, 6, 1.3, 2),
    box2(9.5, 6, 1.5, 2),
    box2(1, 16, 1.5, 1),
    box2(9.2, 12, 1.8, 1.2),
    box2(9.2, 16.8, 1.6, 1, "crate")
  ];
  if (n === 4) l.blockers.push(box2(1, 4.7, 1.2, 0.6, "crate"));
  if (n === 5) l.blockers.push(box2(9.6, 4.7, 1.2, 0.6, "crate"));
  if (n === 6) l.blockers.push(box2(1, 4.7, 1.2, 0.6, "crate"));
  const enemy = (role, route, speed) => ({
    combatRole: role,
    route: route.map(([x, y]) => point2(x, y)),
    speed,
    range: role === "drone" ? 2.8 : role === "heavy" ? 3.1 : 2.9,
    halfAngle: Math.PI / 3.5,
    spotSeconds: 0.8,
    pauseSeconds: role === "drone" ? 0.55 : 0.85,
    investigates: true,
    ...role === "drone" ? { kind: "scanner" } : {}
  });
  const lowerDrone = enemy("drone", [[3.2, 12.4], [3.2, 15.9], [8, 15.9], [8, 12.4]], n <= 3 ? 0.85 : 1);
  const lowerGuard = enemy("scout", [[8.5, 16], [8.5, 14]], 0.7);
  const upperLeft = enemy(n >= 4 ? "drone" : "scout", n >= 4 ? [[3.2, 5.2], [3.2, 8.8], [8.1, 8.8], [8.1, 5.2]] : [[3.2, 8.8], [3.2, 6]], n >= 4 ? 1 : 0.65);
  const upperRight = enemy(n === 6 ? "heavy" : "scout", [[8.4, 8.8], [8.4, 6]], n === 6 ? 0.48 : 0.65);
  l.patrols = [lowerDrone, lowerGuard, upperLeft, upperRight];
  if (n === 6) {
    l.patrols.push(enemy("scout", [[3.8, 1.5], [3.8, 3.8]], 0.7), enemy("sentry", [[7.6, 3.8], [7.6, 1.5]], 0.6));
  }
  const reserves = n === 2 ? 0 : n === 6 ? 1 : 2;
  for (let i = 0; i < reserves; i++) l.patrols.push({ ...enemy("scout", [[i ? 10.5 : 1.6, 18.6], [i ? 8 : 3.4, 18.6]], 0.7), reserveAfter: 12 + i * 5 });
  l.spawn = point2(6, 18);
  l.phone = point2(n === 4 ? 7.5 : 4, 1.3);
  l.exit = { x: (mirror ? 12 - 9.8 : 9.8) - 0.55, y: 18, w: 1.1, h: 1 };
  l.targets = void 0;
  l.combat = { version: 2, revision: 7 };
  l.briefing = n === 2 ? "Clear the pair. Use cover. Take the Seeker and escape." : n === 6 ? "Two patrols, then the Heavy. Use the cover between encounters." : "Clear one patrol pair at a time. Take cover before the next.";
}
function legacyCombatLevel(mission) {
  "worklet";
  const old = getLevel(mission), n = Math.max(1, old.number), i = n - 1;
  const wall = [{ x: 0, y: 0, w: 12, h: 0.65, kind: "wall" }, { x: 0, y: 19.35, w: 12, h: 0.65, kind: "wall" }, { x: 0, y: 0, w: 0.65, h: 20, kind: "wall" }, { x: 11.35, y: 0, w: 0.65, h: 20, kind: "wall" }];
  const cover = (x, y, w, h, kind = "crate") => ({ "x": x, y, w, h, kind });
  const variants = [
    [cover(4, 13, 3, 1.2, "rack"), cover(2, 8.5, 2, 1.5), cover(7, 5, 2.5, 1.3, "rack")],
    [cover(3.5, 14, 2, 2), cover(6.5, 10, 3, 1.2, "rack"), cover(2, 6, 3, 1.3), cover(7.5, 3, 1.4, 2)],
    [cover(2, 13, 2.4, 1.3), cover(7.5, 13, 2.4, 1.3), cover(4.8, 8, 2.4, 2.8, "rack"), cover(2, 4, 2.5, 1.2), cover(8, 5, 2, 1.3)],
    [cover(3, 14, 6, 1.2, "rack"), cover(2, 8, 2.5, 2), cover(7.2, 6, 2.5, 1.5), cover(4.7, 3.4, 1.2, 2)]
  ];
  const blockers = [...wall, ...variants[i % 4].map((b) => ({ ...b }))];
  const roles = [["drone", "scout"], ["scout", "scout", "scout"], ["scout", "sentry", "scout"], ["sentry", "sentry", "scout"], ["scout", "sentry", "scout"], ["heavy", "scout", "scout"], ["sentry", "scout", "sentry", "scout"], ["heavy", "sentry", "sentry"], ["sentry", "scout", "sentry", "scout"], ["heavy", "sentry", "scout", "sentry"], ["heavy", "sentry", "scout", "sentry", "scout"], ["warden", "heavy", "sentry", "sentry"]];
  const rows = [11.2, 6.7, 2, 16.7, 9.6];
  const patrol2 = (role, index) => {
    const y = rows[index];
    return { route: [{ x: index % 2 ? 10.5 : 1.4, y }, { x: index % 2 ? 10.5 : 1.4, y: y + 0.6 }], speed: role === "heavy" || role === "warden" ? 0.6 : role === "sentry" ? 0.7 : 1, range: role === "sentry" ? 5 : 4.5, halfAngle: Math.PI / 3.2, spotSeconds: 0.3, pauseSeconds: 0.8, investigates: true, combatRole: role, ...role === "warden" ? { kind: "warden" } : {} };
  };
  const patrols = roles[i].map(patrol2);
  if (n === 1) {
    blockers.splice(4, blockers.length - 4, cover(4, 13, 3, 1.2, "rack"), cover(7, 6, 2.7, 1.2));
    patrols[0] = { ...patrol2("drone", 0), route: [{ x: 3, y: 11 }, { x: 3, y: 11.1 }], speed: 0 };
    patrols[1] = { ...patrol2("scout", 1), route: [{ x: 9, y: 10 }, { x: 8.5, y: 10.5 }], speed: 0.45, range: 3 };
  }
  const reserves = n === 2 ? 0 : n === 4 || n >= 11 ? 2 : 1;
  for (let r = 0; r < reserves; r++) patrols.push({ ...patrol2("scout", 0), route: [{ x: r ? 10.3 : 1.7, y: 2 }, { x: r ? 10.3 : 1.7, y: 3 }], reserveAfter: 2 + r * 2 });
  if (n === 5) blockers.push(cover(8.3, 14.8, 1.2, 2.4, "rack"));
  if (n === 6) blockers.push(cover(5.1, 4, 1.2, 3, "rack"));
  if (n === 7) blockers.push(cover(5.5, 15.5, 1.1, 1.6));
  if (n === 8) blockers.push(cover(5.2, 10, 2.2, 1.1, "rack"));
  if (n === 9) blockers.push(cover(5, 4, 1.1, 3, "rack"));
  if (n === 10) blockers.push(cover(2, 10, 2, 1.1));
  if (n === 11) blockers.push(cover(8.5, 8.3, 1, 2));
  if (n === 12) blockers.push(cover(5, 10.5, 1.8, 1.2));
  const phone = { x: n % 2 ? 9.8 : 2.1, y: 3.4 }, exit = { x: 8.9, y: 17.5, w: 1.8, h: 1.2 };
  const level = { ...old, id: `combat-v2:${mission}`, title: names[i], briefing: lessons[i], combat: { version: 2 }, spawn: { x: 2.1, y: 17.6 }, phone, exit, blockers, patrols, decoys: 0, gates: void 0, switches: void 0, targets: void 0, exitWindow: void 0, targetSeconds: n < 3 ? 100 : 150, hardLimitSeconds: n === 1 ? 300 : n === 8 ? 300 : 240 };
  if (n === 8) level.targets = [phone, { x: 9.8, y: 3.4 }];
  if (n === 9) {
    level.blockers.push(cover(8.55, 0.65, 0.25, 4.05, "wall"));
    level.switches = [{ x: 5.7, y: 11, kind: "power" }];
    level.gates = [{ box: cover(8.55, 4.7, 2.8, 0.25, "wall"), mode: "power", power: 1, period: 10, openSeconds: 5, phase: 0 }];
  }
  if (n === 10) level.exitWindow = { period: 8, openSeconds: 4, phase: 0 };
  level.combat = { version: 2, revision: 6 };
  if (n === 1) {
    level.blockers.push(cover(0.65, 0.65, 3.3, 7.7, "wall"), cover(5, 0.65, 2.5, 3.5, "wall"), cover(8.6, 15.6, 2.75, 0.9, "crate"), cover(0.8, 9.1, 1, 1.5, "wall"), cover(8.8, 12.8, 2.5, 0.85, "wall"), cover(4.2, 5, 1.15, 3, "wall"));
    level.patrols[2].route = [{ x: 4.4, y: 2 }, { x: 4.4, y: 3 }];
  }
  if (n > 1) {
    level.gates = void 0;
    level.switches = void 0;
    applyDenseLayout(level, n);
  }
  if (n >= 2) {
    let reserve = 0;
    for (const guard of level.patrols) {
      guard.speed *= n <= 4 ? 0.52 : n <= 8 ? 0.68 : 0.78;
      guard.range *= n <= 5 ? 0.6 : n <= 8 ? 0.72 : 0.78;
      guard.pauseSeconds = n <= 4 ? 0.85 : n <= 8 ? 0.65 : 0.5;
      if (n <= 5 && guard.combatRole === "sentry") guard.combatRole = "scout";
      if (guard.reserveAfter !== void 0) guard.reserveAfter = (n <= 4 ? 12 : n <= 8 ? 9 : 7) + reserve++ * 4;
    }
    if (n === 4) {
      let sentries = 0;
      for (const guard of level.patrols) if (guard.combatRole === "sentry" && sentries++ > 0) guard.combatRole = "scout";
    }
    level.hardLimitSeconds += n <= 4 ? 60 : 30;
    if (n === 10) level.exitWindow = { period: 8, openSeconds: 5, phase: 0 };
  }
  if (n >= 2 && n <= 6) applyScoutEncounters(level, n);
  return level;
}
function combatLevel(mission) {
  "worklet";
  return applyHeistLayout(applyCampaignLayout(legacyCombatLevel(mission)));
}

// server/replay.ts
import { z } from "zod";

// src/game/guards.ts
function makeGuards(mission, override) {
  "worklet";
  return (override ?? getLevel(mission)).patrols.map(({ route, range, halfAngle, spotSeconds, kind, sweep, activePower, combatRole = "scout", reserveAfter }) => ({ reactionTicks: 0, alerted: false, hp: { drone: 25, scout: 50, sentry: 75, heavy: 150, warden: 200 }[combatRole], maxHp: { drone: 25, scout: 50, sentry: 75, heavy: 150, warden: 200 }[combatRole], combatRole, gunPhase: "ready", gunTicks: 0, burstLeft: 0, shotAngle: 0, spawned: reserveAfter === void 0, flash: 0, x: route[0].x, y: route[0].y, px: route[0].x, py: route[0].y, angle: sweep ? sweep.angle : Math.atan2(route[1].y - route[0].y, route[1].x - route[0].x), target: 1, wait: 0, exposure: 0, seesPlayer: false, range, halfAngle, spotSeconds, clock: 0, active: reserveAfter === void 0 && (activePower === void 0 || activePower === 0), kind: kind ?? "patrol", lureId: 0, lureAttemptId: 0, lureRetryAt: 0, nextReport: 0, nextChase: 0, mode: "patrol", path: [], pathIndex: 0, searchLeft: 0, searchAngle: 0, lastSeen: { ...route[0] } }));
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
  if (((level.combat?.revision ?? 0) >= 6 || d > 0.5) && (dx * Math.cos(guard.angle) + dy * Math.sin(guard.angle)) / d < Math.cos(guard.halfAngle)) return false;
  return sightDistance(guard.x, guard.y, dx / d, dy / d, d, level) >= d - 1e-7;
}
function destination(g, point2, level, mode) {
  "worklet";
  const path = findPath(g, point2, level);
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
    const alarming = (security?.alarmSeconds ?? -1) >= 0, visibleBefore = sees(g, x, y, level);
    if (alarming && spec.kind !== "scanner") {
      const lured = noise?.kind === "decoy" && g.lureId === noise.id;
      if (visibleBefore && g.clock >= g.nextChase) {
        g.lureId = 0;
        g.lastSeen = { x, y };
        destination(g, g.lastSeen, level, "investigate");
        g.nextChase = g.clock + SECURITY.chaseRepathSeconds;
      }
      if (!lured && !visibleBefore && g.clock >= g.nextReport) {
        g.lastSeen = { x, y };
        const found = destination(g, g.lastSeen, level, "investigate");
        g.nextReport = g.clock + (found ? SECURITY.reportSeconds : 1);
      }
    }
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
    } else if (g.exposure === 0 || alarming) {
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
    const visible2 = sees(g, x, y, level);
    if (spec.investigates) {
      if (visible2) g.lastSeen = { x, y };
      else if (g.seesPlayer) {
        g.lureId = 0;
        destination(g, g.lastSeen, level, "investigate");
      }
    }
    g.seesPlayer = visible2;
    g.exposure = visible2 ? Math.min(1, g.exposure + dt / g.spotSeconds) : Math.max(0, g.exposure - dt / GUARD_TUNING.forgetSeconds);
  }
}

// src/game/melee.ts
function knifeCombat(l) {
  "worklet";
  return (l.combat?.revision ?? 0) >= 15;
}
function knifeReach(g) {
  "worklet";
  return g.combatRole === "heavy" || g.combatRole === "warden" ? 1.05 : 0.85;
}
function meleeState(s) {
  "worklet";
  return s.combat.melee ?? (s.combat.melee = { swings: 0, hits: 0, blocks: 0, noiseId: 0, noiseRadius: 0, target: -1, started: -100, impactAt: 0, until: 0, angle: 0, resolved: true });
}
function clearMelee(s) {
  "worklet";
  const m = s.combat?.melee;
  if (m) {
    m.target = -1;
    m.resolved = true;
  }
}
function canKnifeHit(s, g, l) {
  "worklet";
  const dx = g.x - s.x, dy = g.y - s.y, d = Math.hypot(dx, dy);
  return g.active && g.hp > 0 && d <= knifeReach(g) + 0.08 && (d < 1e-6 || sightDistance(s.x, s.y, dx / d, dy / d, d, l) >= d - 1e-7);
}
function stepMelee(s, l) {
  "worklet";
  const c = s.combat, m = meleeState(s), o = c.order, g = o?.kind === "attack" ? s.guards[o.target] : void 0;
  if (!g || !g.active || g.hp <= 0) {
    clearMelee(s);
    return;
  }
  if (m.target !== o.target) {
    m.target = o.target;
    m.resolved = true;
  }
  if (!m.resolved && s.ticks >= m.impactAt) {
    m.resolved = true;
    const delta = Math.atan2(Math.sin(Math.atan2(g.y - s.y, g.x - s.x) - m.angle), Math.cos(Math.atan2(g.y - s.y, g.x - s.x) - m.angle));
    if (canKnifeHit(s, g, l) && Math.abs(delta) <= Math.PI / 2) {
      const dx = s.x - g.x, dy = s.y - g.y, d = Math.hypot(dx, dy) || 1, side = (dx * Math.cos(g.angle) + dy * Math.sin(g.angle)) / d;
      const rear = side <= -0.35, front = side >= 0.5, armor = g.combatRole === "heavy" || g.combatRole === "warden";
      const unaware = !g.alerted && !g.heist?.hunting && !g.seesPlayer && !sees(g, s.x, s.y, l) && g.hp === g.maxHp;
      const damage = armor ? front ? 0 : rear ? 75 : 20 : g.combatRole === "drone" ? 25 : rear && unaware ? g.hp : 35;
      m.noiseId++;
      m.noiseRadius = damage ? 1.5 : 2.5;
      c.noise = { x: g.x, y: g.y };
      c.noiseLeft = 0.4;
      if (armor && g.heist) g.heist.armorHit = front ? "front" : rear ? "rear" : "side";
      if (!damage) {
        g.flash = 0.15;
        m.blocks++;
        c.feedback = "cover";
        c.feedbackLeft = 0.65;
        c.order = null;
        c.path = [];
        c.pathIndex = 0;
        delete c.attackPlan;
        return;
      }
      m.hits++;
      c.hitEvents++;
      g.hp = Math.max(0, g.hp - damage);
      g.flash = 0.15;
      if (rear && unaware) {
        c.feedback = "ambush";
        c.feedbackLeft = 0.65;
      }
      if (!g.hp) {
        g.active = false;
        g.seesPlayer = false;
        c.kills++;
        if (g.heist) g.heist.charge = 0;
      } else {
        g.lastSeen = { x: s.x, y: s.y };
        if (!g.alerted) {
          g.reactionTicks = Math.max(g.reactionTicks, 8);
          g.gunPhase = "ready";
          g.gunTicks = 0;
        }
        g.alerted = true;
        if (g.brain) {
          g.brain.goal = { ...g.lastSeen };
          g.brain.plan = true;
          g.brain.alertUntil = s.ticks + 180;
        }
        g.mode = "investigate";
      }
    }
  }
  if (m.resolved && s.ticks >= m.until && c.cooldown === 0 && canKnifeHit(s, g, l)) {
    m.swings++;
    m.started = s.ticks;
    m.impactAt = s.ticks + 4;
    m.until = s.ticks + 11;
    m.angle = Math.atan2(g.y - s.y, g.x - s.x);
    m.resolved = false;
    c.cooldown = 11;
    c.path = [];
    c.pathIndex = 0;
    s.facing = Math.abs(g.x - s.x) > Math.abs(g.y - s.y) ? g.x < s.x ? 1 : 3 : g.y < s.y ? 2 : 0;
  }
}

// src/game/encounters.ts
function random(b) {
  "worklet";
  b.rng = Math.imul(b.rng, 1664525) + 1013904223 >>> 0;
  return b.rng / 4294967296;
}
function brain(g, index, l) {
  "worklet";
  if (g.brain) return g.brain;
  let seed = 2166136261;
  for (let j = 0; j < l.id.length; j++) seed = Math.imul(seed ^ l.id.charCodeAt(j), 16777619) >>> 0;
  return g.brain = { rng: seed + Math.imul(index + 1, 2654435761) >>> 0, goal: null, plan: false, nextPlan: 0, seenFor: 0, lastSight: -100, reportAt: 0, heardShot: 0, pickupSeen: 0, searchUntil: 0, searchStep: 0, lastAnchor: 0, alertUntil: 0, blockedFor: 0, supportUntil: 0 };
}
function face(g, a, dt) {
  "worklet";
  const d = Math.atan2(Math.sin(a - g.angle), Math.cos(a - g.angle));
  g.angle += Math.max(-Math.PI * 1.8 * dt, Math.min(Math.PI * 1.8 * dt, d));
}
function goal(g, p, mode) {
  "worklet";
  const b = g.brain;
  if (!b.goal || Math.hypot(b.goal.x - p.x, b.goal.y - p.y) > 0.3 || g.mode !== mode) {
    b.goal = { x: p.x, y: p.y };
    b.plan = true;
  }
  g.mode = mode;
}
function investigate(g, p, tick, delay = 0) {
  "worklet";
  g.lastSeen = { x: p.x, y: p.y };
  goal(g, p, "investigate");
  g.brain.alertUntil = tick + 180;
  g.brain.searchUntil = 0;
  if (!g.alerted) {
    g.alerted = true;
    g.reactionTicks = Math.max(g.reactionTicks, delay);
  }
}
function shareSighting(s, index, l) {
  "worklet";
  const reporter = s.guards[index], b = brain(reporter, index, l);
  if (s.ticks < b.reportAt) return 0;
  b.reportAt = s.ticks + 60;
  const cap = l.number === 1 ? 0 : l.number <= 3 ? 1 : l.number <= 8 ? 2 : 3;
  const candidates = s.guards.map((g, i) => ({ g, i, d: Math.hypot(g.x - reporter.x, g.y - reporter.y) })).filter((v) => v.i !== index && v.g.active && v.g.hp > 0 && v.g.combatRole !== "drone" && !v.g.seesPlayer && v.d <= 4.8).sort((a, c) => a.d - c.d || a.i - c.i);
  let available = Math.max(0, cap - s.guards.filter((g) => g.active && g.hp > 0 && !g.seesPlayer && (g.brain?.supportUntil ?? 0) > s.ticks).length);
  let count = 0;
  for (const v of candidates) {
    const other = brain(v.g, v.i, l), supporting = other.supportUntil > s.ticks;
    if (!supporting && available <= 0) continue;
    investigate(v.g, reporter.lastSeen, s.ticks, supporting ? 0 : 9 + count * 4);
    other.supportUntil = s.ticks + 180;
    other.nextPlan = s.ticks + count * 3;
    if (!supporting) available--;
    count++;
  }
  return count;
}
function roam(g, index, s, l) {
  "worklet";
  const b = g.brain, anchors = l.patrols[index].roam ?? l.patrols[index].route;
  let best = -Infinity, pick = 0;
  for (let j = 0; j < anchors.length; j++) {
    const p = anchors[j], crowded = s.guards.some((other, k) => k !== index && other.active && other.hp > 0 && Math.hypot((other.brain?.goal?.x ?? other.x) - p.x, (other.brain?.goal?.y ?? other.y) - p.y) < 0.9);
    const score = random(b) * 2 - (j === b.lastAnchor ? 3 : 0) - (crowded ? 3 : 0) - Math.hypot(g.x - p.x, g.y - p.y) * 0.035;
    if (score > best) {
      best = score;
      pick = j;
    }
  }
  b.lastAnchor = pick;
  g.target = pick % l.patrols[index].route.length;
  goal(g, anchors[pick], "patrol");
}
function search(g, tick) {
  "worklet";
  const b = g.brain;
  g.mode = "search";
  g.path = [];
  g.pathIndex = 0;
  b.goal = null;
  b.plan = false;
  b.searchStep = 0;
  b.searchUntil = tick + 75 + Math.floor(random(b) * 30);
  g.searchAngle = g.angle;
}
function hasCombatContact(g, x, y, tick, l) {
  "worklet";
  if (sees(g, x, y, l)) return true;
  if ((l.combat?.revision ?? 0) < 9 || (g.brain?.trackingUntil ?? -1) < tick) return false;
  const dx = x - g.x, dy = y - g.y, d = Math.hypot(dx, dy);
  if (d > g.range + 0.6) return false;
  if (d < 1e-6) return true;
  if (d > 1.8 && (dx * Math.cos(g.angle) + dy * Math.sin(g.angle)) / d < -0.5) return false;
  return sightDistance(g.x, g.y, dx / d, dy / d, d, l) >= d - 1e-7;
}
function updateEncounterGuards(s, dt, l, shoot) {
  "worklet";
  let paths = 2;
  const c = s.combat, retainContact = (l.combat?.revision ?? 0) >= 9;
  const start = Math.floor(s.ticks / 3) % Math.max(1, s.guards.length);
  for (let k = 0; k < s.guards.length; k++) {
    const i = (k + start) % s.guards.length, g = s.guards[i], spec = l.patrols[i], b = brain(g, i, l);
    g.px = g.x;
    g.py = g.y;
    if (g.hp <= 0) {
      g.active = false;
      g.seesPlayer = false;
      continue;
    }
    if (spec.reserveAfter !== void 0 && !g.spawned) {
      g.active = s.securityAlarm && s.alarmSeconds >= spec.reserveAfter && Math.hypot(g.x - s.x, g.y - s.y) > 2.2;
      if (!g.active) continue;
      g.spawned = true;
    }
    g.active = true;
    g.clock += dt;
    g.flash = Math.max(0, g.flash - dt);
    g.range = spec.range;
    const rawSeen = hasCombatContact(g, s.x, s.y, s.ticks, l), reacquired = retainContact && rawSeen && (b.trackingUntil ?? -1) >= s.ticks;
    g.seesPlayer = rawSeen;
    b.seenFor = rawSeen ? Math.min(1, b.seenFor + dt) : 0;
    g.exposure = rawSeen ? reacquired ? 1 : Math.min(1, b.seenFor / Math.max(0.3, spec.spotSeconds)) : Math.max(0, g.exposure - dt * 3);
    const confirmed = rawSeen && g.exposure >= 1;
    if (rawSeen) {
      g.lastSeen = { x: s.x, y: s.y };
      b.lastSight = s.ticks;
    }
    if (confirmed) {
      if (retainContact) {
        b.trackingUntil = s.ticks + 60;
        g.wait = 0;
        b.searchUntil = 0;
      }
      b.supportUntil = 0;
      s.spotted = true;
      g.alerted = true;
      b.alertUntil = s.ticks + 180;
      shareSighting(s, i, l);
      if (s.ticks >= g.nextChase || retainContact && g.mode !== "investigate") {
        goal(g, g.lastSeen, "investigate");
        g.nextChase = s.ticks + 18;
      }
    }
    if (b.pickupSeen < s.thefts) {
      b.pickupSeen = s.thefts;
      const p2 = l.targets?.[Math.max(0, s.thefts - 1)] ?? l.phone;
      if (!rawSeen && Math.hypot(g.x - p2.x, g.y - p2.y) < 6) investigate(g, p2, s.ticks, 9);
    }
    if (c.shots > b.heardShot) {
      b.heardShot = c.shots;
      if (!rawSeen && c.noiseLeft > 0 && Math.hypot(c.noise.x - g.x, c.noise.y - g.y) < 3.2) investigate(g, c.noise, s.ticks, 9);
    }
    if (!rawSeen && g.mode === "investigate" && b.lastSight === s.ticks - 1) goal(g, g.lastSeen, "investigate");
    if (g.reactionTicks > 0) {
      g.reactionTicks--;
      continue;
    }
    if (retainContact && confirmed) face(g, Math.atan2(s.y - g.y, s.x - g.x), dt);
    const drone = g.combatRole === "drone";
    const aim = g.combatRole === "warden" ? 36 : g.combatRole === "heavy" ? 33 : g.combatRole === "sentry" ? 27 : 30;
    const burst = g.combatRole === "warden" ? 3 : g.combatRole === "heavy" ? 3 : g.combatRole === "sentry" ? 2 : 1;
    const recovery = g.combatRole === "heavy" || g.combatRole === "warden" ? 42 : 33;
    if (!drone) {
      if (g.gunPhase === "aim") {
        if (!rawSeen) {
          g.gunPhase = "recover";
          g.gunTicks = 15;
        } else {
          if (g.gunTicks > 6) g.shotAngle = Math.atan2(s.y - g.y, s.x - g.x);
          if (!retainContact || !confirmed) face(g, g.shotAngle, dt);
          if (--g.gunTicks <= 0) {
            g.gunPhase = "fire";
            g.burstLeft = burst;
            g.gunTicks = 0;
          }
          continue;
        }
      }
      if (g.gunPhase === "fire") {
        if (g.gunTicks-- <= 0) {
          shoot(s, g, g.shotAngle + (burst > 1 ? (g.burstLeft - (burst + 1) / 2) * 0.12 : 0), i, l.number <= 3 ? 15 : 18);
          g.burstLeft--;
          g.gunTicks = 7;
          if (g.burstLeft <= 0) {
            g.gunPhase = "recover";
            g.gunTicks = recovery;
          }
        }
        continue;
      }
      if (g.gunPhase === "recover") {
        if (--g.gunTicks <= 0) g.gunPhase = "ready";
        else if (g.gunTicks > recovery - 7) continue;
      }
      if (confirmed && g.gunPhase === "ready") {
        g.gunPhase = "aim";
        g.gunTicks = aim;
        g.shotAngle = Math.atan2(s.y - g.y, s.x - g.x);
        c.aimEvents++;
        continue;
      }
    }
    if (retainContact && confirmed && !drone) continue;
    if (g.mode === "search") {
      if (s.ticks >= b.searchUntil) {
        g.alerted = false;
        goal(g, spec.route[0], "return");
      } else {
        face(g, g.searchAngle + Math.sin((s.ticks - b.searchUntil) * 0.045) * 1.4, dt);
        if (b.searchStep < 2 && s.ticks >= b.searchUntil - 65 + b.searchStep * 25) {
          const anchors = spec.roam ?? spec.route, p2 = anchors[(b.lastAnchor + b.searchStep + 1) % anchors.length];
          b.searchStep++;
          if (Math.hypot(p2.x - g.lastSeen.x, p2.y - g.lastSeen.y) < 3.5) {
            b.goal = { ...p2 };
            b.plan = true;
          }
        }
      }
    }
    if (g.wait > 0) {
      g.wait = Math.max(0, g.wait - dt);
      face(g, g.searchAngle + Math.sin(g.clock * 2) * 0.35, dt);
      continue;
    }
    if (!b.goal && g.mode === "patrol") roam(g, i, s, l);
    if (b.plan && b.goal && s.ticks >= b.nextPlan && paths > 0) {
      paths--;
      g.path = findPath(g, b.goal, l);
      g.pathIndex = 0;
      b.plan = false;
      b.nextPlan = s.ticks + 9;
      if (!g.path.length) {
        b.goal = null;
        g.wait = 0.3;
        if (g.mode === "return") g.mode = "patrol";
        if (g.mode === "investigate") search(g, s.ticks);
      }
    }
    if (b.plan) continue;
    const p = g.path[g.pathIndex];
    if (p) {
      const dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy), travel = Math.min(d, spec.speed * (g.mode === "investigate" ? 1.22 : 1) * dt);
      if (d > 0.01 && !(retainContact && confirmed)) face(g, Math.atan2(dy, dx), dt);
      const next = { x: d ? g.x + dx / d * travel : g.x, y: d ? g.y + dy / d * travel : g.y };
      const occupied = s.guards.some((other, j) => j !== i && other.active && other.hp > 0 && Math.hypot(next.x - other.x, next.y - other.y) < 0.48 && Math.hypot(g.x - other.x, g.y - other.y) >= 0.48);
      if (!walkableSegment(g, next, l)) {
        b.plan = true;
        b.nextPlan = s.ticks + 9;
      } else if (!occupied) {
        b.blockedFor = 0;
        g.x = next.x;
        g.y = next.y;
        if (d <= travel + 1e-3) g.pathIndex++;
      } else if (++b.blockedFor > 24 + i * 3) {
        b.blockedFor = 0;
        g.path = [];
        g.pathIndex = 0;
        b.goal = null;
        g.wait = 0.25;
        if (g.mode === "patrol" || g.mode === "return") {
          g.mode = "patrol";
          roam(g, i, s, l);
        } else search(g, s.ticks);
      }
    } else if (b.goal) {
      b.goal = null;
      if (g.mode === "investigate") search(g, s.ticks);
      else if (g.mode === "return") {
        g.mode = "patrol";
        g.alerted = false;
        g.wait = 0.4;
      } else if (g.mode === "patrol") {
        g.wait = spec.pauseSeconds + random(b) * 0.55;
        g.searchAngle = g.angle;
      }
    } else if (g.mode === "investigate" && s.ticks > b.alertUntil) search(g, s.ticks);
  }
}

// src/game/heist-guards.ts
var ENTRY_WARNING_TICKS = 24;
var RADIO_RADIUS = 5;
var SEARCH_TICKS = 150;
var INVESTIGATE_TICKS = 360;
function random2(b) {
  "worklet";
  b.rng = Math.imul(b.rng, 1664525) + 1013904223 >>> 0;
  return b.rng / 4294967296;
}
function brain2(g, index, l) {
  "worklet";
  if (!g.brain) {
    let seed = 2166136261;
    for (let j = 0; j < l.id.length; j++) seed = Math.imul(seed ^ l.id.charCodeAt(j), 16777619) >>> 0;
    g.brain = { rng: seed + Math.imul(index + 1, 2654435761) >>> 0, goal: null, plan: false, nextPlan: 0, seenFor: 0, lastSight: -100, reportAt: 0, heardShot: 0, pickupSeen: 0, searchUntil: 0, searchStep: 0, lastAnchor: 0, alertUntil: 0, blockedFor: 0, supportUntil: 0 };
  }
  if (!g.heist) g.heist = { role: "patrol", charge: 0, broadcastUntil: 0, cooldownUntil: 0, arrivalUntil: 0, heardGrate: 0, armorHit: "none" };
  return g.brain;
}
function face2(g, angle, dt) {
  "worklet";
  const delta = Math.atan2(Math.sin(angle - g.angle), Math.cos(angle - g.angle));
  const speed = g.combatRole === "heavy" || g.combatRole === "warden" ? Math.PI * 1.2 : Math.PI * 1.8;
  g.angle += Math.max(-speed * dt, Math.min(speed * dt, delta));
}
function destination2(g, p, mode) {
  "worklet";
  const b = g.brain;
  if (!b.goal || Math.hypot(b.goal.x - p.x, b.goal.y - p.y) > 0.45 || g.mode !== mode || !b.plan && g.pathIndex >= g.path.length && Math.hypot(p.x - g.x, p.y - g.y) > 0.25) {
    b.goal = { x: p.x, y: p.y };
    b.plan = true;
  }
  g.mode = mode;
  g.wait = 0;
}
function investigate2(g, p, tick, role = "pursuer") {
  "worklet";
  g.lastSeen = { x: p.x, y: p.y };
  g.heist.role = role;
  destination2(g, p, "investigate");
  g.brain.searchUntil = 0;
  g.brain.alertUntil = tick + INVESTIGATE_TICKS;
  if (!g.alerted) {
    g.alerted = true;
    g.reactionTicks = Math.max(g.reactionTicks, 8);
  }
}
function contact(g, p, l) {
  "worklet";
  return sees(g, p.x, p.y, l);
}
function closeOnContact(g, p, l, speed, dt) {
  "worklet";
  if (!walkableSegment(g, p, l)) return false;
  const dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy), travel = Math.min(Math.max(0, d - 1.15), speed * dt);
  if (d > 1e-6) {
    g.x += dx / d * travel;
    g.y += dy / d * travel;
  }
  return true;
}
function trackedShot(g, s, dt, hard) {
  "worklet";
  const lead = hard ? Math.min(0.18, Math.hypot(s.x - g.x, s.y - g.y) / 16) : 0;
  return Math.atan2(s.y - g.y + (s.y - s.py) / dt * lead, s.x - g.x + (s.x - s.px) / dt * lead);
}
function pursue(g, p, tick) {
  "worklet";
  investigate2(g, p, tick);
  g.heist.hunting = true;
  g.brain.trackingUntil = tick + 30;
}
function shareHeistSighting(s, index, l) {
  "worklet";
  const reporter = s.guards[index], b = brain2(reporter, index, l);
  if (s.ticks < b.reportAt) return 0;
  b.reportAt = s.ticks + 12;
  const snapshot = { x: reporter.lastSeen.x, y: reporter.lastSeen.y, tick: s.ticks };
  s.combat.hunt = snapshot;
  s.spotted = true;
  let count = 0;
  for (let i = 0; i < s.guards.length; i++) {
    const g = s.guards[i];
    if (!g.spawned || !g.active || g.hp <= 0 || Math.hypot(g.x - reporter.x, g.y - reporter.y) > RADIO_RADIUS) continue;
    if (i !== index && g.seesPlayer) continue;
    brain2(g, i, l);
    pursue(g, snapshot, s.ticks);
    g.heist.radioAt = s.ticks;
    if (i !== index) count++;
  }
  return count;
}
function crossesLaser(ax, ay, bx, by, r, margin) {
  "worklet";
  let enter = 0, leave = 1;
  for (let axis = 0; axis < 2; axis++) {
    const a = axis ? ay : ax, d = (axis ? by : bx) - a, min = (axis ? r.y : r.x) - margin, max = (axis ? r.y + r.h : r.x + r.w) + margin;
    if (Math.abs(d) < 1e-9) {
      if (a < min || a > max) return false;
      continue;
    }
    const t1 = (min - a) / d, t2 = (max - a) / d;
    enter = Math.max(enter, Math.min(t1, t2));
    leave = Math.min(leave, Math.max(t1, t2));
    if (enter > leave) return false;
  }
  return true;
}
function updateTripwires(s, l) {
  "worklet";
  const lasers = l.encounter?.lasers;
  if (!lasers?.length || !s.combat || s.status !== "playing") return;
  const event = s.combat.tripwire ?? (s.combat.tripwire = { id: 0, inside: lasers.map(() => false), until: 0, x: 0, y: 0, laser: -1 });
  for (let j = 0; j < lasers.length; j++) {
    const r = lasers[j], touching = crossesLaser(s.px, s.py, s.x, s.y, r, 0.16);
    if (event.inside[j]) {
      if (!crossesLaser(s.x, s.y, s.x, s.y, r, 0.28)) event.inside[j] = false;
      continue;
    }
    if (!touching) continue;
    event.inside[j] = true;
    event.id++;
    event.until = s.ticks + 45;
    event.x = s.x;
    event.y = s.y;
    event.laser = j;
    s.spotted = true;
    for (let i = 0; i < s.guards.length; i++) {
      const g = s.guards[i];
      if (!g.spawned || !g.active || g.hp <= 0 || Math.hypot(g.x - s.x, g.y - s.y) > 5) continue;
      brain2(g, i, l);
      if (!g.heist.hunting && !g.seesPlayer) investigate2(g, event, s.ticks);
    }
  }
}
function roam2(g, index, s, l) {
  "worklet";
  const b = g.brain, anchors = l.patrols[index].roam ?? l.patrols[index].route;
  let best = -Infinity, pick = 0;
  for (let j = 0; j < anchors.length; j++) {
    const p = anchors[j], crowded = s.guards.some((o, k) => k !== index && o.active && o.hp > 0 && Math.hypot((o.brain?.goal?.x ?? o.x) - p.x, (o.brain?.goal?.y ?? o.y) - p.y) < 1.1);
    const value = random2(b) * 2 - (j === b.lastAnchor ? 3 : 0) - (crowded ? 4 : 0);
    if (value > best) {
      best = value;
      pick = j;
    }
  }
  b.lastAnchor = pick;
  g.heist.role = "patrol";
  destination2(g, anchors[pick], "patrol");
}
function search2(g, tick) {
  "worklet";
  const b = g.brain;
  g.mode = "search";
  g.path = [];
  g.pathIndex = 0;
  b.goal = null;
  b.plan = false;
  b.searchStep = 0;
  b.searchUntil = tick + SEARCH_TICKS;
  g.heist.searchNext = tick;
  g.heist.searchCycle = 0;
  g.searchAngle = g.angle;
}
function searchCorner(g, index, s, l) {
  "worklet";
  const b = g.brain, h = g.heist, cycle = h.searchCycle ?? 0;
  h.searchCycle = cycle + 1;
  const angle = (index * 0.618 + cycle * 0.381966 + random2(b) * 0.12) * Math.PI * 2, radius = 1.5 + cycle % 3;
  let point2;
  for (let n = 0; n < 8; n++) {
    const a = angle + n * Math.PI / 4, p = { x: g.lastSeen.x + Math.cos(a) * radius, y: g.lastSeen.y + Math.sin(a) * radius };
    if (p.x > 0.7 && p.y > 0.7 && p.x < l.width - 0.7 && p.y < l.height - 0.7 && Math.hypot(p.x - g.x, p.y - g.y) > 0.7 && walkableSegment(p, p, l)) {
      point2 = p;
      break;
    }
  }
  if (!point2) {
    const anchors = l.encounter?.junctions ?? l.patrols[index].route;
    point2 = anchors[(index + cycle) % anchors.length];
  }
  if (point2) {
    b.goal = { x: point2.x, y: point2.y };
    b.plan = true;
  }
  h.searchNext = s.ticks + 45;
  g.wait = 0;
}
function updateHeistGuards(s, dt, l, shoot) {
  "worklet";
  let paths = 2;
  const c = s.combat, start = Math.floor(s.ticks / 3) % Math.max(1, s.guards.length), hard = pressureCombat(l), pressure = guardPressure(l);
  for (let k = 0; k < s.guards.length; k++) {
    const i = (k + start) % s.guards.length, g = s.guards[i], spec = l.patrols[i], b = brain2(g, i, l), h = g.heist;
    g.px = g.x;
    g.py = g.y;
    if (g.hp <= 0) {
      g.active = false;
      g.seesPlayer = false;
      h.charge = 0;
      h.broadcastUntil = 0;
      continue;
    }
    if (spec.reserveAfter !== void 0 && !g.spawned) {
      g.active = false;
      if (s.thefts < (spec.pickupWave ?? 1)) continue;
      if (!h.arrivalUntil) h.arrivalUntil = s.ticks + ENTRY_WARNING_TICKS;
      if (s.ticks < h.arrivalUntil || Math.hypot(g.x - s.x, g.y - s.y) < 2.2) continue;
      g.spawned = true;
      g.active = true;
      const pickup = l.targets?.[Math.max(0, s.thefts - 1)] ?? l.phone;
      investigate2(g, pickup, s.ticks);
      b.pickupSeen = s.thefts;
      g.reactionTicks = Math.max(g.reactionTicks, 12);
    }
    g.active = true;
    g.clock += dt;
    g.flash = Math.max(0, g.flash - dt);
    g.range = spec.range;
    const drone = g.combatRole === "drone", rawSeen = contact(g, s, l), reacquired = rawSeen && !!h.hunting && s.ticks - b.lastSight <= 30;
    g.seesPlayer = rawSeen;
    b.seenFor = rawSeen ? Math.min(1, b.seenFor + dt) : 0;
    g.exposure = rawSeen ? reacquired ? 1 : Math.min(1, b.seenFor / Math.max(hard ? 0.15 : 0.3, spec.spotSeconds)) : Math.max(0, g.exposure - dt * 3);
    const confirmed = rawSeen && g.exposure >= 1;
    if (rawSeen) {
      g.lastSeen = { x: s.x, y: s.y };
      b.lastSight = s.ticks;
    }
    if (confirmed) {
      b.lastSight = s.ticks;
      b.searchUntil = 0;
      g.wait = 0;
      if (!h.hunting || s.ticks >= g.nextChase || g.mode !== "investigate") {
        pursue(g, g.lastSeen, s.ticks);
        g.nextChase = s.ticks + 6;
      }
      if (!drone) {
        shareHeistSighting(s, i, l);
        h.charge = 0;
      } else if (s.ticks >= h.cooldownUntil) {
        h.charge++;
        if (h.charge >= droneReportTicks(l)) {
          h.charge = 0;
          h.broadcastUntil = s.ticks + 21;
          h.cooldownUntil = s.ticks + 120;
          shareHeistSighting(s, i, l);
        }
      }
    } else h.charge = 0;
    if (b.pickupSeen < s.thefts) {
      b.pickupSeen = s.thefts;
      const p2 = l.targets?.[Math.max(0, s.thefts - 1)] ?? l.phone;
      if (!h.hunting && !rawSeen && Math.hypot(g.x - p2.x, g.y - p2.y) < 7) investigate2(g, p2, s.ticks);
    }
    const heard = (l.combat?.revision ?? 0) >= 15 ? c.melee?.noiseId ?? 0 : c.shots;
    if (heard > b.heardShot) {
      b.heardShot = heard;
      if (!h.hunting && !rawSeen && c.noiseLeft > 0 && Math.hypot(c.noise.x - g.x, c.noise.y - g.y) < ((l.combat?.revision ?? 0) >= 15 ? c.melee?.noiseRadius ?? 0 : hard ? 5.8 : 3.6)) investigate2(g, c.noise, s.ticks);
    }
    const noise = c.grateNoise;
    if (noise && noise.id > h.heardGrate) {
      h.heardGrate = noise.id;
      if (!h.hunting && !rawSeen && noise.until >= s.ticks && Math.hypot(noise.x - g.x, noise.y - g.y) < 4.5) investigate2(g, noise, s.ticks);
    }
    if (!rawSeen && h.hunting && b.lastSight === s.ticks - 1) destination2(g, g.lastSeen, "investigate");
    if (!rawSeen && g.mode === "investigate" && s.ticks >= b.alertUntil) search2(g, s.ticks);
    if (g.reactionTicks > 0) {
      g.reactionTicks--;
      continue;
    }
    if (rawSeen && !confirmed) {
      face2(g, Math.atan2(s.y - g.y, s.x - g.x), dt);
      continue;
    }
    if (confirmed && ((l.combat?.revision ?? 0) < 15 || g.gunPhase === "ready")) face2(g, Math.atan2(s.y - g.y, s.x - g.x), dt);
    const armored = g.combatRole === "heavy" || g.combatRole === "warden";
    const aim = hard ? pressure.aim + (armored ? 6 : 0) : g.combatRole === "warden" ? 28 : g.combatRole === "heavy" ? 32 : l.number <= 3 ? 29 : 24;
    const burst = armored ? 3 : g.combatRole === "sentry" || hard ? 2 : 1;
    const recovery = hard ? pressure.recover + (armored ? 7 : 0) : armored ? 38 : 27;
    if (!drone) {
      if (g.gunPhase === "aim") {
        if (!rawSeen) {
          g.gunPhase = "recover";
          g.gunTicks = 12;
        } else {
          if (g.gunTicks > ((l.combat?.revision ?? 0) >= 15 ? 12 : 6)) {
            if (hard) closeOnContact(g, s, l, (spec.pursuitSpeed ?? pressure.pursuit) * 0.85, dt);
            g.shotAngle = trackedShot(g, s, dt, hard);
          }
          face2(g, g.shotAngle, dt);
          if (--g.gunTicks <= 0) {
            g.gunPhase = "fire";
            g.burstLeft = burst;
            g.gunTicks = 0;
          }
          continue;
        }
      }
      if (g.gunPhase === "fire" && !rawSeen) {
        g.gunPhase = "recover";
        g.gunTicks = 12;
        g.burstLeft = 0;
      }
      if (g.gunPhase === "fire") {
        if (g.gunTicks-- <= 0) {
          shoot(s, g, g.shotAngle + (burst > 1 ? (g.burstLeft - (burst + 1) / 2) * 0.1 : 0), i, hard ? pressure.damage : l.number <= 3 ? 12 : 18);
          g.burstLeft--;
          g.gunTicks = 6;
          if (g.burstLeft <= 0) {
            g.gunPhase = "recover";
            g.gunTicks = recovery;
          }
        }
        continue;
      }
      if (g.gunPhase === "recover") {
        if (--g.gunTicks <= 0) g.gunPhase = "ready";
        else if (g.gunTicks > recovery - (hard ? 3 : 7)) continue;
      }
      if (confirmed && g.gunPhase === "ready") {
        g.gunPhase = "aim";
        g.gunTicks = aim;
        g.shotAngle = trackedShot(g, s, dt, hard);
        c.aimEvents++;
        continue;
      }
    }
    if (drone && (l.combat?.revision ?? 0) >= 15 && h.charge > 0) continue;
    if (confirmed && walkableSegment(g, g.lastSeen, l)) {
      const dx = g.lastSeen.x - g.x, dy = g.lastSeen.y - g.y, d = Math.hypot(dx, dy), travel = Math.min(Math.max(0, d - 1.15), (spec.pursuitSpeed ?? 2.25) * dt);
      if (d > 1e-6) {
        g.x += dx / d * travel;
        g.y += dy / d * travel;
      }
      g.path = [];
      g.pathIndex = 0;
      b.goal = { ...g.lastSeen };
      b.plan = false;
      continue;
    }
    if (g.mode === "search") {
      if (s.ticks >= b.searchUntil) {
        h.hunting = false;
        h.role = "patrol";
        h.charge = 0;
        h.broadcastUntil = 0;
        g.alerted = false;
        g.exposure = 0;
        b.seenFor = 0;
        b.trackingUntil = 0;
        g.gunPhase = "ready";
        g.gunTicks = 0;
        g.burstLeft = 0;
        destination2(g, spec.route[0], "return");
      } else if (!b.goal || s.ticks >= (h.searchNext ?? 0)) searchCorner(g, i, s, l);
    }
    if (g.wait > 0) {
      g.wait = Math.max(0, g.wait - dt);
      face2(g, g.searchAngle + Math.sin(g.clock * 2) * 0.25, dt);
      continue;
    }
    if (!b.goal && g.mode === "patrol") roam2(g, i, s, l);
    if (b.plan && b.goal && s.ticks >= b.nextPlan && paths > 0) {
      paths--;
      g.path = findPath(g, b.goal, l);
      g.pathIndex = 0;
      b.plan = false;
      b.nextPlan = s.ticks + 12;
      if (!g.path.length) {
        b.goal = null;
        g.wait = 0.3;
        if (g.mode === "return") g.mode = "patrol";
        if (g.mode === "investigate") search2(g, s.ticks);
      }
    }
    if (b.plan) continue;
    const p = g.path[g.pathIndex];
    if (p) {
      const dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy), speed = g.mode === "investigate" ? spec.pursuitSpeed ?? 2.25 : spec.speed, travel = Math.min(d, speed * dt);
      if (d > 0.01 && !confirmed) face2(g, Math.atan2(dy, dx), dt);
      const next = { x: d ? g.x + dx / d * travel : g.x, y: d ? g.y + dy / d * travel : g.y };
      if (walkableSegment(g, next, l)) {
        g.x = next.x;
        g.y = next.y;
        b.blockedFor = 0;
        if (d <= travel + 1e-8) g.pathIndex++;
      } else {
        b.blockedFor++;
        if (b.blockedFor > 6) {
          b.plan = true;
          b.nextPlan = s.ticks + 3;
          b.blockedFor = 0;
        }
      }
    }
    if (g.pathIndex >= g.path.length) {
      if (g.mode === "investigate") search2(g, s.ticks);
      else if (g.mode === "search") {
        b.goal = null;
        g.path = [];
        g.wait = h.hunting ? 0.2 : 0.4;
      } else if (g.mode === "return") {
        g.mode = "patrol";
        b.goal = null;
        g.path = [];
        g.wait = 0.3;
      } else if (g.mode === "patrol") {
        b.goal = null;
        g.path = [];
        g.wait = spec.pauseSeconds;
        g.searchAngle = g.angle;
      }
    }
  }
  if (c.hunt && !s.guards.some((g) => g.active && g.hp > 0 && g.heist?.hunting)) c.hunt = void 0;
}
function directionalArmor(g, vx, vy, damage) {
  "worklet";
  const speed = Math.hypot(vx, vy) || 1, towardShooter = -(vx * Math.cos(g.angle) + vy * Math.sin(g.angle)) / speed;
  const region = towardShooter >= 0.5 ? "front" : towardShooter <= -0.35 ? "rear" : "side";
  return { region, damage: region === "front" ? Math.max(1, Math.round(damage * 0.28)) : region === "rear" ? Math.min(75, damage * 2) : damage };
}

// src/game/heist-guards-legacy.ts
var ENTRY_WARNING_TICKS2 = 24;
function random3(b) {
  "worklet";
  b.rng = Math.imul(b.rng, 1664525) + 1013904223 >>> 0;
  return b.rng / 4294967296;
}
function brain3(g, index, l) {
  "worklet";
  if (!g.brain) {
    let seed = 2166136261;
    for (let j = 0; j < l.id.length; j++) seed = Math.imul(seed ^ l.id.charCodeAt(j), 16777619) >>> 0;
    g.brain = { rng: seed + Math.imul(index + 1, 2654435761) >>> 0, goal: null, plan: false, nextPlan: 0, seenFor: 0, lastSight: -100, reportAt: 0, heardShot: 0, pickupSeen: 0, searchUntil: 0, searchStep: 0, lastAnchor: 0, alertUntil: 0, blockedFor: 0, supportUntil: 0 };
  }
  if (!g.heist) g.heist = { role: "patrol", charge: 0, broadcastUntil: 0, cooldownUntil: 0, arrivalUntil: 0, heardGrate: 0, armorHit: "none" };
  return g.brain;
}
function face3(g, angle, dt) {
  "worklet";
  const delta = Math.atan2(Math.sin(angle - g.angle), Math.cos(angle - g.angle));
  const speed = g.combatRole === "heavy" || g.combatRole === "warden" ? Math.PI * 1.2 : Math.PI * 1.8;
  g.angle += Math.max(-speed * dt, Math.min(speed * dt, delta));
}
function destination3(g, p, mode) {
  "worklet";
  const b = g.brain;
  if (!b.goal || Math.hypot(b.goal.x - p.x, b.goal.y - p.y) > 0.45 || g.mode !== mode || !b.plan && g.pathIndex >= g.path.length && Math.hypot(p.x - g.x, p.y - g.y) > 0.25) {
    b.goal = { x: p.x, y: p.y };
    b.plan = true;
  }
  g.mode = mode;
  g.wait = 0;
}
function investigate3(g, p, tick, role = "pursuer") {
  "worklet";
  g.lastSeen = { x: p.x, y: p.y };
  g.heist.role = role;
  destination3(g, p, "investigate");
  g.brain.searchUntil = 0;
  g.brain.alertUntil = tick + 180;
  if (!g.alerted) {
    g.alerted = true;
    g.reactionTicks = Math.max(g.reactionTicks, 8);
  }
}
function contact2(g, p, l) {
  "worklet";
  if (!g.heist?.hunting) return sees(g, p.x, p.y, l);
  const dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy);
  return d <= g.range + 0.8 && (d < 1e-6 || sightDistance(g.x, g.y, dx / d, dy / d, d, l) >= d - 1e-7);
}
function closeOnContact2(g, p, l, speed, dt) {
  "worklet";
  if (!walkableSegment(g, p, l)) return false;
  const dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy), travel = Math.min(Math.max(0, d - 1.15), speed * dt);
  if (d > 1e-6) {
    g.x += dx / d * travel;
    g.y += dy / d * travel;
  }
  return true;
}
function trackedShot2(g, s, dt, hard) {
  "worklet";
  const lead = hard ? Math.min(0.18, Math.hypot(s.x - g.x, s.y - g.y) / 16) : 0;
  return Math.atan2(s.y - g.y + (s.y - s.py) / dt * lead, s.x - g.x + (s.x - s.px) / dt * lead);
}
function pursue2(g, p, tick) {
  "worklet";
  investigate3(g, p, tick);
  g.heist.hunting = true;
  g.brain.trackingUntil = tick + 90;
}
function shareHeistSighting2(s, index, l) {
  "worklet";
  const reporter = s.guards[index], b = brain3(reporter, index, l);
  if (s.ticks < b.reportAt) return 0;
  b.reportAt = s.ticks + 12;
  const snapshot = { x: reporter.lastSeen.x, y: reporter.lastSeen.y, tick: s.ticks };
  s.combat.hunt = snapshot;
  s.spotted = true;
  let count = 0;
  for (let i = 0; i < s.guards.length; i++) {
    const g = s.guards[i];
    if (!g.spawned || !g.active || g.hp <= 0) continue;
    brain3(g, i, l);
    pursue2(g, snapshot, s.ticks);
    g.heist.radioAt = s.ticks;
    if (i !== index) count++;
  }
  return count;
}
function crossesLaser2(ax, ay, bx, by, r, margin) {
  "worklet";
  let enter = 0, leave = 1;
  for (let axis = 0; axis < 2; axis++) {
    const a = axis ? ay : ax, d = (axis ? by : bx) - a, min = (axis ? r.y : r.x) - margin, max = (axis ? r.y + r.h : r.x + r.w) + margin;
    if (Math.abs(d) < 1e-9) {
      if (a < min || a > max) return false;
      continue;
    }
    const t1 = (min - a) / d, t2 = (max - a) / d;
    enter = Math.max(enter, Math.min(t1, t2));
    leave = Math.min(leave, Math.max(t1, t2));
    if (enter > leave) return false;
  }
  return true;
}
function updateTripwires2(s, l) {
  "worklet";
  const lasers = l.encounter?.lasers;
  if (!lasers?.length || !s.combat || s.status !== "playing") return;
  const event = s.combat.tripwire ?? (s.combat.tripwire = { id: 0, inside: lasers.map(() => false), until: 0, x: 0, y: 0, laser: -1 });
  for (let j = 0; j < lasers.length; j++) {
    const r = lasers[j], touching = crossesLaser2(s.px, s.py, s.x, s.y, r, 0.16);
    if (event.inside[j]) {
      if (!crossesLaser2(s.x, s.y, s.x, s.y, r, 0.28)) event.inside[j] = false;
      continue;
    }
    if (!touching) continue;
    event.inside[j] = true;
    event.id++;
    event.until = s.ticks + 45;
    event.x = s.x;
    event.y = s.y;
    event.laser = j;
    s.spotted = true;
    for (let i = 0; i < s.guards.length; i++) {
      const g = s.guards[i];
      if (!g.spawned || !g.active || g.hp <= 0 || Math.hypot(g.x - s.x, g.y - s.y) > 5) continue;
      brain3(g, i, l);
      if (!g.heist.hunting && !g.seesPlayer) investigate3(g, event, s.ticks);
    }
  }
}
function roam3(g, index, s, l) {
  "worklet";
  const b = g.brain, anchors = l.patrols[index].roam ?? l.patrols[index].route;
  let best = -Infinity, pick = 0;
  for (let j = 0; j < anchors.length; j++) {
    const p = anchors[j], crowded = s.guards.some((o, k) => k !== index && o.active && o.hp > 0 && Math.hypot((o.brain?.goal?.x ?? o.x) - p.x, (o.brain?.goal?.y ?? o.y) - p.y) < 1.1);
    const value = random3(b) * 2 - (j === b.lastAnchor ? 3 : 0) - (crowded ? 4 : 0);
    if (value > best) {
      best = value;
      pick = j;
    }
  }
  b.lastAnchor = pick;
  g.heist.role = "patrol";
  destination3(g, anchors[pick], "patrol");
}
function search3(g, tick) {
  "worklet";
  const b = g.brain;
  g.mode = "search";
  g.path = [];
  g.pathIndex = 0;
  b.goal = null;
  b.plan = false;
  b.searchStep = 0;
  b.searchUntil = tick + 90;
  g.searchAngle = g.angle;
}
function searchCorner2(g, index, s, l) {
  "worklet";
  const b = g.brain, h = g.heist, cycle = h.searchCycle ?? 0;
  h.searchCycle = cycle + 1;
  const angle = (index * 0.618 + cycle * 0.381966 + random3(b) * 0.12) * Math.PI * 2, radius = 1.5 + cycle % 3;
  let point2;
  for (let n = 0; n < 8; n++) {
    const a = angle + n * Math.PI / 4, p = { x: g.lastSeen.x + Math.cos(a) * radius, y: g.lastSeen.y + Math.sin(a) * radius };
    if (p.x > 0.7 && p.y > 0.7 && p.x < l.width - 0.7 && p.y < l.height - 0.7 && Math.hypot(p.x - g.x, p.y - g.y) > 0.7 && walkableSegment(p, p, l)) {
      point2 = p;
      break;
    }
  }
  if (!point2) {
    const anchors = l.encounter?.junctions ?? l.patrols[index].route;
    point2 = anchors[(index + cycle) % anchors.length];
  }
  if (point2) {
    b.goal = { x: point2.x, y: point2.y };
    b.plan = true;
  }
  b.searchUntil = s.ticks + 90;
  g.wait = 0;
}
function updateHeistGuards2(s, dt, l, shoot) {
  "worklet";
  let paths = 2;
  const c = s.combat, start = Math.floor(s.ticks / 3) % Math.max(1, s.guards.length), hard = pressureCombat(l), pressure = guardPressure(l);
  for (let k = 0; k < s.guards.length; k++) {
    const i = (k + start) % s.guards.length, g = s.guards[i], spec = l.patrols[i], b = brain3(g, i, l), h = g.heist;
    g.px = g.x;
    g.py = g.y;
    if (g.hp <= 0) {
      g.active = false;
      g.seesPlayer = false;
      h.charge = 0;
      h.broadcastUntil = 0;
      continue;
    }
    if (spec.reserveAfter !== void 0 && !g.spawned) {
      g.active = false;
      if (s.thefts < (spec.pickupWave ?? 1)) continue;
      if (!h.arrivalUntil) h.arrivalUntil = s.ticks + ENTRY_WARNING_TICKS2;
      if (s.ticks < h.arrivalUntil || Math.hypot(g.x - s.x, g.y - s.y) < 2.2) continue;
      g.spawned = true;
      g.active = true;
      const pickup = l.targets?.[Math.max(0, s.thefts - 1)] ?? l.phone;
      investigate3(g, pickup, s.ticks);
      b.pickupSeen = s.thefts;
      g.reactionTicks = Math.max(g.reactionTicks, 12);
    }
    g.active = true;
    g.clock += dt;
    g.flash = Math.max(0, g.flash - dt);
    g.range = spec.range;
    const report = c.hunt;
    if (report && (h.radioAt ?? -1) < report.tick) {
      pursue2(g, report, s.ticks);
      h.radioAt = report.tick;
    }
    const drone = g.combatRole === "drone", rawSeen = contact2(g, s, l), reacquired = rawSeen && !!h.hunting;
    g.seesPlayer = rawSeen;
    b.seenFor = rawSeen ? Math.min(1, b.seenFor + dt) : 0;
    g.exposure = rawSeen ? reacquired ? 1 : Math.min(1, b.seenFor / Math.max(hard ? 0.15 : 0.3, spec.spotSeconds)) : Math.max(0, g.exposure - dt * 3);
    const confirmed = rawSeen && g.exposure >= 1;
    if (rawSeen) {
      g.lastSeen = { x: s.x, y: s.y };
      b.lastSight = s.ticks;
    }
    if (confirmed) {
      b.lastSight = s.ticks;
      b.searchUntil = 0;
      g.wait = 0;
      if (!h.hunting || s.ticks >= g.nextChase || g.mode !== "investigate") {
        pursue2(g, g.lastSeen, s.ticks);
        g.nextChase = s.ticks + 6;
      }
      if (!drone || c.hunt) {
        shareHeistSighting2(s, i, l);
        h.charge = 0;
      } else if (s.ticks >= h.cooldownUntil) {
        h.charge++;
        if (h.charge >= droneReportTicks(l)) {
          h.charge = 0;
          h.broadcastUntil = s.ticks + 21;
          h.cooldownUntil = s.ticks + 120;
          shareHeistSighting2(s, i, l);
        }
      }
    } else h.charge = 0;
    if (b.pickupSeen < s.thefts) {
      b.pickupSeen = s.thefts;
      const p2 = l.targets?.[Math.max(0, s.thefts - 1)] ?? l.phone;
      if (!h.hunting && !rawSeen && Math.hypot(g.x - p2.x, g.y - p2.y) < 7) investigate3(g, p2, s.ticks);
    }
    const heard = (l.combat?.revision ?? 0) >= 15 ? c.melee?.noiseId ?? 0 : c.shots;
    if (heard > b.heardShot) {
      b.heardShot = heard;
      if (!h.hunting && !rawSeen && c.noiseLeft > 0 && Math.hypot(c.noise.x - g.x, c.noise.y - g.y) < ((l.combat?.revision ?? 0) >= 15 ? c.melee?.noiseRadius ?? 0 : hard ? 5.8 : 3.6)) investigate3(g, c.noise, s.ticks);
    }
    const noise = c.grateNoise;
    if (noise && noise.id > h.heardGrate) {
      h.heardGrate = noise.id;
      if (!h.hunting && !rawSeen && noise.until >= s.ticks && Math.hypot(noise.x - g.x, noise.y - g.y) < 4.5) investigate3(g, noise, s.ticks);
    }
    if (!rawSeen && h.hunting && b.lastSight === s.ticks - 1) destination3(g, g.lastSeen, "investigate");
    if (g.reactionTicks > 0) {
      g.reactionTicks--;
      continue;
    }
    if (rawSeen && !confirmed) {
      face3(g, Math.atan2(s.y - g.y, s.x - g.x), dt);
      continue;
    }
    if (confirmed && ((l.combat?.revision ?? 0) < 15 || g.gunPhase === "ready")) face3(g, Math.atan2(s.y - g.y, s.x - g.x), dt);
    const armored = g.combatRole === "heavy" || g.combatRole === "warden";
    const aim = hard ? pressure.aim + (armored ? 6 : 0) : g.combatRole === "warden" ? 28 : g.combatRole === "heavy" ? 32 : l.number <= 3 ? 29 : 24;
    const burst = armored ? 3 : g.combatRole === "sentry" || hard ? 2 : 1;
    const recovery = hard ? pressure.recover + (armored ? 7 : 0) : armored ? 38 : 27;
    if (!drone) {
      if (g.gunPhase === "aim") {
        if (!rawSeen) {
          g.gunPhase = "recover";
          g.gunTicks = 12;
        } else {
          if (g.gunTicks > ((l.combat?.revision ?? 0) >= 15 ? 12 : 6)) {
            if (hard) closeOnContact2(g, s, l, (spec.pursuitSpeed ?? pressure.pursuit) * 0.85, dt);
            g.shotAngle = trackedShot2(g, s, dt, hard);
          }
          face3(g, g.shotAngle, dt);
          if (--g.gunTicks <= 0) {
            g.gunPhase = "fire";
            g.burstLeft = burst;
            g.gunTicks = 0;
          }
          continue;
        }
      }
      if (g.gunPhase === "fire" && !rawSeen) {
        g.gunPhase = "recover";
        g.gunTicks = 12;
        g.burstLeft = 0;
      }
      if (g.gunPhase === "fire") {
        if (g.gunTicks-- <= 0) {
          shoot(s, g, g.shotAngle + (burst > 1 ? (g.burstLeft - (burst + 1) / 2) * 0.1 : 0), i, hard ? pressure.damage : l.number <= 3 ? 12 : 18);
          g.burstLeft--;
          g.gunTicks = 6;
          if (g.burstLeft <= 0) {
            g.gunPhase = "recover";
            g.gunTicks = recovery;
          }
        }
        continue;
      }
      if (g.gunPhase === "recover") {
        if (--g.gunTicks <= 0) g.gunPhase = "ready";
        else if (g.gunTicks > recovery - (hard ? 3 : 7)) continue;
      }
      if (confirmed && g.gunPhase === "ready") {
        g.gunPhase = "aim";
        g.gunTicks = aim;
        g.shotAngle = trackedShot2(g, s, dt, hard);
        c.aimEvents++;
        continue;
      }
    }
    if (drone && (l.combat?.revision ?? 0) >= 15 && h.charge > 0) continue;
    if (confirmed && walkableSegment(g, g.lastSeen, l)) {
      const dx = g.lastSeen.x - g.x, dy = g.lastSeen.y - g.y, d = Math.hypot(dx, dy), travel = Math.min(Math.max(0, d - 1.15), (spec.pursuitSpeed ?? 2.25) * dt);
      if (d > 1e-6) {
        g.x += dx / d * travel;
        g.y += dy / d * travel;
      }
      g.path = [];
      g.pathIndex = 0;
      b.goal = { ...g.lastSeen };
      b.plan = false;
      continue;
    }
    if (g.mode === "search") {
      if (h.hunting) {
        if (!b.goal || s.ticks >= b.searchUntil) searchCorner2(g, i, s, l);
      } else if (s.ticks >= b.searchUntil) {
        g.alerted = false;
        h.role = "patrol";
        destination3(g, spec.route[0], "return");
      } else face3(g, g.searchAngle + Math.sin((s.ticks - b.searchUntil) * 0.045) * 1.4, dt);
    }
    if (g.wait > 0) {
      g.wait = Math.max(0, g.wait - dt);
      face3(g, g.searchAngle + Math.sin(g.clock * 2) * 0.25, dt);
      continue;
    }
    if (!b.goal && g.mode === "patrol") roam3(g, i, s, l);
    if (b.plan && b.goal && s.ticks >= b.nextPlan && paths > 0) {
      paths--;
      g.path = findPath(g, b.goal, l);
      g.pathIndex = 0;
      b.plan = false;
      b.nextPlan = s.ticks + 12;
      if (!g.path.length) {
        b.goal = null;
        g.wait = 0.3;
        if (g.mode === "return") g.mode = "patrol";
        if (g.mode === "investigate") search3(g, s.ticks);
      }
    }
    if (b.plan) continue;
    const p = g.path[g.pathIndex];
    if (p) {
      const dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy), speed = h.hunting || g.mode === "investigate" ? spec.pursuitSpeed ?? 2.25 : spec.speed, travel = Math.min(d, speed * dt);
      if (d > 0.01 && !confirmed) face3(g, Math.atan2(dy, dx), dt);
      const next = { x: d ? g.x + dx / d * travel : g.x, y: d ? g.y + dy / d * travel : g.y };
      if (walkableSegment(g, next, l)) {
        g.x = next.x;
        g.y = next.y;
        b.blockedFor = 0;
        if (d <= travel + 1e-8) g.pathIndex++;
      } else {
        b.blockedFor++;
        if (b.blockedFor > 6) {
          b.plan = true;
          b.nextPlan = s.ticks + 3;
          b.blockedFor = 0;
        }
      }
    }
    if (g.pathIndex >= g.path.length) {
      if (g.mode === "investigate") search3(g, s.ticks);
      else if (g.mode === "search") {
        b.goal = null;
        g.path = [];
        g.wait = h.hunting ? 0.2 : 0.4;
      } else if (g.mode === "return") {
        g.mode = "patrol";
        b.goal = null;
        g.path = [];
        g.wait = 0.3;
      } else if (g.mode === "patrol") {
        b.goal = null;
        g.path = [];
        g.wait = spec.pauseSeconds;
        g.searchAngle = g.angle;
      }
    }
  }
}

// src/game/courier-speed.ts
function courierSpeedBonus(level) {
  "worklet";
  if ((level.combat?.revision ?? 0) < 13 || level.id !== `combat-v2:${level.mission}` || level.mission === "night-shift" || level.number < 1 || level.number > 12) return 0;
  return Math.min(2, Math.floor((level.number - 1) / 4)) * 8;
}
function courierSpeedMultiplier(level) {
  "worklet";
  return 1 + courierSpeedBonus(level) / 100;
}

// src/game/combat.ts
var COMBAT = { damage: 25, range: 4, shotTicks: 12, bulletSpeed: 16, maxProjectiles: 48, playerHP: 100, damageGrace: 6 };
function freshCombat() {
  "worklet";
  return { version: 2, hp: 100, commandSeen: 0, order: null, path: [], pathIndex: 0, cooldown: 0, invulnerable: 0, shots: 0, enemyShots: 0, kills: 0, damageTaken: 0, aimEvents: 0, hitEvents: 0, feedback: "none", feedbackLeft: 0, projectiles: [], nextShot: 1, noise: { x: 0, y: 0 }, noiseLeft: 0, flash: 0, repath: 0 };
}
function enemyStats(role, hard = false) {
  "worklet";
  if (hard) return role === "drone" ? { hp: 25, aim: 0, damage: 0, burst: 0, recover: 90 } : role === "scout" ? { hp: 50, aim: 21, damage: 25, burst: 2, recover: 25 } : role === "sentry" ? { hp: 75, aim: 18, damage: 20, burst: 3, recover: 30 } : role === "heavy" ? { hp: 150, aim: 30, damage: 22, burst: 3, recover: 36 } : { hp: 200, aim: 27, damage: 25, burst: 5, recover: 33 };
  return role === "drone" ? { hp: 25, aim: 0, damage: 0, burst: 0, recover: 90 } : role === "scout" ? { hp: 50, aim: 27, damage: 20, burst: 1, recover: 33 } : role === "sentry" ? { hp: 75, aim: 24, damage: 15, burst: 2, recover: 33 } : role === "heavy" ? { hp: 150, aim: 36, damage: 10, burst: 3, recover: 42 } : { hp: 200, aim: 42, damage: 15, burst: 3, recover: 42 };
}
function tacticalCombat(l) {
  "worklet";
  return (l.combat?.revision ?? 0) >= 11 || (l.combat?.revision ?? 0) >= 3 && l.id !== "combat-v2:practice";
}
function fairAmbush(l) {
  "worklet";
  return (l.combat?.revision ?? 0) >= 6;
}
function turnToward(g, angle, dt) {
  "worklet";
  const delta = Math.atan2(Math.sin(angle - g.angle), Math.cos(angle - g.angle));
  g.angle += Math.max(-Math.PI * 2 * dt, Math.min(Math.PI * 2 * dt, delta));
}
function reactToNoise(g, point2, l, tick = 0) {
  "worklet";
  g.lastSeen = { x: point2.x, y: point2.y };
  if ((l.combat?.revision ?? 0) >= 8 && g.brain) {
    g.brain.goal = { ...g.lastSeen };
    g.brain.plan = true;
    g.brain.alertUntil = tick + 180;
  } else {
    g.path = findPath(g, g.lastSeen, l);
    g.pathIndex = 0;
  }
  g.mode = "investigate";
  if (!g.alerted) {
    g.alerted = true;
    g.reactionTicks = 9;
  }
}
function clearOrder(c) {
  "worklet";
  c.order = null;
  c.path = [];
  c.pathIndex = 0;
  delete c.attackPlan;
  if (c.melee) {
    c.melee.target = -1;
    c.melee.resolved = true;
  }
}
function visible(a, b, level) {
  "worklet";
  const d = Math.hypot(a.x - b.x, a.y - b.y);
  return d < 1e-6 || sightDistance(a.x, a.y, (b.x - a.x) / d, (b.y - a.y) / d, d, level) >= d - 1e-7;
}
function validPoint(p, l) {
  "worklet";
  return p.x > 0.65 && p.y > 0.65 && p.x < l.width - 0.65 && p.y < l.height - 0.65 && !l.blockers.some((b) => intersectsBox(p.x, p.y, b, 0.32));
}
function setPath(s, p, l) {
  "worklet";
  if (!validPoint(p, l)) return false;
  const path = findPath(s, p, l);
  if (!path.length) return false;
  s.combat.path = path;
  s.combat.pathIndex = 0;
  return true;
}
function attackApproach(s, g, l) {
  "worklet";
  const c = s.combat;
  if (visible(s, g, l) && Math.hypot(g.x - s.x, g.y - s.y) <= COMBAT.range) {
    c.path = [];
    return true;
  }
  let best = null, distance = Infinity;
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6, p = { x: g.x + Math.cos(angle) * 3.3, y: g.y + Math.sin(angle) * 3.3 };
    if (!validPoint(p, l) || !visible(p, g, l)) continue;
    const path = findPath(s, p, l);
    if (!path.length) continue;
    let cost = 0, last = s;
    for (const n of path) {
      cost += Math.hypot(n.x - last.x, n.y - last.y);
      last = n;
    }
    if (cost < distance) {
      distance = cost;
      best = path;
    }
  }
  if (!best) return false;
  c.path = best;
  c.pathIndex = 0;
  return true;
}
function approachTarget(s, g, l) {
  "worklet";
  const c = s.combat, standOff = knifeCombat(l) ? knifeReach(g) : 2.6, d = Math.hypot(g.x - s.x, g.y - s.y);
  if (d <= standOff && visible(s, g, l)) {
    c.path = [];
    c.pathIndex = 0;
    return true;
  }
  const route = findPath(s, g, l);
  if (!route.length) return false;
  const approach2 = [];
  let from = s;
  for (const to of route) {
    const length = Math.hypot(to.x - from.x, to.y - from.y), steps = Math.max(1, Math.ceil(length / 0.18));
    for (let n = 1; n <= steps; n++) {
      const p = { x: from.x + (to.x - from.x) * n / steps, y: from.y + (to.y - from.y) * n / steps };
      if (Math.hypot(p.x - g.x, p.y - g.y) <= standOff && visible(p, g, l)) {
        approach2.push(p);
        c.path = approach2;
        c.pathIndex = 0;
        return true;
      }
    }
    approach2.push(to);
    from = to;
  }
  return false;
}
function issue(s, cmd, l) {
  "worklet";
  const c = s.combat;
  if (cmd.seq <= c.commandSeen) return;
  c.commandSeen = cmd.seq;
  if (tacticalCombat(l) && c.order?.kind === "phone" && cmd.kind === "phone" && c.order.target === cmd.target) return;
  c.feedbackLeft = 1;
  c.feedback = "blocked";
  if (cmd.kind === "stop") {
    clearOrder(c);
    c.feedback = "move";
    return;
  }
  if (cmd.kind === "attack") {
    const g = s.guards[cmd.target], tracking = (l.combat?.revision ?? 0) >= 14;
    if (!g || !g.active || g.hp <= 0 || !tracking && !visible(s, g, l)) return;
    if (tracking && c.order?.kind === "attack" && c.order.target === cmd.target) {
      c.feedback = "target";
      return;
    }
    if (knifeCombat(l) && c.attackPlan?.failedTarget === cmd.target && s.ticks < c.attackPlan.nextTick) return;
    if (!(tracking ? approachTarget(s, g, l) : attackApproach(s, g, l))) {
      if (knifeCombat(l)) c.attackPlan = { x: g.x, y: g.y, nextTick: s.ticks + 8, failedTarget: cmd.target };
      return;
    }
    if (tracking) c.attackPlan = { x: g.x, y: g.y, nextTick: s.ticks + 12 };
  } else {
    let p = cmd;
    if (cmd.kind === "phone") {
      if (s.carrying) return;
      p = l.targets?.[s.delivered] ?? l.phone;
    }
    if (cmd.kind === "exit") {
      if (!s.carrying) return;
      p = { x: l.exit.x + l.exit.w / 2, y: l.exit.y + l.exit.h / 2 };
    }
    if (cmd.kind === "switch") {
      const pad = l.switches?.[cmd.target];
      if (!pad) return;
      p = pad;
    }
    if (!setPath(s, p, l)) return;
  }
  if (cmd.kind !== "attack") {
    delete c.attackPlan;
    clearMelee(s);
  } else if (c.order?.target !== cmd.target) clearMelee(s);
  c.order = { ...cmd };
  c.feedback = cmd.kind === "attack" ? "target" : "move";
  s.pickup = 0;
}
function walkActor(a, p, speed, dt, l) {
  "worklet";
  const d = Math.hypot(p.x - a.x, p.y - a.y), travel = Math.min(d, speed * dt);
  if (d < 1e-6) return true;
  const next = { x: a.x + (p.x - a.x) / d * travel, y: a.y + (p.y - a.y) / d * travel };
  if (!walkableSegment(a, next, l)) return false;
  a.x = next.x;
  a.y = next.y;
  return true;
}
function spawnShot(s, from, angle, owner, damage) {
  "worklet";
  const c = s.combat;
  if (owner < 0 && knifeCombat(s.definition)) return;
  if (c.projectiles.length >= COMBAT.maxProjectiles) return;
  const speed = owner < 0 ? tacticalCombat(s.definition) ? 18 : 16 : (s.definition.combat?.revision ?? 0) >= 11 ? 16 : tacticalCombat(s.definition) ? 13 : 10;
  c.projectiles.push({ id: c.nextShot++, x: from.x, y: from.y, px: from.x, py: from.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, left: owner < 0 ? COMBAT.range : 7, owner, damage });
  if (owner < 0) {
    c.shots++;
    c.noise = { x: s.x, y: s.y };
    c.noiseLeft = tacticalCombat(s.definition) ? 1.5 : 1.2;
  } else c.enemyShots++;
}
function gates(s) {
  "worklet";
  const l = s.definition;
  let changed = false;
  s.relayTimers = s.relayTimers.map((t) => Math.max(0, t - TUNING.step));
  for (let i = 0; i < (l.gates?.length ?? 0); i++) {
    const g = l.gates[i], closed = g.mode === "power" ? s.power !== g.power : g.mode === "relay" ? (s.relayTimers[g.relay ?? 0] ?? 0) <= 0 : (s.elapsed + g.phase) % g.period >= g.openSeconds;
    const occupied = intersectsBox(s.x, s.y, g.box, 0.4) || s.guards.some((a) => a.active && a.hp > 0 && intersectsBox(a.x, a.y, g.box, 0.4));
    if ((!closed || !occupied) && s.closedGates[i] !== closed) {
      s.closedGates[i] = closed;
      changed = true;
    }
  }
  if (changed) s.blockers = [...l.blockers, ...(l.gates ?? []).filter((_, i) => s.closedGates[i]).map((g) => g.box)];
}
function enemies(s, dt, l) {
  "worklet";
  if ((l.combat?.revision ?? 0) >= 16) {
    updateHeistGuards(s, dt, l, spawnShot);
    return;
  }
  if ((l.combat?.revision ?? 0) >= 10) {
    updateHeistGuards2(s, dt, l, spawnShot);
    return;
  }
  if ((l.combat?.revision ?? 0) >= 8) {
    updateEncounterGuards(s, dt, l, spawnShot);
    return;
  }
  const c = s.combat;
  for (let i = 0; i < s.guards.length; i++) {
    const g = s.guards[i], spec = l.patrols[i], stats = enemyStats(g.combatRole, tacticalCombat(l));
    g.px = g.x;
    g.py = g.y;
    if (g.hp <= 0) {
      g.active = false;
      g.seesPlayer = false;
      continue;
    }
    if (spec.reserveAfter !== void 0 && !g.spawned) {
      g.active = s.securityAlarm && s.alarmSeconds >= spec.reserveAfter && Math.hypot(s.x - g.x, s.y - g.y) > 1.25;
      if (!g.active) continue;
      g.spawned = true;
    }
    g.active = true;
    g.clock += dt;
    g.flash = Math.max(0, g.flash - dt);
    g.range = spec.range + (tacticalCombat(l) && s.securityAlarm ? 0.8 : 0);
    if (g.combatRole === "drone") {
      if ((l.combat?.revision ?? 0) < 7) {
        g.seesPlayer = false;
        g.exposure = 0;
        continue;
      }
      const p2 = spec.route[g.target];
      if (g.wait > 0) g.wait = Math.max(0, g.wait - dt);
      else if (p2) {
        const dx = p2.x - g.x, dy = p2.y - g.y;
        if (Math.hypot(dx, dy) > 0.01) turnToward(g, Math.atan2(dy, dx), dt);
        if (walkActor(g, p2, spec.speed, dt, l) && Math.hypot(g.x - p2.x, g.y - p2.y) < 0.02) {
          g.target = (g.target + 1) % spec.route.length;
          g.wait = spec.pauseSeconds;
        }
      }
      g.seesPlayer = sees(g, s.x, s.y, l);
      g.exposure = g.seesPlayer ? Math.min(1, g.exposure + dt / Math.max(0.5, spec.spotSeconds)) : Math.max(0, g.exposure - dt * 3);
      if (g.exposure >= 1 && g.clock >= g.nextReport) {
        s.spotted = true;
        g.lastSeen = { x: s.x, y: s.y };
        g.nextReport = g.clock + 2;
        for (const other of s.guards) if (other !== g && other.active && other.hp > 0 && other.combatRole !== "drone" && Math.hypot(other.x - g.x, other.y - g.y) <= 4.5 && !other.seesPlayer) reactToNoise(other, g.lastSeen, l, s.ticks);
      }
      continue;
    }
    if (fairAmbush(l) && g.reactionTicks > 0) {
      g.reactionTicks--;
      g.seesPlayer = false;
      g.exposure = 0;
      continue;
    }
    const seen = sees(g, s.x, s.y, l);
    if (tacticalCombat(l) && g.seesPlayer && !seen) {
      g.path = findPath(g, g.lastSeen, l);
      g.pathIndex = 0;
      g.mode = "investigate";
      g.nextReport = g.clock + 1.4;
    }
    g.seesPlayer = seen;
    g.exposure = seen ? 1 : 0;
    if (seen) {
      s.spotted = true;
      g.lastSeen = { x: s.x, y: s.y };
      if (fairAmbush(l)) g.alerted = true;
    }
    if (g.gunPhase === "aim") {
      if (!seen) {
        g.gunPhase = "recover";
        g.gunTicks = 12;
        continue;
      }
      if (g.gunTicks > 6) g.shotAngle = Math.atan2(s.y - g.y, s.x - g.x);
      g.angle = g.shotAngle;
      if (--g.gunTicks <= 0) {
        g.gunPhase = "fire";
        g.burstLeft = stats.burst;
        g.gunTicks = 0;
      }
    }
    if (g.gunPhase === "fire") {
      if (g.gunTicks-- <= 0) {
        spawnShot(s, g, g.shotAngle + (g.combatRole === "heavy" || g.combatRole === "warden" ? (g.burstLeft - (stats.burst + 1) / 2) * (tacticalCombat(l) ? 0.16 : 0.19) : 0), i, stats.damage);
        g.burstLeft--;
        g.gunTicks = 6;
        if (g.burstLeft <= 0) {
          g.gunPhase = "recover";
          g.gunTicks = stats.recover;
        }
      }
      continue;
    }
    if (g.gunPhase === "aim") continue;
    const recovering = g.gunPhase === "recover" && --g.gunTicks > 0;
    if (recovering && (!tacticalCombat(l) || g.gunTicks > stats.recover - 8)) continue;
    if (!recovering && g.gunPhase === "recover") g.gunPhase = "ready";
    if (seen && !recovering) {
      g.gunPhase = "aim";
      g.gunTicks = stats.aim;
      g.shotAngle = Math.atan2(s.y - g.y, s.x - g.x);
      c.aimEvents++;
      continue;
    }
    if (s.securityAlarm && g.clock >= g.nextReport || c.noiseLeft > 0 && Math.hypot(c.noise.x - g.x, c.noise.y - g.y) < (fairAmbush(l) ? 3.5 : tacticalCombat(l) ? 7 : 5) && g.clock >= g.nextChase) {
      const source = s.securityAlarm ? { x: s.x, y: s.y } : { ...c.noise };
      if (fairAmbush(l)) {
        if (s.securityAlarm) g.alerted = true;
        reactToNoise(g, source, l, s.ticks);
      } else {
        g.lastSeen = source;
        g.path = findPath(g, g.lastSeen, l);
        g.pathIndex = 0;
        g.mode = "investigate";
      }
      g.nextReport = g.clock + (tacticalCombat(l) ? 1.4 + i % 3 * 0.15 : 4);
      g.nextChase = g.clock + 1.3;
      if (fairAmbush(l) && g.reactionTicks > 0) continue;
    }
    const multiplier = s.securityAlarm ? tacticalCombat(l) ? 2 + 0.35 * Math.min(1, s.alarmSeconds / 12) : 1.35 + 0.15 * Math.min(1, s.alarmSeconds / 10) : 1;
    if (recovering && seen && g.clock >= g.nextChase) {
      g.path = findPath(g, g.lastSeen, l);
      g.pathIndex = 0;
      g.mode = "investigate";
      g.nextChase = g.clock + 0.7;
    }
    let p;
    if (g.mode === "investigate" || g.mode === "return") {
      p = g.path[g.pathIndex];
      if (!p) {
        if (g.mode === "return") {
          g.mode = "patrol";
          g.wait = 0.6;
        } else {
          g.path = findPath(g, spec.route[g.target], l);
          g.pathIndex = 0;
          g.mode = "return";
        }
      }
    } else if (g.wait > 0) {
      g.wait -= dt;
      continue;
    } else p = spec.route[g.target];
    if (p) {
      const dx = p.x - g.x, dy = p.y - g.y;
      if (Math.hypot(dx, dy) > 0.01) {
        const angle = Math.atan2(dy, dx);
        if (fairAmbush(l)) turnToward(g, angle, dt);
        else g.angle = angle;
      }
      if (walkActor(g, p, spec.speed * multiplier, dt, l) && Math.hypot(g.x - p.x, g.y - p.y) < 0.02) {
        if (g.mode === "investigate" || g.mode === "return") g.pathIndex++;
        else {
          g.target = (g.target + 1) % spec.route.length;
          g.wait = spec.pauseSeconds;
        }
      }
    }
  }
}
function projectiles(s, dt, l) {
  "worklet";
  const c = s.combat;
  const alive = [];
  for (const p of c.projectiles) {
    p.px = p.x;
    p.py = p.y;
    const travel = Math.min(p.left, Math.hypot(p.vx, p.vy) * dt), speed = Math.hypot(p.vx, p.vy), dx = p.vx / speed, dy = p.vy / speed;
    let distance = sightDistance(p.x, p.y, dx, dy, travel, l), hit = -2;
    const targets = p.owner < 0 ? s.guards : [s];
    for (let i = 0; i < targets.length; i++) {
      const a = targets[i];
      if (p.owner < 0 && (!a.active || a.hp <= 0)) continue;
      const ax = a.x - p.x, ay = a.y - p.y, along = ax * dx + ay * dy, perp = ax * ax + ay * ay - along * along, r = 0.38;
      if (perp > r * r || along + r < 0) continue;
      const contact3 = Math.max(0, along - Math.sqrt(Math.max(0, r * r - perp)));
      if (contact3 <= distance) {
        distance = contact3;
        hit = i;
      }
    }
    p.x += dx * distance;
    p.y += dy * distance;
    p.left -= travel;
    if (hit >= 0) {
      if (p.owner < 0) {
        const g = s.guards[hit];
        const ambush = p.damage > COMBAT.damage;
        const armor = (l.combat?.revision ?? 0) >= 10 && (g.combatRole === "heavy" || g.combatRole === "warden") ? directionalArmor(g, p.vx, p.vy, p.damage) : void 0;
        const damage = armor?.damage ?? p.damage;
        if (armor && g.heist) g.heist.armorHit = armor.region;
        if (ambush) {
          c.feedback = "ambush";
          c.feedbackLeft = 0.65;
        }
        g.hp = Math.max(0, g.hp - damage);
        if (tacticalCombat(l) && g.hp > 0) {
          g.lastSeen = { x: s.x, y: s.y };
          if (fairAmbush(l)) {
            reactToNoise(g, s, l, s.ticks);
            if (ambush) {
              g.reactionTicks = Math.max(g.reactionTicks, 12);
              g.gunPhase = "ready";
              g.gunTicks = 0;
            }
          } else if (visible(g, s, l) && g.gunPhase !== "fire" && g.gunPhase !== "aim") {
            g.angle = Math.atan2(s.y - g.y, s.x - g.x);
            g.shotAngle = g.angle;
            g.gunPhase = "aim";
            g.gunTicks = enemyStats(g.combatRole, true).aim;
            c.aimEvents++;
          }
        }
        g.flash = 0.15;
        c.hitEvents++;
        if (!g.hp) {
          g.active = false;
          g.seesPlayer = false;
          c.kills++;
        }
      } else if (c.invulnerable === 0) {
        const damage = Math.min(c.hp, p.damage);
        c.hp -= damage;
        c.damageTaken += damage;
        c.invulnerable = COMBAT.damageGrace;
        c.flash = 0.2;
        if (!c.hp) {
          s.status = "caught";
          s.caughtBy = p.owner;
        }
      }
      continue;
    }
    if (distance + 1e-7 >= travel && p.left > 0) alive.push(p);
  }
  c.projectiles = alive;
}
function stepCombat(s, input, dt = TUNING.step) {
  "worklet";
  const c = s.combat;
  s.px = s.x;
  s.py = s.y;
  s.ticks++;
  s.elapsed = s.ticks / 30;
  s.vx = 0;
  s.vy = 0;
  c.cooldown = Math.max(0, c.cooldown - 1);
  c.invulnerable = Math.max(0, c.invulnerable - 1);
  c.flash = Math.max(0, c.flash - dt);
  c.feedbackLeft = Math.max(0, c.feedbackLeft - dt);
  c.noiseLeft = Math.max(0, c.noiseLeft - dt);
  if (s.securityAlarm) s.alarmSeconds += dt;
  gates(s);
  const level = { ...s.definition, blockers: s.blockers };
  if (input.command) issue(s, input.command, level);
  const order = c.order;
  if (order?.kind === "attack") {
    const g = s.guards[order.target];
    if (!g || !g.active || g.hp <= 0) clearOrder(c);
    else if (knifeCombat(level)) {
      stepMelee(s, level);
      if (c.order && (!c.melee || c.melee.resolved && s.ticks >= c.melee.until) && !canKnifeHit(s, g, level)) {
        const plan = c.attackPlan;
        if (!plan || s.ticks >= plan.nextTick && (c.pathIndex >= c.path.length || Math.hypot(g.x - plan.x, g.y - plan.y) > 0.35)) {
          c.attackPlan = { x: g.x, y: g.y, nextTick: s.ticks + 8 };
          if (!approachTarget(s, g, level)) {
            clearOrder(c);
            c.attackPlan = { x: g.x, y: g.y, nextTick: s.ticks + 8, failedTarget: order.target };
            c.feedback = "blocked";
            c.feedbackLeft = 1;
          }
        }
      }
    } else if (visible(s, g, level) && Math.hypot(s.x - g.x, s.y - g.y) <= ((level.combat?.revision ?? 0) >= 14 ? c.pathIndex < c.path.length ? 2.6 : 3.1 : COMBAT.range)) {
      c.path = [];
      s.facing = Math.abs(g.x - s.x) > Math.abs(g.y - s.y) ? g.x < s.x ? 1 : 3 : g.y < s.y ? 2 : 0;
      if (!c.cooldown) {
        const behind = (s.x - g.x) * Math.cos(g.angle) + (s.y - g.y) * Math.sin(g.angle) < 0;
        const unaware = fairAmbush(level) ? g.hp === g.maxHp && !sees(g, s.x, s.y, level) : !g.seesPlayer;
        const damage = tacticalCombat(level) && !s.securityAlarm && unaware && g.gunPhase === "ready" && behind ? 50 : 25;
        spawnShot(s, s, Math.atan2(g.y - s.y, g.x - s.x), -1, damage);
        c.cooldown = 12;
      }
    } else if ((level.combat?.revision ?? 0) >= 14) {
      const plan = c.attackPlan;
      if (!plan || s.ticks >= plan.nextTick && (c.pathIndex >= c.path.length || Math.hypot(g.x - plan.x, g.y - plan.y) > 0.65)) {
        c.attackPlan = { x: g.x, y: g.y, nextTick: s.ticks + 12 };
        if (!approachTarget(s, g, level)) {
          clearOrder(c);
          c.feedback = "cover";
          c.feedbackLeft = 1;
        }
      }
    } else if (c.pathIndex >= c.path.length) {
      clearOrder(c);
      c.feedback = "cover";
      c.feedbackLeft = 1;
    }
  }
  const point2 = c.path[c.pathIndex];
  if (point2 && !(knifeCombat(level) && c.melee && !c.melee.resolved)) {
    const speed = (tacticalCombat(level) ? s.carrying ? 3.15 : 4.1 : s.carrying ? 2.8 : 3.4) * courierSpeedMultiplier(level);
    if (walkActor(s, point2, speed, dt, level)) {
      if (Math.hypot(point2.x - s.x, point2.y - s.y) < 0.02) c.pathIndex++;
    } else {
      c.repath++;
      if (!setPath(s, c.path[c.path.length - 1], level)) {
        clearOrder(c);
        c.feedback = "blocked";
        c.feedbackLeft = 1;
      }
    }
  }
  s.vx = (s.x - s.px) / dt;
  s.vy = (s.y - s.py) / dt;
  s.walked += Math.hypot(s.x - s.px, s.y - s.py);
  if (Math.hypot(s.vx, s.vy) > 0.01) s.facing = Math.abs(s.vx) > Math.abs(s.vy) ? s.vx < 0 ? 1 : 3 : s.vy < 0 ? 2 : 0;
  if (c.order && c.pathIndex >= c.path.length && c.order.kind !== "attack") {
    const kind = c.order.kind;
    if (kind === "phone") {
      const phone = level.targets?.[s.delivered] ?? level.phone;
      if (Math.hypot(s.x - phone.x, s.y - phone.y) < 0.7) {
        s.pickup += dt;
        if (s.pickup >= (tacticalCombat(level) ? 0.55 : 0.4) - 1e-8) {
          s.carrying = true;
          s.securityAlarm = true;
          s.thefts++;
          s.pickup = 0;
          clearOrder(c);
        }
      } else clearOrder(c);
    } else if (kind === "switch") {
      const pad = level.switches?.[c.order.target];
      if (pad && Math.hypot(s.x - pad.x, s.y - pad.y) < 0.7) {
        if (pad.kind === "power") s.power = s.power ? 0 : 1;
        else s.relayTimers[pad.channel ?? 0] = pad.duration ?? 9;
        s.activations++;
      }
      clearOrder(c);
    } else clearOrder(c);
  }
  if ((level.combat?.revision ?? 0) >= 10 && Math.hypot(s.vx, s.vy) > 0.1 && s.ticks >= (c.grateNoise?.nextAt ?? 0)) {
    for (const grate of level.encounter?.grates ?? []) if (intersectsBox(s.x, s.y, grate, 0.08)) {
      c.grateNoise = { id: (c.grateNoise?.id ?? 0) + 1, x: s.x, y: s.y, until: s.ticks + 30, nextAt: s.ticks + 45 };
      break;
    }
  }
  if ((level.combat?.revision ?? 0) >= 16) updateTripwires(s, level);
  else updateTripwires2(s, level);
  enemies(s, dt, level);
  projectiles(s, dt, level);
  s.alert = s.guards.some((g) => g.active && g.hp > 0 && g.seesPlayer) ? 1 : 0;
  s.battery = c.hp;
  if (s.status !== "playing") {
    clearOrder(c);
    s.vx = 0;
    s.vy = 0;
    return;
  }
  const e = level.exit, w = level.exitWindow, open = !w || (s.elapsed + w.phase) % w.period < w.openSeconds;
  if (s.carrying && s.x >= e.x && s.x <= e.x + e.w && s.y >= e.y && s.y <= e.y + e.h && open) {
    s.extraction += dt;
    if (s.extraction >= (tacticalCombat(level) ? 1.2 : 0.8) - 1e-8) {
      s.delivered++;
      s.deliveryBatteries.push(c.hp);
      s.carrying = false;
      s.extraction = 0;
      clearOrder(c);
      if (s.delivered >= (level.targets?.length ?? 1)) {
        s.status = "won";
        s.score = 5e3 + Math.floor(3e3 * Math.max(0, level.hardLimitSeconds * 30 - s.ticks) / (level.hardLimitSeconds * 30)) + 20 * c.hp;
      }
    }
  } else s.extraction = 0;
  if (s.status === "playing" && s.ticks >= level.hardLimitSeconds * 30) s.status = "timeout";
}

// src/game/simulation.ts
function gateWantsClosed(g, elapsed, power, timers) {
  "worklet";
  return g.mode === "power" ? g.power !== power : g.mode === "relay" ? (timers[g.relay ?? 0] ?? 0) <= 0 : (elapsed + g.phase) % g.period >= g.openSeconds;
}
function initialState(mission = "practice", definition) {
  "worklet";
  const level = definition ?? getLevel(mission);
  return {
    combat: level.combat ? freshCombat() : null,
    definition,
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
    guards: makeGuards(mission, definition),
    alert: 0,
    caughtBy: -1,
    spotted: false,
    closedGates: (level.gates ?? []).map((g) => gateWantsClosed(g, 0, 0, [0, 0])),
    blockers: [...level.blockers, ...(level.gates ?? []).filter((g) => gateWantsClosed(g, 0, 0, [0, 0])).map((g) => g.box)]
  };
}
function stateLevel(s) {
  "worklet";
  return s.definition ?? getLevel(s.mission);
}
function exitOpen(s) {
  "worklet";
  const w = stateLevel(s).exitWindow;
  return !w || (s.elapsed + w.phase) % w.period < w.openSeconds;
}
function idleInput() {
  "worklet";
  return { x: 0, y: 0, interact: false, dash: 0 };
}
function targetPhone(s) {
  "worklet";
  const level = stateLevel(s);
  return level.targets?.[Math.min(s.delivered, level.targets.length - 1)] ?? level.phone;
}
function targetCount(s) {
  "worklet";
  return stateLevel(s).targets?.length ?? 1;
}
function nearPhone(s) {
  "worklet";
  const phone = targetPhone(s);
  return s.status === "playing" && !s.carrying && Math.hypot(s.x - phone.x, s.y - phone.y) <= TUNING.pickupRadius;
}
function nearSwitch(s) {
  "worklet";
  const switches = stateLevel(s).switches ?? [];
  for (let i = 0; i < switches.length; i++) if (Math.hypot(s.x - switches[i].x, s.y - switches[i].y) < 0.95) return i;
  return -1;
}
function inExit(s) {
  "worklet";
  const e = stateLevel(s).exit;
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
  const level = stateLevel(s), gates2 = level.gates;
  if (!gates2) return;
  let changed = false;
  for (let i = 0; i < gates2.length; i++) {
    const gate = gates2[i], wantsClosed = gateWantsClosed(gate, s.elapsed, s.power, s.relayTimers);
    const occupied = intersectsBox(s.x, s.y, gate.box, 0.4) || s.guards.some((g) => intersectsBox(g.x, g.y, gate.box, 0.45));
    const closed = wantsClosed && (s.closedGates[i] || !occupied);
    if (closed !== s.closedGates[i]) {
      s.closedGates[i] = closed;
      changed = true;
    }
  }
  if (changed) s.blockers = [...level.blockers, ...gates2.filter((_, i) => s.closedGates[i]).map((g) => g.box)];
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
  if (s.combat) {
    stepCombat(s, input, dt);
    return;
  }
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
    const pad = stateLevel(s).switches[switchIndex];
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
  updateGuards(s.guards, s.x, s.y, dt, { ...stateLevel(s), blockers: s.blockers }, noise, { power: s.power, delivered: s.delivered, alarmSeconds: s.securityAlarm && stateLevel(s).number > 0 ? s.alarmSeconds : -1 });
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
  if (s.carrying && inExit(s) && exitOpen(s) && s.dashLeft === 0) {
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
        s.score = 1e4 + 2e3 * (targetCount(s) - 1) + 20 * s.battery + 5 * Math.max(0, Math.floor(stateLevel(s).targetSeconds - s.elapsed));
      } else {
        s.carrying = false;
      }
    }
  } else s.extraction = 0;
  if (s.status === "playing" && s.elapsed + 1e-8 >= stateLevel(s).hardLimitSeconds) {
    s.status = "timeout";
    s.vx = 0;
    s.vy = 0;
    s.px = s.x;
    s.py = s.y;
  }
}

// server/replay.ts
var command = z.object({ seq: z.number().int().min(1).max(14400), kind: z.enum(["move", "attack", "phone", "exit", "switch", "stop"]), x: z.number().min(0).max(24), y: z.number().min(0).max(40), target: z.number().int().min(-1).max(63) }).strict();
var replayInput = z.object({ version: z.union([z.literal(1), z.literal(2)]), chunks: z.array(z.object({ x: z.number().int().min(-127).max(127), y: z.number().int().min(-127).max(127), buttons: z.number().int().min(0).max(7), command: command.optional(), ticks: z.number().int().min(1).max(14400) }).strict()).min(1).max(14400) }).strict();
function verifyReplay(mission, input, definition) {
  if (!CAMPAIGN_IDS.includes(mission)) throw new Error("Unknown ranked mission.");
  const replay = replayInput.parse(input), level = definition ?? (replay.version === 2 ? combatLevel(mission) : getLevel(mission)), limit = level.hardLimitSeconds * 30, state = initialState(mission, level);
  let count = 0, dash = 0, tool = 0, commandSeq = 0;
  if (!!level.combat !== (replay.version === 2)) throw new Error("Replay does not match mission combat version.");
  for (const chunk of replay.chunks) {
    if (replay.version === 1 && chunk.command) throw new Error("Legacy replay cannot contain combat commands.");
    if (replay.version === 2 && (chunk.buttons || chunk.x || chunk.y)) throw new Error("Combat requires command input.");
    if (chunk.command) {
      if (chunk.ticks !== 1 || chunk.command.seq <= commandSeq) throw new Error("Invalid command sequence.");
      commandSeq = chunk.command.seq;
    }
    if (count + chunk.ticks > limit) throw new Error("Replay exceeds the mission time limit.");
    if ((chunk.buttons & 6) !== 0 && chunk.ticks !== 1) throw new Error("An action edge must occupy one tick.");
    for (let n = 0; n < chunk.ticks; n++) {
      if (state.status !== "playing") throw new Error("Replay continues after a terminal result.");
      if (chunk.buttons & 2) dash++;
      if (chunk.buttons & 4) tool++;
      step(state, { x: chunk.x / 127, y: chunk.y / 127, interact: !!(chunk.buttons & 1), dash, tool, command: chunk.command });
      count++;
    }
  }
  return { status: state.status === "playing" ? "incomplete" : state.status, score: state.score, ticks: state.ticks, seconds: state.elapsed, battery: state.battery, delivered: state.delivered, spotted: state.spotted, ...state.combat ? { hp: state.combat.hp, shots: state.combat.shots, kills: state.combat.kills, damageTaken: state.combat.damageTaken } : {} };
}
export {
  replayInput,
  verifyReplay
};
