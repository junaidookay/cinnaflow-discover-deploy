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
  Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PendingItem {
  id: string;
  title: string;
  tags: string[] | null;
  created_at: string;
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
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'trending' | 'popular'>('trending');
  const [fetchLimit, setFetchLimit] = useState('10');
  const [magnetLinks, setMagnetLinks] = useState<Record<string, string>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);

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

        {/* Pending Items Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Pending Resolution ({pendingItems.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadPendingItems} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
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
                      <Input
                        placeholder="Paste magnet link..."
                        className="w-64 text-xs font-mono"
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
              <h4 className="font-medium text-sm mb-2">💡 How to find magnet links</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use your Debrid Media Manager to find cached content</li>
                <li>• Cached torrents will stream instantly via Real-Debrid</li>
                <li>• Paste the magnet link and click resolve to get streaming URL</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAutomation;
