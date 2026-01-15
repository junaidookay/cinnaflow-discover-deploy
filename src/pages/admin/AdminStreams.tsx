import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Loader2, 
  ExternalLink,
  Film,
  Tv,
  Trophy,
  Video
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Database } from '@/integrations/supabase/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ContentItem = Database['public']['Tables']['content_items']['Row'];

interface StreamingOffer {
  provider: string;
  providerId: number;
  url: string;
  monetizationType: string;
}

interface StreamStats {
  total: number;
  withEmbed: number;
  withExternalLinks: number;
  noStreams: number;
  byType: Record<string, { total: number; withStreams: number }>;
}

const AdminStreams = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkRefreshing, setIsBulkRefreshing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, found: 0 });
  const [showBulkResults, setShowBulkResults] = useState(false);
  const [bulkResults, setBulkResults] = useState<Array<{
    item: ContentItem;
    freeStreaming: StreamingOffer[];
    success: boolean;
  }>>([]);
  const [filter, setFilter] = useState<'all' | 'with-streams' | 'no-streams'>('all');

  const fetchContent = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .order('title');

    if (error) {
      toast.error('Failed to load content');
    } else {
      setContent(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const hasStreams = (item: ContentItem): boolean => {
    const hasEmbed = !!item.video_embed_url;
    const hasExternal = item.external_watch_links && 
      Object.keys(item.external_watch_links as object).length > 0;
    return hasEmbed || hasExternal;
  };

  const stats: StreamStats = useMemo(() => {
    const result: StreamStats = {
      total: content.length,
      withEmbed: 0,
      withExternalLinks: 0,
      noStreams: 0,
      byType: {},
    };

    content.forEach(item => {
      const type = item.content_type;
      if (!result.byType[type]) {
        result.byType[type] = { total: 0, withStreams: 0 };
      }
      result.byType[type].total++;

      if (item.video_embed_url) result.withEmbed++;
      if (item.external_watch_links && Object.keys(item.external_watch_links as object).length > 0) {
        result.withExternalLinks++;
      }
      if (hasStreams(item)) {
        result.byType[type].withStreams++;
      } else {
        result.noStreams++;
      }
    });

    return result;
  }, [content]);

  const filteredContent = useMemo(() => {
    switch (filter) {
      case 'with-streams':
        return content.filter(hasStreams);
      case 'no-streams':
        return content.filter(item => !hasStreams(item));
      default:
        return content;
    }
  }, [content, filter]);

  const bulkRefreshStreams = async () => {
    const itemsToRefresh = content.filter(item => !hasStreams(item));
    
    if (itemsToRefresh.length === 0) {
      toast.info('All content already has streaming sources!');
      return;
    }

    setIsBulkRefreshing(true);
    setBulkProgress({ current: 0, total: itemsToRefresh.length, found: 0 });
    setBulkResults([]);

    const results: typeof bulkResults = [];

    for (let i = 0; i < itemsToRefresh.length; i++) {
      const item = itemsToRefresh[i];
      
      try {
        const yearMatch = item.title.match(/\((\d{4})\)/);
        const year = yearMatch ? parseInt(yearMatch[1]) : undefined;
        const cleanTitle = item.title.replace(/\s*\(\d{4}\)\s*$/, '').trim();

        const { data, error } = await supabase.functions.invoke('justwatch-lookup', {
          body: {
            title: cleanTitle,
            year,
            type: item.content_type === 'tv' ? 'tv' : 'movie',
          },
        });

        if (!error && data.found && data.freeStreaming?.length > 0) {
          results.push({
            item,
            freeStreaming: data.freeStreaming,
            success: true,
          });
          setBulkProgress(prev => ({ ...prev, found: prev.found + 1 }));
        } else {
          results.push({
            item,
            freeStreaming: [],
            success: false,
          });
        }
      } catch (err) {
        results.push({
          item,
          freeStreaming: [],
          success: false,
        });
      }

      setBulkProgress(prev => ({ ...prev, current: i + 1 }));
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setBulkResults(results);
    setIsBulkRefreshing(false);
    setShowBulkResults(true);
  };

  const applyAllBulkResults = async () => {
    const successfulResults = bulkResults.filter(r => r.success && r.freeStreaming.length > 0);
    
    for (const result of successfulResults) {
      const newLinks: Record<string, string> = {};
      result.freeStreaming.forEach(offer => {
        const key = offer.provider.toLowerCase().replace(/\s+/g, '_');
        newLinks[key] = offer.url;
      });

      const existingLinks = (result.item.external_watch_links as Record<string, string>) || {};
      const mergedLinks = { ...existingLinks, ...newLinks };

      await supabase
        .from('content_items')
        .update({ external_watch_links: mergedLinks })
        .eq('id', result.item.id);
    }

    toast.success(`Applied streaming links to ${successfulResults.length} items`);
    setShowBulkResults(false);
    fetchContent();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'movie': return <Film className="w-4 h-4" />;
      case 'tv': return <Tv className="w-4 h-4" />;
      case 'sports': return <Trophy className="w-4 h-4" />;
      case 'clip': return <Video className="w-4 h-4" />;
      default: return <Play className="w-4 h-4" />;
    }
  };

  const coveragePercent = stats.total > 0 
    ? Math.round(((stats.total - stats.noStreams) / stats.total) * 100) 
    : 0;

  return (
    <AdminLayout title="Streaming Sources Dashboard">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Content</span>
            <Play className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">With Streams</span>
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">
            {stats.total - stats.noStreams}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Needs Streams</span>
            <AlertCircle className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-yellow-400">{stats.noStreams}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Coverage</span>
            <RefreshCw className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{coveragePercent}%</p>
          <Progress value={coveragePercent} className="mt-2 h-2" />
        </div>
      </div>

      {/* Type Breakdown */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <h3 className="text-sm font-medium text-foreground mb-4">Coverage by Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.byType).map(([type, data]) => {
            const percent = data.total > 0 
              ? Math.round((data.withStreams / data.total) * 100) 
              : 0;
            return (
              <div key={type} className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-lg">
                  {getTypeIcon(type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground capitalize">{type}</p>
                  <div className="flex items-center gap-2">
                    <Progress value={percent} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">{percent}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          {(['all', 'with-streams', 'no-streams'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? 'All' : f === 'with-streams' ? 'With Streams' : 'Needs Streams'}
            </button>
          ))}
        </div>

        <Button
          onClick={bulkRefreshStreams}
          disabled={isBulkRefreshing || stats.noStreams === 0}
          className="gap-2"
        >
          {isBulkRefreshing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking... ({bulkProgress.current}/{bulkProgress.total})
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Bulk Refresh ({stats.noStreams} items)
            </>
          )}
        </Button>
      </div>

      {/* Bulk Progress */}
      {isBulkRefreshing && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground">Checking JustWatch availability...</span>
            <span className="text-sm text-green-400">{bulkProgress.found} found</span>
          </div>
          <Progress 
            value={(bulkProgress.current / bulkProgress.total) * 100} 
            className="h-2"
          />
        </div>
      )}

      {/* Content List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-10 bg-secondary rounded" />
                <div className="flex-1">
                  <div className="h-4 bg-secondary rounded w-1/3 mb-2" />
                  <div className="h-3 bg-secondary rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredContent.map(item => {
            const hasEmbed = !!item.video_embed_url;
            const externalLinks = item.external_watch_links as Record<string, string> | null;
            const hasExternal = externalLinks && Object.keys(externalLinks).length > 0;
            const streamStatus = hasEmbed || hasExternal;

            return (
              <div
                key={item.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center gap-4"
              >
                {item.thumbnail_url ? (
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-16 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-10 bg-secondary rounded flex items-center justify-center">
                    {getTypeIcon(item.content_type)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">{item.title}</h4>
                  <p className="text-sm text-muted-foreground capitalize">{item.content_type}</p>
                </div>

                <div className="flex items-center gap-2">
                  {hasEmbed && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                      Embed
                    </span>
                  )}
                  {hasExternal && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      {Object.keys(externalLinks!).length} links
                    </span>
                  )}
                  {!streamStatus && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                      No streams
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk Results Modal */}
      <Dialog open={showBulkResults} onOpenChange={setShowBulkResults}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Refresh Results</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found free streams for {bulkResults.filter(r => r.success).length} of {bulkResults.length} items
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {bulkResults.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    result.success 
                      ? 'bg-green-500/10 border-green-500/20' 
                      : 'bg-secondary/50 border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{result.item.title}</span>
                    {result.success ? (
                      <span className="text-sm text-green-400">
                        {result.freeStreaming.length} stream(s)
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not found</span>
                    )}
                  </div>
                  {result.success && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {result.freeStreaming.map((offer, oidx) => (
                        <span key={oidx} className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                          {offer.provider}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={applyAllBulkResults}
                className="flex-1"
                disabled={bulkResults.filter(r => r.success).length === 0}
              >
                Apply All Found Streams
              </Button>
              <Button variant="outline" onClick={() => setShowBulkResults(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminStreams;