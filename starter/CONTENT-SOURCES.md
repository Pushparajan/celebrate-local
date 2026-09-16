# Content Source Setup — SharePoint, Google Drive, da.live

EDS supports exactly one active content source per `fstab.yaml` mount point (see
docs/01-reference-architecture.md for why the choice matters and how it affects the rest
of the launchpad). This doc walks through setting up each of the three supported sources
from scratch, using `Pushparajan/celebrate-local` as the running example — swap in your
own owner/repo/site names throughout.

Pick one. All three examples below produce a working `fstab.yaml` for the same repo; only
one should be active at a time (comment out or delete the others).

---

## Before any of these: install the AEM Code Sync GitHub App

Required regardless of which content source you choose — this is what builds/serves your
code, independent of where the content lives.

1. Visit `https://github.com/apps/aem-code-sync/installations/new`
2. Choose **Only select repositories**, pick your repo (`celebrate-local`)
3. Save

Without this, `fstab.yaml` can point anywhere and nothing will render.

---

## Option A — da.live (fastest to start, no enterprise IT involved)

Best when: you want to be live in minutes, don't need SharePoint/Drive's existing
governance, or are prototyping before a bigger enterprise rollout.

1. Go to **da.live** and use **Create a new site from a GitHub repository**, pasting
   `https://github.com/Pushparajan/celebrate-local`. This creates a matching org/site in
   DA's content store, visible at `da.live/#/Pushparajan/celebrate-local`.
2. Set `fstab.yaml`:
   ```yaml
   mountpoints:
     /:
       url: https://content.da.live/Pushparajan/celebrate-local/
       type: markup
   ```
3. Commit and push `fstab.yaml` to `main`.
4. **Content lives in DA's store, not your git repo.** Open the site in da.live and either
   use its document editor directly, or **Upload** a `.docx`/`.md` file (e.g. this
   launchpad's `content/aurora-il/celebrations.docx`) into the matching path.
5. In da.live, open the page and use the **Sidekick** browser extension (or the DA Bulk
   Operations app) to **Preview**, then **Publish**.
   - Preview: `https://main--celebrate-local--pushparajan.aem.page/...`
   - Live: `https://main--celebrate-local--pushparajan.aem.live/...`
6. Locally: `cd starter && npx aem up` now proxies from that mount point.

No sharing/permissions step needed beyond your own da.live login — this is the option
with the least setup friction.

---

## Option B — SharePoint

Best when: your organization already standardizes on Microsoft 365 and content owners
are already comfortable authoring in Word/Excel there.

1. Create a SharePoint site (or use an existing one) and a document library inside it —
   the default **Shared Documents** library works, or create a dedicated one for this
   project.
2. Share that library/folder with the people (or service account) who need edit access:
   the `...` menu → **Manage Access** → **Direct access**, and add each editor.
   - **Note**: some Adobe-hosted public demos historically instruct sharing with
     `helix@adobe.com` — that's specific to Adobe's own demo infrastructure, not something
     you need for your own tenant. For your own SharePoint, share with your own team.
3. Set `fstab.yaml` to the library's URL:
   ```yaml
   mountpoints:
     /: https://<tenant>.sharepoint.com/sites/<site-name>/Shared Documents/<folder>
   ```
   Example: `https://contoso.sharepoint.com/sites/celebrate-local/Shared Documents/website`
4. Commit and push `fstab.yaml` to `main`.
5. Install the **AEM Sidekick** browser extension and sign in with your Microsoft
   account (the same one with access to the library). First preview will prompt
   authorization.
6. Author pages as Word documents inside that library, following this repo's block-table
   conventions (docs/04, docs/06) — page paths map to document paths relative to the
   mounted folder.
7. Use Sidekick to **Preview**, then **Publish** each page.

**Enterprise IT note**: depending on your tenant's Azure AD policies, a tenant admin may
need to consent to the AEM Sidekick's Microsoft Graph API access the first time anyone in
the org uses it. If Sidekick auth silently fails, that's usually the cause — check with
your M365 admin before assuming `fstab.yaml` is wrong.

---

## Option C — Google Drive

Best when: your organization is on Google Workspace, or you want a fast personal setup
without enterprise SharePoint governance.

1. Create a new folder in Google Drive for this project.
2. Share it with the editors who need access (edit permission). For your own personal
   project, your own account is enough — Sidekick authenticates as you.
3. Copy the folder ID from the URL (`drive.google.com/drive/folders/<FOLDER_ID>`).
4. Set `fstab.yaml`:
   ```yaml
   mountpoints:
     /: https://drive.google.com/drive/folders/<FOLDER_ID>
   ```
5. Commit and push `fstab.yaml` to `main`.
6. Install the **AEM Sidekick** browser extension, sign in with the same Google account.
7. Author pages as Google Docs inside that folder, `query-index` data as a Google Sheet
   if needed (docs/05's sheet-backed content pattern) — same block-table conventions as
   any other source.
8. Use Sidekick to **Preview**, then **Publish**.

---

## Switching sources later

Changing `fstab.yaml` and pushing to `main` is the whole migration — EDS always reads the
current `main` branch's `fstab.yaml`. You'll need to re-author or re-import content into
the new source (nothing carries over automatically), which is exactly what
`tools/migration/`'s crawl→scrape→classify→generate pipeline in this launchpad is for if
you're moving a non-trivial amount of content.

## A note on the newer Configuration Service

Adobe's more recent Helix versions support content-source configuration via a
**Configuration Service API** instead of (or alongside) `fstab.yaml`, enabling one code
repo to drive multiple sites ("repoless" setups) and adding an overlay source after a
site already exists. `fstab.yaml` remains fully supported and is what this starter uses —
switch to the Configuration Service only if you specifically need multi-site-from-one-repo,
which is outside this launchpad's default single-site setup (see docs/01's multi-site
topology options if that's your situation).
