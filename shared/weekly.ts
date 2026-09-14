/** Monday 00:00 UTC, inclusive; following Monday exclusive. */
export function weekWindow(now=new Date()){
 const start=new Date(now);start.setUTCHours(0,0,0,0);start.setUTCDate(start.getUTCDate()-(start.getUTCDay()+6)%7);
 const end=new Date(start.getTime()+7*86400000);
 return {week:start.toISOString().slice(0,10),startsAt:start.toISOString(),endsAt:end.toISOString()};
}
export function weeklyResetLabel(endsAt:string,now=Date.now()){
 const minutes=Math.max(0,Math.ceil((Date.parse(endsAt)-now)/60000));
 return minutes===0?'New week · refresh':`${Math.floor(minutes/1440)}d ${Math.floor(minutes%1440/60)}h ${minutes%60}m left`;
}
