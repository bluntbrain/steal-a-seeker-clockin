import Storage from 'expo-sqlite/kv-store';
export const readSave=(key:string)=>Storage.getItemAsync(key);
export const writeSave=(key:string,value:string)=>Storage.setItemAsync(key,value);
