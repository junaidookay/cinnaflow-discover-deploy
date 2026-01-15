import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Eye, EyeOff, Star, RefreshCw, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import ContentFormModal from '@/components/admin/ContentFormModal';
import { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
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

const AdminContent = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [filter, setFilter] = useState<string>('all');
  
  // Refresh streams state
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [refreshResults, setRefreshResults] = useState<{
    item: ContentItem;
    freeStreaming: StreamingOffer[];
    allOffers: StreamingOffer[];
  } | null>(null);

  const fetchContent = async () => {
    setIsLoading(true);
    let query = supabase.from('content_items').select('*').order('created_at', { ascending: false });
    
    if (filter !== 'all' && (filter === 'movie' || filter === 'tv' || filter === 'sports' || filter === 'clip')) {
      query = query.eq('content_type', filter);
    }
    
    const { data, error } = await query;
    
    if (error) {
      toast.error('Failed to load content');
    } else {
      setContent(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchContent();
  }, [filter]);

  const togglePublish = async (item: ContentItem) => {
    const { error } = await supabase
      .from('content_items')
      .update({ is_published: !item.is_published })
      .eq('id', item.id);

    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(item.is_published ? 'Unpublished' : 'Published');
      fetchContent();
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    
    const { error } = await supabase.from('content_items').delete().eq('id', id);
    
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Content deleted');
      fetchContent();
    }
  };

  const toggleBadge = async (item: ContentItem, badge: string) => {
    const currentBadges = item.badges || [];
    const hasBadge = currentBadges.includes(badge as any);
    const newBadges = hasBadge
      ? currentBadges.filter((b) => b !== badge)
      : [...currentBadges, badge];

    const { error } = await supabase
      .from('content_items')
      .update({ badges: newBadges as any })
      .eq('id', item.id);

    if (error) {
      toast.error('Failed to update badge');
    } else {
      toast.success(`Badge ${hasBadge ? 'removed' : 'added'}`);
      fetchContent();
    }
  };

  const refreshStreams = async (item: ContentItem) => {
    setRefreshingId(item.id);
    
    try {
      // Extract year from title if possible (e.g., "Movie Title (2023)")
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

      if (error) throw error;

      if (data.found && data.freeStreaming?.length > 0) {
        setRefreshResults({
          item,
          freeStreaming: data.freeStreaming,
          allOffers: data.allOffers || [],
        });
        setShowRefreshModal(true);
      } else {
        toast.info(`No free streaming options found for "${item.title}"`);
      }
    } catch (err) {
      console.error('Refresh streams error:', err);
      toast.error('Failed to check streaming availability');
    } finally {
      setRefreshingId(null);
    }
  };

  const applyRefreshedStreams = async () => {
    if (!refreshResults) return;

    const { item, freeStreaming } = refreshResults;
    
    // Build external watch links from found streams
    const newLinks: Record<string, string> = {};
    freeStreaming.forEach(offer => {
      const key = offer.provider.toLowerCase().replace(/\s+/g, '_');
      newLinks[key] = offer.url;
    });

    // Merge with existing links
    const existingLinks = (item.external_watch_links as Record<string, string>) || {};
    const mergedLinks = { ...existingLinks, ...newLinks };

    const { error } = await supabase
      .from('content_items')
      .update({ external_watch_links: mergedLinks })
      .eq('id', item.id);

    if (error) {
      toast.error('Failed to update streaming links');
    } else {
      toast.success(`Updated ${Object.keys(newLinks).length} streaming links`);
      fetchContent();
    }

    setShowRefreshModal(false);
    setRefreshResults(null);
  };

  const hasExternalLinks = (item: ContentItem) => {
    const links = item.external_watch_links as Record<string, string> | null;
    return links && Object.keys(links).length > 0;
  };

  return (
    <AdminLayout title="Content Management">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['all', 'movie', 'tv', 'sports', 'clip'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => {
            setEditingItem(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Content
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="aspect-video bg-secondary rounded-lg mb-4" />
              <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
              <div className="h-3 bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : content.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground mb-4">No content found</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-primary hover:underline"
          >
            Add your first content
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="aspect-video bg-secondary relative">
                {item.thumbnail_url ? (
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No thumbnail
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {item.badges?.map((badge) => (
                    <span
                      key={badge}
                      className="px-2 py-0.5 bg-primary/80 text-primary-foreground text-xs rounded"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
                <div className="absolute top-2 left-2 flex gap-1">
                  {!item.is_published && (
                    <span className="px-2 py-0.5 bg-yellow-500/80 text-black text-xs rounded">
                      Draft
                    </span>
                  )}
                  {hasExternalLinks(item) && (
                    <span className="px-2 py-0.5 bg-green-500/80 text-white text-xs rounded flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      Streams
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground capitalize mb-3">{item.content_type}</p>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => togglePublish(item)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.is_published
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                    title={item.is_published ? 'Unpublish' : 'Publish'}
                  >
                    {item.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => toggleBadge(item, 'trending')}
                    className={`p-2 rounded-lg transition-colors ${
                      item.badges?.includes('trending')
                        ? 'bg-primary/20 text-primary'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                    title="Toggle Trending"
                  >
                    <Star className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => refreshStreams(item)}
                    disabled={refreshingId === item.id}
                    className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh Streams"
                  >
                    {refreshingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowModal(true);
                    }}
                    className="p-2 bg-secondary text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 bg-destructive/20 text-destructive hover:bg-destructive/30 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ContentFormModal
          item={editingItem}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingItem(null);
            fetchContent();
          }}
        />
      )}

      {/* Refresh Streams Results Modal */}
      <Dialog open={showRefreshModal} onOpenChange={setShowRefreshModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Streaming Options Found</DialogTitle>
          </DialogHeader>
          
          {refreshResults && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found {refreshResults.freeStreaming.length} free streaming option(s) for "{refreshResults.item.title}"
              </p>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Free Streams</h4>
                {refreshResults.freeStreaming.map((offer, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">{offer.provider}</p>
                      <p className="text-xs text-muted-foreground capitalize">{offer.monetizationType}</p>
                    </div>
                    <a
                      href={offer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>

              {refreshResults.allOffers.length > refreshResults.freeStreaming.length && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Other Options</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {refreshResults.allOffers
                      .filter(o => !refreshResults.freeStreaming.find(f => f.providerId === o.providerId))
                      .slice(0, 5)
                      .map((offer, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1 text-sm text-muted-foreground">
                          <span>{offer.provider}</span>
                          <span className="capitalize text-xs">{offer.monetizationType}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={applyRefreshedStreams}
                  className="flex-1"
                >
                  Apply Free Streams
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRefreshModal(false);
                    setRefreshResults(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminContent;
