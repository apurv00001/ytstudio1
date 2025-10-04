import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload as UploadIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const uploadSchema = z.object({
  title: z.string()
    .trim()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z.string()
    .max(5000, "Description must be less than 5000 characters")
    .optional(),
  tags: z.string()
    .max(500, "Tags must be less than 500 characters")
    .optional(),
  privacy: z.enum(["public", "unlisted", "private"]),
});

export default function Upload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
        fetchChannel(session.user.id);
      }
    });
  }, [navigate]);

  const fetchChannel = async (userId: string) => {
    const { data } = await supabase
      .from("channels")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    setChannel(data);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session || !channel || !videoFile) return;

    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const rawData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string || undefined,
        tags: formData.get("tags") as string || undefined,
        privacy: formData.get("privacy") as string,
      };

      // Validate input
      const validation = uploadSchema.safeParse(rawData);
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { title, description, privacy, tags: tagsString } = validation.data;
      const tags = tagsString 
        ? tagsString.split(",").map(t => t.trim()).filter(t => t.length > 0)
        : [];

      // Upload video
      const videoPath = `${session.user.id}/${Date.now()}_${videoFile.name}`;
      const { error: videoError } = await supabase.storage
        .from("videos")
        .upload(videoPath, videoFile);

      if (videoError) throw videoError;

      // Store path instead of public URL since buckets are now private
      const videoStoragePath = videoPath;

      // Upload thumbnail if provided
      let thumbnailStoragePath = null;
      if (thumbnailFile) {
        const thumbnailPath = `${session.user.id}/${Date.now()}_${thumbnailFile.name}`;
        const { error: thumbnailError } = await supabase.storage
          .from("thumbnails")
          .upload(thumbnailPath, thumbnailFile);

        if (!thumbnailError) {
          thumbnailStoragePath = thumbnailPath;
        }
      }

      // Create video record with storage paths (not URLs)
      const { data: videoData, error: dbError } = await supabase
        .from("videos")
        .insert({
          channel_id: channel.id,
          title,
          description,
          video_url: videoStoragePath,
          thumbnail_url: thumbnailStoragePath,
          privacy: privacy as any,
          published_at: privacy === "public" ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!channel) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle>Create a Channel First</CardTitle>
              <CardDescription>
                You need to create a channel before uploading videos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/channel/create")}>Create Channel</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Video</CardTitle>
            <CardDescription>Share your content with the world</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Video File *
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  {videoFile ? (
                    <div>
                      <p className="font-medium">{videoFile.name}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setVideoFile(null)}
                        className="mt-2"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to select video file
                      </p>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                        required
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Thumbnail (optional)
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input
                  name="title"
                  placeholder="Enter video title"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  name="description"
                  placeholder="Tell viewers about your video"
                  rows={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <Input
                  name="tags"
                  placeholder="Separate tags with commas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Privacy *</label>
                <Select name="privacy" defaultValue="public">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !videoFile}>
                {loading ? "Uploading..." : "Upload Video"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
