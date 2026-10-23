"use client";
import { useEffect, useState } from "react";
import type { Resource } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { Maximize2 } from "lucide-react";
export default function PresentationImage({
  resource,
  alt,
  onOpen,
  portrait = false,
}: {
  resource: Resource;
  alt: string;
  onOpen: (resource: Resource) => void;
  portrait?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setUrl("");
    setFailed(false);
    supabase?.storage
      .from("research-files")
      .createSignedUrl(resource.path, 120)
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data) setFailed(true);
        else setUrl(data.signedUrl);
      });
    return () => {
      active = false;
    };
  }, [resource.id, resource.path]);
  // Signed images are loaded directly, never through a public image-optimization cache.
  return (
    <button
      className={`presentation-image ${portrait ? "portrait" : ""}`}
      onClick={() => onOpen(resource)}
      aria-label={`Enlarge ${alt}`}
    >
      {url && !failed ? (
        <img
          src={url}
          alt={alt}
          onError={() => setFailed(true)}
          loading="lazy"
        />
      ) : (
        <span className="image-loading">
          {failed ? "Image unavailable" : "Loading image…"}
        </span>
      )}
      <span className="presentation-image-zoom">
        <Maximize2 size={16} />
        <span>View image</span>
      </span>
    </button>
  );
}
