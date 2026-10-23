"use client";
import { useState } from "react";
import type { Entry, Resource } from "@/lib/data";
import { approvedImage } from "@/lib/presentation";
import {
  videoDefaults,
  youtubeId,
  type TeamVideoDetails,
} from "@/lib/team-video";
import TeamIntroductionVideo from "./team-introduction-video";

export default function TeamVideoEditor({
  entry,
  entries,
  resources,
  onChange,
}: {
  entry: Entry;
  entries: Entry[];
  resources: Resource[];
  onChange: (value: Partial<Entry>) => void;
}) {
  const [preview, setPreview] = useState(false);
  const settings = entry.details?.team_video || { enabled: true };
  const change = (value: Partial<TeamVideoDetails>) =>
    onChange({
      details: { ...entry.details, team_video: { ...settings, ...value } },
    });
  const images = resources.filter((r) =>
    approvedImage(r.id, resources, entries, true),
  );
  return (
    <fieldset className="presentation-editor team-video-editor">
      <legend>Project introduction video</legend>
      <p className="muted">
        Title and Summary above control the section heading and description.
        Editing a published video starts a separate draft. Preview here, then
        save as Draft or choose Published below when ready.
      </p>
      <label className="check-label">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => change({ enabled: e.target.checked })}
        />
        Enable video section
      </label>
      <label>
        Video subtitle
        <input
          maxLength={180}
          value={settings.subtitle ?? videoDefaults.subtitle}
          onChange={(e) => change({ subtitle: e.target.value })}
        />
      </label>
      <label>
        YouTube video URL
        <input
          type="url"
          aria-label="YouTube video URL"
          maxLength={2048}
          placeholder="https://www.youtube.com/watch?v=…"
          value={settings.url || ""}
          onChange={(e) => change({ url: e.target.value })}
        />
        <small>
          HTTPS watch, youtu.be, Shorts, and YouTube embed links are supported.
          Leave blank for the Coming Soon placeholder.
        </small>
      </label>
      {settings.url?.trim() && !youtubeId(settings.url) && (
        <p role="alert" className="form-error">
          Enter a valid YouTube link. This URL will not be embedded or saved.
        </p>
      )}
      <button
        type="button"
        className="text-button"
        onClick={() => change({ url: "" })}
      >
        Remove video URL
      </button>
      <label>
        Video thumbnail (optional)
        <select
          aria-label="Video thumbnail (optional)"
          value={settings.thumbnail_id || ""}
          onChange={(e) =>
            change({ thumbnail_id: e.target.value || undefined })
          }
        >
          <option value="">No thumbnail</option>
          {settings.thumbnail_id &&
            !images.some((r) => r.id === settings.thumbnail_id) && (
              <option value={settings.thumbnail_id}>
                Current thumbnail unavailable or not approved
              </option>
            )}
          {images.map((r) => (
            <option key={r.id} value={r.id}>
              {r.caption || r.name} · {r.status} · {r.visibility}
            </option>
          ))}
        </select>
        <small>
          Upload an approved image through Documents & Gallery first. Public
          thumbnails also need a published public resource and parent record. A
          draft thumbnail stays private.
        </small>
      </label>
      <button
        type="button"
        className="button"
        aria-expanded={preview}
        onClick={() => setPreview(!preview)}
      >
        {preview ? "Hide video preview" : "Preview video section"}
      </button>
      {preview && (
        <div
          className="team-video-editor-preview"
          aria-label="Unsaved video preview"
        >
          <p className="portfolio-preview-note">
            Unsaved editorial preview · only visible in this editor.
          </p>
          {settings.enabled ? (
            <TeamIntroductionVideo
              entry={entry}
              entries={[...entries.filter((e) => e.id !== entry.id), entry]}
              resources={resources}
              editable
              preview
            />
          ) : (
            <p>
              The video section will be hidden when these settings are
              published.
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
