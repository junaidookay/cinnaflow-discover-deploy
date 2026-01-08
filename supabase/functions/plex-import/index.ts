import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlexRequest {
  action: "list-libraries" | "preview" | "import";
  serverUrl: string;
  plexToken: string;
  libraryKeys?: string[];
}

async function fetchPlex(serverUrl: string, path: string, plexToken: string) {
  const response = await fetch(`${serverUrl}${path}`, {
    headers: {
      Accept: "application/json",
      "X-Plex-Token": plexToken,
    },
  });

  if (!response.ok) {
    throw new Error(`Plex API error: ${response.status}`);
  }

  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, serverUrl, plexToken, libraryKeys }: PlexRequest = await req.json();

    if (!serverUrl || !plexToken) {
      return new Response(JSON.stringify({ error: "Server URL and Plex token required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list-libraries") {
      const data = await fetchPlex(serverUrl, "/library/sections", plexToken);
      
      const libraries = data.MediaContainer?.Directory?.map((lib: any) => ({
        key: lib.key,
        title: lib.title,
        type: lib.type,
        count: lib.count || 0,
      })) || [];

      return new Response(JSON.stringify({ libraries }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "preview" || action === "import") {
      if (!libraryKeys || libraryKeys.length === 0) {
        return new Response(JSON.stringify({ error: "Library keys required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const allItems: any[] = [];

      for (const key of libraryKeys) {
        const data = await fetchPlex(serverUrl, `/library/sections/${key}/all`, plexToken);
        
        const items = data.MediaContainer?.Metadata?.map((item: any) => ({
          ratingKey: item.ratingKey,
          title: item.title,
          type: item.type,
          year: item.year,
          thumb: item.thumb,
          summary: item.summary,
        })) || [];

        allItems.push(...items);
      }

      if (action === "preview") {
        return new Response(JSON.stringify({ items: allItems }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Import action - insert into database
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const contentItems = allItems.map((item) => ({
        title: item.title,
        content_type: item.type === "movie" ? "movie" : item.type === "show" ? "tv" : "clip",
        description: item.summary || null,
        thumbnail_url: item.thumb 
          ? `${serverUrl}/photo/:/transcode?width=400&height=600&url=${encodeURIComponent(item.thumb)}&X-Plex-Token=${plexToken}`
          : null,
        poster_url: item.thumb
          ? `${serverUrl}/photo/:/transcode?width=400&height=600&url=${encodeURIComponent(item.thumb)}&X-Plex-Token=${plexToken}`
          : null,
        is_published: false, // Import as draft
        tags: item.year ? [String(item.year)] : [],
      }));

      const { error: insertError } = await serviceClient
        .from("content_items")
        .insert(contentItems);

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to import content" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ imported: contentItems.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in plex-import:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
