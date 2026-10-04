/** One distinct illustration set for each ten-level chapter; decoration only. */
export const CAMPAIGN_WORLDS = [
 {id:'first-pickup',title:'First Pickup',actors:['toly','mert','beeman'],brands:['jupiter','bonk','solana'],accent:'#345D4F'},
 {id:'seeker-square',title:'Seeker Square',actors:['chase','lily','seeker'],brands:['meteora','wif','skr'],accent:'#355A58'},
 {id:'validator-yard',title:'Validator Yard',actors:['vibhu','akshay','validator'],brands:['pump','phantom','solana'],accent:'#3B5656',extra:'pump-capsule'},
 {id:'seed-vault',title:'Seed Vault',actors:['toly-vault','seed-vault','toly-rope'],brands:['skr','solana','phantom'],accent:'#435D48'},
 {id:'relay-raid',title:'Relay Raid',actors:['mert-scan','mert-relay','token-fountain'],brands:['solana','jupiter','skr'],accent:'#345A62'},
 {id:'phone-flight',title:'Phone Flight',actors:['chase-surf','phone-launch','courier-glider'],brands:['jupiter','meteora','solana'],accent:'#454D67'},
 {id:'meme-market',title:'Meme Market',actors:['lily-net','bonk-courier','hat-dog'],brands:['bonk','wif','pump'],accent:'#605A42'},
 {id:'orbital-escape',title:'Orbital Escape',actors:['vibhu-phone','vibhu-coins','jupiter-orbit'],brands:['jupiter','skr','solana'],accent:'#455D4A'},
 {id:'portal-pursuit',title:'Portal Pursuit',actors:['akshay-portal','akshay-drone','meteora-shards'],brands:['meteora','pump','phantom'],accent:'#514F67',extra:'portal'},
 {id:'last-hideout',title:'Last Hideout',actors:['beeman-bridge','beeman-lookout','phantom-friend'],brands:['phantom','skr','solana'],accent:'#3A605A'},
] as const;
export type CampaignWorldId=typeof CAMPAIGN_WORLDS[number]['id'];
