// Fixed heading: controls stay screen-relative without a second camera joystick.
export const CAMERA_HEADING = Math.atan2(6, 11);
export function screenToWorld(x: number, y: number) {
  'worklet';
  const c = Math.cos(CAMERA_HEADING), s = Math.sin(CAMERA_HEADING);
  return { x: x*c+y*s, y: -x*s+y*c };
}
