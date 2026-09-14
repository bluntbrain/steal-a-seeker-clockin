// Old challenge manifests retain their signed content; translate only the label shown.
export function playerCopy(text:string){return text.replace(/\bDECOY\b/g,'DISTRACT').replace(/\bDecoys\b/g,'Distractions').replace(/\bdecoys\b/g,'distractions').replace(/\bdecoy\b/g,'distraction');}
