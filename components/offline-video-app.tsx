"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  deleteOfflineVideo,
  getOfflineVideo,
  listOfflineVideos,
  saveOfflineVideo,
  type OfflineVideoRecord,
} from "@/lib/offline-db";
import {
  getYoutubeThumbnail,
  type TrainingVideo,
  type VideoQuality,
} from "@/lib/videos";
import { PwaRegister } from "@/components/pwa-register";

type DownloadState = "idle" | "downloading" | "saved" | "error";
type AppScreen = "home" | "watch" | "lessons" | "offline";

type OfflineVideoAppProps = {
  initialVideos: TrainingVideo[];
};

const qualityOptions: Exclude<VideoQuality, "auto">[] = ["240p", "360p", "720p"];

const navItems: { id: AppScreen; label: string }[] = [
  { id: "home", label: "Inicio" },
  { id: "watch", label: "Assistir" },
  { id: "lessons", label: "Aulas" },
  { id: "offline", label: "Offline" },
];

export function OfflineVideoApp({ initialVideos }: OfflineVideoAppProps) {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [selectedId, setSelectedId] = useState(initialVideos[0]?.id ?? "");
  const [isOnline, setIsOnline] = useState(true);
  const [offlineMap, setOfflineMap] = useState<Record<string, OfflineVideoRecord>>({});
  const [downloadState, setDownloadState] = useState<DownloadState>("idle");
  const [quality, setQuality] = useState<VideoQuality>("360p");
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Pronto para treinar");
  const [filter, setFilter] = useState("Todos");

  const selectedVideo = useMemo(
    () => initialVideos.find((video) => video.id === selectedId) ?? initialVideos[0],
    [initialVideos, selectedId],
  );

  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(initialVideos.map((video) => video.category)))],
    [initialVideos],
  );

  const groupedVideos = useMemo(() => {
    return categories
      .filter((category) => category !== "Todos")
      .map((category) => ({
        category,
        videos: initialVideos.filter((video) => video.category === category),
      }));
  }, [categories, initialVideos]);

  const filteredVideos = useMemo(() => {
    if (filter === "Todos") {
      return initialVideos;
    }

    return initialVideos.filter((video) => video.category === filter);
  }, [filter, initialVideos]);

  const offlineVideos = useMemo(
    () => initialVideos.filter((video) => Boolean(offlineMap[video.id])),
    [initialVideos, offlineMap],
  );

  const selectedOffline = selectedVideo ? offlineMap[selectedVideo.id] : undefined;
  const canUseYoutube = isOnline && selectedVideo && !selectedVideo.youtubeId.startsWith("placeholder");
  const videoSource = localUrl ?? selectedVideo?.localSrc ?? null;
  const totalOfflineSize = Object.values(offlineMap).reduce((sum, record) => sum + record.size, 0);

  useEffect(() => {
    const setOnline = () => setIsOnline(true);
    const setOffline = () => setIsOnline(false);
    const syncOnlineState = window.setTimeout(() => setIsOnline(navigator.onLine), 0);

    window.addEventListener("online", setOnline);
    window.addEventListener("offline", setOffline);

    return () => {
      window.clearTimeout(syncOnlineState);
      window.removeEventListener("online", setOnline);
      window.removeEventListener("offline", setOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    listOfflineVideos()
      .then((records) => {
        if (cancelled) {
          return;
        }

        setOfflineMap(
          records.reduce<Record<string, OfflineVideoRecord>>((acc, record) => {
            acc[record.id] = record;
            return acc;
          }, {}),
        );
      })
      .catch(() => setStatusMessage("Nao foi possivel ler os videos offline."));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let objectUrl: string | null = null;

    async function loadLocalVideo() {
      if (!selectedVideo) {
        return;
      }

      const record = await getOfflineVideo(selectedVideo.id);

      if (!record) {
        setLocalUrl(null);
        return;
      }

      objectUrl = URL.createObjectURL(record.blob);
      setLocalUrl(objectUrl);
    }

    loadLocalVideo().catch(() => setLocalUrl(null));

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedVideo]);

  function selectVideo(videoId: string, nextScreen: AppScreen = "watch") {
    setSelectedId(videoId);
    setScreen(nextScreen);
  }

  async function downloadSelectedVideo() {
    if (!selectedVideo || quality === "auto") {
      return;
    }

    setDownloadState("downloading");
    setStatusMessage("Baixando video autorizado para uso offline...");

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: selectedVideo.id, quality }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Falha ao baixar o video.");
      }

      const blob = await response.blob();
      const record: OfflineVideoRecord = {
        id: selectedVideo.id,
        blob,
        quality,
        downloadedAt: Date.now(),
        size: blob.size,
      };

      await saveOfflineVideo(record);
      setOfflineMap((current) => ({ ...current, [selectedVideo.id]: record }));
      setDownloadState("saved");
      setStatusMessage("Video salvo no dispositivo.");
    } catch (error) {
      setDownloadState("error");
      setStatusMessage(error instanceof Error ? error.message : "Falha ao baixar o video.");
    }
  }

  async function removeSelectedVideo() {
    if (!selectedVideo) {
      return;
    }

    await deleteOfflineVideo(selectedVideo.id);
    setOfflineMap((current) => {
      const next = { ...current };
      delete next[selectedVideo.id];
      return next;
    });
    setLocalUrl(null);
    setDownloadState("idle");
    setStatusMessage("Video removido do modo offline.");
  }

  return (
    <>
      <PwaRegister />
      <main className="min-h-screen overflow-hidden bg-[#07110d] pb-20 text-[#f7f1df] md:pb-0">
        <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#07110d]/88 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <button
              className="flex min-w-0 items-center gap-3 text-left"
              onClick={() => setScreen("home")}
              type="button"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#f4c542] text-lg font-black text-[#12362b]">
                OU
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold uppercase tracking-[0.18em] text-[#f4c542]">
                  Desbravadores Play
                </span>
                <span className="block truncate text-base font-semibold text-white">Ordem Unida</span>
              </span>
            </button>

            <nav className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`h-9 rounded-md px-4 text-sm font-bold transition ${
                    screen === item.id
                      ? "bg-[#f4c542] text-[#10251d]"
                      : "text-white/72 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => setScreen(item.id)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-2 text-xs font-semibold">
              <StatusPill value={isOnline ? "Online" : "Offline"} tone={isOnline ? "gold" : "muted"} />
              <StatusPill value={`${Object.keys(offlineMap).length}/10 salvos`} tone="green" />
            </div>
          </div>
        </header>

        <ScreenBackground />

        <div className="relative z-10 pt-16">
          {screen === "home" ? (
            <HomeScreen
              groupedVideos={groupedVideos}
              offlineMap={offlineMap}
              onDownload={downloadSelectedVideo}
              onOpenLessons={() => setScreen("lessons")}
              onOpenWatch={() => setScreen("watch")}
              onSelect={selectVideo}
              selectedOffline={Boolean(selectedOffline)}
              selectedVideo={selectedVideo}
              totalOfflineSize={totalOfflineSize}
            />
          ) : null}

          {screen === "watch" ? (
            <WatchScreen
              canUseYoutube={Boolean(canUseYoutube && !videoSource)}
              downloadState={downloadState}
              isOnline={isOnline}
              localSource={videoSource}
              onDownload={downloadSelectedVideo}
              onRemove={removeSelectedVideo}
              onSelect={(id) => selectVideo(id, "watch")}
              offlineMap={offlineMap}
              quality={quality}
              selectedOffline={Boolean(selectedOffline)}
              selectedVideo={selectedVideo}
              setQuality={setQuality}
              statusMessage={statusMessage}
              videos={initialVideos}
            />
          ) : null}

          {screen === "lessons" ? (
            <LessonsScreen
              activeId={selectedVideo?.id}
              categories={categories}
              filter={filter}
              filteredVideos={filteredVideos}
              offlineMap={offlineMap}
              onFilter={setFilter}
              onSelect={selectVideo}
            />
          ) : null}

          {screen === "offline" ? (
            <OfflineScreen
              activeId={selectedVideo?.id}
              offlineMap={offlineMap}
              offlineVideos={offlineVideos}
              onRemove={removeSelectedVideo}
              onSelect={selectVideo}
              totalOfflineSize={totalOfflineSize}
            />
          ) : null}
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#07110d]/94 px-3 py-2 backdrop-blur-md md:hidden">
          <div className="grid grid-cols-4 gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`h-12 rounded-md text-xs font-black transition ${
                  screen === item.id ? "bg-[#f4c542] text-[#10251d]" : "text-white/68"
                }`}
                onClick={() => setScreen(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </main>
    </>
  );
}

function HomeScreen({
  selectedVideo,
  selectedOffline,
  groupedVideos,
  offlineMap,
  totalOfflineSize,
  onDownload,
  onOpenWatch,
  onOpenLessons,
  onSelect,
}: {
  selectedVideo?: TrainingVideo;
  selectedOffline: boolean;
  groupedVideos: { category: string; videos: TrainingVideo[] }[];
  offlineMap: Record<string, OfflineVideoRecord>;
  totalOfflineSize: number;
  onDownload: () => void;
  onOpenWatch: () => void;
  onOpenLessons: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid h-full w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-h-[520px] flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#f4c542] px-2.5 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#10251d]">
              Aula {selectedVideo?.order}
            </span>
            <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/82">
              {selectedVideo?.category}
            </span>
            {selectedOffline ? (
              <span className="rounded-md border border-[#9bc89e]/30 bg-[#31533f]/80 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#dff5d9]">
                Offline
              </span>
            ) : null}
          </div>

          <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-normal text-white sm:text-6xl">
            {selectedVideo?.title}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#ded8c8] sm:text-lg">
            {selectedVideo?.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#b8c2bb]">
            <span>{selectedVideo?.duration}</span>
            <span className="h-1 w-1 rounded-full bg-[#f4c542]" />
            <span>{selectedVideo?.steps.length} passos guiados</span>
            <span className="h-1 w-1 rounded-full bg-[#f4c542]" />
            <span>{formatBytes(totalOfflineSize)} offline</span>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex h-12 items-center justify-center rounded-md bg-[#f4c542] px-6 text-sm font-black text-[#10251d] shadow-[0_18px_40px_rgba(244,197,66,.24)] transition hover:bg-[#ffd760]"
              onClick={onOpenWatch}
              type="button"
            >
              Assistir agora
            </button>
            <button
              className="inline-flex h-12 items-center justify-center rounded-md border border-white/12 bg-white/12 px-6 text-sm font-bold text-white backdrop-blur transition hover:bg-white/18"
              onClick={onOpenLessons}
              type="button"
            >
              Ver aulas
            </button>
            <button
              className="inline-flex h-12 items-center justify-center rounded-md border border-white/12 px-6 text-sm font-bold text-white/85 transition hover:bg-white/10"
              onClick={onDownload}
              type="button"
            >
              Baixar offline
            </button>
          </div>

          <div className="mt-8 grid max-w-2xl gap-2 sm:grid-cols-3">
            {selectedVideo?.steps.map((step, index) => (
              <div key={step} className="rounded-md border border-white/10 bg-black/20 p-3 backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#f4c542]">
                  Passo {index + 1}
                </p>
                <p className="mt-1 text-sm leading-5 text-[#eee7d5]">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-[310px] rounded-[28px] border border-white/10 bg-white/8 p-3 shadow-[0_30px_90px_rgba(0,0,0,.44)]">
            <MiniPoster video={selectedVideo} />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 w-full max-w-7xl">
        {groupedVideos.slice(0, 3).map((group) => (
          <VideoRow
            key={group.category}
            activeId={selectedVideo?.id}
            offlineMap={offlineMap}
            onSelect={onSelect}
            title={group.category}
            videos={group.videos}
          />
        ))}
      </div>
    </section>
  );
}

function WatchScreen({
  selectedVideo,
  selectedOffline,
  localSource,
  canUseYoutube,
  statusMessage,
  quality,
  setQuality,
  downloadState,
  isOnline,
  videos,
  offlineMap,
  onDownload,
  onRemove,
  onSelect,
}: {
  selectedVideo?: TrainingVideo;
  selectedOffline: boolean;
  localSource: string | null;
  canUseYoutube: boolean;
  statusMessage: string;
  quality: VideoQuality;
  setQuality: (quality: VideoQuality) => void;
  downloadState: DownloadState;
  isOnline: boolean;
  videos: TrainingVideo[];
  offlineMap: Record<string, OfflineVideoRecord>;
  onDownload: () => void;
  onRemove: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="grid min-h-[calc(100vh-4rem)] gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(270px,420px)_minmax(0,1fr)] lg:px-8">
      <div className="mx-auto flex w-full max-w-[430px] items-center">
        <div className="w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1813] p-2 shadow-[0_30px_90px_rgba(0,0,0,.48)]">
          <VideoPanel
            canUseYoutube={canUseYoutube}
            localSource={localSource}
            selectedOffline={selectedOffline}
            video={selectedVideo}
          />
          <div className="grid gap-4 rounded-b-[22px] border-t border-white/10 bg-[#0b1611] p-4">
            <div>
              <p className="text-sm font-semibold text-white">{statusMessage}</p>
              <p className="mt-1 text-xs leading-5 text-[#aeb9b1]">
                Player vertical para videos locais/offline. YouTube usa iframe em formato Shorts.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {qualityOptions.map((option) => (
                <button
                  key={option}
                  className={`h-10 min-w-16 rounded-md border px-3 text-sm font-bold transition ${
                    quality === option
                      ? "border-[#f4c542] bg-[#f4c542] text-[#10251d]"
                      : "border-white/10 bg-white/8 text-white hover:bg-white/14"
                  }`}
                  onClick={() => setQuality(option)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="flex min-w-0 flex-col justify-center pb-4">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f4c542]">
            Assistindo agora
          </p>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-5xl">{selectedVideo?.title}</h2>
          <p className="mt-4 text-base leading-7 text-[#ded8c8]">{selectedVideo?.description}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              className="h-12 rounded-md bg-[#f4c542] px-6 text-sm font-black text-[#10251d] transition hover:bg-[#ffd760] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={downloadState === "downloading" || !isOnline || !selectedVideo}
              onClick={onDownload}
              type="button"
            >
              {downloadState === "downloading" ? "Baixando" : "Baixar offline"}
            </button>
            <button
              className="h-12 rounded-md border border-white/12 px-6 text-sm font-bold text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!selectedOffline}
              onClick={onRemove}
              type="button"
            >
              Remover offline
            </button>
          </div>
        </div>

        <div className="mt-8 min-w-0">
          <VideoRow
            activeId={selectedVideo?.id}
            offlineMap={offlineMap}
            onSelect={onSelect}
            title="Proximas aulas"
            videos={videos}
          />
        </div>
      </aside>
    </section>
  );
}

function LessonsScreen({
  categories,
  filter,
  filteredVideos,
  activeId,
  offlineMap,
  onFilter,
  onSelect,
}: {
  categories: string[];
  filter: string;
  filteredVideos: TrainingVideo[];
  activeId?: string;
  offlineMap: Record<string, OfflineVideoRecord>;
  onFilter: (filter: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f4c542]">
              Catalogo
            </p>
            <h2 className="mt-2 text-4xl font-black text-white">Todas as aulas</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category}
                className={`h-10 shrink-0 rounded-md px-4 text-sm font-bold transition ${
                  filter === category
                    ? "bg-[#f4c542] text-[#10251d]"
                    : "bg-white/10 text-white hover:bg-white/16"
                }`}
                onClick={() => onFilter(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              active={activeId === video.id}
              offline={Boolean(offlineMap[video.id])}
              onSelect={() => onSelect(video.id)}
              video={video}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function OfflineScreen({
  offlineVideos,
  offlineMap,
  activeId,
  totalOfflineSize,
  onSelect,
  onRemove,
}: {
  offlineVideos: TrainingVideo[];
  offlineMap: Record<string, OfflineVideoRecord>;
  activeId?: string;
  totalOfflineSize: number;
  onSelect: (id: string) => void;
  onRemove: () => void;
}) {
  return (
    <section className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-4 md:grid-cols-[1fr_280px] md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f4c542]">
              Biblioteca offline
            </p>
            <h2 className="mt-2 text-4xl font-black text-white">Videos salvos</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#ded8c8]">
              Estes videos ficam no IndexedDB do aparelho e continuam acessiveis sem internet.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/8 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#f4c542]">
              Armazenamento
            </p>
            <p className="mt-2 text-3xl font-black text-white">{formatBytes(totalOfflineSize)}</p>
            <p className="mt-1 text-sm text-white/60">{offlineVideos.length} de 10 aulas salvas</p>
          </div>
        </div>

        {offlineVideos.length > 0 ? (
          <div className="mt-8">
            <VideoRow
              activeId={activeId}
              offlineMap={offlineMap}
              onSelect={onSelect}
              title="Disponiveis sem internet"
              videos={offlineVideos}
            />
            <button
              className="mt-2 h-11 rounded-md border border-white/12 px-5 text-sm font-bold text-white/85 transition hover:bg-white/10"
              onClick={onRemove}
              type="button"
            >
              Remover aula selecionada
            </button>
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-white/10 bg-white/8 p-8 text-center">
            <p className="text-xl font-black text-white">Nenhum video salvo ainda</p>
            <p className="mt-2 text-sm text-white/64">
              Abra uma aula, escolha a qualidade e toque em Baixar offline.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ScreenBackground() {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,#31533f_0,#12362b_24%,#07110d_62%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#07110d_0%,rgba(7,17,13,.92)_34%,rgba(7,17,13,.25)_72%,#07110d_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-52 bg-[linear-gradient(0deg,#07110d_0%,rgba(7,17,13,0)_100%)]" />
    </div>
  );
}

function MiniPoster({ video }: { video?: TrainingVideo }) {
  if (!video) {
    return null;
  }

  const thumbnail = getYoutubeThumbnail(video.youtubeId);

  return (
    <div className="relative aspect-[9/16] overflow-hidden rounded-[22px] bg-[#12362b]">
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: thumbnail
            ? `url(${thumbnail})`
            : "linear-gradient(135deg, #12362b 0%, #31533f 48%, #0b1611 100%)",
        }}
      />
      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.82))]" />
      <span className="absolute inset-x-0 bottom-0 p-5">
        <span className="rounded-md bg-[#f4c542] px-2 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#10251d]">
          Reels
        </span>
        <span className="mt-3 block text-2xl font-black text-white">{video.title}</span>
      </span>
    </div>
  );
}

function VideoPanel({
  video,
  localSource,
  selectedOffline,
  canUseYoutube,
}: {
  video?: TrainingVideo;
  localSource: string | null;
  selectedOffline: boolean;
  canUseYoutube: boolean;
}) {
  if (!video) {
    return null;
  }

  return (
    <div className="aspect-[9/16] w-full overflow-hidden rounded-[22px] bg-black">
      {localSource ? (
        <VerticalVideoPlayer src={localSource} title={video.title} />
      ) : canUseYoutube ? (
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1&playsinline=1`}
          title={video.title}
        />
      ) : (
        <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-6 text-center text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#31533f_0,#12362b_38%,#050807_100%)]" />
          <div className="relative grid h-20 w-20 place-items-center rounded-md bg-[#f4c542] text-3xl font-black text-[#12362b] shadow-[0_20px_50px_rgba(0,0,0,.35)]">
            {video.order}
          </div>
          <div className="relative mt-5">
            <p className="text-xl font-black">
              {selectedOffline ? "Carregando video offline" : "Video do YouTube pendente"}
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/72">
              Troque o ID placeholder por um video real da playlist ou use um MP4 local em
              public/videos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function VerticalVideoPlayer({ src, title }: { src: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  async function togglePlay() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      await video.play().catch(() => undefined);
      return;
    }

    video.pause();
  }

  function toggleMute() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }

  function seek(value: string) {
    const video = videoRef.current;
    const nextProgress = Number(value);

    if (!video || !duration) {
      return;
    }

    video.currentTime = (nextProgress / 100) * duration;
    setCurrentTime(video.currentTime);
  }

  function syncMetadata() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    setCurrentTime(video.currentTime);
    setIsMuted(video.muted);
  }

  function syncTime() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    setCurrentTime(video.currentTime);
  }

  async function enterFullscreen() {
    await frameRef.current?.requestFullscreen?.().catch(() => undefined);
  }

  return (
    <div ref={frameRef} className="group relative h-full w-full bg-black">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        key={src}
        onClick={togglePlay}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={syncMetadata}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onTimeUpdate={syncTime}
        playsInline
        preload="metadata"
        src={src}
        title={title}
      />

      <button
        aria-label={isPlaying ? "Pausar" : "Reproduzir"}
        className={`absolute inset-0 grid place-items-center transition ${
          isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        }`}
        onClick={togglePlay}
        type="button"
      >
        <span className="grid h-20 w-20 place-items-center rounded-full bg-[#f4c542]/94 text-3xl font-black text-[#10251d] shadow-[0_18px_44px_rgba(0,0,0,.42)]">
          {isPlaying ? "II" : ">"}
        </span>
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(0,0,0,.86),rgba(0,0,0,0))] px-4 pb-4 pt-20">
        <div className="pointer-events-auto">
          <input
            aria-label="Progresso do video"
            className="h-1 w-full accent-[#f4c542]"
            max="100"
            min="0"
            onChange={(event) => seek(event.target.value)}
            type="range"
            value={progress}
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                aria-label={isPlaying ? "Pausar" : "Reproduzir"}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/14 text-sm font-black text-white backdrop-blur transition hover:bg-white/22"
                onClick={togglePlay}
                type="button"
              >
                {isPlaying ? "II" : ">"}
              </button>
              <button
                aria-label={isMuted ? "Ativar som" : "Silenciar"}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/14 text-sm font-black text-white backdrop-blur transition hover:bg-white/22"
                onClick={toggleMute}
                type="button"
              >
                {isMuted ? "M" : "S"}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-white/82">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <button
                aria-label="Tela cheia"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/14 text-xs font-black text-white backdrop-blur transition hover:bg-white/22"
                onClick={enterFullscreen}
                type="button"
              >
                FS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoRow({
  title,
  videos,
  activeId,
  offlineMap,
  onSelect,
}: {
  title: string;
  videos: TrainingVideo[];
  activeId?: string;
  offlineMap: Record<string, OfflineVideoRecord>;
  onSelect: (id: string) => void;
}) {
  if (videos.length === 0) {
    return null;
  }

  return (
    <section className="mb-9">
      <h2 className="mb-3 text-xl font-black text-white">{title}</h2>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            active={activeId === video.id}
            offline={Boolean(offlineMap[video.id])}
            onSelect={() => onSelect(video.id)}
            video={video}
          />
        ))}
      </div>
    </section>
  );
}

