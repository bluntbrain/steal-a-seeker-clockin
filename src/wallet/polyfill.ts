import {Buffer} from 'buffer';
import {install} from 'react-native-quick-crypto';
install();

globalThis.Buffer = globalThis.Buffer || Buffer;
