import { sendWithProton } from './smtp.js';

const ALLOWED_ORIGINS=new Set(['https://ploos.no','https://www.ploos.no']);
const HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
const MAX_BODY=12000;
const valid=(value,min,max)=>typeof value==='string'&&value.trim().length>=min&&value.length<=max;
function reply(status,message,origin=''){
  const headers={...HEADERS};
  if(ALLOWED_ORIGINS.has(origin)){headers['Access-Control-Allow-Origin']=origin;headers.Vary='Origin'}
  return new Response(JSON.stringify({message}),{status,headers});
}
async function turnstileValid(token,request,secret){
  if(!valid(token,1,2048))return false;
  const params=new URLSearchParams({secret,response:token});
  const address=request.headers.get('CF-Connecting-IP');
  if(address)params.set('remoteip',address);
  const res=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:params});
  if(!res.ok)return false;
  const result=await res.json();
  return result.success===true&&result.action==='contact'&&
    (result.hostname==='ploos.no'||result.hostname==='www.ploos.no');
}
export default {
  async fetch(request,env){
    const origin=request.headers.get('Origin')||'';
    if(request.method==='OPTIONS'){
      if(!ALLOWED_ORIGINS.has(origin))return reply(403,'Forbidden',origin);
      return new Response(null,{status:204,headers:{
        'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS',
        'Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'3600','Vary':'Origin'
      }});
    }
    if(request.method!=='POST')return reply(405,'Method not allowed',origin);
    if(!ALLOWED_ORIGINS.has(origin))return reply(403,'Forbidden',origin);
    if(request.headers.get('Content-Type')?.split(';')[0]!=='application/json')return reply(415,'Unsupported media type',origin);
    if(Number(request.headers.get('Content-Length')||0)>MAX_BODY)return reply(413,'Too large',origin);
    if(!env.PROTON_SMTP_USERNAME||!env.PROTON_SMTP_TOKEN||!env.CONTACT_TO_EMAIL||!env.TURNSTILE_SECRET_KEY)
      return reply(503,'Unavailable',origin);
    let data;
    try{const body=await request.text();if(body.length>MAX_BODY)return reply(413,'Too large',origin);data=JSON.parse(body)}
    catch{return reply(400,'Invalid request',origin)}
    if(data?.website)return reply(200,'Accepted',origin);
    if(!valid(data?.name,1,120)||!valid(data?.subject,1,160)||
       !valid(data?.message,1,5000)||!valid(data?.email,3,254)||
       !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))return reply(400,'Invalid fields',origin);
    try{
      if(!await turnstileValid(data['cf-turnstile-response'],request,env.TURNSTILE_SECRET_KEY))
        return reply(400,'Anti-spam validation failed',origin);
      await sendWithProton(env,data);
      return reply(200,'Sent',origin);
    }catch{return reply(502,'Delivery error',origin)}
  }
};
