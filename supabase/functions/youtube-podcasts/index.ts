import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface YouTubeSearchResult {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
  description: string;
  duration?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'YouTube API key not configured',
          instructions: 'Add YOUTUBE_API_KEY to your backend secrets'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, query, videoId, channelId, maxResults = 10 } = await req.json();

    let url: string;
    let data: any;

    switch (action) {
      case 'search_podcasts': {
        // Search for podcasts/long-form content
        url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=long&q=${encodeURIComponent(query + ' podcast')}&maxResults=${maxResults}&key=${apiKey}`;
        
        const response = await fetch(url);
        data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        const results: YouTubeSearchResult[] = data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
          publishedAt: item.snippet.publishedAt,
          description: item.snippet.description,
        }));

        return new Response(
          JSON.stringify({ results }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_popular_podcasts': {
        // Get popular podcast channels' latest videos
        const podcastChannels = [
          'UCwgKmJM4ZJQRJ-U5NjvR2dg', // Joe Rogan
          'UCJHa3iqJZU6Lx8-0nAQz8Sg', // The Daily
          'UCHdMK5Ef2El8KbD3L_WgANg', // TED Talks
          'UC295-Dw_tDNtZXFeAPAQKEw', // Lex Fridman
          'UCe0TLA0EsQbE-MjuHXevj2A', // H3 Podcast
        ];

        const allVideos: YouTubeSearchResult[] = [];
        
        for (const channelId of podcastChannels.slice(0, 3)) { // Limit to save quota
          try {
            url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=3&key=${apiKey}`;
            const response = await fetch(url);
            const channelData = await response.json();
            
            if (channelData.items) {
              allVideos.push(...channelData.items.map((item: any) => ({
                id: item.id.videoId,
                title: item.snippet.title,
                channelTitle: item.snippet.channelTitle,
                thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
                publishedAt: item.snippet.publishedAt,
                description: item.snippet.description,
              })));
            }
          } catch (err) {
            console.error(`Error fetching channel ${channelId}:`, err);
          }
        }

        return new Response(
          JSON.stringify({ results: allVideos }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_video_details': {
        if (!videoId) {
          throw new Error('Video ID required');
        }

        url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`;
        
        const response = await fetch(url);
        data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        if (!data.items || data.items.length === 0) {
          throw new Error('Video not found');
        }

        const video = data.items[0];
        
        return new Response(
          JSON.stringify({
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            channelTitle: video.snippet.channelTitle,
            thumbnail: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.high?.url,
            publishedAt: video.snippet.publishedAt,
            duration: video.contentDetails.duration,
            viewCount: video.statistics.viewCount,
            likeCount: video.statistics.likeCount,
            embedUrl: `https://www.youtube.com/embed/${video.id}`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_channel_videos': {
        if (!channelId) {
          throw new Error('Channel ID required');
        }

        url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${maxResults}&key=${apiKey}`;
        
        const response = await fetch(url);
        data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        const results: YouTubeSearchResult[] = data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
          publishedAt: item.snippet.publishedAt,
          description: item.snippet.description,
        }));

        return new Response(
          JSON.stringify({ results }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('YouTube API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
