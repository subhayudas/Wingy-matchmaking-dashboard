"use client";

import { useState } from "react";
import { photoUrl, initials } from "../lib/format";

export function Avatar({
  user,
  size = 48,
  ring,
}: {
  user: { full_name?: string | null; readable_username?: string | null; pseudonym?: string | null; photo_paths_json?: string[] | null; gender?: string | null };
  size?: number;
  ring?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const url = photoUrl(user.photo_paths_json?.[0]);
  const ini = initials(user.full_name ?? null, user.readable_username ?? user.pseudonym ?? null);
  const bg = user.gender === "woman" ? "#dedbff" : user.gender === "man" ? "#dbf7ff" : "#ece5db";

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ${
        ring ? "ring-2 ring-cream shadow-md2" : ""
      }`}
      style={{ width: size, height: size, background: bg }}
    >
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={ini}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="editorial font-semibold text-muted" style={{ fontSize: size * 0.36 }}>
          {ini}
        </span>
      )}
    </div>
  );
}
