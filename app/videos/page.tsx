import { AppShell } from "@/components/app-shell";
import { VideoSearch } from "@/components/video-search";
import { TRAINING_VIDEOS } from "@/lib/videos";

export default function VideosPage() {
  return (
    <AppShell>
      <section className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f4c542]">
          Catalogo
        </p>
        <h1 className="mt-2 text-4xl font-black text-white">Todos os videos</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#ded8c8]">
          Busque pelo nome do comando e abra o player com marcas, camera lenta e repeticao.
        </p>

        <VideoSearch videos={TRAINING_VIDEOS} />
      </section>
    </AppShell>
  );
}
