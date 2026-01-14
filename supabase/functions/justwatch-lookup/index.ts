import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// JustWatch GraphQL API endpoint
const JUSTWATCH_API = 'https://apis.justwatch.com/graphql';

// Free streaming providers we care about
const FREE_PROVIDERS = [
  { id: 73, name: 'Tubi', slug: 'tubi' },
  { id: 300, name: 'Pluto TV', slug: 'pluto' },
  { id: 386, name: 'Peacock', slug: 'peacock' },
  { id: 457, name: 'Plex', slug: 'plex' },
  { id: 207, name: 'Roku Channel', slug: 'roku' },
  { id: 387, name: 'Freevee', slug: 'freevee' },
  { id: 328, name: 'Crackle', slug: 'crackle' },
];

const FREE_PROVIDER_IDS = FREE_PROVIDERS.map(p => p.id);

interface StreamingOffer {
  provider: string;
  providerId: number;
  url: string;
  monetizationType: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, year, type, tmdb_id } = await req.json();

    if (!title) {
      throw new Error('Title is required');
    }

    // Search JustWatch for the content
    const searchQuery = `
      query SearchTitles($searchTitlesInput: SearchTitlesInput!, $country: Country!, $language: Language!) {
        searchTitles(input: $searchTitlesInput, country: $country, language: $language) {
          edges {
            node {
              id
              objectId
              objectType
              content {
                title
                originalReleaseYear
                externalIds {
                  tmdbId
                }
              }
              offers(country: $country, platform: WEB) {
                monetizationType
                presentationType
                standardWebURL
                package {
                  id
                  packageId
                  clearName
                  technicalName
                }
              }
            }
          }
        }
      }
    `;

    const searchResponse = await fetch(JUSTWATCH_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        variables: {
          searchTitlesInput: {
            searchQuery: title,
            objectTypes: type === 'tv' ? ['SHOW'] : ['MOVIE'],
            first: 10,
          },
          country: 'US',
          language: 'en',
        },
      }),
    });

    const searchData = await searchResponse.json();
    
    if (searchData.errors) {
      console.error('JustWatch GraphQL errors:', searchData.errors);
      throw new Error('JustWatch API error');
    }

    const edges = searchData?.data?.searchTitles?.edges || [];
    
    // Find the best match based on title, year, and optionally TMDB ID
    let bestMatch = null;
    
    for (const edge of edges) {
      const node = edge.node;
      const content = node.content;
      
      // Check if TMDB ID matches (most reliable)
      if (tmdb_id && content?.externalIds?.tmdbId === tmdb_id) {
        bestMatch = node;
        break;
      }
      
      // Check title and year match
      const titleMatch = content?.title?.toLowerCase() === title.toLowerCase();
      const yearMatch = !year || content?.originalReleaseYear === year;
      
      if (titleMatch && yearMatch) {
        bestMatch = node;
        break;
      }
    }
    
    // If no exact match, take the first result
    if (!bestMatch && edges.length > 0) {
      bestMatch = edges[0].node;
    }

    if (!bestMatch) {
      return new Response(JSON.stringify({ 
        found: false,
        freeStreaming: [],
        allOffers: [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract offers
    const offers = bestMatch.offers || [];
    
    // Filter to free streaming options
    const freeOffers: StreamingOffer[] = offers
      .filter((offer: any) => {
        const isFreeProvider = FREE_PROVIDER_IDS.includes(offer.package?.packageId);
        const isFree = offer.monetizationType === 'FREE' || offer.monetizationType === 'ADS';
        return isFreeProvider || isFree;
      })
      .map((offer: any) => ({
        provider: offer.package?.clearName || 'Unknown',
        providerId: offer.package?.packageId,
        url: offer.standardWebURL,
        monetizationType: offer.monetizationType,
      }))
      // Remove duplicates by provider
      .filter((offer: StreamingOffer, index: number, self: StreamingOffer[]) => 
        index === self.findIndex(o => o.providerId === offer.providerId)
      );

    // Get all offers for reference
    const allOffers: StreamingOffer[] = offers
      .slice(0, 20)
      .map((offer: any) => ({
        provider: offer.package?.clearName || 'Unknown',
        providerId: offer.package?.packageId,
        url: offer.standardWebURL,
        monetizationType: offer.monetizationType,
      }))
      .filter((offer: StreamingOffer, index: number, self: StreamingOffer[]) => 
        index === self.findIndex(o => o.providerId === offer.providerId && o.monetizationType === offer.monetizationType)
      );

    return new Response(JSON.stringify({
      found: true,
      title: bestMatch.content?.title,
      year: bestMatch.content?.originalReleaseYear,
      freeStreaming: freeOffers,
      allOffers: allOffers,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('JustWatch Lookup Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, found: false, freeStreaming: [] }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
