export function pricingFailure(error:unknown){
 const status=typeof error==='object'&&error!==null&&'status' in error?error.status:undefined;
 const unavailable=status===400||status===404;
 return {unavailable,message:unavailable?'This item is not available in the store yet. Please check back later.':'Could not update prices. Tap to retry.'};
}
