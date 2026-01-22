-- Add episodes JSONB column to store multiple episode links for TV shows
-- Format: [{ season: 1, episode: 1, title: "Winter is Coming", url: "https://..." }, ...]
ALTER TABLE public.content_items 
ADD COLUMN episodes JSONB DEFAULT '[]'::jsonb;

-- Add index for faster queries on episodes
CREATE INDEX idx_content_items_episodes ON public.content_items USING GIN (episodes);

-- Comment for documentation
COMMENT ON COLUMN public.content_items.episodes IS 'Stores episode data for TV shows: [{season: number, episode: number, title: string, url: string}]';