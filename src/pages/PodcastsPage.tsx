import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContentCard from "@/components/ContentCard";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Radio } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  content_type: string;
  tags: string[] | null;
  video_embed_url: string | null;
}

const PodcastsPage = () => {
  const [podcasts, setPodcasts] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        // Fetch content items tagged with 'podcast'
        const { data, error } = await supabase
          .from('content_items')
          .select('*')
          .eq('is_published', true)
          .contains('tags', ['podcast'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPodcasts(data || []);
      } catch (err) {
        console.error('Error fetching podcasts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPodcasts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Radio className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Podcasts</h1>
              <p className="text-muted-foreground">Discover interesting conversations and shows</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : podcasts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {podcasts.map((podcast) => (
                <Link key={podcast.id} to={`/content/${podcast.id}`}>
                  <ContentCard
                    id={podcast.id}
                    title={podcast.title}
                    image={podcast.thumbnail_url || '/placeholder.svg'}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Radio className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h2 className="text-xl font-semibold text-muted-foreground mb-2">No podcasts yet</h2>
              <p className="text-muted-foreground">
                Check back soon for new podcast content!
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PodcastsPage;
