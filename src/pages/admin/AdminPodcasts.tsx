import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Loader2, ExternalLink, Play, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PodcastResult {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
  description: string;
}

const AdminPodcasts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PodcastResult[]>([]);
  const [selectedPodcasts, setSelectedPodcasts] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);

  const searchPodcasts = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('youtube-podcasts', {
        body: { 
          action: 'search_podcasts', 
          query: searchQuery,
          maxResults: 12
        },
      });

      if (error) throw error;

      if (data.error) {
        if (data.instructions) {
          setApiConfigured(false);
          toast.error(data.error);
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setApiConfigured(true);
      setResults(data.results || []);
      
      if (data.results?.length === 0) {
        toast.info('No podcasts found for this query');
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to search podcasts');
    } finally {
      setIsSearching(false);
    }
  };

  const loadPopularPodcasts = async () => {
    setIsSearching(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('youtube-podcasts', {
        body: { action: 'get_popular_podcasts' },
      });

      if (error) throw error;

      if (data.error) {
        if (data.instructions) {
          setApiConfigured(false);
          toast.error(data.error);
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setApiConfigured(true);
      setResults(data.results || []);
    } catch (err) {
      console.error('Load error:', err);
      toast.error('Failed to load popular podcasts');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedPodcasts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPodcasts(newSelected);
  };

  const importSelected = async () => {
    if (selectedPodcasts.size === 0) {
      toast.error('Please select at least one podcast');
      return;
    }

    setIsImporting(true);
    let successCount = 0;

    try {
      for (const podcastId of selectedPodcasts) {
        const podcast = results.find(r => r.id === podcastId);
        if (!podcast) continue;

        // Import as content item
        const { error } = await supabase.from('content_items').insert({
          title: podcast.title,
          description: podcast.description.slice(0, 500),
          content_type: 'clip', // Using clip type for podcasts
          thumbnail_url: podcast.thumbnail,
          video_embed_url: `https://www.youtube.com/embed/${podcast.id}`,
          tags: ['podcast', 'youtube', podcast.channelTitle.toLowerCase().replace(/\s+/g, '-')],
          is_published: false, // Draft by default
          section_assignments: [],
        });

        if (error) {
          console.error('Import error:', error);
        } else {
          successCount++;
        }
      }

      toast.success(`Imported ${successCount} podcast(s) as drafts`);
      setSelectedPodcasts(new Set());
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Failed to import podcasts');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AdminLayout title="YouTube Podcasts">
      <div className="space-y-6">
        {/* API Status Banner */}
        {apiConfigured === false && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-400">YouTube API Not Configured</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add <code className="bg-secondary px-1 rounded">YOUTUBE_API_KEY</code> to your backend secrets to enable podcast search.
              </p>
              <ol className="text-sm text-muted-foreground mt-2 list-decimal list-inside space-y-1">
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" className="text-primary hover:underline">Google Cloud Console</a></li>
                <li>Enable the YouTube Data API v3</li>
                <li>Create an API key and add it to your secrets</li>
              </ol>
            </div>
          </div>
        )}

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Podcasts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Search for podcasts (e.g., 'tech news', 'interviews', 'comedy')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchPodcasts()}
                className="flex-1"
              />
              <Button onClick={searchPodcasts} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </Button>
              <Button variant="outline" onClick={loadPopularPodcasts} disabled={isSearching}>
                Popular
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Results ({results.length})
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedPodcasts.size} selected
                </span>
                <Button 
                  onClick={importSelected} 
                  disabled={selectedPodcasts.size === 0 || isImporting}
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Import Selected
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((podcast) => (
                <Card 
                  key={podcast.id}
                  className={`overflow-hidden cursor-pointer transition-all ${
                    selectedPodcasts.has(podcast.id) 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-secondary/50'
                  }`}
                  onClick={() => toggleSelection(podcast.id)}
                >
                  <div className="relative aspect-video">
                    <img
                      src={podcast.thumbnail}
                      alt={podcast.title}
                      className="w-full h-full object-cover"
                    />
                    {selectedPodcasts.has(podcast.id) && (
                      <div className="absolute top-2 right-2 p-1 bg-primary rounded-full">
                        <CheckCircle className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">
                      {podcast.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {podcast.channelTitle}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {podcast.description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(podcast.publishedAt).toLocaleDateString()}
                      </span>
                      <a
                        href={`https://youtube.com/watch?v=${podcast.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:underline text-xs flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isSearching && results.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Search for podcasts to import them to CinnaFlow</p>
            <p className="text-sm mt-1">Or click "Popular" to see trending podcast episodes</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPodcasts;
