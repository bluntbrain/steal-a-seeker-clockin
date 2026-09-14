import React,{Component,type ErrorInfo,type ReactNode} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
type Props={children:ReactNode;scope:string;fallback?:ReactNode};
/** Catches React render/lifecycle failures. Native process crashes need separate fixes. */
export default class RecoveryBoundary extends Component<Props,{failed:boolean;generation:number}>{
 state={failed:false,generation:0};
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(error:Error,info:ErrorInfo){console.error('[SeekerRecovery]',this.props.scope,error.name,error.message,info.componentStack);}
 render(){
  if(!this.state.failed)return <React.Fragment key={this.state.generation}>{this.props.children}</React.Fragment>;
  if(this.props.fallback)return this.props.fallback;
  return <View testID="app-recovery" style={s.screen}><Text style={s.title}>Let’s get you back.</Text><Text style={s.body}>This screen hit a problem. Reload to restore your saved progress and check any pending payment.</Text><Pressable accessibilityRole="button" accessibilityLabel="Reload game" onPress={()=>this.setState(s=>({failed:false,generation:s.generation+1}))} style={s.button}><Text style={s.label}>Reload game</Text></Pressable><Text style={s.note}>An unfinished run may not be saved. Don’t pay again while a payment is being checked.</Text></View>;
 }
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:'#0C0C0E',alignItems:'center',justifyContent:'center',padding:28,gap:18},title:{fontSize:26,fontWeight:'800',color:'#F1F6EF'},body:{color:'#A7BCC1',fontSize:15,lineHeight:22,textAlign:'center',maxWidth:350},button:{backgroundColor:'#CFE6E4',paddingVertical:16,paddingHorizontal:30,borderRadius:16},label:{color:'#173739',fontWeight:'800',fontSize:15},note:{color:'#839B9D',fontSize:12,lineHeight:18,textAlign:'center',maxWidth:340}});
