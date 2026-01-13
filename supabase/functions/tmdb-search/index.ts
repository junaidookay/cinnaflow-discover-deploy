import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured');
    }

    const { action, query, id, type } = await req.json();

    let url: string;
    
    switch (action) {
      case 'search':
        // Search for movies and TV shows
        url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`;
        break;
      
      case 'search_movies':
        url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
        break;
      
      case 'search_tv':
        url = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
        break;
      
      case 'details':
        // Get full details for a specific movie or TV show
        url = `${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits`;
        break;
      
      case 'trending':
        url = `${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}`;
        break;
      
      case 'popular_movies':
        url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`;
        break;
      
      case 'popular_tv':
        url = `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}`;
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const response = await fetch(url);
    const data = await response.json();

    // Transform results to include full image URLs
    if (data.results) {
      data.results = data.results.map((item: any) => ({
        ...item,
        poster_url: item.poster_path ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}` : null,
        backdrop_url: item.backdrop_path ? `${TMDB_IMAGE_BASE}/original${item.backdrop_path}` : null,
        thumbnail_url: item.poster_path ? `${TMDB_IMAGE_BASE}/w300${item.poster_path}` : null,
      }));
    } else if (data.poster_path) {
      // Single item details
      data.poster_url = `${TMDB_IMAGE_BASE}/w500${data.poster_path}`;
      data.backdrop_url = data.backdrop_path ? `${TMDB_IMAGE_BASE}/original${data.backdrop_path}` : null;
      data.thumbnail_url = `${TMDB_IMAGE_BASE}/w300${data.poster_path}`;
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('TMDB API Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});