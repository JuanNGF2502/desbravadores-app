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
  const body = (await request.json().catch(() => null)) as {
    videoId?: string;
    quality?: Exclude<VideoQuality, "auto">;
  } | null;

  if (!body?.videoId || !body.quality || !formats[body.quality]) {
    return NextResponse.json({ error: "Requisicao de download invalida." }, { status: 400 });
  }

  const video = findTrainingVideo(body.videoId);

  if (!video) {
    return NextResponse.json({ error: "Video nao encontrado." }, { status: 404 });
  }

  if (video.youtubeId.startsWith("placeholder")) {
    return NextResponse.json(
      { error: "Substitua o placeholder por um ID real do YouTube antes de baixar." },
      { status: 400 },
    );
  }

  const ytDlpCommand = await findYtDlpCommand();

  if (!ytDlpCommand) {
    return NextResponse.json(
      {
        error:
          "yt-dlp nao esta instalado no servidor. Para baixar videos do YouTube, instale yt-dlp ou use um arquivo local em public/videos.",
      },
      { status: 501 },
    );
  }

  const child = spawn(
    ytDlpCommand,
    ["--no-playlist", "-f", formats[body.quality], "-o", "-", `https://www.youtube.com/watch?v=${video.youtubeId}`],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk: string) => {
    stderr += chunk;
  });

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

async function findYtDlpCommand() {
  if (process.env.YT_DLP_PATH && (await commandExists(process.env.YT_DLP_PATH))) {
    return process.env.YT_DLP_PATH;
  }

  const localBinary = process.platform === "win32" ? "bin\\yt-dlp.exe" : "./bin/yt-dlp";

  if (await commandExists(localBinary)) {
    return localBinary;
  }

  if (await commandExists("yt-dlp")) {
    return "yt-dlp";
  }

  return null;
}

function commandExists(command: string) {
  return new Promise<boolean>((resolve) => {
    const child = spawn(command, ["--version"], { stdio: "ignore" });

    child.on("error", () => resolve(false));
    child.on("exit", (code) => resolve(code === 0));
  });
}
