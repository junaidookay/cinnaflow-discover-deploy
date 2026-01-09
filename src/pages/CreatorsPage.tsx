import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Video, ExternalLink, Twitch, Youtube } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type CreatorPromotion = Tables<"creator_promotions">;

const platformIcons: Record<string, React.ReactNode> = {
  twitch: <Twitch className="w-4 h-4" />,
  youtube: <Youtube className="w-4 h-4" />,
  kick: <Video className="w-4 h-4" />,
};

const platformColors: Record<string, string> = {
  twitch: "bg-purple-600 hover:bg-purple-700",
  youtube: "bg-red-600 hover:bg-red-700",
  kick: "bg-green-600 hover:bg-green-700",
};

const CreatorsPage = () => {
  const { data: creators, isLoading } = useQuery({
    queryKey: ["all-creators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_promotions")
        .select("*")
        .eq("approval_status", "approved")
        .order("is_live", { ascending: false })
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CreatorPromotion[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold cinna-gold-text">
              Creators & Streamers
            </h1>
            <Link
              to="/submit/creator"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Submit Your Channel
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-video rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : creators && creators.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {creators.map((creator) => (
                <div key={creator.id} className="group">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary">
                    {creator.thumbnail_url ? (
                      <img
                        src={creator.thumbnail_url}
                        alt={creator.creator_name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <Video className="w-12 h-12 text-primary" />
                      </div>
                    )}

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      {creator.channel_url && (
                        <a
                          href={creator.channel_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`rounded-full p-3 ${platformColors[creator.platform] || "bg-primary hover:bg-primary/90"} transition-colors`}
                        >
                          {platformIcons[creator.platform] || <Video className="w-5 h-5" />}
                        </a>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {creator.is_live && (
                        <Badge className="bg-red-600 text-white text-xs animate-pulse">
                          LIVE
                        </Badge>
                      )}
                      {creator.is_featured && (
                        <Badge className="bg-primary text-xs">
                          Featured
                        </Badge>
                      )}
                    </div>

                    {/* Platform badge */}
                    <Badge 
                      className={`absolute bottom-2 right-2 text-xs capitalize ${
                        creator.platform === "twitch" ? "bg-purple-600" :
                        creator.platform === "youtube" ? "bg-red-600" :
                        "bg-green-600"
                      }`}
                    >
                      {creator.platform}
                    </Badge>
                  </div>

                  <h3 className="mt-2 font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {creator.creator_name}
                  </h3>

                  {creator.channel_url && (
                    <a
                      href={creator.channel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mt-1"
                    >
                      Visit Channel <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No creators available yet.</p>
              <Link
                to="/submit/creator"
                className="text-primary hover:underline"
              >
                Be the first to submit your channel →
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreatorsPage;