import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Eye, MousePointer, Play, Share2, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalyticsDashboardProps {
  promotionIds: string[];
  promotionType: 'artist' | 'creator';
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const AnalyticsDashboard = ({ promotionIds, promotionType }: AnalyticsDashboardProps) => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['promotion-analytics', promotionIds, promotionType],
    queryFn: async () => {
      if (!promotionIds.length) return [];
      
      const { data, error } = await supabase
        .from('promotion_analytics')
        .select('*')
        .in('promotion_id', promotionIds)
        .eq('promotion_type', promotionType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: promotionIds.length > 0,
  });

  const stats = useMemo(() => {
    if (!analytics?.length) {
      return {
        totalViews: 0,
        totalClicks: 0,
        totalPlays: 0,
        totalShares: 0,
        dailyData: [],
        eventBreakdown: [],
      };
    }

    const counts = {
      view: 0,
      click: 0,
      play: 0,
      share: 0,
    };

    const dailyMap = new Map<string, { date: string; views: number; clicks: number; plays: number }>();

    analytics.forEach((event) => {
      counts[event.event_type as keyof typeof counts]++;
      
      const date = new Date(event.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      const existing = dailyMap.get(date) || { date, views: 0, clicks: 0, plays: 0 };
      if (event.event_type === 'view') existing.views++;
      if (event.event_type === 'click') existing.clicks++;
      if (event.event_type === 'play') existing.plays++;
      dailyMap.set(date, existing);
    });

    const dailyData = Array.from(dailyMap.values()).slice(-7).reverse();
    
    const eventBreakdown = [
      { name: 'Views', value: counts.view },
      { name: 'Clicks', value: counts.click },
      { name: 'Plays', value: counts.play },
      { name: 'Shares', value: counts.share },
    ].filter(e => e.value > 0);

    return {
      totalViews: counts.view,
      totalClicks: counts.click,
      totalPlays: counts.play,
      totalShares: counts.share,
      dailyData,
      eventBreakdown,
    };
  }, [analytics]);

  const engagementRate = stats.totalViews > 0 
    ? ((stats.totalClicks + stats.totalPlays) / stats.totalViews * 100).toFixed(1)
    : '0';

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalViews}</p>
                <p className="text-xs text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MousePointer className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalClicks}</p>
                <p className="text-xs text-muted-foreground">Total Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Play className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalPlays}</p>
                <p className="text-xs text-muted-foreground">Total Plays</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{engagementRate}%</p>
                <p className="text-xs text-muted-foreground">Engagement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Last 7 Days Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicks" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No activity data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              Event Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.eventBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.eventBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.eventBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No events recorded yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;