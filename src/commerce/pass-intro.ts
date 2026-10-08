/** Session dismissal is deliberately not tied to wallet/account refreshes. */
export function showPassIntro(input:{dismissed:boolean;owned:boolean;diagnostic:boolean}){
 return !input.dismissed&&!input.owned&&!input.diagnostic;
}

// the map window reports when it is on screen, so the welcome screen can stay up until then. without it the game
// screen showed for a few frames between the welcome screen and the map
const homeListeners=new Set<()=>void>();
export const homeShown=()=>{for(const l of homeListeners)l();};
export const onHomeShown=(l:()=>void)=>{homeListeners.add(l);return()=>{homeListeners.delete(l);};};
