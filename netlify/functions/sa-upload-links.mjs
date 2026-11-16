// Creates the Dropbox folder paths for one send and returns direct upload links for each file.
import { json, checkPass, root, safe, dropbox } from '../lib/sa.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  if (!checkPass(req)) return json({ error: 'The team passcode was not accepted. Check it in Settings.' }, 401);
  try {
    const { folder, sub, names } = await req.json();
    if (!Array.isArray(names) || !names.length || names.length > 300) return json({ error: 'No files to upload.' }, 400);
    const base = `${root()}/${safe(folder)}/${safe(sub)}`;
    const items = [];
    for (const n of names) {
      const path = `${base}/${safe(n)}`;
      let link = null;
      try {
        const j = await dropbox('files/get_temporary_upload_link', {
          commit_info: { path, mode: 'overwrite', mute: true },
          duration: 3600
        });
        link = j.link;
      } catch (e) {
        return json({ error: e.message }, 502);
      }
      items.push({ name: n, path, link });
    }
    return json({ folder: base, items });
  } catch (e) {
    return json({ error: e.message || String(e) }, 500);
  }
};
