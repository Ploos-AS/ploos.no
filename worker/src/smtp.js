import { connect } from 'cloudflare:sockets';

const HOST = 'smtp.protonmail.ch';
const PORT = 587;
const encoder = new TextEncoder();
const crlf = '\r\n';

function encodeHeader(value) {
  const bytes = encoder.encode(String(value));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return '=?UTF-8?B?' + btoa(binary) + '?=';
}
function cleanHeader(value) {
  return String(value).replace(/[\r\n\x00-\x1F\x7F]/g, ' ').trim();
}
function safeAddress(value) {
  const address=String(value).trim();
  if(!/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(address)) throw new Error('Invalid address');
  return address;
}
function base64(str) {
  const buf=encoder.encode(str);
  let raw='';
  for(const byte of buf) raw+=String.fromCharCode(byte);
  return btoa(raw);
}

export async function sendWithProton(env, data) {
  const username = safeAddress(env.PROTON_SMTP_USERNAME);
  const from = safeAddress(env.CONTACT_FROM_EMAIL || username);
  const recipient = safeAddress(env.CONTACT_TO_EMAIL);
  const replyTo = safeAddress(data.email);
  // The SMTP session is intentionally a single request. No credentials are
  // transmitted until the server confirms STARTTLS has completed.
  let socket=connect({hostname:HOST,port:PORT},{secureTransport:'starttls'});
  let reader,writer;
  let buffer='';
  const decoder=new TextDecoder();
  async function attach(s) {
    reader=s.readable.getReader();
    writer=s.writable.getWriter();
    buffer='';
  }
  async function readLine() {
    for(;;) {
      const n=buffer.indexOf('\n');
      if(n!==-1) {
        const line=buffer.slice(0,n+1).replace(/\r?\n$/,'');
        buffer=buffer.slice(n+1);
        return line;
      }
      const chunk=await reader.read();
      if(chunk.done) throw new Error('SMTP connection closed');
      buffer+=decoder.decode(chunk.value,{stream:true});
      if(buffer.length>12000) throw new Error('SMTP response too long');
    }
  }
  async function expect(code) {
    let line=await readLine();
    if(!line.startsWith(String(code))) throw new Error('SMTP rejected command');
    while(line[3]==='-') {
      line=await readLine();
      if(!line.startsWith(String(code))) throw new Error('Unexpected SMTP response');
    }
  }
  async function command(message,code) {
    await writer.write(encoder.encode(message+crlf));
    await expect(code);
  }
  try {
    await socket.opened;
    await attach(socket);
    await expect(220);
    await command('EHLO ploos.no',250);
    await command('STARTTLS',220);
    // Reader and writer must be released before TLS upgrade.
    reader.releaseLock();
    writer.releaseLock();
    socket=socket.startTls();
    await socket.opened;
    await attach(socket);
    await command('EHLO ploos.no',250);
    await command('AUTH LOGIN',334);
    await command(base64(username),334);
    await command(base64(env.PROTON_SMTP_TOKEN),235);
    await command('MAIL FROM:<' + from + '>',250);
    await command('RCPT TO:<' + recipient + '>',250);
    await command('DATA',354);
    const safeSubject=cleanHeader(data.subject);
    const body=[
      'Message submitted through ploos.no contact form',
      '',
      'Name: '+data.name,
      'Reply email: '+replyTo,
      'Subject: '+safeSubject,
      '',
      data.message
    ].join('\n').replace(/\r?\n/g,crlf);
    const message=[
      'From: '+from,
      'To: '+recipient,
      'Reply-To: '+replyTo,
      'Subject: '+encodeHeader('Ploos contact: '+safeSubject),
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      base64(body)
    ].join(crlf);
    await writer.write(encoder.encode(message+crlf+'.'+crlf));
    await expect(250);
    await command('QUIT',221);
  } finally {
    try{reader?.releaseLock()}catch{}
    try{writer?.releaseLock()}catch{}
    try{socket.close()}catch{}
  }
}
