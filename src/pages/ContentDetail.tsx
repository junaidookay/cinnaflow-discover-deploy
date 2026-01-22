import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VideoPlayer, { isDirectVideoUrl } from '@/components/VideoPlayer';
import EpisodeSelector, { Episode } from '@/components/EpisodeSelector';
import { Play, ArrowLeft, Film, Star, Calendar, Clock, Tv } from 'lucide-react';
import { Database, Json } from '@/integrations/supabase/types';

type ContentItem = Database['public']['Tables']['content_items']['Row'] & {
  episodes?: Json;
};

interface TMDBDetails {
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres?: { id: number; name: string }[];
}

const ContentDetail = () => {
  const { id } = useParams();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [related, setRelated] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tmdbDetails, setTmdbDetails] = useState<TMDBDetails | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  // Parse episodes from JSON
  const parseEpisodes = (episodesJson: Json | undefined): Episode[] => {
    if (!episodesJson || !Array.isArray(episodesJson)) return [];
    return episodesJson
      .filter((ep): boolean => 
        typeof ep === 'object' && 
        ep !== null &&
        'season' in ep && 
        'episode' in ep && 
        'url' in ep
      )
      .map(ep => ({
        season: (ep as Record<string, unknown>).season as number,
        episode: (ep as Record<string, unknown>).episode as number,
        title: (ep as Record<string, unknown>).title as string | undefined,
        url: (ep as Record<string, unknown>).url as string,
      }));
  };

  // Extract TMDB ID from tags
  const getTmdbId = (tags: string[] | null): string | null => {
    if (!tags) return null;
    const tmdbTag = tags.find(t => t.startsWith('tmdb:'));
    return tmdbTag ? tmdbTag.replace('tmdb:', '') : null;
  };

  // Filter out internal tags for display
  const getDisplayTags = (tags: string[] | null): string[] => {
    if (!tags) return [];
    return tags.filter(tag => 
      !tag.startsWith('tmdb:') && 
      tag !== 'auto-imported' && 
      tag !== 'trending' && 
      tag !== 'popular'
    );
  };

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) return;
      
      const { data } = await supabase
        .from('content_items')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      setContent(data);
      
      if (data) {
        // Parse episodes and set first episode as default for TV shows
        const episodes = parseEpisodes((data as ContentItem).episodes);
        if (episodes.length > 0) {
          setCurrentEpisode(episodes[0]);
        } else {
          setCurrentEpisode(null);
        }

        // Fetch TMDB details if we have a TMDB ID
        const tmdbId = getTmdbId(data.tags);
        if (tmdbId) {
          try {
            const mediaType = data.content_type === 'tv' ? 'tv' : 'movie';
            const { data: tmdbData } = await supabase.functions.invoke('tmdb-search', {
              body: { action: 'details', id: tmdbId, type: mediaType }
            });
            if (tmdbData) {
              setTmdbDetails(tmdbData);
            }
          } catch (err) {
            console.log('Could not fetch TMDB details');
          }
        }
        
        const { data: relatedData } = await supabase
          .from('content_items')
          .select('*')
          .eq('content_type', data.content_type)
          .eq('is_published', true)
          .neq('id', id)
          .limit(6);
        
        setRelated(relatedData || []);
      }
      
      setIsLoading(false);
    };

    fetchContent();
  }, [id]);

  // Get current video URL (either from episode or main video_embed_url)
  const getCurrentVideoUrl = (): string | null => {
    if (currentEpisode?.url) {
      return currentEpisode.url;
    }
    return content?.video_embed_url || null;
  };

  // Get parsed episodes for the selector
  const episodes = content ? parseEpisodes(content.episodes) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Content Not Found</h1>
          <Link to="/" className="text-primary hover:underline">Back to Home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="container mx-auto px-4 md:px-8 py-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Poster */}
            <div className="lg:col-span-1">
              <div className="aspect-[2/3] bg-card rounded-xl overflow-hidden">
                {content.poster_url || content.thumbnail_url ? (
                  <img
                    src={content.poster_url || content.thumbnail_url || ''}
                    alt={content.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-4">
                {content.badges?.map((badge) => (
                  <span key={badge} className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full">
                    {badge}
                  </span>
                ))}
                <span className="px-3 py-1 bg-secondary text-muted-foreground text-sm rounded-full capitalize">
                  {content.content_type}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-display text-foreground mb-4">{content.title}</h1>
              
              {content.description && (
                <p className="text-muted-foreground mb-6 line-clamp-4">{content.description}</p>
              )}

              {/* TMDB Metrics */}
              {tmdbDetails && (
                <div className="flex flex-wrap gap-4 mb-6">
                  {tmdbDetails.vote_average && tmdbDetails.vote_average > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                      <Star className="w-4 h-4 text-primary fill-primary" />
                      <span className="font-semibold text-foreground">
                        {tmdbDetails.vote_average.toFixed(1)}
                      </span>
                      {tmdbDetails.vote_count && (
                        <span className="text-sm text-muted-foreground">
                          ({tmdbDetails.vote_count.toLocaleString()} votes)
                        </span>
                      )}
                    </div>
                  )}
                  {(tmdbDetails.release_date || tmdbDetails.first_air_date) && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">
                        {new Date(tmdbDetails.release_date || tmdbDetails.first_air_date || '').getFullYear()}
                      </span>
                    </div>
                  )}
                  {tmdbDetails.runtime && tmdbDetails.runtime > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">
                        {Math.floor(tmdbDetails.runtime / 60)}h {tmdbDetails.runtime % 60}m
                      </span>
                    </div>
                  )}
                  {tmdbDetails.number_of_seasons && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                      <Tv className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">
                        {tmdbDetails.number_of_seasons} Season{tmdbDetails.number_of_seasons > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {tmdbDetails.number_of_episodes && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                      <Film className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">
                        {tmdbDetails.number_of_episodes} Episodes
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Genre Tags */}
              {tmdbDetails?.genres && tmdbDetails.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {tmdbDetails.genres.map((genre) => (
                    <span key={genre.id} className="px-3 py-1 bg-secondary text-foreground text-sm rounded-lg">
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Display Tags (filtered) */}
              {(() => {
                const displayTags = getDisplayTags(content.tags);
                return displayTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {displayTags.map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-secondary text-foreground text-sm rounded-lg">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Watch Now Button */}
              {getCurrentVideoUrl() && (
                <button 
                  onClick={() => playerRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Watch Now
                </button>
              )}

              {/* Video Player Section */}
              {getCurrentVideoUrl() ? (
                <div ref={playerRef} className="mt-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Film className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {isDirectVideoUrl(getCurrentVideoUrl()!) ? 'Direct Stream' : 'Embedded Player'}
                      {currentEpisode && ` • S${currentEpisode.season}E${currentEpisode.episode}`}
                    </span>
                  </div>
                  <VideoPlayer 
                    key={getCurrentVideoUrl()}
                    src={getCurrentVideoUrl()!} 
                    poster={content.thumbnail_url || content.poster_url || undefined}
                    title={currentEpisode ? `${content.title} - S${currentEpisode.season}E${currentEpisode.episode}` : content.title}
                  />

                  {/* Episode Selector for TV Shows */}
                  {content.content_type === 'tv' && episodes.length > 0 && (
                    <EpisodeSelector
                      episodes={episodes}
                      currentEpisode={currentEpisode}
                      onEpisodeSelect={(ep) => {
                        setCurrentEpisode(ep);
                        playerRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="mt-6"
                    />
                  )}
                </div>
              ) : (
                <div ref={playerRef} className="mt-8">
                  <div className="aspect-video bg-card rounded-xl flex flex-col items-center justify-center text-center p-6">
                    <Film className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No streaming source available yet</p>
                    <p className="text-sm text-muted-foreground">
                      This content is being processed. Check back soon!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Content */}
          {related.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-semibold text-foreground mb-6">Related Content</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {related.map((item) => (
                  <Link key={item.id} to={`/content/${item.id}`} className="group">
                    <div className="aspect-video bg-card rounded-lg overflow-hidden mb-2">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full bg-secondary" />
                      )}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{item.title}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContentDetail;
