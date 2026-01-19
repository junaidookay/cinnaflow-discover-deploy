import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const REAL_DEBRID_API = 'https://api.real-debrid.com/rest/1.0';

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  media_type?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
  const REAL_DEBRID_API_KEY = Deno.env.get('REAL_DEBRID_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!TMDB_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'TMDB_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { action, limit = 10, category = 'trending' } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'fetch_trending': {
        // Get trending movies from TMDB
        const tmdbUrl = category === 'popular' 
          ? `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`
          : `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`;
        
        const response = await fetch(tmdbUrl);
        const data = await response.json();
        
        if (!data.results) {
          throw new Error('Failed to fetch from TMDB');
        }

        const movies: TMDBMovie[] = data.results.slice(0, limit);
        const importedMovies = [];
        const skippedMovies = [];

        for (const movie of movies) {
          // Check if movie already exists
          const { data: existing } = await supabase
            .from('content_items')
            .select('id')
            .contains('tags', [`tmdb:${movie.id}`])
            .single();

          if (existing) {
            skippedMovies.push({ title: movie.title, reason: 'Already exists' });
            continue;
          }

          // Import to database as draft
          const { error: insertError } = await supabase
            .from('content_items')
            .insert({
              title: movie.title,
              description: movie.overview?.slice(0, 500) || '',
              content_type: 'movie',
              poster_url: movie.poster_path ? `${TMDB_IMAGE_BASE}/w500${movie.poster_path}` : null,
              thumbnail_url: movie.poster_path ? `${TMDB_IMAGE_BASE}/w300${movie.poster_path}` : null,
              tags: ['tmdb:' + movie.id, 'auto-imported', category],
              is_published: false,
              section_assignments: [],
            });

          if (insertError) {
            console.error('Insert error:', insertError);
            skippedMovies.push({ title: movie.title, reason: insertError.message });
          } else {
            importedMovies.push({ title: movie.title, tmdb_id: movie.id });
          }
        }

        return new Response(JSON.stringify({
          success: true,
          imported: importedMovies.length,
          skipped: skippedMovies.length,
          importedMovies,
          skippedMovies,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'bulk_resolve_debrid': {
        // This action processes content items that need Real-Debrid resolution
        if (!REAL_DEBRID_API_KEY) {
          return new Response(
            JSON.stringify({ error: 'REAL_DEBRID_API_KEY not configured' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get content items without video URLs
        const { data: contentItems, error } = await supabase
          .from('content_items')
          .select('*')
          .is('video_embed_url', null)
          .eq('is_published', false)
          .contains('tags', ['auto-imported'])
          .limit(limit);

        if (error) throw error;

        const results = {
          processed: 0,
          needsMagnet: [] as string[],
        };

        // For now, just mark which items need magnets
        // Real implementation would integrate with torrent search APIs
        for (const item of contentItems || []) {
          results.needsMagnet.push(item.title);
        }

        results.processed = contentItems?.length || 0;

        return new Response(JSON.stringify({
          success: true,
          message: `Found ${results.processed} items needing video sources`,
          items: results.needsMagnet,
          note: 'Use the content management to add magnet links for these items',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'resolve_single': {
        // Resolve a single magnet link for a content item
        const { contentId, magnet } = await req.json();
        
        if (!contentId || !magnet) {
          throw new Error('Content ID and magnet link required');
        }

        if (!REAL_DEBRID_API_KEY) {
          throw new Error('Real-Debrid not configured');
        }

        const headers = {
          'Authorization': `Bearer ${REAL_DEBRID_API_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        };

        // Add magnet to Real-Debrid
        const addResponse = await fetch(`${REAL_DEBRID_API}/torrents/addMagnet`, {
          method: 'POST',
          headers,
          body: `magnet=${encodeURIComponent(magnet)}`,
        });

        if (!addResponse.ok) {
          const error = await addResponse.json();
          throw new Error(error.error || 'Failed to add magnet');
        }

        const addData = await addResponse.json();
        const torrentId = addData.id;

        // Select all files
        await fetch(`${REAL_DEBRID_API}/torrents/selectFiles/${torrentId}`, {
          method: 'POST',
          headers,
          body: 'files=all',
        });

        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check torrent info
        const infoResponse = await fetch(`${REAL_DEBRID_API}/torrents/info/${torrentId}`, {
          headers: { 'Authorization': `Bearer ${REAL_DEBRID_API_KEY}` },
        });

        const torrentInfo = await infoResponse.json();

        if (torrentInfo.status === 'downloaded' && torrentInfo.links?.length > 0) {
          // Get streaming URL
          const unrestrictResponse = await fetch(`${REAL_DEBRID_API}/unrestrict/link`, {
            method: 'POST',
            headers,
            body: `link=${encodeURIComponent(torrentInfo.links[0])}`,
          });

          if (unrestrictResponse.ok) {
            const streamData = await unrestrictResponse.json();
            
            // Update content item with streaming URL
            await supabase
              .from('content_items')
              .update({ 
                video_embed_url: streamData.download,
                is_published: true,
                section_assignments: ['recently_added'],
              })
              .eq('id', contentId);

            return new Response(JSON.stringify({
              success: true,
              status: 'ready',
              streamUrl: streamData.download,
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        return new Response(JSON.stringify({
          success: true,
          status: torrentInfo.status,
          progress: torrentInfo.progress,
          torrent_id: torrentId,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_pending': {
        // Get content items pending resolution
        const { data, error } = await supabase
          .from('content_items')
          .select('id, title, tags, created_at')
          .is('video_embed_url', null)
          .eq('is_published', false)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          count: data?.length || 0,
          items: data || [],
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'stats': {
        // Get automation statistics
        const { count: totalDrafts } = await supabase
          .from('content_items')
          .select('*', { count: 'exact', head: true })
          .eq('is_published', false);

        const { count: autoImported } = await supabase
          .from('content_items')
          .select('*', { count: 'exact', head: true })
          .contains('tags', ['auto-imported']);

        const { count: needsSource } = await supabase
          .from('content_items')
          .select('*', { count: 'exact', head: true })
          .is('video_embed_url', null)
          .eq('is_published', false);

        const { count: published } = await supabase
          .from('content_items')
          .select('*', { count: 'exact', head: true })
          .eq('is_published', true);

        return new Response(JSON.stringify({
          success: true,
          stats: {
            totalDrafts: totalDrafts || 0,
            autoImported: autoImported || 0,
            needsSource: needsSource || 0,
            published: published || 0,
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Content automation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
