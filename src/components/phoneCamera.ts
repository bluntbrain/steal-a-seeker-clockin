export type PhonePose = {yaw:number;pitch:number;zoom:number};
export const PHONE_DEFAULT_POSE:PhonePose={yaw:Math.PI-0.4,pitch:0.12,zoom:1};
export const PHONE_PRESETS:Record<string,PhonePose>={
  Front:{yaw:0,pitch:0,zoom:1},Back:{yaw:Math.PI,pitch:0,zoom:1},
  Left:{yaw:-Math.PI/2,pitch:0,zoom:1},Right:{yaw:Math.PI/2,pitch:0,zoom:1},
  Top:{yaw:0,pitch:Math.PI/2-0.025,zoom:1},Bottom:{yaw:0,pitch:-Math.PI/2+0.025,zoom:1},
};
export function clampPhonePose(p:PhonePose):PhonePose{
  return {yaw:Number.isFinite(p.yaw)?p.yaw:PHONE_DEFAULT_POSE.yaw,
    pitch:Math.max(-Math.PI/2+0.025,Math.min(Math.PI/2-0.025,Number.isFinite(p.pitch)?p.pitch:0)),
    zoom:Math.max(0.72,Math.min(1.3,Number.isFinite(p.zoom)?p.zoom:1))};
}
export function dragPhone(start:PhonePose,dx:number,dy:number):PhonePose{
  return clampPhonePose({...start,yaw:start.yaw-dx*0.009,pitch:start.pitch+dy*0.009});
}
export function pinchPhone(start:PhonePose,startSpan:number,span:number):PhonePose{
  return clampPhonePose({...start,zoom:startSpan>0&&span>0?start.zoom*span/startSpan:start.zoom});
}
