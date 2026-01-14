import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  Film,
  Tv,
  TrendingUp,
  Plus,
  Check,
  Loader2,
  Star,
  Calendar,
  Link,
  Video,
  CheckSquare,
  Square,
  Sparkles,
  ExternalLink,
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

interface ExternalLink {
  source: string;
  url: string;
}

interface StreamingOffer {
  provider: string;
  providerId: number;
  url: string;
  monetizationType: string;
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

const STREAMING_SOURCES = [
  { id: 'tubi', name: 'Tubi', placeholder: 'https://tubitv.com/movies/...' },
  { id: 'pluto', name: 'Pluto TV', placeholder: 'https://pluto.tv/on-demand/movies/...' },
  { id: 'plex', name: 'Plex', placeholder: 'https://watch.plex.tv/movie/...' },
  { id: 'youtube', name: 'YouTube', placeholder: 'https://youtube.com/watch?v=...' },
  { id: 'other', name: 'Other', placeholder: 'https://...' },
];

const AdminTMDB = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<TMDBResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);
  const [imported, setImported] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState('search');
  
  // Bulk selection state
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkImporting, setBulkImporting] = useState(false);
  
  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importItem, setImportItem] = useState<TMDBResult | null>(null);
  const [videoEmbedUrl, setVideoEmbedUrl] = useState('');
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>([]);
  
  // JustWatch lookup state
  const [lookingUpStreams, setLookingUpStreams] = useState(false);
  const [streamingOffers, setStreamingOffers] = useState<StreamingOffer[]>([]);
  const [allOffers, setAllOffers] = useState<StreamingOffer[]>([]);

  const searchTMDB = async (action: string, query?: string) => {
    setLoading(true);
    setSelectedItems(new Set()); // Clear selection on new search
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

  const toggleSelection = (id: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const unimportedIds = results.filter(r => !imported.has(r.id)).map(r => r.id);
    setSelectedItems(new Set(unimportedIds));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const openImportModal = (item: TMDBResult) => {
    setImportItem(item);
    setVideoEmbedUrl('');
    setExternalLinks([]);
    setStreamingOffers([]);
    setAllOffers([]);
    setShowImportModal(true);
  };

  const lookupFreeStreams = async () => {
    if (!importItem) return;
    
    setLookingUpStreams(true);
    try {
      const mediaType = importItem.media_type || (importItem.title ? 'movie' : 'tv');
      const title = importItem.title || importItem.name || '';
      const releaseDate = importItem.release_date || importItem.first_air_date;
      const year = releaseDate ? new Date(releaseDate).getFullYear() : undefined;

      const { data, error } = await supabase.functions.invoke('justwatch-lookup', {
        body: { 
          title,
          year,
          type: mediaType,
          tmdb_id: importItem.id,
        }
      });

      if (error) throw error;

      if (data.found) {
        setStreamingOffers(data.freeStreaming || []);
        setAllOffers(data.allOffers || []);
        
        // Auto-populate external links from free streaming offers
        if (data.freeStreaming && data.freeStreaming.length > 0) {
          const autoLinks = data.freeStreaming.map((offer: StreamingOffer) => ({
            source: offer.provider.toLowerCase().replace(/\s/g, ''),
            url: offer.url,
          }));
          setExternalLinks(autoLinks);
          toast.success(`Found ${data.freeStreaming.length} free streaming option(s)!`);
        } else {
          toast.info('No free streaming options found for this title');
        }
      } else {
        toast.info('Title not found on JustWatch');
      }
    } catch (error: any) {
      console.error('JustWatch lookup error:', error);
      toast.error('Failed to lookup streaming: ' + error.message);
    } finally {
      setLookingUpStreams(false);
    }
  };

  const addExternalLink = () => {
    setExternalLinks([...externalLinks, { source: 'tubi', url: '' }]);
  };

  const updateExternalLink = (index: number, field: 'source' | 'url', value: string) => {
    const updated = [...externalLinks];
    updated[index][field] = value;
    setExternalLinks(updated);
  };

  const removeExternalLink = (index: number) => {
    setExternalLinks(externalLinks.filter((_, i) => i !== index));
  };

  const importContent = async (item: TMDBResult, embedUrl?: string, links?: ExternalLink[]) => {
    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
    const contentType = mediaType === 'movie' ? 'movie' : 'tv';
    const title = item.title || item.name || 'Untitled';
    
    // Map genre IDs to tags
    const tags = item.genre_ids?.map(id => genreMap[id]).filter(Boolean) || [];

    // Format external links as JSON
    const formattedLinks = links?.filter(l => l.url.trim())?.map(l => ({
      source: l.source,
      url: l.url.trim()
    })) || null;

    const { error } = await supabase
      .from('content_items')
      .insert({
        title,
        description: item.overview || null,
        content_type: contentType,
        poster_url: item.poster_url,
        thumbnail_url: item.thumbnail_url,
        tags,
        is_published: false,
        video_embed_url: embedUrl?.trim() || null,
        external_watch_links: formattedLinks && formattedLinks.length > 0 ? formattedLinks : null,
      });

    if (error) throw error;
    return title;
  };

  const handleSingleImport = async () => {
    if (!importItem) return;
    
    setImporting(importItem.id);
    try {
      const title = await importContent(importItem, videoEmbedUrl, externalLinks);
      setImported(prev => new Set([...prev, importItem.id]));
      toast.success(`Imported "${title}" as draft`);
      setShowImportModal(false);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Failed to import: ' + error.message);
    } finally {
      setImporting(null);
    }
  };

  const handleQuickImport = async (item: TMDBResult) => {
    setImporting(item.id);
    try {
      const title = await importContent(item);
      setImported(prev => new Set([...prev, item.id]));
      toast.success(`Imported "${title}" as draft`);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Failed to import: ' + error.message);
    } finally {
      setImporting(null);
    }
  };

  const handleBulkImport = async () => {
    if (selectedItems.size === 0) return;
    
    setBulkImporting(true);
    const itemsToImport = results.filter(r => selectedItems.has(r.id) && !imported.has(r.id));
    let successCount = 0;
    let failCount = 0;

    for (const item of itemsToImport) {
      try {
        await importContent(item);
        setImported(prev => new Set([...prev, item.id]));
        successCount++;
      } catch (error) {
        console.error('Bulk import error for', item.title || item.name, error);
        failCount++;
      }
    }

    setSelectedItems(new Set());
    setBulkImporting(false);
    
    if (failCount === 0) {
      toast.success(`Successfully imported ${successCount} items as drafts`);
    } else {
      toast.warning(`Imported ${successCount} items, ${failCount} failed`);
    }
  };

  const loadTrending = () => searchTMDB('trending');
  const loadPopularMovies = () => searchTMDB('popular_movies');
  const loadPopularTV = () => searchTMDB('popular_tv');

  const selectedCount = selectedItems.size;
  const allSelected = results.length > 0 && results.filter(r => !imported.has(r.id)).every(r => selectedItems.has(r.id));

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

        {/* Bulk Actions Bar */}
        {results.length > 0 && (
          <div className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={allSelected ? deselectAll : selectAll}
                className="gap-2"
              >
                {allSelected ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {allSelected ? 'Deselect All' : 'Select All'}
              </Button>
              
              {selectedCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>

            {selectedCount > 0 && (
              <Button
                onClick={handleBulkImport}
                disabled={bulkImporting}
                className="gap-2"
              >
                {bulkImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Import {selectedCount} Item{selectedCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </div>
        )}

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
                    onQuickImport={() => handleQuickImport(item)}
                    onImportWithOptions={() => openImportModal(item)}
                    isImporting={importing === item.id}
                    isImported={imported.has(item.id)}
                    isSelected={selectedItems.has(item.id)}
                    onToggleSelect={() => toggleSelection(item.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Import Modal with Video URL Options */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Import "{importItem?.title || importItem?.name}"
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* JustWatch Auto-Lookup */}
            <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Find Free Streaming</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={lookupFreeStreams}
                  disabled={lookingUpStreams}
                  className="gap-2"
                >
                  {lookingUpStreams ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Auto-Lookup
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Search Tubi, Pluto TV, Peacock, Plex, and more for free streams
              </p>
              
              {/* Show found streams */}
              {streamingOffers.length > 0 && (
                <div className="mt-3 space-y-2">
                  <Label className="text-xs text-primary">Found free streams:</Label>
                  <div className="flex flex-wrap gap-2">
                    {streamingOffers.map((offer, idx) => (
                      <a
                        key={idx}
                        href={offer.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-1 rounded hover:bg-primary/30 transition-colors"
                      >
                        {offer.provider}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show all available platforms */}
              {allOffers.length > 0 && (
                <div className="mt-3 space-y-2">
                  <Label className="text-xs text-muted-foreground">Also available on:</Label>
                  <div className="flex flex-wrap gap-1">
                    {allOffers
                      .filter(o => !streamingOffers.some(s => s.providerId === o.providerId))
                      .slice(0, 8)
                      .map((offer, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {offer.provider} ({offer.monetizationType.toLowerCase()})
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Video Embed URL */}
            <div className="space-y-2">
              <Label htmlFor="embed-url">Direct Video Embed URL (optional)</Label>
              <Input
                id="embed-url"
                placeholder="https://www.youtube.com/embed/... or iframe source"
                value={videoEmbedUrl}
                onChange={(e) => setVideoEmbedUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                For embedded players (YouTube, Vimeo, etc.)
              </p>
            </div>

            {/* External Watch Links */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>External Watch Links {externalLinks.length > 0 && `(${externalLinks.length})`}</Label>
                <Button variant="outline" size="sm" onClick={addExternalLink} className="gap-1">
                  <Plus className="w-3 h-3" />
                  Add Link
                </Button>
              </div>
              
              {externalLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Click "Auto-Lookup" above or add links manually
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {externalLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={link.source}
                        onChange={(e) => updateExternalLink(index, 'source', e.target.value)}
                        className="w-32 h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {STREAMING_SOURCES.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <Input
                        placeholder={STREAMING_SOURCES.find(s => s.id === link.source)?.placeholder}
                        value={link.url}
                        onChange={(e) => updateExternalLink(index, 'url', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExternalLink(index)}
                        className="shrink-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Future: Real-Debrid integration placeholder */}
            <div className="border border-dashed border-border rounded-lg p-4 bg-secondary/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link className="w-4 h-4" />
                <span>Real-Debrid integration coming soon</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Auto-fetch streaming links from magnet sources
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowImportModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSingleImport} 
              disabled={importing === importItem?.id}
              className="gap-2"
            >
              {importing === importItem?.id ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Import as Draft
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

interface ContentCardProps {
  item: TMDBResult;
  onQuickImport: () => void;
  onImportWithOptions: () => void;
  isImporting: boolean;
  isImported: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}

const ContentCard = ({ 
  item, 
  onQuickImport, 
  onImportWithOptions,
  isImporting, 
  isImported,
  isSelected,
  onToggleSelect 
}: ContentCardProps) => {
  const title = item.title || item.name || 'Untitled';
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
  const releaseDate = item.release_date || item.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

  return (
    <div className={`bg-card border rounded-xl overflow-hidden group transition-colors ${
      isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
    }`}>
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
        
        {/* Selection Checkbox */}
        {!isImported && (
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              className="bg-background/80 backdrop-blur-sm"
            />
          </div>
        )}

        {/* Type Badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-2 left-8 text-xs"
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
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
          {isImported ? (
            <Badge variant="secondary" className="gap-1">
              <Check className="w-3 h-3" />
              Imported
            </Badge>
          ) : isImporting ? (
            <Button size="sm" disabled className="gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Importing...
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={onQuickImport} className="gap-2 w-full">
                <Plus className="w-4 h-4" />
                Quick Import
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onImportWithOptions}
                className="gap-2 w-full"
              >
                <Video className="w-4 h-4" />
                Add Video URLs
              </Button>
            </>
          )}
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
