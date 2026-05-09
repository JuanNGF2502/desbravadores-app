import { OfflineVideoApp } from "@/components/offline-video-app";
import { TRAINING_VIDEOS } from "@/lib/videos";

export default function Home() {
  return <OfflineVideoApp initialVideos={TRAINING_VIDEOS} />;
}
