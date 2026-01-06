import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, ExternalLink, Calendar, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type ArtistPromotion = Database['public']['Tables']['artist_promotions']['Row'];
type ApprovalStatus = Database['public']['Enums']['approval_status'];

const AdminArtists = () => {
  const [artists, setArtists] = useState<ArtistPromotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ApprovalStatus | 'all'>('all');

  const fetchArtists = async () => {
    setIsLoading(true);
    let query = supabase.from('artist_promotions').select('*').order('created_at', { ascending: false });
    
    if (filter !== 'all') {
      query = query.eq('approval_status', filter);
    }
    
    const { data, error } = await query;
    
    if (error) {
      toast.error('Failed to load artists');
    } else {
      setArtists(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchArtists();
  }, [filter]);

  const updateStatus = async (id: string, status: ApprovalStatus) => {
    const { error } = await supabase
      .from('artist_promotions')
      .update({ approval_status: status })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Artist ${status}`);
      fetchArtists();
    }
  };

  const toggleSponsored = async (artist: ArtistPromotion) => {
    const { error } = await supabase
      .from('artist_promotions')
      .update({ is_sponsored: !artist.is_sponsored })
      .eq('id', artist.id);

    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(artist.is_sponsored ? 'Removed sponsor badge' : 'Added sponsor badge');
      fetchArtists();
    }
  };

  const updatePlacement = async (id: string, placement: string) => {
    const artist = artists.find((a) => a.id === id);
    if (!artist) return;

    const currentPlacements = artist.placement_locations || [];
    const hasPlacement = currentPlacements.includes(placement);
    const newPlacements = hasPlacement
      ? currentPlacements.filter((p) => p !== placement)
      : [...currentPlacements, placement];

    const { error } = await supabase
      .from('artist_promotions')
      .update({ placement_locations: newPlacements })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update placement');
    } else {
      toast.success(`Placement ${hasPlacement ? 'removed' : 'added'}`);
      fetchArtists();
    }
  };

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  };

  return (
    <AdminLayout title="Artist Promotions">
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
              <div className="aspect-square bg-secondary rounded-lg mb-4" />
              <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
              <div className="h-3 bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : artists.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">No artist submissions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {artists.map((artist) => (
            <div
              key={artist.id}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="aspect-square bg-secondary relative">
                {artist.thumbnail_url ? (
                  <img
                    src={artist.thumbnail_url}
                    alt={artist.artist_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[artist.approval_status]}`}>
                    {artist.approval_status}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-1">{artist.artist_name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{artist.submitter_email}</p>

                {/* External Links */}
                <div className="flex gap-2 mb-4">
                  {artist.external_links && typeof artist.external_links === 'object' && (
                    <>
                      {(artist.external_links as any).youtube && (
                        <a
                          href={(artist.external_links as any).youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {(artist.external_links as any).spotify && (
                        <a
                          href={(artist.external_links as any).spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </>
                  )}
                </div>

                {/* Placements */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Placements:</p>
                  <div className="flex gap-1 flex-wrap">
                    {['homepage', 'in-feed'].map((placement) => (
                      <button
                        key={placement}
                        onClick={() => updatePlacement(artist.id, placement)}
                        className={`px-2 py-1 rounded text-xs transition-colors ${
                          artist.placement_locations?.includes(placement)
                            ? 'bg-primary/20 text-primary'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {placement}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {artist.approval_status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(artist.id, 'approved')}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(artist.id, 'rejected')}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => toggleSponsored(artist)}
                    className={`p-2 rounded-lg transition-colors ${
                      artist.is_sponsored
                        ? 'bg-primary/20 text-primary'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                    title="Toggle Sponsored"
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

export default AdminArtists;
