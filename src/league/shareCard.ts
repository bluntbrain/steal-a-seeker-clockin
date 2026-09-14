import {captureRef} from 'react-native-view-shot';
import * as Files from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type {CourierCardData} from './card';
export async function shareCard(_data:CourierCardData,ref:Parameters<typeof captureRef>[0],save=false){
 const uri=await captureRef(ref,{format:'png',quality:1,result:'tmpfile',width:1080,height:1350});
 if(save){const directory=await Files.StorageAccessFramework.requestDirectoryPermissionsAsync();if(!directory.granted)return;const target=await Files.StorageAccessFramework.createFileAsync(directory.directoryUri,`seeker-${_data.week}.png`,'image/png');const contents=await Files.readAsStringAsync(uri,{encoding:Files.EncodingType.Base64});await Files.writeAsStringAsync(target,contents,{encoding:Files.EncodingType.Base64});return;}
 if(!await Sharing.isAvailableAsync())throw Error('No sharing app is available on this device.');
 await Sharing.shareAsync(uri,{mimeType:'image/png',dialogTitle:'Share or save your Courier Card',UTI:'public.png'});
}
