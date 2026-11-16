// Sends the report email to the client (copy to admin) and the Word copy to the inspector, with files from Dropbox.
import { env, json, checkPass, insideRoot, dropbox, emails } from '../lib/sa.mjs';

async function sendEmail(msg) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + env('RESEND_API_KEY'), 'content-type': 'application/json' },
    body: JSON.stringify(msg)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('Email service: ' + (j.message || j.name || r.status));
  return j.id;
}

async function attachments(files) {
  const out = [];
  for (const f of Array.isArray(files) ? files : []) {
    if (!insideRoot(f.path)) throw new Error('That Dropbox path is not allowed.');
    const { link } = await dropbox('files/get_temporary_link', { path: f.path });
    out.push({ filename: String(f.name || f.path.split('/').pop()).slice(0, 150), path: link });
  }
  return out;
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  if (!checkPass(req)) return json({ error: 'The team passcode was not accepted. Check it in Settings.' }, 401);
  if (!env('RESEND_API_KEY') || !env('MAIL_FROM')) return json({ error: 'Email sending is not set up yet.' }, 503);
  try {
    const p = await req.json();
    const to = emails(p.to);
    const cc = emails(p.cc).filter((x) => !to.includes(x));
    if (!to.length && !cc.length) return json({ error: 'There is no valid email address to send to.' }, 400);
    const replyTo = emails(p.replyTo);

    const clientId = await sendEmail({
      from: env('MAIL_FROM'),
      to: to.length ? to : cc,
      cc: to.length && cc.length ? cc : undefined,
      reply_to: replyTo.length ? replyTo : undefined,
      subject: String(p.subject || 'Inspection report').slice(0, 250),
      text: String(p.text || ''),
      attachments: await attachments(p.clientFiles)
    });

    let inspectorId = null;
    const ins = p.inspector;
    if (ins && emails(ins.to).length && Array.isArray(ins.files) && ins.files.length) {
      inspectorId = await sendEmail({
        from: env('MAIL_FROM'),
        to: emails(ins.to),
        subject: String(ins.subject || 'Word copy of your report').slice(0, 250),
        text: String(ins.text || ''),
        attachments: await attachments(ins.files)
      });
    }
    return json({ ok: true, clientId, inspectorId });
  } catch (e) {
    return json({ error: e.message || String(e) }, 500);
  }
};
