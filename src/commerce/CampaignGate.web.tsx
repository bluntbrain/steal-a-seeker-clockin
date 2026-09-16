import React,{type ReactNode} from 'react';
// Campaign access is free. Only issuing a ranked weekly ticket requires the pass.
export default function CampaignGate({children}:{children:ReactNode}){return <>{children}</>;}
