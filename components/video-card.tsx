import Link from "next/link";
import { getYoutubeThumbnail, type TrainingVideo } from "@/lib/videos";

export function VideoCard({ video }: { video: TrainingVideo }) {
  const thumbnail = getYoutubeThumbnail(video.youtubeId);

  return (
    <Link
      className="group relative min-h-[280px] overflow-hidden rounded-md border border-white/10 text-left shadow-[0_18px_40px_rgba(0,0,0,.26)] transition duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:border-white/24"
      href={`/video/${video.id}`}
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
      <span className="relative flex h-full min-h-[280px] flex-col justify-between p-3">
        <span className="flex items-start justify-between gap-3">
          <span className="rounded-md bg-black/45 px-2 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#f4c542] backdrop-blur">
            Aula {video.order}
          </span>
          <span className="rounded-md bg-[#f4c542] px-2 py-1 text-xs font-black text-[#10251d]">
            {video.duration}
          </span>
        </span>
        <span>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#d9c99b]">
            {video.category}
          </span>
          <span className="block text-base font-black leading-6 text-white">{video.title}</span>
          <span className="mt-2 line-clamp-3 block text-sm leading-5 text-white/72">
            {video.description}
          </span>
        </span>
      </span>
    </Link>
  );
}
