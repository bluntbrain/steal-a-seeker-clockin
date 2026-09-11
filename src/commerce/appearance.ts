export type Appearance={outfit?:string;trail?:string;frame?:string;rack?:string;reducedEffects?:boolean};
export function courierPalette(outfit?:string){
 if(outfit==='night-courier')return {dark:'#142629',cream:'#304843',mint:'#99edcf'};
 if(outfit==='signal-runner')return {dark:'#dbe3d5',cream:'#f1eedf',mint:'#ed9862'};
 return {dark:'#17282d',cream:'#e8ebda',mint:'#a8ecd7'};
}
