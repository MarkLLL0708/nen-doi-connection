import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const U=process.env.VITE_SUPABASE_URL, K=process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const tok=JSON.parse(fs.readFileSync("/tmp/browser/rt/tokens.json"));
const MINE=process.argv[2], OTHER="c2c3b18c-fb3f-4ef0-a94d-1fd354dba816";
function mk(t){const c=createClient(U,K,{auth:{persistSession:false,autoRefreshToken:false},global:t?{headers:{Authorization:`Bearer ${t}`}}:{}}); if(t) c.realtime.setAuth(t); return c;}
function join(c,topic,priv,label){return new Promise(res=>{const got=[];const ch=c.channel(topic,{config:{private:priv,presence:{key:label}}});
 ch.on("broadcast",{event:"press"},({payload})=>got.push(payload)).on("presence",{event:"sync"},()=>got.push({presence:Object.keys(ch.presenceState())}));
 const t=setTimeout(()=>res({label,status:"TIMEOUT",ch,got}),8000);
 ch.subscribe((s,e)=>{if(s!=="SUBSCRIBED"&&s!=="CHANNEL_ERROR"&&s!=="TIMED_OUT")return;clearTimeout(t);res({label,status:s,err:e?.message,ch,got});});});}
const A=mk(tok.A),B=mk(tok.B),X=mk(null),Y=mk(null);
const topic=`thumb:${MINE}`;
const ra=await join(A,topic,true,"A"), rb=await join(B,topic,true,"B");
const rx=await join(X,topic,true,"anon-private"), ry=await join(Y,topic,false,"anon-public-same-address");
const ro=await join(mk(tok.A),`thumb:${OTHER}`,true,"A-into-other-pair");
await rb.ch.track({user_id:"B",pressing:true});
await rb.ch.send({type:"broadcast",event:"press",payload:{user_id:"B",pressing:true}});
await new Promise(r=>setTimeout(r,3000));
for(const r of [ra,rb,rx,ry,ro]) console.log(r.label,"| join:",r.status,r.err??"","| received:",JSON.stringify(r.got));
process.exit(0);
