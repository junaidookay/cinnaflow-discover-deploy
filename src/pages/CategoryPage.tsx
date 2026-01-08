import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type ContentItem = Tables<"content_items">;

const categoryConfig: Record<string, { title: string; type: "movie" | "tv" | "sports" | "clip" }> = {
  "/movies": { title: "Movies", type: "movie" },
  "/tv": { title: "TV Shows", type: "tv" },
  "/sports": { title: "Sports", type: "sports" },
  "/clips": { title: "Clips", type: "clip" },
};

const CategoryPage = () => {
  const location = useLocation();
  const config = categoryConfig[location.pathname];

  const { data: content, isLoading } = useQuery({
    queryKey: ["category-content", config?.type],
    queryFn: async () => {
      if (!config) return [];
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("content_type", config.type)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ContentItem[];
    },
    enabled: !!config,
  });

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Category not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-8 cinna-gold-text">
            {config.title}
          </h1>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[2/3] rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : content && content.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {content.map((item) => (
                <Link
                  key={item.id}
                  to={`/content/${item.id}`}
                  className="group relative"
                >
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-secondary">
                    {item.poster_url || item.thumbnail_url ? (
                      <img
                        src={item.poster_url || item.thumbnail_url || ""}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <Play className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-primary rounded-full p-3">
                        <Play className="w-6 h-6 text-primary-foreground" />
                      </div>
                    </div>

                    {/* Badges */}
                    {item.badges && item.badges.length > 0 && (
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {item.badges.map((badge) => (
                          <Badge
                            key={badge}
                            variant={badge === "trending" ? "default" : "secondary"}
                            className="text-xs capitalize"
                          >
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <h3 className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  {item.tags && item.tags.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {item.tags.slice(0, 2).join(" • ")}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No {config.title.toLowerCase()} available yet.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
