import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Film, 
  Tv, 
  TrendingUp, 
  Plus, 
  Check, 
  Loader2,
  Star,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TMDBResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_url: string | null;
  backdrop_url: string | null;
  thumbnail_url: string | null;
  media_type?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  genre_ids?: number[];
}

const genreMap: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News',
  10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics'
};

const AdminTMDB = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<TMDBResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);
  const [imported, setImported] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState('search');

  const searchTMDB = async (action: string, query?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tmdb-search', {
        body: { action, query }
      });

      if (error) throw error;
      setResults(data.results || []);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error('Failed to search TMDB: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchTMDB('search', searchQuery);
    }
  };

  const importContent = async (item: TMDBResult) => {
    setImporting(item.id);
    try {
      const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
      const contentType = mediaType === 'movie' ? 'movie' : 'tv';
      const title = item.title || item.name || 'Untitled';
      const releaseDate = item.release_date || item.first_air_date;
      
      // Map genre IDs to tags
      const tags = item.genre_ids?.map(id => genreMap[id]).filter(Boolean) || [];

      const { error } = await supabase
        .from('content_items')
        .insert({
          title,
          description: item.overview || null,
          content_type: contentType,
          poster_url: item.poster_url,
          thumbnail_url: item.thumbnail_url,
          tags,
          is_published: false, // Import as draft
          external_watch_links: null,
        });

      if (error) throw error;

      setImported(prev => new Set([...prev, item.id]));
      toast.success(`Imported "${title}" as draft`);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Failed to import: ' + error.message);
    } finally {
      setImporting(null);
    }
  };

  const loadTrending = () => searchTMDB('trending');
  const loadPopularMovies = () => searchTMDB('popular_movies');
  const loadPopularTV = () => searchTMDB('popular_tv');

  return (
    <AdminLayout title="TMDB Import">
      <div className="space-y-6">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search movies and TV shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </Button>
        </form>

        {/* Quick Actions */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="search" className="gap-2">
              <Search className="w-4 h-4" />
              Search Results
            </TabsTrigger>
            <TabsTrigger value="trending" onClick={loadTrending} className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="movies" onClick={loadPopularMovies} className="gap-2">
              <Film className="w-4 h-4" />
              Popular Movies
            </TabsTrigger>
            <TabsTrigger value="tv" onClick={loadPopularTV} className="gap-2">
              <Tv className="w-4 h-4" />
              Popular TV
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {activeTab === 'search' 
                  ? 'Search for movies or TV shows to import'
                  : 'No results found'}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {results.map((item) => (
                  <ContentCard 
                    key={item.id} 
                    item={item}
                    onImport={() => importContent(item)}
                    isImporting={importing === item.id}
                    isImported={imported.has(item.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

interface ContentCardProps {
  item: TMDBResult;
  onImport: () => void;
  isImporting: boolean;
  isImported: boolean;
}

const ContentCard = ({ item, onImport, isImporting, isImported }: ContentCardProps) => {
  const title = item.title || item.name || 'Untitled';
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
  const releaseDate = item.release_date || item.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden group">
      {/* Poster */}
      <div className="aspect-[2/3] bg-secondary relative">
        {item.poster_url ? (
          <img 
            src={item.poster_url} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {mediaType === 'movie' ? (
              <Film className="w-12 h-12 text-muted-foreground" />
            ) : (
              <Tv className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
        )}
        
        {/* Type Badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-2 left-2 text-xs"
        >
          {mediaType === 'movie' ? 'Movie' : 'TV'}
        </Badge>

        {/* Rating */}
        {item.vote_average && item.vote_average > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 px-1.5 py-0.5 rounded text-xs">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            {item.vote_average.toFixed(1)}
          </div>
        )}

        {/* Import Button Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            size="sm"
            onClick={onImport}
            disabled={isImporting || isImported}
            className="gap-2"
          >
            {isImported ? (
              <>
                <Check className="w-4 h-4" />
                Imported
              </>
            ) : isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Import
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-sm truncate" title={title}>
          {title}
        </h3>
        {year && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Calendar className="w-3 h-3" />
            {year}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTMDB;