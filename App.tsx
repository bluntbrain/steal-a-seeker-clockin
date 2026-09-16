import GameScreen from './src/GameScreen';
import NativeParityProbe from './src/NativeParityProbe';
import NativeRecoveryProbe from './src/NativeRecoveryProbe';
// Dedicated diagnostics use synthetic fixtures, never purchase entitlements.
export default process.env.EXPO_PUBLIC_NATIVE_RECOVERY==='1'?NativeRecoveryProbe:process.env.EXPO_PUBLIC_NATIVE_PARITY==='1'?NativeParityProbe:GameScreen;
