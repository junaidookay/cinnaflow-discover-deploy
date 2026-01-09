import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Music, ExternalLink, Youtube, Disc3 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type ArtistPromotion = Tables<"artist_promotions">;

const ArtistsPage = () => {
  const { data: artists, isLoading } = useQuery({
    queryKey: ["all-artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_promotions")
        .select("*")
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ArtistPromotion[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold cinna-gold-text">
              Music Artists
            </h1>
            <Link
              to="/submit/artist"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Submit Your Music
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-full" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                </div>
              ))}
            </div>
          ) : artists && artists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {artists.map((artist) => {
                const externalLinks = artist.external_links as Record<string, string | null> | null;
                
                return (
                  <div
                    key={artist.id}
                    className="group text-center"
                  >
                    <div className="relative aspect-square rounded-full overflow-hidden bg-secondary mx-auto mb-3">
                      {artist.thumbnail_url ? (
                        <img
                          src={artist.thumbnail_url}
                          alt={artist.artist_name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                          <Music className="w-12 h-12 text-primary" />
                        </div>
                      )}

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                        {externalLinks?.youtube && (
                          <a
                            href={externalLinks.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-red-600 rounded-full p-2 hover:bg-red-700 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Youtube className="w-4 h-4 text-white" />
                          </a>
                        )}
                        {externalLinks?.spotify && (
                          <a
                            href={externalLinks.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-600 rounded-full p-2 hover:bg-green-700 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Disc3 className="w-4 h-4 text-white" />
                          </a>
                        )}
                      </div>

                      {artist.is_sponsored && (
                        <Badge className="absolute top-2 right-2 text-xs bg-primary">
                          Sponsored
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {artist.artist_name}
                    </h3>

                    {artist.video_embed_url && (
                      <a
                        href={artist.video_embed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mt-1"
                      >
                        Watch Video <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No artists available yet.</p>
              <Link
                to="/submit/artist"
                className="text-primary hover:underline"
              >
                Be the first to submit your music →
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ArtistsPage;