const ALLOWED_ORIGINS = new Set(['https://ploos.no', 'https://www.ploos.no']);
const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
function reply(status, message, origin = '') {
  const headers = {...HEADERS};
  if (ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return new Response(JSON.stringify({message}), {status, headers});
}
const valid = (v, min, max) => typeof v === 'string' && v.trim().length >= min && v.length <= max;
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') {
      if (!ALLOWED_ORIGINS.has(origin)) return reply(403, 'Forbidden', origin);
      return new Response(null, {status: 204, headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '3600', 'Vary':'Origin'
      }});
    }
    if (request.method !== 'POST') return reply(405, 'Method not allowed', origin);
    if (!ALLOWED_ORIGINS.has(origin)) return reply(403, 'Forbidden', origin);
    if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/json') return reply(415, 'Unsupported media type', origin);
    if (Number(request.headers.get('Content-Length') || 0) > 12000) return reply(413,'Too large',origin);
    if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) return reply(503, 'Unavailable', origin);
    let data;
    try {
      const body=await request.text();
      if (body.length > 12000) return reply(413,'Too large',origin);
      data=JSON.parse(body);
    } catch { return reply(400,'Invalid request',origin); }
    if (data?.website) return reply(200, 'Accepted', origin); // honeypot
    if (!valid(data?.name,1,120) || !valid(data?.subject,1,160) ||
        !valid(data?.message,1,5000) || !valid(data?.email,3,254) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return reply(400,'Invalid fields',origin);
    const plain=['Contact form submission', 'Name: '+data.name.trim(), 'Reply address: '+data.email.trim(), 'Subject: '+data.subject.trim(), '', data.message.trim()].join('\n');
    try {
      const upstream=await fetch('https://api.resend.com/emails',{
        method:'POST',
        headers:{'Authorization':'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},
        body:JSON.stringify({from:env.CONTACT_FROM_EMAIL,to:[env.CONTACT_TO_EMAIL],
          subject:'Ploos contact: '+data.subject.trim().replace(/[\r\n]/g,' '),
          text:plain,reply_to:data.email.trim()})
      });
      if (!upstream.ok) return reply(502,'Delivery error',origin);
      return reply(200,'Sent',origin);
    } catch { return reply(502,'Delivery error',origin); }
  }
};
