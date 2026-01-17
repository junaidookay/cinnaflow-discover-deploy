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

    console.log(`Searching JustWatch for: "${title}" (${year || 'no year'}, type: ${type || 'movie'})`);

    // Updated GraphQL query matching current JustWatch API schema
    const searchQuery = `
      query SearchTitles(
        $searchQuery: String!,
        $country: Country!,
        $language: Language!,
        $first: Int!,
        $filter: TitleFilter
      ) {
        popularTitles(
          country: $country,
          first: $first,
          filter: $filter,
          sortBy: POPULAR,
          sortRandomSeed: 0
        ) {
          edges {
            node {
              id
              objectId
              objectType
              content(country: $country, language: $language) {
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

    // Alternative simpler search using the title search endpoint
    const simpleSearchQuery = `
      query GetSearchTitles($country: Country!, $language: Language!, $first: Int!, $searchQuery: String!) {
        search: popularTitles(
          country: $country
          first: $first
          filter: { searchQuery: $searchQuery }
          sortBy: POPULAR
        ) {
          edges {
            node {
              id
              objectId
              objectType
              content(country: $country, language: $language) {
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

    const objectTypes = type === 'tv' ? ['SHOW'] : ['MOVIE'];

    const searchResponse = await fetch(JUSTWATCH_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        query: simpleSearchQuery,
        variables: {
          searchQuery: title,
          country: 'US',
          language: 'en',
          first: 10,
        },
      }),
    });

    const searchData = await searchResponse.json();
    
    if (searchData.errors) {
      console.error('JustWatch GraphQL errors:', searchData.errors);
      
      // Try alternative REST API approach
      console.log('Trying alternative REST API...');
      const restResult = await tryRestApi(title, type, year, tmdb_id);
      if (restResult) {
        return new Response(JSON.stringify(restResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error('JustWatch API error');
    }

    const edges = searchData?.data?.search?.edges || searchData?.data?.popularTitles?.edges || [];
    
    console.log(`Found ${edges.length} results from JustWatch`);
    
    // Find the best match based on title, year, and optionally TMDB ID
    let bestMatch = null;
    
    for (const edge of edges) {
      const node = edge.node;
      const content = node.content;
      
      // Filter by type if specified
      if (type) {
        const expectedType = type === 'tv' ? 'SHOW' : 'MOVIE';
        if (node.objectType !== expectedType) continue;
      }
      
      // Check if TMDB ID matches (most reliable)
      if (tmdb_id && content?.externalIds?.tmdbId === String(tmdb_id)) {
        bestMatch = node;
        console.log(`Found exact TMDB match: ${content?.title}`);
        break;
      }
      
      // Check title and year match
      const titleMatch = content?.title?.toLowerCase().includes(title.toLowerCase()) ||
                         title.toLowerCase().includes(content?.title?.toLowerCase());
      const yearMatch = !year || content?.originalReleaseYear === year || 
                        content?.originalReleaseYear === parseInt(year);
      
      if (titleMatch && yearMatch) {
        bestMatch = node;
        console.log(`Found title/year match: ${content?.title} (${content?.originalReleaseYear})`);
        break;
      }
    }
    
    // If no exact match, take the first result of correct type
    if (!bestMatch && edges.length > 0) {
      for (const edge of edges) {
        if (type) {
          const expectedType = type === 'tv' ? 'SHOW' : 'MOVIE';
          if (edge.node.objectType === expectedType) {
            bestMatch = edge.node;
            break;
          }
        } else {
          bestMatch = edges[0].node;
          break;
        }
      }
    }

    if (!bestMatch) {
      console.log('No match found on JustWatch');
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
    console.log(`Found ${offers.length} streaming offers`);
    
    // Filter to free streaming options
    const freeOffers: StreamingOffer[] = offers
      .filter((offer: any) => {
        const isFreeProvider = FREE_PROVIDER_IDS.includes(offer.package?.packageId);
        const isFree = offer.monetizationType === 'FREE' || offer.monetizationType === 'ADS' || offer.monetizationType === 'FLATRATE_AND_ADS';
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

    console.log(`Found ${freeOffers.length} free streaming options`);

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

// Alternative REST API fallback
async function tryRestApi(title: string, type: string | undefined, year: number | undefined, tmdb_id: string | undefined): Promise<any | null> {
  try {
    // JustWatch also has a REST search endpoint
    const encodedTitle = encodeURIComponent(title);
    const searchUrl = `https://apis.justwatch.com/content/titles/en_US/popular?body={"page_size":10,"page":1,"query":"${encodedTitle}","content_types":["${type === 'tv' ? 'show' : 'movie'}"]}`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.log('REST API also failed');
      return null;
    }
    
    const data = await response.json();
    const items = data?.items || [];
    
    if (items.length === 0) {
      return { found: false, freeStreaming: [], allOffers: [] };
    }
    
    // Find best match
    let bestItem = items[0];
    for (const item of items) {
      if (year && item.original_release_year === year) {
        bestItem = item;
        break;
      }
    }
    
    // Get offers for this item
    const offersUrl = `https://apis.justwatch.com/content/titles/${type === 'tv' ? 'show' : 'movie'}/${bestItem.id}/locale/en_US`;
    const offersResponse = await fetch(offersUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!offersResponse.ok) {
      return { found: true, title: bestItem.title, year: bestItem.original_release_year, freeStreaming: [], allOffers: [] };
    }
    
    const offersData = await offersResponse.json();
    const offers = offersData?.offers || [];
    
    const freeOffers = offers
      .filter((offer: any) => {
        const isFreeProvider = FREE_PROVIDER_IDS.includes(offer.provider_id);
        const isFree = offer.monetization_type === 'free' || offer.monetization_type === 'ads';
        return isFreeProvider || isFree;
      })
      .map((offer: any) => {
        const provider = FREE_PROVIDERS.find(p => p.id === offer.provider_id);
        return {
          provider: provider?.name || `Provider ${offer.provider_id}`,
          providerId: offer.provider_id,
          url: offer.urls?.standard_web || '',
          monetizationType: offer.monetization_type?.toUpperCase() || 'FREE',
        };
      })
      .filter((offer: StreamingOffer, index: number, self: StreamingOffer[]) => 
        index === self.findIndex(o => o.providerId === offer.providerId)
      );
    
    return {
      found: true,
      title: bestItem.title,
      year: bestItem.original_release_year,
      freeStreaming: freeOffers,
      allOffers: offers.slice(0, 20).map((offer: any) => ({
        provider: `Provider ${offer.provider_id}`,
        providerId: offer.provider_id,
        url: offer.urls?.standard_web || '',
        monetizationType: offer.monetization_type?.toUpperCase() || 'UNKNOWN',
      })),
    };
  } catch (err) {
    console.error('REST API fallback error:', err);
    return null;
  }
}
