import type {Point} from '../game/level';
export const TAP_INTERVAL_MS=80;
export type PendingTap=Point&{at:number};
// Input presentation only: bursts keep the newest intent, never a backlog of paths.
export function isDuplicateTap(previous:PendingTap|null,next:PendingTap){
 'worklet';return !!previous&&next.at-previous.at<180&&Math.hypot(next.x-previous.x,next.y-previous.y)<.12;
}
export function tapReady(pending:PendingTap|null,elapsedMs:number){'worklet';return pending!==null&&elapsedMs>=TAP_INTERVAL_MS;}
