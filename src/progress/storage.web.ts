export const readSave=async(key:string)=>localStorage.getItem(key);
export const writeSave=async(key:string,value:string)=>{localStorage.setItem(key,value);};
