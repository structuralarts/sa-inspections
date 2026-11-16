// Tells the app whether automatic sending is set up and the passcode is right.
import { env, json, checkPass, root } from '../lib/sa.mjs';

export default async (req) => {
  const email = !!(env('RESEND_API_KEY') && env('MAIL_FROM'));
  const dropbox = !!(env('DROPBOX_APP_KEY') && env('DROPBOX_APP_SECRET') && env('DROPBOX_REFRESH_TOKEN'));
  const passcodeOk = checkPass(req);
  return json({ ok: email && dropbox && passcodeOk, email, dropbox, passcodeOk, from: env('MAIL_FROM'), root: root() });
};
