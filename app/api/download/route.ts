import { spawn } from "node:child_process";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { findTrainingVideo, type VideoQuality } from "@/lib/videos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const formats: Record<Exclude<VideoQuality, "auto">, string> = {
  "240p": "best[height<=240][ext=mp4]/best[height<=240]/best",
  "360p": "best[height<=360][ext=mp4]/best[height<=360]/best",
  "720p": "best[height<=720][ext=mp4]/best[height<=720]/best",
};

export async function POST(request: Request) {
  if (process.env.ENABLE_YOUTUBE_DOWNLOADS !== "true") {
    return NextResponse.json(
      {
        error:
          "Downloads estao desativados. Configure ENABLE_YOUTUBE_DOWNLOADS=true apenas para videos proprios ou autorizados.",
      },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    videoId?: string;
    quality?: Exclude<VideoQuality, "auto">;
  } | null;

  if (!body?.videoId || !body.quality || !formats[body.quality]) {
    return NextResponse.json({ error: "Requisicao de download invalida." }, { status: 400 });
  }

  const video = findTrainingVideo(body.videoId);

  if (!video || video.youtubeId.startsWith("placeholder")) {
    return NextResponse.json(
      { error: "Substitua o placeholder por um ID real do YouTube antes de baixar." },
      { status: 400 },
    );
  }

  const child = spawn(
    "yt-dlp",
    ["--no-playlist", "-f", formats[body.quality], "-o", "-", `https://www.youtube.com/watch?v=${video.youtubeId}`],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk: string) => {
    stderr += chunk;
  });

  child.on("error", () => undefined);

  const stream = Readable.toWeb(child.stdout) as ReadableStream<Uint8Array>;

  return new Response(stream, {
    headers: {
      "Content-Disposition": `attachment; filename="${video.id}-${body.quality}.mp4"`,
      "Content-Type": "video/mp4",
      "X-Offline-Video-Id": video.id,
      "X-Download-Notes": encodeURIComponent(stderr.slice(0, 200)),
    },
  });
}
