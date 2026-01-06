import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, ExternalLink, Radio, Star, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type CreatorPromotion = Database['public']['Tables']['creator_promotions']['Row'];
type ApprovalStatus = Database['public']['Enums']['approval_status'];

const platformColors = {
  twitch: 'text-purple-400 bg-purple-500/20',
  youtube: 'text-red-400 bg-red-500/20',
  kick: 'text-green-400 bg-green-500/20',
};

const AdminCreators = () => {
  const [creators, setCreators] = useState<CreatorPromotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ApprovalStatus | 'all'>('all');

  const fetchCreators = async () => {
    setIsLoading(true);
    let query = supabase.from('creator_promotions').select('*').order('created_at', { ascending: false });
    
    if (filter !== 'all') {
      query = query.eq('approval_status', filter);
    }
    
    const { data, error } = await query;
    
    if (error) {
      toast.error('Failed to load creators');
    } else {
      setCreators(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCreators();
  }, [filter]);

  const updateStatus = async (id: string, status: ApprovalStatus) => {
    const { error } = await supabase
      .from('creator_promotions')
      .update({ approval_status: status })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Creator ${status}`);
      fetchCreators();
    }
  };

  const toggleLive = async (creator: CreatorPromotion) => {
    const { error } = await supabase
      .from('creator_promotions')
      .update({ is_live: !creator.is_live })
      .eq('id', creator.id);

    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(creator.is_live ? 'Removed live status' : 'Set as live');
      fetchCreators();
    }
  };

  const toggleFeatured = async (creator: CreatorPromotion) => {
    const { error } = await supabase
      .from('creator_promotions')
      .update({ is_featured: !creator.is_featured })
      .eq('id', creator.id);

    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(creator.is_featured ? 'Removed featured status' : 'Set as featured');
      fetchCreators();
    }
  };

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  };

  return (
    <AdminLayout title="Creator Promotions">
      <div className="flex gap-2 flex-wrap mb-6">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="aspect-video bg-secondary rounded-lg mb-4" />
              <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
              <div className="h-3 bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : creators.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">No creator submissions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creators.map((creator) => (
            <div
              key={creator.id}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="aspect-video bg-secondary relative">
                {creator.thumbnail_url ? (
                  <img
                    src={creator.thumbnail_url}
                    alt={creator.creator_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${platformColors[creator.platform]}`}>
                    {creator.platform}
                  </span>
                  {creator.is_live && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500 text-white animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[creator.approval_status]}`}>
                    {creator.approval_status}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-1">{creator.creator_name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{creator.submitter_email}</p>

                {/* Channel Link */}
                {creator.channel_url && (
                  <a
                    href={creator.channel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-4"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Channel
                  </a>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {creator.approval_status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(creator.id, 'approved')}
                        className="flex items-center gap-1 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(creator.id, 'rejected')}
                        className="flex items-center gap-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => toggleLive(creator)}
                    className={`p-2 rounded-lg transition-colors ${
                      creator.is_live
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                    title="Toggle Live"
                  >
                    <Wifi className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => toggleFeatured(creator)}
                    className={`p-2 rounded-lg transition-colors ${
                      creator.is_featured
                        ? 'bg-primary/20 text-primary'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                    title="Toggle Featured"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCreators;
