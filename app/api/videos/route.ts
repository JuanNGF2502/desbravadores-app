import { NextResponse } from "next/server";
import { TRAINING_VIDEOS, getYoutubeThumbnail } from "@/lib/videos";

export const dynamic = "force-dynamic";

type YoutubeItem = {
  id: string;
  snippet?: {
    title?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
  contentDetails?: {
    duration?: string;
  };
};

export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const realIds = TRAINING_VIDEOS.map((video) => video.youtubeId).filter(
    (id) => !id.startsWith("placeholder"),
  );

  if (!apiKey || realIds.length === 0) {
    return NextResponse.json({
      source: "local",
      videos: TRAINING_VIDEOS.map((video) => ({
        ...video,
        thumbnail: getYoutubeThumbnail(video.youtubeId),
      })),
    });
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("id", realIds.join(","));
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, { next: { revalidate: 3600 } });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Nao foi possivel consultar a YouTube Data API." },
      { status: response.status },
    );
  }

  const payload = (await response.json()) as { items?: YoutubeItem[] };
  const items = new Map((payload.items ?? []).map((item) => [item.id, item]));

  return NextResponse.json({
    source: "youtube",
    videos: TRAINING_VIDEOS.map((video) => {
      const youtube = items.get(video.youtubeId);
      const thumbnail =
        youtube?.snippet?.thumbnails?.high?.url ??
        youtube?.snippet?.thumbnails?.medium?.url ??
        youtube?.snippet?.thumbnails?.default?.url ??
        getYoutubeThumbnail(video.youtubeId);

      return {
        ...video,
        youtubeTitle: youtube?.snippet?.title,
        youtubeDuration: youtube?.contentDetails?.duration,
        thumbnail,
      };
    }),
  });
}
