import {loadReturnSigner} from './return-chain';

async function main() {
  const path = process.env.DEVNET_SIGNER_PATH, treasury = process.env.DEVNET_TREASURY;
  if (!path || !treasury) throw new Error('Set DEVNET_SIGNER_PATH and DEVNET_TREASURY.');
  const signer = await loadReturnSigner(path, treasury);
  console.log(JSON.stringify({ready: true, treasury: signer.address, sendsTransactions: false}));
}
main().catch(() => {console.error('Signer validation failed. Check the file permissions, key format and configured public treasury.'); process.exitCode = 1;});
