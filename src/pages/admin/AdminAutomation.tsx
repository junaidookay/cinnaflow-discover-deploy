import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  Download, 
  Zap, 
  Film, 
  TrendingUp,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  Link as LinkIcon,
  Search,
  Wand2,
  Magnet
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PendingItem {
  id: string;
  title: string;
  tags: string[] | null;
  created_at: string;
}

interface TorrentResult {
  name: string;
  info_hash: string;
  seeders: number;
  leechers: number;
  size: string;
  magnet: string;
}

interface Stats {
  totalDrafts: number;
  autoImported: number;
  needsSource: number;
  published: number;
}

const AdminAutomation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAutoResolving, setIsAutoResolving] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'trending' | 'popular'>('trending');
  const [fetchLimit, setFetchLimit] = useState('10');
  const [magnetLinks, setMagnetLinks] = useState<Record<string, string>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [torrentResults, setTorrentResults] = useState<TorrentResult[]>([]);
  const [autoResolveLimit, setAutoResolveLimit] = useState('5');

  useEffect(() => {
    loadStats();
    loadPendingItems();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('content-automation', {
        body: { action: 'stats' },
      });

      if (error) throw error;
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadPendingItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('content-automation', {
        body: { action: 'get_pending' },
      });

      if (error) throw error;
      setPendingItems(data.items || []);
    } catch (err) {
      console.error('Failed to load pending items:', err);
      toast.error('Failed to load pending items');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrending = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke('content-automation', {
        body: { 
          action: 'fetch_trending', 
          category: selectedCategory,
          limit: parseInt(fetchLimit) 
        },
      });

      if (error) throw error;

      if (data.imported > 0) {
        toast.success(`Imported ${data.imported} movies as drafts`);
      }
      if (data.skipped > 0) {
        toast.info(`Skipped ${data.skipped} (already exist)`);
      }

      loadStats();
      loadPendingItems();
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to fetch trending content');
    } finally {
      setIsFetching(false);
    }
  };

  const resolveMagnet = async (contentId: string) => {
    const magnet = magnetLinks[contentId];
    if (!magnet?.trim()) {
      toast.error('Please enter a magnet link');
      return;
    }

    setResolvingId(contentId);
    try {
      const { data, error } = await supabase.functions.invoke('content-automation', {
        body: { 
          action: 'resolve_single', 
          contentId,
          magnet 
        },
      });

      if (error) throw error;

      if (data.status === 'ready') {
        toast.success('Content resolved and published!');
        setMagnetLinks(prev => {
          const updated = { ...prev };
          delete updated[contentId];
          return updated;
        });
        loadStats();
        loadPendingItems();
      } else {
        toast.info(`Processing: ${data.status} (${data.progress || 0}%)`);
      }
    } catch (err) {
      console.error('Resolve error:', err);
      toast.error('Failed to resolve magnet');
    } finally {
      setResolvingId(null);
    }
  };

  const searchTorrents = async () => {
    if (!searchQuery.trim()) {
      toast.error('Enter a search query');
      return;
    }

    setIsSearching(true);
    setTorrentResults([]);
    try {
      const { data, error } = await supabase.functions.invoke('content-automation', {
        body: { 
          action: 'search_torrents', 
          query: searchQuery,
          year: searchYear 
        },
      });

      if (error) throw error;

      if (data.results?.length > 0) {
        setTorrentResults(data.results);
        toast.success(`Found ${data.results.length} torrents`);
      } else {
        toast.info('No torrents found');
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Torrent search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const autoResolveItem = async (contentId: string) => {
    setResolvingId(contentId);
    try {
      const { data, error } = await supabase.functions.invoke('content-automation', {
        body: { action: 'auto_resolve', contentId },
      });

      if (error) throw error;

      if (data.status === 'ready') {
        toast.success(`Resolved: ${data.torrent}`);
        loadStats();
        loadPendingItems();
      } else if (data.status === 'no_results') {
        toast.warning('No torrents found for this title');
      } else {
        toast.info(`${data.status}: ${data.torrent || 'Processing...'}`);
      }
    } catch (err) {
      console.error('Auto-resolve error:', err);
      toast.error('Auto-resolve failed');
    } finally {
      setResolvingId(null);
    }
  };

  const bulkAutoResolve = async () => {
    setIsAutoResolving(true);
    try {
      const { data, error } = await supabase.functions.invoke('content-automation', {
        body: { action: 'bulk_auto_resolve', limit: parseInt(autoResolveLimit) },
      });

      if (error) throw error;

      toast.success(`Processed ${data.processed} items: ${data.resolved?.length || 0} resolved`);
      
      if (data.failed?.length > 0) {
        console.log('Failed items:', data.failed);
      }

      loadStats();
      loadPendingItems();
    } catch (err) {
      console.error('Bulk resolve error:', err);
      toast.error('Bulk auto-resolve failed');
    } finally {
      setIsAutoResolving(false);
    }
  };

  const copyMagnet = (magnet: string) => {
    navigator.clipboard.writeText(magnet);
    toast.success('Magnet link copied!');
  };

  return (
    <AdminLayout title="Content Automation">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Film className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.published || 0}</p>
                  <p className="text-xs text-muted-foreground">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalDrafts || 0}</p>
                  <p className="text-xs text-muted-foreground">Drafts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.autoImported || 0}</p>
                  <p className="text-xs text-muted-foreground">Auto-Imported</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.needsSource || 0}</p>
                  <p className="text-xs text-muted-foreground">Need Source</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Auto-Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Auto-Import from TMDB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm text-muted-foreground mb-2 block">Category</label>
                <Select value={selectedCategory} onValueChange={(v: 'trending' | 'popular') => setSelectedCategory(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trending">Trending This Week</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-24">
                <label className="text-sm text-muted-foreground mb-2 block">Limit</label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={fetchLimit}
                  onChange={(e) => setFetchLimit(e.target.value)}
                />
              </div>

              <Button onClick={fetchTrending} disabled={isFetching}>
                {isFetching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Fetch Movies
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              This will import movie metadata from TMDB as drafts. You'll need to add streaming sources via Real-Debrid.
            </p>
          </CardContent>
        </Card>

        {/* Torrent Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Torrent Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end mb-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-muted-foreground mb-2 block">Movie Title</label>
                <Input
                  placeholder="Search for a movie..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchTorrents()}
                />
              </div>
              <div className="w-24">
                <label className="text-sm text-muted-foreground mb-2 block">Year</label>
                <Input
                  placeholder="2024"
                  value={searchYear}
                  onChange={(e) => setSearchYear(e.target.value)}
                />
              </div>
              <Button onClick={searchTorrents} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Search
              </Button>
            </div>

            {torrentResults.length > 0 && (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {torrentResults.map((torrent) => (
                  <div key={torrent.info_hash} className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{torrent.name}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {torrent.size}
                        </Badge>
                        <Badge variant="default" className="text-xs bg-green-600">
                          S: {torrent.seeders}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          L: {torrent.leechers}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => copyMagnet(torrent.magnet)}>
                      <Magnet className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Items Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Pending Resolution ({pendingItems.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={autoResolveLimit}
                  onChange={(e) => setAutoResolveLimit(e.target.value)}
                  className="w-16 h-8"
                />
                <Button 
                  size="sm" 
                  onClick={bulkAutoResolve} 
                  disabled={isAutoResolving || pendingItems.length === 0}
                >
                  {isAutoResolving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  Auto-Resolve
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={loadPendingItems} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pendingItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pending items. Import content or add magnet links to resolve.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.title}</h4>
                      <div className="flex gap-2 mt-1">
                        {item.tags?.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 bg-secondary rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => autoResolveItem(item.id)}
                        disabled={resolvingId === item.id}
                        title="Auto-find and resolve"
                      >
                        {resolvingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4" />
                        )}
                      </Button>
                      <Input
                        placeholder="Or paste magnet link..."
                        className="w-48 text-xs font-mono"
                        value={magnetLinks[item.id] || ''}
                        onChange={(e) => setMagnetLinks(prev => ({ ...prev, [item.id]: e.target.value }))}
                      />
                      <Button
                        size="sm"
                        onClick={() => resolveMagnet(item.id)}
                        disabled={resolvingId === item.id || !magnetLinks[item.id]?.trim()}
                      >
                        {resolvingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h4 className="font-medium text-sm mb-2">🪄 Automation Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Click the wand icon to auto-search and resolve a single item</li>
                <li>• Use "Auto-Resolve" to bulk process multiple items automatically</li>
                <li>• Only torrents with 5+ seeders are used for better reliability</li>
                <li>• Use the Torrent Search above to manually find specific versions</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAutomation;
