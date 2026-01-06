import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Film, Music, Users, Clock } from 'lucide-react';

interface Stats {
  totalContent: number;
  pendingArtists: number;
  pendingCreators: number;
  publishedContent: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalContent: 0,
    pendingArtists: 0,
    pendingCreators: 0,
    publishedContent: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [contentResult, artistsResult, creatorsResult, publishedResult] = await Promise.all([
          supabase.from('content_items').select('id', { count: 'exact', head: true }),
          supabase.from('artist_promotions').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending'),
          supabase.from('creator_promotions').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending'),
          supabase.from('content_items').select('id', { count: 'exact', head: true }).eq('is_published', true),
        ]);

        setStats({
          totalContent: contentResult.count || 0,
          pendingArtists: artistsResult.count || 0,
          pendingCreators: creatorsResult.count || 0,
          publishedContent: publishedResult.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Content', value: stats.totalContent, icon: Film, color: 'text-blue-400' },
    { label: 'Published', value: stats.publishedContent, icon: Film, color: 'text-green-400' },
    { label: 'Pending Artists', value: stats.pendingArtists, icon: Music, color: 'text-yellow-400' },
    { label: 'Pending Creators', value: stats.pendingCreators, icon: Users, color: 'text-purple-400' },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className={`w-8 h-8 ${stat.color}`} />
                {isLoading ? (
                  <div className="h-8 w-16 bg-secondary animate-pulse rounded" />
                ) : (
                  <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            <a
              href="/admin/content"
              className="block p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <p className="font-medium text-foreground">Add New Content</p>
              <p className="text-sm text-muted-foreground">Create movies, TV shows, sports, or clips</p>
            </a>
            <a
              href="/admin/artists"
              className="block p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <p className="font-medium text-foreground">Review Artist Submissions</p>
              <p className="text-sm text-muted-foreground">{stats.pendingArtists} pending reviews</p>
            </a>
            <a
              href="/admin/creators"
              className="block p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <p className="font-medium text-foreground">Review Creator Submissions</p>
              <p className="text-sm text-muted-foreground">{stats.pendingCreators} pending reviews</p>
            </a>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Platform Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <span className="text-muted-foreground">Content Published</span>
              <span className="text-foreground font-medium">{stats.publishedContent}/{stats.totalContent}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <span className="text-muted-foreground">Artist Promotions</span>
              <span className="text-yellow-400 font-medium">{stats.pendingArtists} pending</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <span className="text-muted-foreground">Creator Promotions</span>
              <span className="text-purple-400 font-medium">{stats.pendingCreators} pending</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
