import { supabase } from "@/integrations/supabase/client";

/**
 * Get a signed URL for a file in storage
 * @param bucket - Storage bucket name
 * @param path - File path in the bucket
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL or null if error
 */
export async function getSignedUrl(
  bucket: string,
  path: string | null,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error(`Error creating signed URL for ${bucket}/${path}:`, error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Get signed URLs for video and thumbnail
 */
export async function getVideoUrls(videoPath: string | null, thumbnailPath: string | null) {
  const [videoUrl, thumbnailUrl] = await Promise.all([
    getSignedUrl("videos", videoPath, 7200), // 2 hour expiry for videos
    getSignedUrl("thumbnails", thumbnailPath, 86400), // 24 hour expiry for thumbnails
  ]);

  return { videoUrl, thumbnailUrl };
}
