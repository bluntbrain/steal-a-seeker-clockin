import GameScreen from './src/GameScreen';
import NativeParityProbe from './src/NativeParityProbe';
// Dedicated test build only; it offers no campaign access or payment bypass.
export default process.env.EXPO_PUBLIC_NATIVE_PARITY==='1'?NativeParityProbe:GameScreen;
