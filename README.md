# SA Inspections – automatic sending setup

This folder is the SA Inspections app plus four small server functions. Once it is live on Netlify, tapping **Send now** in the app:

- emails the report PDF (and a zip of the photos, if chosen) to the client, with a copy to admin, from the admin address, with the subject and message filled in;
- sets "reply to" as the engineer who did the inspection, so client replies go to them;
- emails the editable Word copy and the PDF to the engineer who did the inspection;
- saves the PDF, Word file and photos to Dropbox, in a folder per job, for example
  `/SA Inspections/25084 Murwillumbah/2026-11-16 0930 Structural Site Inspection Report/`.

Allow about 30–45 minutes. You need access to: **Netlify**, **GitHub** (free account), the **Structural Arts Dropbox**, and the **DNS settings for structuralarts.com.au** (whoever manages the domain or website).

Nothing here changes your existing Microsoft 365 / Outlook email.

---

## 1. Put the app on Netlify

Netlify's drag-and-drop page can't run server functions, so the site goes through GitHub:

1. Sign in at github.com and create a new **private** repository, for example `sa-inspections`.
2. On the empty repository page, choose **uploading an existing file**, and drag in **everything inside this folder** (including the `netlify` folder and `netlify.toml`). Commit.
3. In Netlify: **Add new site → Import an existing project → GitHub**, pick the repository. Leave the build command empty and the publish directory as `.`. Deploy.
4. Note the site address, for example `https://sa-inspections.netlify.app`. You can rename it in **Site configuration → Change site name**.

Later updates: upload the new `index.html` to the same GitHub repository and Netlify redeploys by itself.

## 2. Pick a team passcode

Choose a passcode (for example 6+ characters). The iPads type it once in the app's Settings. It stops anyone else from sending email through the site.

## 3. Email sending (Resend)

1. Create a free account at **resend.com** (3,000 emails a month free).
2. **Domains → Add domain** → `structuralarts.com.au`. Resend shows 3–4 DNS records (a DKIM `TXT` record, and `MX` + `TXT` records on a `send` subdomain). Add them in your DNS provider exactly as shown. They don't affect your existing email.
3. Wait for Resend to show the domain as **Verified** (usually minutes, sometimes a few hours).
4. **API Keys → Create API key** with "Sending access". Copy it.

## 4. Dropbox

1. Signed in to the Structural Arts Dropbox, go to **dropbox.com/developers/apps → Create app**.
2. Choose **Scoped access**, then **Full Dropbox** (so reports can go into an existing company folder). Name it, for example `SA Inspections`.
3. **Permissions** tab: tick `files.content.write` and `files.content.read`, then **Submit**.
4. **Settings** tab → **Redirect URIs**: add
   `https://YOUR-SITE.netlify.app/.netlify/functions/dropbox-auth` and click Add.
5. Copy the **App key** and **App secret** from the Settings tab.

## 5. Add the settings to Netlify

In Netlify: **Site configuration → Environment variables → Add a variable** for each:

| Name | Value |
|---|---|
| `SA_PASSCODE` | the team passcode from step 2 |
| `MAIL_FROM` | `Structural Arts <admin@structuralarts.com.au>` |
| `RESEND_API_KEY` | the Resend API key |
| `DROPBOX_APP_KEY` | the Dropbox App key |
| `DROPBOX_APP_SECRET` | the Dropbox App secret |
| `DROPBOX_ROOT` | the Dropbox folder for reports, for example `/Structural Arts/Inspection reports` |

Then **Deploys → Trigger deploy → Deploy site**.

## 6. Connect Dropbox (one time)

1. Open `https://YOUR-SITE.netlify.app/.netlify/functions/dropbox-auth?pass=YOUR-PASSCODE`
2. Sign in to the Structural Arts Dropbox and click **Allow**.
3. The page shows a long code. Add it in Netlify as `DROPBOX_REFRESH_TOKEN`, then **Trigger deploy** again.

## 7. On each iPad

1. Open `https://YOUR-SITE.netlify.app` in Safari, then **Share → Add to Home Screen**.
2. In the app: **Settings → Automatic sending**, type the team passcode, tap **Check connection**. It should say "Connected".
3. Inspections saved in the old app (the claude.ai link) are stored separately. To bring them across: in the old app **Settings → Save backup file**, then in the new app **Settings → Add inspections from a backup**.
4. Send a test report to yourself first.

---

## If something goes wrong

- **"The passcode isn't right yet"**: the passcode typed on the iPad doesn't match `SA_PASSCODE`.
- **"Almost set up: email sending still needs finishing"**: `RESEND_API_KEY` or `MAIL_FROM` is missing; redeploy after adding.
- **"Email service: … domain is not verified"**: finish the DNS records in step 3.
- **"Dropbox sign-in failed"**: redo step 6 (the refresh token is missing or was revoked).
- **Netlify logs**: Netlify → **Logs → Functions** shows each send.
- If automatic sending fails, nothing is emailed, and the app's normal Mail-app buttons still work.

Limits: Resend allows emails up to 40 MB in total. If a job has a very large number of photos, send the report on its own and the photos separately.
