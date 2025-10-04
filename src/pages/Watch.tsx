import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Share2 } from "lucide-react";
import { VideoCard } from "@/components/VideoCard";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useToast } from "@/hooks/use-toast";

export default function Watch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoId = searchParams.get("v");
  const [video, setVideo] = useState<any>(null);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [userLike, setUserLike] = useState<boolean | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (videoId) {
      fetchVideo();
      fetchRelatedVideos();
      if (session) {
        fetchUserLike();
        recordView();
      }
    }
  }, [videoId, session]);

  const fetchVideo = async () => {
    const { data, error } = await supabase
      .from("videos")
      .select(`
        *,
        channels (
          id,
          name,
          avatar_url,
          subscriber_count
        )
      `)
      .eq("id", videoId)
      .single();

    if (!error && data) {
      setVideo(data);
    }
  };

  const fetchRelatedVideos = async () => {
    const { data } = await supabase
      .from("videos")
      .select(`
        *,
        channels (
          name,
          avatar_url
        )
      `)
      .eq("privacy", "public")
      .neq("id", videoId)
      .limit(10);

    if (data) {
      setRelatedVideos(data);
    }
  };

  const fetchUserLike = async () => {
    const { data } = await supabase
      .from("likes")
      .select("is_like")
      .eq("video_id", videoId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (data) {
      setUserLike(data.is_like);
    }
  };

  const recordView = async () => {
    await supabase
      .from("watch_history")
      .insert({
        user_id: session.user.id,
        video_id: videoId,
      });

    await supabase
      .from("videos")
      .update({ view_count: (video?.view_count || 0) + 1 })
      .eq("id", videoId);
  };

  const handleLike = async (isLike: boolean) => {
    if (!session) {
      navigate("/auth");
      return;
    }

    if (userLike === isLike) {
      await supabase
        .from("likes")
        .delete()
        .eq("video_id", videoId)
        .eq("user_id", session.user.id);
      setUserLike(null);
    } else {
      await supabase
        .from("likes")
        .upsert({
          video_id: videoId,
          user_id: session.user.id,
          is_like: isLike,
        });
      setUserLike(isLike);
    }
    fetchVideo();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Video link copied to clipboard",
    });
  };

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="aspect-video bg-muted rounded-lg" />
            <div className="h-8 bg-muted rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <VideoPlayer
                src={video.video_url}
                onTimeUpdate={(time) => {
                  // Update watch progress
                }}
              />
            </div>

            <div>
              <h1 className="text-xl font-bold mb-2">{video.title}</h1>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                      {video.channels?.avatar_url && (
                        <img
                          src={video.channels.avatar_url}
                          alt={video.channels.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{video.channels?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {video.channels?.subscriber_count?.toLocaleString()} subscribers
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-secondary rounded-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-l-full ${userLike === true ? "text-primary" : ""}`}
                      onClick={() => handleLike(true)}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {video.like_count}
                    </Button>
                    <div className="w-px h-6 bg-border" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-r-full ${userLike === false ? "text-primary" : ""}`}
                      onClick={() => handleLike(false)}
                    >
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      {video.dislike_count}
                    </Button>
                  </div>

                  <Button variant="secondary" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {video.description && (
                <div className="mt-4 p-4 bg-secondary rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{video.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold">Related Videos</h2>
            {relatedVideos.map((relatedVideo) => (
              <VideoCard
                key={relatedVideo.id}
                id={relatedVideo.id}
                title={relatedVideo.title}
                thumbnail={relatedVideo.thumbnail_url}
                channelName={relatedVideo.channels?.name || "Unknown"}
                channelAvatar={relatedVideo.channels?.avatar_url}
                views={relatedVideo.view_count}
                createdAt={relatedVideo.created_at}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
