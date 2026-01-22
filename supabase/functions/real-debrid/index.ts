import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REAL_DEBRID_API = 'https://api.real-debrid.com/rest/1.0';

interface UnrestrictedLink {
  id: string;
  filename: string;
  mimeType: string;
  filesize: number;
  link: string;
  host: string;
  chunks: number;
  download: string;
  streamable: number;
}

interface TorrentInfo {
  id: string;
  filename: string;
  hash: string;
  status: string;
  progress: number;
  files: Array<{
    id: number;
    path: string;
    bytes: number;
    selected: number;
  }>;
  links: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('REAL_DEBRID_API_KEY');
  
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Real-Debrid API key not configured', configured: false }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const { action, magnet, link, torrent_id } = await req.json();

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    switch (action) {
      case 'check_status': {
        // Check if Real-Debrid is properly configured
        const response = await fetch(`${REAL_DEBRID_API}/user`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        
        if (!response.ok) {
          throw new Error('Invalid API key');
        }
        
        const userData = await response.json();
        return new Response(JSON.stringify({
          configured: true,
          premium: userData.premium > 0,
          expiration: userData.expiration,
          username: userData.username,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'add_magnet': {
        if (!magnet) {
          throw new Error('Magnet link is required');
        }

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
        
        // Select all files
        await fetch(`${REAL_DEBRID_API}/torrents/selectFiles/${addData.id}`, {
          method: 'POST',
          headers,
          body: 'files=all',
        });

        // Wait a moment for processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check status
        const infoResponse = await fetch(`${REAL_DEBRID_API}/torrents/info/${addData.id}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });

        const torrentInfo: TorrentInfo = await infoResponse.json();

        // If downloaded, get the streaming URL
        if (torrentInfo.status === 'downloaded' && torrentInfo.links?.length > 0) {
          // Find the largest video file
          const videoLink = torrentInfo.links[0];
          
          const unrestrictResponse = await fetch(`${REAL_DEBRID_API}/unrestrict/link`, {
            method: 'POST',
            headers,
            body: `link=${encodeURIComponent(videoLink)}`,
          });

          if (unrestrictResponse.ok) {
            const unrestrictData: UnrestrictedLink = await unrestrictResponse.json();
            return new Response(JSON.stringify({
              success: true,
              status: 'ready',
              streamUrl: unrestrictData.download,
              filename: unrestrictData.filename,
              id: addData.id,
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        return new Response(JSON.stringify({
          success: true,
          status: torrentInfo.status,
          progress: torrentInfo.progress,
          id: addData.id,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'select_files': {
        const { torrentId } = await req.json();
        if (!torrentId) {
          throw new Error('Torrent ID is required');
        }

        // Select all files
        await fetch(`${REAL_DEBRID_API}/torrents/selectFiles/${torrentId}`, {
          method: 'POST',
          headers,
          body: 'files=all',
        });

        // Wait and check status
        await new Promise(resolve => setTimeout(resolve, 3000));

        const infoResponse = await fetch(`${REAL_DEBRID_API}/torrents/info/${torrentId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });

        const torrentInfo: TorrentInfo = await infoResponse.json();

        if (torrentInfo.status === 'downloaded' && torrentInfo.links?.length > 0) {
          const videoLink = torrentInfo.links[0];
          
          const unrestrictResponse = await fetch(`${REAL_DEBRID_API}/unrestrict/link`, {
            method: 'POST',
            headers,
            body: `link=${encodeURIComponent(videoLink)}`,
          });

          if (unrestrictResponse.ok) {
            const unrestrictData: UnrestrictedLink = await unrestrictResponse.json();
            return new Response(JSON.stringify({
              success: true,
              status: 'ready',
              streamUrl: unrestrictData.download,
              filename: unrestrictData.filename,
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        return new Response(JSON.stringify({
          success: true,
          status: torrentInfo.status,
          progress: torrentInfo.progress,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check_torrent': {
        if (!torrent_id) {
          throw new Error('Torrent ID is required');
        }

        const infoResponse = await fetch(`${REAL_DEBRID_API}/torrents/info/${torrent_id}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });

        if (!infoResponse.ok) {
          throw new Error('Failed to get torrent info');
        }

        const torrentInfo: TorrentInfo = await infoResponse.json();

        return new Response(JSON.stringify({
          id: torrentInfo.id,
          filename: torrentInfo.filename,
          status: torrentInfo.status,
          progress: torrentInfo.progress,
          links: torrentInfo.links || [],
          files: torrentInfo.files?.map(f => ({
            id: f.id,
            path: f.path,
            size: f.bytes,
            selected: f.selected === 1,
          })),
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'unrestrict': {
        if (!link) {
          throw new Error('Link is required');
        }

        // Unrestrict the link to get direct download URL
        const unrestrictResponse = await fetch(`${REAL_DEBRID_API}/unrestrict/link`, {
          method: 'POST',
          headers,
          body: `link=${encodeURIComponent(link)}`,
        });

        if (!unrestrictResponse.ok) {
          const error = await unrestrictResponse.json();
          throw new Error(error.error || 'Failed to unrestrict link');
        }

        const unrestrictData: UnrestrictedLink = await unrestrictResponse.json();

        return new Response(JSON.stringify({
          success: true,
          filename: unrestrictData.filename,
          filesize: unrestrictData.filesize,
          mimeType: unrestrictData.mimeType,
          download: unrestrictData.download,
          streamable: unrestrictData.streamable === 1,
          host: unrestrictData.host,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'resolve_magnet': {
        // Full flow: add magnet, wait for processing, get streaming links
        if (!magnet) {
          throw new Error('Magnet link is required');
        }

        // Add magnet
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

        // Wait a moment and check status
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get torrent info
        const infoResponse = await fetch(`${REAL_DEBRID_API}/torrents/info/${torrentId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });

        const torrentInfo: TorrentInfo = await infoResponse.json();

        // If already cached, unrestrict ALL the links (for TV shows with episodes)
        if (torrentInfo.status === 'downloaded' && torrentInfo.links?.length > 0) {
          const streamLinks = [];
          
          // Process all links, not just first 5
          for (const rdLink of torrentInfo.links) {
            try {
              const unrestrictResponse = await fetch(`${REAL_DEBRID_API}/unrestrict/link`, {
                method: 'POST',
                headers,
                body: `link=${encodeURIComponent(rdLink)}`,
              });
              
              if (unrestrictResponse.ok) {
                const unrestrictData: UnrestrictedLink = await unrestrictResponse.json();
                // Include all video files (streamable or not, as some MKVs might not be flagged)
                const isVideoFile = /\.(mp4|mkv|avi|mov|wmv|m4v|webm)$/i.test(unrestrictData.filename);
                if (isVideoFile) {
                  // Try to extract season/episode from filename
                  const seMatch = unrestrictData.filename.match(/[Ss](\d{1,2})[Ee](\d{1,2})/);
                  
                  streamLinks.push({
                    filename: unrestrictData.filename,
                    download: unrestrictData.download,
                    filesize: unrestrictData.filesize,
                    season: seMatch ? parseInt(seMatch[1]) : null,
                    episode: seMatch ? parseInt(seMatch[2]) : null,
                  });
                }
              }
            } catch (e) {
              console.error('Failed to unrestrict link:', e);
            }
          }

          // Sort by season/episode if available
          streamLinks.sort((a, b) => {
            if (a.season !== null && b.season !== null) {
              if (a.season !== b.season) return a.season - b.season;
              if (a.episode !== null && b.episode !== null) {
                return a.episode - b.episode;
              }
            }
            return 0;
          });

          return new Response(JSON.stringify({
            success: true,
            status: 'ready',
            torrent_id: torrentId,
            streams: streamLinks,
            is_tv_show: streamLinks.some(s => s.season !== null),
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Still processing
        return new Response(JSON.stringify({
          success: true,
          status: torrentInfo.status,
          progress: torrentInfo.progress,
          torrent_id: torrentId,
          streams: [],
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Real-Debrid Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
