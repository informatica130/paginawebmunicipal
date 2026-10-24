// Cliente SMTP mínimo (sin dependencias): TLS implícito (465) o STARTTLS (587), AUTH LOGIN.
// Variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
// Copiado de la Plataforma de Trámites (server/integrations/mailer.js) para usar el mismo
// servidor de correo. Se limpian saltos de línea en destinatario y asunto (inyección de cabeceras).

import net from 'node:net';
import tls from 'node:tls';

function encodeHeader(s) {
  return /[^\x20-\x7e]/.test(s) ? `=?UTF-8?B?${Buffer.from(s).toString('base64')}?=` : s;
}

// Lector de respuestas SMTP (multi-línea "250-..." hasta "250 ...").
function reader(socket) {
  let buf = '';
  let lines = [];
  const waiting = [];
  const ready = [];
  const onData = (chunk) => {
    buf += chunk.toString('utf8');
    let i;
    while ((i = buf.indexOf('\r\n')) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 2);
      lines.push(line);
      if (/^\d{3} /.test(line)) {
        const resp = { code: Number(line.slice(0, 3)), text: lines.join('\n') };
        lines = [];
        waiting.length ? waiting.shift()(resp) : ready.push(resp);
      }
    }
  };
  socket.on('data', onData);
  return {
    next: () => new Promise((res) => (ready.length ? res(ready.shift()) : waiting.push(res))),
    detach: () => socket.removeListener('data', onData),
  };
}

export function createMailer({ host, port = 587, user, pass, from }) {
  if (!host || !from) return null;
  port = Number(port);
  const fromAddr = from.replace(/.*</, '').replace(/>.*/, '').trim();

  async function send({ to, subject, text, replyTo }) {
    to = String(to || '').replace(/[\r\n<>]/g, '').trim();
    subject = String(subject || '').replace(/[\r\n]+/g, ' ');
    replyTo = replyTo ? String(replyTo).replace(/[\r\n<>]/g, '').trim() : '';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) throw new Error('Destinatario inválido');
    let socket = port === 465 ? tls.connect({ port, host, servername: host }) : net.connect(port, host);
    socket.setTimeout(20000, () => socket.destroy(new Error('SMTP: tiempo de espera agotado')));
    const errored = new Promise((_, rej) => socket.once('error', rej));
    const run = async () => {
      let r = reader(socket);
      const cmd = async (line, expect = [250]) => {
        if (line !== null) socket.write(line + '\r\n');
        const resp = await r.next();
        if (!expect.includes(resp.code)) throw new Error(`SMTP ${resp.text}`);
        return resp;
      };
      await cmd(null, [220]);
      let ehlo = await cmd('EHLO melipeuco.cl');
      if (port !== 465 && /STARTTLS/i.test(ehlo.text)) {
        await cmd('STARTTLS', [220]);
        r.detach();
        socket = tls.connect({ socket, servername: host });
        await new Promise((res, rej) => (socket.once('secureConnect', res), socket.once('error', rej)));
        r = reader(socket);
        ehlo = await cmd('EHLO melipeuco.cl');
      }
      if (user) {
        await cmd('AUTH LOGIN', [334]);
        await cmd(Buffer.from(user).toString('base64'), [334]);
        await cmd(Buffer.from(pass || '').toString('base64'), [235]);
      }
      await cmd(`MAIL FROM:<${fromAddr}>`);
      await cmd(`RCPT TO:<${to}>`, [250, 251]);
      await cmd('DATA', [354]);
      const body = Buffer.from(String(text || '').replace(/\r?\n/g, '\r\n'), 'utf8').toString('base64').replace(/.{76}/g, '$&\r\n');
      const msg = [`From: ${from}`, `To: ${to}`, ...(replyTo ? [`Reply-To: ${replyTo}`] : []), `Subject: ${encodeHeader(subject || '')}`, `Date: ${new Date().toUTCString()}`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', body].join('\r\n');
      await cmd(msg + '\r\n.', [250]);
      socket.write('QUIT\r\n');
      socket.end();
      return { ok: true };
    };
    return Promise.race([run(), errored]);
  }

  return { send };
}

