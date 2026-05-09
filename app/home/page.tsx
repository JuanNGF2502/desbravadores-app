import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { VideoCard } from "@/components/video-card";
import { TRAINING_VIDEOS } from "@/lib/videos";

export default function HomePage() {
  const featuredVideo = TRAINING_VIDEOS[0];
  const nextVideos = TRAINING_VIDEOS.slice(1, 6);

  return (
    <AppShell>
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="flex min-h-[520px] flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#f4c542] px-2.5 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#10251d]">
              Aula {featuredVideo.order}
            </span>
            <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/82">
              {featuredVideo.category}
            </span>
          </div>

          <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-normal text-white sm:text-6xl">
            {featuredVideo.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#ded8c8] sm:text-lg">
            {featuredVideo.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#b8c2bb]">
            <span>{featuredVideo.duration}</span>
            <span className="h-1 w-1 rounded-full bg-[#f4c542]" />
            <span>{featuredVideo.steps.length} passos guiados</span>
            <span className="h-1 w-1 rounded-full bg-[#f4c542]" />
            <span>{featuredVideo.markers.length} marcas no video</span>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-md bg-[#f4c542] px-6 text-sm font-black text-[#10251d] shadow-[0_18px_40px_rgba(244,197,66,.24)] transition hover:bg-[#ffd760]"
              href={`/video/${featuredVideo.id}`}
            >
              Assistir agora
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-md border border-white/12 bg-white/12 px-6 text-sm font-bold text-white backdrop-blur transition hover:bg-white/18"
              href="/videos"
            >
              Todos os videos
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-[310px] rounded-[28px] border border-white/10 bg-white/8 p-3 shadow-[0_30px_90px_rgba(0,0,0,.44)]">
            <div className="relative aspect-[9/16] overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#12362b,#31533f,#0b1611)]">
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.82))]" />
              <span className="absolute inset-x-0 bottom-0 p-5">
                <span className="rounded-md bg-[#f4c542] px-2 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#10251d]">
                  Reels
                </span>
                <span className="mt-3 block text-2xl font-black text-white">{featuredVideo.title}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2 className="mb-3 text-xl font-black text-white">Continue treinando</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {nextVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
