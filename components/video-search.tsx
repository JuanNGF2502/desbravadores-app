"use client";

import { useMemo, useState } from "react";
import { VideoCard } from "@/components/video-card";
import type { TrainingVideo } from "@/lib/videos";

export function VideoSearch({ videos }: { videos: TrainingVideo[] }) {
  const [query, setQuery] = useState("");

  const filteredVideos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return videos;
    }

    return videos.filter((video) => {
      const content = `${video.title} ${video.category} ${video.description}`.toLowerCase();
      return content.includes(normalizedQuery);
    });
  }, [query, videos]);

  return (
    <>
      <div className="mt-8 max-w-2xl">
        <label className="text-sm font-black uppercase tracking-[0.16em] text-[#f4c542]" htmlFor="search">
          Buscar por nome do comando
        </label>
        <input
          className="mt-3 h-12 w-full rounded-md border border-white/10 bg-white/10 px-4 text-base font-semibold text-white outline-none transition placeholder:text-white/38 focus:border-[#f4c542]"
          id="search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ex.: sentido, descansar, marcha..."
          type="search"
          value={query}
        />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {filteredVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </>
  );
}
