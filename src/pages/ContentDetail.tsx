import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Play, ExternalLink, ArrowLeft } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type ContentItem = Database['public']['Tables']['content_items']['Row'];

const ContentDetail = () => {
  const { id } = useParams();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [related, setRelated] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) return;
      
      const { data } = await supabase
        .from('content_items')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      setContent(data);
      
      if (data) {
        const { data: relatedData } = await supabase
          .from('content_items')
          .select('*')
          .eq('content_type', data.content_type)
          .eq('is_published', true)
          .neq('id', id)
          .limit(6);
        
        setRelated(relatedData || []);
      }
      
      setIsLoading(false);
    };

    fetchContent();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Content Not Found</h1>
          <Link to="/" className="text-primary hover:underline">Back to Home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="container mx-auto px-4 md:px-8 py-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Poster */}
            <div className="lg:col-span-1">
              <div className="aspect-[2/3] bg-card rounded-xl overflow-hidden">
                {content.poster_url || content.thumbnail_url ? (
                  <img
                    src={content.poster_url || content.thumbnail_url || ''}
                    alt={content.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-4">
                {content.badges?.map((badge) => (
                  <span key={badge} className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full">
                    {badge}
                  </span>
                ))}
                <span className="px-3 py-1 bg-secondary text-muted-foreground text-sm rounded-full capitalize">
                  {content.content_type}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-display text-foreground mb-4">{content.title}</h1>
              
              {content.description && (
                <p className="text-muted-foreground mb-6 line-clamp-4">{content.description}</p>
              )}

              {content.tags && content.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {content.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-secondary text-foreground text-sm rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                <Play className="w-5 h-5" />
                Watch Now
              </button>

              {/* Video Embed */}
              {content.video_embed_url && (
                <div className="mt-8 aspect-video bg-card rounded-xl overflow-hidden">
                  <iframe
                    src={content.video_embed_url}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Related Content */}
          {related.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-semibold text-foreground mb-6">Related Content</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {related.map((item) => (
                  <Link key={item.id} to={`/content/${item.id}`} className="group">
                    <div className="aspect-video bg-card rounded-lg overflow-hidden mb-2">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full bg-secondary" />
                      )}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{item.title}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContentDetail;
