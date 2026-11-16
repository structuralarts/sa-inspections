// Fallback upload through the server, used if the iPad can't upload straight to Dropbox. Max about 5.5 MB per file.
import { json, checkPass, insideRoot, dropboxToken, asciiJson } from '../lib/sa.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  if (!checkPass(req)) return json({ error: 'The team passcode was not accepted. Check it in Settings.' }, 401);
  try {
    const path = decodeURIComponent(req.headers.get('x-sa-path') || '');
    if (!insideRoot(path)) return json({ error: 'That Dropbox path is not allowed.' }, 400);
    const body = await req.arrayBuffer();
    const r = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + (await dropboxToken()),
        'content-type': 'application/octet-stream',
        'Dropbox-API-Arg': asciiJson({ path, mode: 'overwrite', mute: true })
      },
      body
    });
    if (!r.ok) return json({ error: 'Dropbox upload failed: ' + (await r.text()).slice(0, 300) }, 502);
    return json({ ok: true, path });
  } catch (e) {
    return json({ error: e.message || String(e) }, 500);
  }
};
