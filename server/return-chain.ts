import {readFile, stat} from 'node:fs/promises';
import {z} from 'zod';
import {AccountRole, address, blockhash, appendTransactionMessageInstructions, createTransactionMessage, createKeyPairSignerFromBytes, getBase64Decoder, getBase64EncodedWireTransaction, getSignatureFromTransaction, pipe, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners, type KeyPairSigner, type Instruction} from '@solana/kit';
import {findAssociatedTokenPda, getCreateAssociatedTokenIdempotentInstructionAsync, getTransferCheckedInstruction} from '@solana-program/token';
import {DEVNET_GENESIS, MEMO_PROGRAM, TOKEN_PROGRAM, rpc, verifyPayment} from './chain';
import {RETURN_FEE_RESERVE, type ReturnBinding, type ReturnChain, type ReturnConfig, type ReturnInspection, type SignedReturn} from './returns';

type RpcCall = <T>(method: string, params?: unknown[]) => Promise<T>;
const uint = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const account = z.object({context: z.object({slot: uint}), value: z.object({owner: z.string(), data: z.object({parsed: z.object({type: z.string(), info: z.record(z.string(), z.unknown())})})}).nullable()});
const requiredError = z.unknown().refine(value => value !== undefined, 'RPC error field is missing.');
const statusResponse = z.object({context: z.object({slot: uint}), value: z.array(z.object({slot: uint, err: requiredError, confirmationStatus: z.enum(['processed', 'confirmed', 'finalized']).nullable()}).nullable()).length(1)});

export async function loadReturnSigner(path: string, expected: string) {
  const info = await stat(path);
  if (!info.isFile() || (info.mode & 0o077) !== 0) throw new Error('Devnet signer must be a private local file.');
  const bytes = z.array(z.number().int().min(0).max(255)).length(64).parse(JSON.parse(await readFile(path, 'utf8')));
  const signer = await createKeyPairSignerFromBytes(new Uint8Array(bytes));
  if (signer.address !== expected) throw new Error('Devnet signer does not match the configured treasury.');
  return signer;
}

