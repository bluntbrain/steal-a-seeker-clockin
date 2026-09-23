/** Owner-approved planned regular price; never label it a previous selling price. */
export function welcomeOffer(skr:number,usdCents:number){
 if(!Number.isFinite(skr)||skr<=0||!Number.isSafeInteger(usdCents)||usdCents<=0)return null;
 return {skr,usdCents,plannedSkr:skr*2,plannedUsdCents:usdCents*2};
}
