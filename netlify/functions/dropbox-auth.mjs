// One-time setup: connects the Structural Arts Dropbox and shows the refresh token to paste into Netlify.
import { env, html } from '../lib/sa.mjs';

export default async (req) => {
  const url = new URL(req.url);
  const key = env('DROPBOX_APP_KEY');
  const secret = env('DROPBOX_APP_SECRET');
  const redirect = `${url.origin}/.netlify/functions/dropbox-auth`;
  if (!key || !secret) return html('<h1>Almost there</h1><p>Add <b>DROPBOX_APP_KEY</b> and <b>DROPBOX_APP_SECRET</b> in Netlify, redeploy, then open this page again.</p>');

  const code = url.searchParams.get('code');
  if (!code) {
    if (!env('SA_PASSCODE') || url.searchParams.get('pass') !== env('SA_PASSCODE'))
      return html('<h1>Connect Dropbox</h1><p>Open this page with <code>?pass=</code> followed by the team passcode, for example <code>/.netlify/functions/dropbox-auth?pass=1234</code>.</p>', 401);
    const auth = new URL('https://www.dropbox.com/oauth2/authorize');
    auth.search = new URLSearchParams({ client_id: key, response_type: 'code', token_access_type: 'offline', redirect_uri: redirect }).toString();
    return Response.redirect(auth.toString(), 302);
  }

  const r = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirect, client_id: key, client_secret: secret })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.refresh_token)
    return html(`<h1>Dropbox didn’t connect</h1><p>${String(j.error_description || j.error || r.status).replace(/</g, '&lt;')}</p><p>Check the redirect URI in the Dropbox app settings is exactly:<br><code>${redirect}</code></p>`, 400);
  return html(`<h1>Dropbox connected</h1><p>Copy this value into Netlify as <b>DROPBOX_REFRESH_TOKEN</b>, then redeploy the site:</p>
<textarea readonly style="width:100%;height:110px;font:14px monospace" onclick="this.select()">${j.refresh_token}</textarea>
<p>Keep it private. Anyone with it can write to this Dropbox app.</p>`);
};