function VideoCard({
  video,
  active,
  offline,
  onSelect,
}: {
  video: TrainingVideo;
  active: boolean;
  offline: boolean;
  onSelect: () => void;
}) {
  const thumbnail = getYoutubeThumbnail(video.youtubeId);

  return (
    <button
      className={`group relative min-h-[280px] w-[160px] shrink-0 snap-start overflow-hidden rounded-md border text-left shadow-[0_18px_40px_rgba(0,0,0,.26)] transition duration-200 hover:-translate-y-1 hover:scale-[1.02] sm:min-h-[320px] sm:w-[190px] ${
        active ? "border-[#f4c542]" : "border-white/10 hover:border-white/24"
      }`}
      onClick={onSelect}
      type="button"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: thumbnail
            ? `url(${thumbnail})`
            : "linear-gradient(135deg, #12362b 0%, #31533f 48%, #0b1611 100%)",
        }}
      />
      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.04)_0%,rgba(0,0,0,.38)_48%,rgba(0,0,0,.9)_100%)]" />
      <span className="relative flex h-full min-h-[280px] flex-col justify-between p-3 sm:min-h-[320px]">
        <span className="flex items-start justify-between gap-3">
          <span className="rounded-md bg-black/45 px-2 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#f4c542] backdrop-blur">
            Aula {video.order}
          </span>
          {offline ? (
            <span className="rounded-md bg-[#f4c542] px-2 py-1 text-xs font-black text-[#10251d]">
              Offline
            </span>
          ) : null}
        </span>
        <span>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#d9c99b]">
            {video.category} | {video.duration}
          </span>
          <span className="block text-base font-black leading-6 text-white">{video.title}</span>
          <span className="mt-2 line-clamp-3 block text-sm leading-5 text-white/72">
            {video.description}
          </span>
        </span>
      </span>
    </button>
  );
}

function StatusPill({ value, tone }: { value: string; tone: "gold" | "green" | "muted" }) {
  const toneClass =
    tone === "gold"
      ? "border-[#f4c542]/40 bg-[#f4c542]/16 text-[#ffe08a]"
      : tone === "green"
        ? "border-[#7aa36f]/30 bg-[#31533f]/42 text-[#dff5d9]"
        : "border-white/12 bg-white/10 text-white/70";

  return <span className={`rounded-md border px-2.5 py-1 ${toneClass}`}>{value}</span>;
}

function formatBytes(size: number) {
  if (size === 0) {
    return "0 MB";
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
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
