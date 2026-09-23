/** Session dismissal is deliberately not tied to wallet/account refreshes. */
export function showPassIntro(input:{dismissed:boolean;owned:boolean;diagnostic:boolean}){
 return !input.dismissed&&!input.owned&&!input.diagnostic;
}
