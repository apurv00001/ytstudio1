import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { VideoCard } from "@/components/VideoCard";
import { getSignedUrl } from "@/utils/storage";

export default function Home() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-youtube-videos', {
        body: { query: 'trending' }
      });

      if (error) {
        console.error('Error fetching YouTube videos:', error);
        setLoading(false);
        return;
      }

      if (data?.videos) {
        setVideos(data.videos);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-video rounded-lg bg-muted animate-pulse" />
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No videos found. Upload the first video!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                thumbnail={video.thumbnail_url}
                channelName={video.channel_name || video.channels?.name || "Unknown"}
                channelAvatar={video.channels?.avatar_url}
                views={video.view_count || 0}
                createdAt={video.created_at}
                isYouTubeVideo={video.isYouTubeVideo}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
