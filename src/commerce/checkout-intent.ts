import type {Order,ProductId} from '../../shared/commerce';
import type {PriceSnapshot} from '../../shared/pricing';
/** Continue directly only for the exact price the player tapped. */
export function matchesCheckoutPrice(order:Order,sku:ProductId,price:PriceSnapshot|undefined,rebateSkr?:number){
 return (rebateSkr===undefined||order.campaignTerms?.rebate===rebateSkr)&&!!price&&order.sku===sku&&order.status==='quoted'&&!order.signature&&!order.payment
  &&(order.currency??'SKR')===price.currency&&order.amount===price.amount&&order.decimals===price.decimals
  &&order.pricing?.usdCents===price.usdCents;
}
