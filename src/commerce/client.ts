import type {AccountState,Order,ProductId,SignInChallenge} from '../../shared/commerce';
export class ApiError extends Error{constructor(public status:number,message:string){super(message);}}
export const API_URL=process.env.EXPO_PUBLIC_API_URL;
export async function api<T>(path:string,options:{token?:string;body?:unknown;method?:string}={}):Promise<T>{
 if(!API_URL)throw new ApiError(503,'The purchase service is not configured in this test build.');
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{const response=await fetch(`${API_URL.replace(/\/$/,'')}${path}`,{method:options.method||(options.body?'POST':'GET'),headers:{'Content-Type':'application/json',...(options.token?{Authorization:`Bearer ${options.token}`}:{})},body:options.body?JSON.stringify(options.body):undefined,signal:controller.signal});const result=await response.json();if(!response.ok)throw new ApiError(response.status,result.error||'Service unavailable.');return result as T;}finally{clearTimeout(timeout);}
}
export type Session={token:string;wallet:string;expiresAt:string};
export const commerceApi={
 challenge:(wallet:string)=>api<SignInChallenge>('/auth/challenge',{body:{wallet}}),
 signIn:(body:{id:string;wallet:string;signedMessage:string;signature:string})=>api<{token:string;expiresAt:string;account:AccountState}>('/auth/verify',{body}),
 me:(token:string)=>api<AccountState>('/me',{token}),
 orders:(token:string)=>api<Order[]>('/orders',{token}),
 order:(token:string,id:string)=>api<Order>(`/orders/${id}`,{token}),
 quote:(token:string,sku:ProductId,idempotencyKey:string)=>api<Order>('/orders',{token,body:{sku,idempotencyKey}}),
 attach:(token:string,id:string,signature:string)=>api<Order>(`/orders/${id}/transaction`,{token,body:{signature}}),
 reconcile:(token:string,id:string)=>api<Order>(`/orders/${id}/reconcile`,{token,body:{}}),
 equip:(token:string,sku:ProductId)=>api<AccountState>('/me/equipment',{token,method:'PUT',body:{sku}}),
};
