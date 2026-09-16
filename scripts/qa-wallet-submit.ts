// Retired: the app now uses MWA wallet sign-and-send, not an app-side sender.
// Keep this entry point explicit so an old QA command cannot send from devnet fixtures.
console.error('This QA flow is retired. Run tests/wallet-managed-send.test.ts for the current MWA flow, then test approval in Phantom on Android.');
process.exitCode=1;
export {};
