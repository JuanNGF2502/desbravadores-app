"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TrainingVideo } from "@/lib/videos";
import { formatMarkerTime } from "@/lib/videos";

type YoutubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setLoop: (loop: boolean) => void;
  setPlaybackRate: (rate: number) => void;
};

type YoutubeNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars: Record<string, number | string>;
      events: {
        onReady: () => void;
        onStateChange: (event: { data: number }) => void;
      };
    },
  ) => YoutubePlayer;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
  };
};

declare global {
  interface Window {
    YT?: YoutubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function VideoPlayerScreen({ video }: { video: TrainingVideo }) {
  const youtubeContainerRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<YoutubePlayer | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const progressTimerRef = useRef<number | null>(null);
  const isYoutube = !video.localSrc && !video.youtubeId.startsWith("placeholder");
  const [isReady, setIsReady] = useState(!isYoutube);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSlowMotion, setIsSlowMotion] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState("Baixar");

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const syncYoutubeProgress = useCallback(() => {
    const player = youtubePlayerRef.current;

    if (!player) {
      return;
    }

    setCurrentTime(player.getCurrentTime() || 0);
    setDuration(player.getDuration() || 0);
  }, []);

  useEffect(() => {
    if (!isYoutube || !youtubeContainerRef.current) {
      return;
    }

    let cancelled = false;

    function createPlayer() {
      if (cancelled || !window.YT || !youtubeContainerRef.current) {
        return;
      }

      youtubePlayerRef.current = new window.YT.Player(youtubeContainerRef.current, {
        videoId: video.youtubeId,
        playerVars: {
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            setIsReady(true);
            syncYoutubeProgress();
          },
          onStateChange: (event) => {
            const playerState = window.YT?.PlayerState;
            setIsPlaying(event.data === playerState?.PLAYING);

            if (event.data === playerState?.ENDED && isRepeating) {
              youtubePlayerRef.current?.seekTo(0, true);
              youtubePlayerRef.current?.playVideo();
            }
          },
        },
      });
    }

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://www.youtube.com/iframe_api"]',
      );

      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }

      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        createPlayer();
      };
    }

    return () => {
      cancelled = true;
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = null;
    };
  }, [isRepeating, isYoutube, syncYoutubeProgress, video.youtubeId]);

  useEffect(() => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
    }

    progressTimerRef.current = window.setInterval(() => {
      if (isYoutube) {
        syncYoutubeProgress();
        return;
      }

      const localVideo = localVideoRef.current;
      if (localVideo) {
        setCurrentTime(localVideo.currentTime);
        setDuration(Number.isFinite(localVideo.duration) ? localVideo.duration : 0);
      }
    }, 350);

    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, [isYoutube, syncYoutubeProgress]);

  async function togglePlay() {
    if (isYoutube) {
      const player = youtubePlayerRef.current;

      if (!player || !isReady) {
        return;
      }

      if (isPlaying) {
        player.pauseVideo();
        return;
      }

      player.playVideo();
      return;
    }

    const localVideo = localVideoRef.current;

    if (!localVideo) {
      return;
    }

    if (localVideo.paused) {
      await localVideo.play().catch(() => undefined);
      return;
    }

    localVideo.pause();
  }

  function toggleSlowMotion() {
    const nextSlowMotion = !isSlowMotion;
    const rate = nextSlowMotion ? 0.5 : 1;

    setIsSlowMotion(nextSlowMotion);
    youtubePlayerRef.current?.setPlaybackRate(rate);

    if (localVideoRef.current) {
      localVideoRef.current.playbackRate = rate;
    }
  }

  function toggleRepeat() {
    const nextRepeating = !isRepeating;

    setIsRepeating(nextRepeating);
    youtubePlayerRef.current?.setLoop(nextRepeating);

    if (localVideoRef.current) {
      localVideoRef.current.loop = nextRepeating;
    }
  }

  function seekTo(seconds: number) {
    youtubePlayerRef.current?.seekTo(seconds, true);

    if (localVideoRef.current) {
      localVideoRef.current.currentTime = seconds;
    }

    setCurrentTime(seconds);
  }

  function seekProgress(value: string) {
    if (!duration) {
      return;
    }

    seekTo((Number(value) / 100) * duration);
  }

  async function downloadVideo() {
    setDownloadStatus("Baixando...");

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.id, quality: "360p" }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Falha ao baixar");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${video.id}.mp4`;
      anchor.click();
      URL.revokeObjectURL(url);
      setDownloadStatus("Baixado");
      window.setTimeout(() => setDownloadStatus("Baixar"), 1800);
    } catch (error) {
      setDownloadStatus(error instanceof Error ? error.message : "Erro");
      window.setTimeout(() => setDownloadStatus("Baixar"), 2600);
    }
  }

  return (
    <section className="grid min-h-[calc(100vh-4rem)] gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(270px,430px)_minmax(0,1fr)] lg:px-8">
      <div className="mx-auto flex w-full max-w-[430px] items-center">
        <div className="w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1813] p-2 shadow-[0_30px_90px_rgba(0,0,0,.48)]">
          <div className="relative aspect-[9/16] overflow-hidden rounded-[22px] bg-black">
            {video.localSrc ? (
              <video
                className="h-full w-full object-cover"
                loop={isRepeating}
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                playsInline
                ref={localVideoRef}
                src={video.localSrc}
              />
            ) : isYoutube ? (
              <div className="h-full w-full" ref={youtubeContainerRef} />
            ) : (
              <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_30%,#31533f_0,#12362b_38%,#050807_100%)] p-8 text-center">
                <div>
                  <p className="text-2xl font-black text-white">Video pendente</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Adicione um ID do YouTube ou um arquivo local em public/videos.
                  </p>
                </div>
              </div>
            )}

            <button
              aria-label={isPlaying ? "Pausar" : "Reproduzir"}
              className="absolute inset-0 grid place-items-center"
              onClick={togglePlay}
              type="button"
            >
              <span
                className={`grid h-20 w-20 place-items-center rounded-full bg-[#f4c542]/94 text-3xl font-black text-[#10251d] shadow-[0_18px_44px_rgba(0,0,0,.42)] transition ${
                  isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100"
                }`}
              >
                {isPlaying ? "II" : ">"}
              </span>
            </button>

            <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(0,0,0,.86),rgba(0,0,0,0))] px-4 pb-4 pt-20">
              <input
                aria-label="Progresso do video"
                className="h-1 w-full accent-[#f4c542]"
                max="100"
                min="0"
                onChange={(event) => seekProgress(event.target.value)}
                type="range"
                value={progress}
              />
              <div className="mt-3 flex items-center justify-between text-xs font-bold text-white/82">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-b-[22px] border-t border-white/10 bg-[#0b1611] p-4">
            <button
              className={`h-11 rounded-md border text-sm font-black transition ${
                isSlowMotion
                  ? "border-[#f4c542] bg-[#f4c542] text-[#10251d]"
                  : "border-white/10 bg-white/8 text-white hover:bg-white/14"
              }`}
              onClick={toggleSlowMotion}
              type="button"
            >
              Camera Lenta
            </button>
            <button
              className={`h-11 rounded-md border text-sm font-black transition ${
                isRepeating
                  ? "border-[#f4c542] bg-[#f4c542] text-[#10251d]"
                  : "border-white/10 bg-white/8 text-white hover:bg-white/14"
              }`}
              onClick={toggleRepeat}
              type="button"
            >
              Repetir
            </button>
            <button
              className="h-11 rounded-md bg-[#f4c542] text-sm font-black text-[#10251d] transition hover:bg-[#ffd760]"
              onClick={downloadVideo}
              type="button"
            >
              {downloadStatus}
            </button>
          </div>
        </div>
      </div>

      <aside className="flex min-w-0 flex-col justify-center pb-4">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f4c542]">
            Aula {video.order} | {video.category}
          </p>
          <h1 className="mt-3 text-3xl font-black text-white sm:text-5xl">{video.title}</h1>
          <p className="mt-4 text-base leading-7 text-[#ded8c8]">{video.description}</p>
        </div>

        <section className="mt-8 max-w-xl rounded-lg border border-white/10 bg-white/8 p-4">
          <h2 className="text-lg font-black text-white">Marcas do video</h2>
          <div className="mt-4 grid gap-2">
            {video.markers.map((marker) => (
              <button
                className="grid grid-cols-[64px_1fr] items-center gap-3 rounded-md border border-white/10 bg-black/20 p-3 text-left transition hover:border-[#f4c542] hover:bg-black/30"
                key={`${marker.time}-${marker.label}`}
                onClick={() => seekTo(marker.time)}
                type="button"
              >
                <span className="font-mono text-sm font-black text-[#f4c542]">
                  {formatMarkerTime(marker.time)}
                </span>
                <span className="text-sm font-bold text-white">{marker.label}</span>
              </button>
            ))}
          </div>
        </section>
      </aside>
    </section>
  );
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0:00";
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}
