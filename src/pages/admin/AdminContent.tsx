import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Eye, EyeOff, Star } from 'lucide-react';
import { toast } from 'sonner';
import ContentFormModal from '@/components/admin/ContentFormModal';
import { Database } from '@/integrations/supabase/types';

type ContentItem = Database['public']['Tables']['content_items']['Row'];

const AdminContent = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const fetchContent = async () => {
    setIsLoading(true);
    let query = supabase.from('content_items').select('*').order('created_at', { ascending: false });
    
    if (filter !== 'all' && (filter === 'movie' || filter === 'tv' || filter === 'sports' || filter === 'clip')) {
      query = query.eq('content_type', filter);
    }
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
                {!item.is_published && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-yellow-500/80 text-black text-xs rounded">
                    Draft
                  </div>
                )}
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
    </AdminLayout>
  );
};

export default AdminContent;
