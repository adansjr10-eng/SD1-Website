# Team introduction video

The Project Overview video section appears directly after Current Project Progress and before the existing team/advisor cards. Home has a small link to it. Until a video is published, visitors see the supplied Coming Soon message in a responsive 16:9 panel.

## Add, preview, and publish

1. Sign in with your existing editor/admin account. Open **Admin workspace → Manage introduction video** (or **Edit video section** on Overview).
2. Edit **Title** for the section heading and **Summary** for its description. The subtitle is editable under **Project introduction video**.
3. Paste an HTTPS YouTube watch, `youtu.be`, Shorts, or YouTube embed link into **YouTube video URL**. The application extracts only the video ID and builds its own `youtube-nocookie.com` player. It does not accept iframe HTML or other video hosts. Use a video that allows embedding; configure captions in YouTube Studio when available.
4. Select **Preview video section** to inspect unsaved changes inside the editor. Saving as **Draft** persists the changes for editors/admins to review on Overview. A new section starts Team only; revisions retain the current audience.
5. When approved, choose **Published** and the intended **Public / Team only** visibility, then select **Save & publish**. Check the page in a signed-out window and on mobile.

Editing a published video starts a separate draft, preserving the current published version. Saving that draft does not change the public section. The newest published version accessible to the visitor supplies the live settings; editors additionally see their saved draft preview. A newer team-only version does not replace an older public version for anonymous visitors. Choose Public when the change is intended for the public website.

To change the video, replace its URL and publish the reviewed draft. **Remove video URL** restores the Coming Soon placeholder after publication. To hide the entire section and Home link, clear **Enable video section** and publish that change with the intended visibility. Saved versions remain content records; use the disable/remove controls to change the public section rather than deleting its latest published record, which could reveal an earlier version.

PBT visibility controls access to the section and its stored settings. YouTube controls access to the hosted video itself; an unlisted YouTube link is not an authenticated private video service.

## Optional thumbnail

Upload a JPEG, PNG, or WebP through **Documents & Gallery**, review its caption/source and reuse permission, and select it in **Video thumbnail (optional)**. Only approved resources appear in the picker. Files remain in the existing private `research-files` bucket and use short-lived authorized URLs.

Publish the thumbnail resource and any linked parent record with public visibility to show it anonymously. Publishing video settings does not publish a draft/private thumbnail. If the selected thumbnail is unavailable, the player still works; the Coming Soon panel also works without any image. With a thumbnail, the YouTube iframe loads after the visitor selects Play. Without one, a valid video uses a lazy-loaded iframe with native controls and fullscreen support.

## Implementation and verification

The existing `entries.details` JSON stores `team_video`; `title`, `summary`, status, and visibility reuse the current content model and RLS. No new migration, bucket, policy, environment variable, or Vercel configuration is needed. Implementation does not import or modify live records.

Validation includes URL/security and publication-selection unit tests, existing PostgreSQL/RLS tests, mocked admin/anonymous/viewer browser workflows, desktop/tablet/mobile layout checks, TypeScript validation, and a production build. Mocked browser checks verify player URLs/attributes and editorial behavior, not actual YouTube playback or live Supabase persistence. After deploying, publish your actual recording and verify playback, captions, full screen, save/reload, and the intended visibility with real accounts.
