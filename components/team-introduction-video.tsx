"use client";
import { useEffect, useState } from "react";
import { Play, ExternalLink } from "lucide-react";
import type { Entry, Resource } from "@/lib/data";
import { approvedImage } from "@/lib/presentation";
import { videoDefaults, youtubeId } from "@/lib/team-video";
import { supabase } from "@/lib/supabase";

function Thumbnail({ resource }: { resource: Resource }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true;
    setUrl("");
    supabase?.storage
      .from("research-files")
      .createSignedUrl(resource.path, 120)
      .then(({ data, error }) => {
        if (active && !error && data) setUrl(data.signedUrl);
      });
    return () => {
      active = false;
    };
  }, [resource.id, resource.path]);
  // Private bucket images bypass the public Next.js image-optimization cache.
  return url ? (
    <img src={url} alt="" loading="lazy" onError={() => setUrl("")} />
  ) : null;
}

function Player({
  id,
  title,
  thumbnail,
}: {
  id?: string;
  title: string;
  thumbnail?: Resource;
}) {
  const [playing, setPlaying] = useState(false);
  if (!id)
    return (
      <div className="team-video-frame team-video-placeholder">
        {thumbnail && <Thumbnail resource={thumbnail} />}
        <div className="team-video-placeholder-copy">
          <span className="team-video-icon">
            <Play size={26} aria-hidden="true" />
          </span>
          <h3>Team Introduction Video — Coming Soon</h3>
          <p>
            Meet the students behind the Passenger Bearing Tester project. Our
            team introduction video will be available soon.
          </p>
        </div>
      </div>
    );
  return (
    <>
      <div className="team-video-frame">
        {thumbnail && !playing ? (
          <button
            type="button"
            className="team-video-poster"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${title}`}
          >
            <Thumbnail resource={thumbnail} />
            <span className="team-video-icon">
              <Play size={28} aria-hidden="true" />
            </span>
            <span>Play introduction video</span>
          </button>
        ) : (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?controls=1&rel=0${playing ? "&autoplay=1" : ""}`}
            title={title}
            width="960"
            height="540"
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </div>
      <a
        className="text-link team-video-watch"
        href={`https://www.youtube.com/watch?v=${id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Watch on YouTube <ExternalLink size={13} />
      </a>
    </>
  );
}

export default function TeamIntroductionVideo({
  entry,
  entries,
  resources,
  editable = false,
  preview = false,
}: {
  entry?: Entry;
  entries: Entry[];
  resources: Resource[];
  editable?: boolean;
  preview?: boolean;
}) {
  const settings = entry?.details?.team_video;
  if (settings?.enabled === false) return null;
  const id = youtubeId(settings?.url);
  const thumbnail = approvedImage(
    settings?.thumbnail_id,
    resources,
    entries,
    editable,
  );
  const heading = entry?.title || videoDefaults.heading;
  const subtitle = settings?.subtitle || videoDefaults.subtitle;
  return (
    <section
      id={preview ? undefined : "project-introduction-video"}
      className="team-video-section"
      aria-label="Team project introduction video"
    >
      <div className="portfolio-section-heading">
        <div>
          <span className="eyebrow">{subtitle}</span>
          <h2>{heading}</h2>
          <p>{entry?.summary || videoDefaults.description}</p>
        </div>
      </div>
      <Player
        key={`${id || "placeholder"}:${thumbnail?.id || ""}`}
        id={id}
        title={`${heading} — ${subtitle}`}
        thumbnail={thumbnail}
      />
    </section>
  );
}
