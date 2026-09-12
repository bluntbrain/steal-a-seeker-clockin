import type {PaymentQuote} from './commerce';
import type {DailyManifest,RunResult} from './ranked';
import type {ReturnStatus} from './returns';

export type PaidManifest=Pick<DailyManifest,'mission'|'rulesHash'|'levelHash'|'seed'|'loadout'|'hardLimitSeconds'>;
export type PaidStatus='quoted'|'verifying_payment'|'ready'|'running'|'verifying_run'|'won'|'lost'|'refunding'|'returned'|'refunded'|'expired'|'review';
export type PaidRun={id:string;wallet:string;startKey:string|null;manifest:PaidManifest;issuedAt:string;expiresAt:string;result:RunResult|null};
export type PaidEntry={id:string;wallet:string;status:PaidStatus;quote:PaymentQuote;manifest:PaidManifest;readyUntil:string|null;run:PaidRun|null;detail:string|null;return:ReturnStatus|null};
export type PaidChallenge={enabled:boolean;currency:'TEST SKR';entryPrice:10;grossSuccessReturn:10;unstartedHours:24;manifest:PaidManifest;termsVersion:'devnet-v1';terms:string[]};
