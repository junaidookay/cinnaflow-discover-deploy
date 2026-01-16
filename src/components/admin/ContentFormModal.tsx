import { useState, useEffect, useRef } from 'react';
import { X, Magnet, Loader2, Link, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

type ContentItem = Database['public']['Tables']['content_items']['Row'];
type ContentType = Database['public']['Enums']['content_type'];
type BadgeType = Database['public']['Enums']['badge_type'];
type SectionType = Database['public']['Enums']['section_type'];

interface ContentFormModalProps {
  item: ContentItem | null;
  onClose: () => void;
  onSave: () => void;
}

interface MagnetProgress {
  status: string;
  progress: number;
  torrentId: string | null;
  filename?: string;
}

const ContentFormModal = ({ item, onClose, onSave }: ContentFormModalProps) => {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    content_type: (item?.content_type || 'movie') as ContentType,
    description: item?.description || '',
    tags: item?.tags?.join(', ') || '',
    thumbnail_url: item?.thumbnail_url || '',
    poster_url: item?.poster_url || '',
    video_embed_url: item?.video_embed_url || '',
    badges: item?.badges || [],
    section_assignments: item?.section_assignments || [],
    hero_order: item?.hero_order || null,
    is_published: item?.is_published || false,
    external_watch_links: item?.external_watch_links as Record<string, string> || {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [magnetLink, setMagnetLink] = useState('');
  const [isResolvingMagnet, setIsResolvingMagnet] = useState(false);
  const [magnetProgress, setMagnetProgress] = useState<MagnetProgress | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // External link editor state
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderUrl, setNewProviderUrl] = useState('');

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const pollTorrentStatus = async (torrentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('real-debrid', {
        body: {
          action: 'check_torrent',
          torrent_id: torrentId,
        },
      });

      if (error) throw error;

      if (data.status === 'downloaded' && data.links?.length > 0) {
        // Torrent is ready, get stream URL
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        
        const { data: unrestrictData } = await supabase.functions.invoke('real-debrid', {
          body: {
            action: 'unrestrict',
            link: data.links[0],
          },
        });

        if (unrestrictData?.download) {
          setFormData(prev => ({
            ...prev,
            video_embed_url: unrestrictData.download,
          }));
          setMagnetLink('');
          setMagnetProgress(null);
          setIsResolvingMagnet(false);
          toast.success('Magnet resolved! Streaming URL added.');
        }
      } else {
        setMagnetProgress({
          status: data.status || 'processing',
          progress: data.progress || 0,
          torrentId: torrentId,
          filename: data.filename,
        });
      }
    } catch (err) {
      console.error('Poll error:', err);
    }
  };

  const resolveMagnetLink = async () => {
    if (!magnetLink.trim()) {
      toast.error('Please enter a magnet link');
      return;
    }

    if (!magnetLink.startsWith('magnet:')) {
      toast.error('Invalid magnet link format');
      return;
    }

    setIsResolvingMagnet(true);
    setMagnetProgress({ status: 'adding', progress: 0, torrentId: null });
    
    try {
      const { data, error } = await supabase.functions.invoke('real-debrid', {
        body: {
          action: 'add_magnet',
          magnet: magnetLink.trim(),
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setMagnetProgress(null);
        setIsResolvingMagnet(false);
        return;
      }

      if (data.streamUrl) {
        setFormData({
          ...formData,
          video_embed_url: data.streamUrl,
        });
        setMagnetLink('');
        setMagnetProgress(null);
        setIsResolvingMagnet(false);
        toast.success('Magnet resolved! Streaming URL added.');
      } else if (data.id) {
        // Start polling for progress
        setMagnetProgress({
          status: data.status || 'processing',
          progress: data.progress || 0,
          torrentId: data.id,
        });
        
        pollIntervalRef.current = setInterval(() => {
          pollTorrentStatus(data.id);
        }, 3000);
        
        toast.info('Torrent added. Monitoring download progress...');
      } else {
        setMagnetProgress(null);
        setIsResolvingMagnet(false);
        toast.info(`Status: ${data.status || 'Processing...'}`);
      }
    } catch (err: any) {
      console.error('Magnet resolve error:', err);
      toast.error(err.message || 'Failed to resolve magnet link');
      setMagnetProgress(null);
      setIsResolvingMagnet(false);
    }
  };

  const cancelMagnetPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setMagnetProgress(null);
    setIsResolvingMagnet(false);
  };

  const addExternalLink = () => {
    if (!newProviderName.trim() || !newProviderUrl.trim()) {
      toast.error('Please enter both provider name and URL');
      return;
    }

    const key = newProviderName.toLowerCase().replace(/\s+/g, '_');
    setFormData({
      ...formData,
      external_watch_links: {
        ...formData.external_watch_links,
        [key]: newProviderUrl.trim(),
      },
    });
    setNewProviderName('');
    setNewProviderUrl('');
    toast.success('External link added');
  };

  const removeExternalLink = (key: string) => {
    const { [key]: _, ...rest } = formData.external_watch_links;
    setFormData({
      ...formData,
      external_watch_links: rest,
    });
  };

  const updateExternalLink = (key: string, newUrl: string) => {
    setFormData({
      ...formData,
      external_watch_links: {
        ...formData.external_watch_links,
        [key]: newUrl,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = {
      title: formData.title,
      content_type: formData.content_type,
      description: formData.description,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      thumbnail_url: formData.thumbnail_url || null,
      poster_url: formData.poster_url || null,
      video_embed_url: formData.video_embed_url || null,
      badges: formData.badges as BadgeType[],
      section_assignments: formData.section_assignments as SectionType[],
      hero_order: formData.hero_order,
      is_published: formData.is_published,
      external_watch_links: Object.keys(formData.external_watch_links).length > 0 
        ? formData.external_watch_links 
        : null,
    };

    try {
      if (item) {
        const { error } = await supabase
          .from('content_items')
          .update(data)
          .eq('id', item.id);
        if (error) throw error;
        toast.success('Content updated');
      } else {
        const { error } = await supabase.from('content_items').insert(data);
        if (error) throw error;
        toast.success('Content created');
      }
      onSave();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleArrayValue = (
    field: 'badges' | 'section_assignments',
    value: string
  ) => {
    const current = formData[field] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: updated });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {item ? 'Edit Content' : 'Add Content'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Content Type *
              </label>
              <select
                value={formData.content_type}
                onChange={(e) =>
                  setFormData({ ...formData, content_type: e.target.value as ContentType })
                }
                className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="movie">Movie</option>
                <option value="tv">TV Show</option>
                <option value="sports">Sports</option>
                <option value="clip">Clip</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Brief description (max 3-4 lines)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Action, Drama, Thriller"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Thumbnail URL
              </label>
              <input
                type="url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Poster URL
              </label>
              <input
                type="url"
                value={formData.poster_url}
                onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Video Embed URL
            </label>
            <input
              type="url"
              value={formData.video_embed_url}
              onChange={(e) => setFormData({ ...formData, video_embed_url: e.target.value })}
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://www.youtube.com/embed/..."
            />
          </div>

          {/* Magnet Link Resolution */}
          <div className="p-4 bg-secondary/30 border border-border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Magnet className="w-4 h-4 text-primary" />
              <label className="text-sm font-medium text-foreground">
                Resolve Magnet Link (Real-Debrid)
              </label>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={magnetLink}
                onChange={(e) => setMagnetLink(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="magnet:?xt=urn:btih:..."
                disabled={isResolvingMagnet}
              />
              <Button
                type="button"
                onClick={resolveMagnetLink}
                disabled={isResolvingMagnet || !magnetLink.trim()}
                className="shrink-0"
              >
                {isResolvingMagnet ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Link className="w-4 h-4 mr-2" />
                    Resolve
                  </>
                )}
              </Button>
            </div>
            
            {/* Progress Indicator */}
            {magnetProgress && (
              <div className="space-y-2 p-3 bg-background/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">
                    {magnetProgress.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-foreground font-medium">
                    {magnetProgress.progress}%
                  </span>
                </div>
                <Progress value={magnetProgress.progress} className="h-2" />
                {magnetProgress.filename && (
                  <p className="text-xs text-muted-foreground truncate">
                    {magnetProgress.filename}
                  </p>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelMagnetPolling}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Paste a magnet link to convert it to a direct streaming URL via Real-Debrid
            </p>
          </div>

          {/* External Watch Links Editor */}
          <div className="p-4 bg-secondary/30 border border-border rounded-lg space-y-3">
            <label className="text-sm font-medium text-foreground">
              External Watch Links
            </label>
            
            {/* Existing links */}
            {Object.entries(formData.external_watch_links).length > 0 && (
              <div className="space-y-2">
                {Object.entries(formData.external_watch_links).map(([provider, url]) => (
                  <div key={provider} className="flex items-center gap-2">
                    <span className="w-24 text-sm text-muted-foreground capitalize truncate">
                      {provider.replace(/_/g, ' ')}
                    </span>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateExternalLink(provider, e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExternalLink(provider)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add new link */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <input
                type="text"
                value={newProviderName}
                onChange={(e) => setNewProviderName(e.target.value)}
                className="w-24 px-3 py-1.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Provider"
              />
              <input
                type="url"
                value={newProviderUrl}
                onChange={(e) => setNewProviderUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://..."
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addExternalLink}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add streaming sources like Tubi, Pluto TV, Peacock, etc.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Badges
            </label>
            <div className="flex flex-wrap gap-2">
              {['trending', 'featured', 'sponsored'].map((badge) => (
                <button
                  key={badge}
                  type="button"
                  onClick={() => toggleArrayValue('badges', badge)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    (formData.badges as string[]).includes(badge)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {badge.charAt(0).toUpperCase() + badge.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Section Assignments
            </label>
            <div className="flex flex-wrap gap-2">
              {['hero', 'trending', 'recently_added', 'editor_picks'].map((section) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => toggleArrayValue('section_assignments', section)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    (formData.section_assignments as string[]).includes(section)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {section.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">Published</span>
            </label>

            {(formData.section_assignments as string[]).includes('hero') && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-foreground">Hero Order:</label>
                <input
                  type="number"
                  value={formData.hero_order || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero_order: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-20 px-2 py-1 bg-secondary border border-border rounded text-foreground"
                  min="1"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContentFormModal;
