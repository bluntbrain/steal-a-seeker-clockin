import type {LeagueBoard,LeagueEntry} from '../../shared/league';

/** Server rank may be tied. Position determines ordering, never a new rank. */
export function leagueLeaders(board:LeagueBoard){return [...board.entries].sort((a,b)=>a.position-b.position).slice(0,3);}
export function leagueRows(board:LeagueBoard){const leaders=new Set(leagueLeaders(board).map(p=>p.wallet));return board.entries.filter(p=>!leaders.has(p.wallet));}
/** Include leaders and an off-page personal result once, preserving server ranks. */
export function leagueStandings(board:LeagueBoard,nearby=false){
 const rows=[...(nearby?board.nearby:board.entries)];
 if(board.personal&&!rows.some(row=>row.wallet===board.personal!.wallet))rows.push(board.personal);
 return rows.sort((a,b)=>a.position-b.position);
}
export function rivalLabel(personal:LeagueEntry|null,rival:LeagueEntry|null){
 if(!personal||!rival)return null;
 if(rival.points>personal.points)return `${(rival.points-personal.points).toLocaleString()} pts to match #${rival.rank}`;
 return `${Math.max(0,(personal.ticks-rival.ticks)/30).toFixed(2)}s faster to match #${rival.rank}`;
}
