// Shared helpers for the SA Inspections server functions.
export const env = (k) => (process.env[k] || '').trim();

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}

export function html(body, status = 200) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SA Inspections setup</title>
<body style="font:16px/1.5 system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 20px">${body}</body>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }
  );
}

// Every request from the app carries the team passcode set in SA_PASSCODE.
export function checkPass(req) {
  const need = env('SA_PASSCODE');
  return !!need && (req.headers.get('x-sa-passcode') || '') === need;
}

export function root() {
  let r = env('DROPBOX_ROOT') || '/SA Inspections';
  if (!r.startsWith('/')) r = '/' + r;
  return r.replace(/\/+$/, '');
}

export const safe = (s) =>
  String(s || '')
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || 'Untitled';

// Dropbox header arguments must be plain ASCII.
export const asciiJson = (o) =>
  JSON.stringify(o).replace(/[\u007f-\uffff]/g, (c) => '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4));

let token = null;
let tokenExpires = 0;
export async function dropboxToken() {
  if (token && Date.now() < tokenExpires) return token;
  const r = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: env('DROPBOX_REFRESH_TOKEN'),
      client_id: env('DROPBOX_APP_KEY'),
      client_secret: env('DROPBOX_APP_SECRET')
    })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('Dropbox sign-in failed: ' + (j.error_description || j.error || r.status));
  token = j.access_token;
  tokenExpires = Date.now() + ((j.expires_in || 14400) - 120) * 1000;
  return token;
}

export async function dropbox(endpoint, body) {
  const r = await fetch('https://api.dropboxapi.com/2/' + endpoint, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + (await dropboxToken()), 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const t = await r.text();
  let j;
  try { j = JSON.parse(t); } catch { j = { error_summary: t }; }
  if (!r.ok) throw new Error('Dropbox: ' + (j.error_summary || r.status));
  return j;
}

export const insideRoot = (p) => typeof p === 'string' && p.startsWith(root() + '/') && !p.includes('/../');

export const emails = (list) =>
  (Array.isArray(list) ? list : [list])
    .map((s) => String(s || '').trim())
    .filter((s) => /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(s))
    .slice(0, 20);
