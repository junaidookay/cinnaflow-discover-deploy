-- Create promotion_analytics table to track views, clicks, and engagement
CREATE TABLE public.promotion_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promotion_id UUID NOT NULL,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('artist', 'creator')),
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'play', 'share')),
  user_id UUID,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_promotion_analytics_promotion ON public.promotion_analytics(promotion_id, promotion_type);
CREATE INDEX idx_promotion_analytics_created ON public.promotion_analytics(created_at);

-- Enable RLS
ALTER TABLE public.promotion_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert analytics events (public tracking)
CREATE POLICY "Anyone can insert analytics"
ON public.promotion_analytics
FOR INSERT
WITH CHECK (true);

-- Artists/Creators can only view their own promotion analytics
CREATE POLICY "Users can view their own analytics"
ON public.promotion_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM artist_promotions ap 
    WHERE ap.id = promotion_analytics.promotion_id 
    AND ap.submitter_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND promotion_analytics.promotion_type = 'artist'
  )
  OR
  EXISTS (
    SELECT 1 FROM creator_promotions cp 
    WHERE cp.id = promotion_analytics.promotion_id 
    AND cp.submitter_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND promotion_analytics.promotion_type = 'creator'
  )
  OR
  public.has_role(auth.uid(), 'admin')
);

-- Add music_file_url and audio_url columns to artist_promotions for file uploads
ALTER TABLE public.artist_promotions 
ADD COLUMN IF NOT EXISTS music_file_url TEXT,
ADD COLUMN IF NOT EXISTS audio_preview_url TEXT;

-- Add storage policies for media bucket if not exists
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to media bucket
CREATE POLICY "Public read access for media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');