export class DevnetReturnChain implements ReturnChain {
  private call: RpcCall;
  constructor(private config: ReturnConfig & {rpcUrl: string}, private signer: KeyPairSigner, call?: RpcCall) {
    if (signer.address !== config.treasury) throw new Error('Return signer does not match the treasury.');
    this.call = call ?? (<T>(method: string, params?: unknown[]) => rpc<T>(config.rpcUrl, method, params));
  }
  private async genesis() {
    if (await this.call('getGenesisHash') !== DEVNET_GENESIS) throw new Error('Returns are restricted to devnet.');
  }
  async available(minContextSlot = 0) {
    await this.genesis();
    const mint = account.parse(await this.call('getAccountInfo', [this.config.mint, {encoding: 'jsonParsed', commitment: 'finalized', minContextSlot}]));
    if (mint.context.slot < minContextSlot) throw new Error('RPC balance is older than the latest finalized return.');
    if (!mint.value || mint.value.owner !== TOKEN_PROGRAM || mint.value.data.parsed.type !== 'mint' || mint.value.data.parsed.info.decimals !== this.config.decimals || mint.value.data.parsed.info.isInitialized !== true) throw new Error('Devnet return mint is not ready.');
    const source = account.parse(await this.call('getAccountInfo', [this.config.source, {encoding: 'jsonParsed', commitment: 'finalized', minContextSlot: mint.context.slot}]));
    if (source.context.slot < mint.context.slot) throw new Error('Treasury account context is stale.');
    const token = source.value?.data.parsed.info;
    if (!source.value || source.value.owner !== TOKEN_PROGRAM || source.value.data.parsed.type !== 'account' || token?.owner !== this.config.treasury || token?.mint !== this.config.mint || token?.state !== 'initialized') throw new Error('Return treasury account is not ready.');
    const amount = z.object({amount: z.string().regex(/^\d+$/), decimals: z.literal(this.config.decimals)}).parse(token.tokenAmount);
    const balance = z.object({context: z.object({slot: uint}), value: uint}).parse(await this.call('getBalance', [this.config.treasury, {commitment: 'finalized', minContextSlot: source.context.slot}]));
    if (balance.context.slot < source.context.slot) throw new Error('Treasury SOL balance context is stale.');
    return {tokens: BigInt(amount.amount), lamports: BigInt(balance.value)};
  }
  async prepare(binding: ReturnBinding): Promise<SignedReturn> {
    if (binding.treasury !== this.config.treasury || binding.source !== this.config.source || binding.mint !== this.config.mint || binding.decimals !== this.config.decimals) throw new Error('Return binding differs from signer configuration.');
    const available = await this.available();
    if (available.tokens < BigInt(binding.amount) || available.lamports < RETURN_FEE_RESERVE) throw new Error('Treasury needs devnet token or fee funding.');
    const [destination] = await findAssociatedTokenPda({owner: address(binding.wallet), mint: address(binding.mint), tokenProgram: address(TOKEN_PROGRAM)});
    if (destination !== binding.destination) throw new Error('Return destination does not belong to the reserved wallet.');
    const lifetime = z.object({context: z.object({slot: uint}), value: z.object({blockhash: z.string(), lastValidBlockHeight: uint})}).parse(await this.call('getLatestBlockhash', [{commitment: 'finalized'}]));
    const create = await getCreateAssociatedTokenIdempotentInstructionAsync({payer: this.signer, owner: address(binding.wallet), mint: address(binding.mint), ata: destination, tokenProgram: address(TOKEN_PROGRAM)});
    const transfer = getTransferCheckedInstruction({source: address(binding.source), mint: address(binding.mint), destination, authority: this.signer, amount: BigInt(binding.amount), decimals: binding.decimals});
    const bound: Instruction = {...transfer, accounts: [...transfer.accounts, {address: address(binding.reference), role: AccountRole.READONLY}]};
    const memo: Instruction = {programAddress: address(MEMO_PROGRAM), data: new TextEncoder().encode(binding.memo)};
    const message = pipe(createTransactionMessage({version: 0}), m => setTransactionMessageFeePayerSigner(this.signer, m), m => setTransactionMessageLifetimeUsingBlockhash({blockhash: blockhash(lifetime.value.blockhash), lastValidBlockHeight: BigInt(lifetime.value.lastValidBlockHeight)}, m), m => appendTransactionMessageInstructions([create, bound, memo], m));
    const signed = await signTransactionMessageWithSigners(message), wire = getBase64EncodedWireTransaction(signed);
    const fee = z.object({value: uint.nullable()}).parse(await this.call('getFeeForMessage', [getBase64Decoder().decode(signed.messageBytes), {commitment: 'finalized', minContextSlot: lifetime.context.slot}]));
    const rent = uint.parse(await this.call('getMinimumBalanceForRentExemption', [165, {commitment: 'finalized'}]));
    if (fee.value === null || fee.value > 10_000 || BigInt(rent) + BigInt(fee.value) * 8n > RETURN_FEE_RESERVE) throw new Error('Network costs exceed the reserved devnet fee budget.');
    const simulation = z.object({value: z.object({err: z.unknown()})}).parse(await this.call('simulateTransaction', [wire, {encoding: 'base64', sigVerify: true, commitment: 'finalized', minContextSlot: lifetime.context.slot}]));
    if (simulation.value.err !== null) throw new Error('Return transaction preflight failed.');
    return {signature: getSignatureFromTransaction(signed), wire, blockhash: lifetime.value.blockhash, lastValidHeight: String(lifetime.value.lastValidBlockHeight), contextSlot: String(lifetime.context.slot)};
  }
  async broadcast(attempt: SignedReturn) {
    await this.genesis();
    const signature = await this.call('sendTransaction', [attempt.wire, {encoding: 'base64', skipPreflight: false, preflightCommitment: 'finalized', minContextSlot: Number(attempt.contextSlot), maxRetries: 2}]);
    if (signature !== attempt.signature) throw new Error('RPC returned a different transaction signature.');
  }
  async inspect(binding: ReturnBinding, attempt: SignedReturn): Promise<ReturnInspection> {
    await this.genesis();
    const height = uint.parse(await this.call('getBlockHeight', [{commitment: 'finalized', minContextSlot: Number(attempt.contextSlot)}]));
    const status = statusResponse.parse(await this.call('getSignatureStatuses', [[attempt.signature], {searchTransactionHistory: true}]));
    if (status.context.slot < Number(attempt.contextSlot)) throw new Error('RPC status context is behind the signed transaction.');
    const current = status.value[0];
    if (current?.confirmationStatus === 'finalized') {
      if (current.err !== null) return {state: 'failed', detail: 'Prior return failed atomically on devnet.'};
      const value = await this.call('getTransaction', [attempt.signature, {encoding: 'json', commitment: 'finalized', maxSupportedTransactionVersion: 0}]);
      if (value === null) throw new Error('Finalized transaction data is unavailable.');
      const verified = verifyPayment({wallet: binding.treasury, recipient: binding.wallet, source: binding.source, destination: binding.destination, mint: binding.mint, tokenProgram: TOKEN_PROGRAM, amount: binding.amount, decimals: binding.decimals, reference: binding.reference, memo: binding.memo, createdAt: '', expiresAt: ''}, attempt.signature, value, false);
      if (verified.state !== 'verified') return {state: 'review', detail: 'Finalized return did not match its reserved transfer. Funds remain reserved.'};
      return {state: 'settled', slot: verified.slot};
    }
    // A non-finalized status is not proof of failure, even after blockhash expiry.
    if (current || BigInt(height) <= BigInt(attempt.lastValidHeight)) return {state: 'pending', detail: 'Waiting for finalized return evidence.'};
    const first = uint.parse(await this.call('getFirstAvailableBlock'));
    if (first > Number(attempt.contextSlot)) throw new Error('RPC history no longer covers this transaction; archival reconciliation is required.');
    const history = z.array(z.object({signature: z.string(), err: requiredError})).parse(await this.call('getSignaturesForAddress', [binding.reference, {commitment: 'finalized', minContextSlot: status.context.slot, limit: 1000}]));
    if (history.length === 1000 || history.some(row => row.signature === attempt.signature || row.err === null)) throw new Error('Reference history requires further finalized reconciliation.');
    // Re-read with history search after the finalized reference scan. A missing
    // result from an incomplete/pruned provider never reaches this branch.
    const recheck = statusResponse.parse(await this.call('getSignatureStatuses', [[attempt.signature], {searchTransactionHistory: true}]));
    if (recheck.context.slot < status.context.slot || recheck.value[0]) throw new Error('Return status changed during expiry reconciliation.');
    return {state: 'expired', detail: 'Lifetime expired with no executed return in finalized RPC history.'};
  }
}
