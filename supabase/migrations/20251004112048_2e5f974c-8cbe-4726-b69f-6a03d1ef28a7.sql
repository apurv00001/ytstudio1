-- Fix Security Issue: Make all storage buckets private
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('videos', 'thumbnails', 'avatars', 'banners');

-- Fix Security Issue: Restrict likes table to only show user's own likes
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;

CREATE POLICY "Users can view own likes"
  ON public.likes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Note: Videos table already has like_count/dislike_count for public display
-- This ensures individual user preferences remain private