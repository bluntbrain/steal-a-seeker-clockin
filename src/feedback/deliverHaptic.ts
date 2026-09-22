/** Unsupported Android primitives may reject on older OS versions. Fall back once
 * through Android's native feedback API, which still respects system settings.
 */
export async function deliverHaptic(primary:()=>Promise<unknown>,fallback:(()=>Promise<unknown>)|undefined,stillEnabled:()=>boolean){
 try{await primary();}catch{
  if(!fallback||!stillEnabled())return;
  try{await fallback();}catch{/* Feedback must never break the requested action. */}
 }
}
