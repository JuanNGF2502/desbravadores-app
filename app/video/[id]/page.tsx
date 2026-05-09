import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { VideoPlayerScreen } from "@/components/video-player-screen";
import { findTrainingVideo, TRAINING_VIDEOS } from "@/lib/videos";

export function generateStaticParams() {
  return TRAINING_VIDEOS.map((video) => ({ id: video.id }));
}

export default async function VideoPage({ params }: PageProps<"/video/[id]">) {
  const { id } = await params;
  const video = findTrainingVideo(id);

  if (!video) {
    notFound();
  }

  return (
    <AppShell>
      <VideoPlayerScreen video={video} />
    </AppShell>
  );
}
