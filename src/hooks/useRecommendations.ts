import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

type ContentItem = Tables<"content_items">;

export const useRecommendations = (currentContentId?: string, tags?: string[]) => {
  const { user } = useAuth();

  // Get similar content based on tags
  const { data: similarContent = [], isLoading: similarLoading } = useQuery({
    queryKey: ["similar-content", currentContentId, tags],
    queryFn: async () => {
      if (!tags || tags.length === 0) return [];

      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("is_published", true)
        .neq("id", currentContentId || "")
        .overlaps("tags", tags)
        .limit(6);

      if (error) throw error;
      return data as ContentItem[];
    },
    enabled: !!tags && tags.length > 0,
  });

  // Get "Because You Watched" based on user's view history
  const { data: becauseYouWatched = [], isLoading: historyLoading } = useQuery({
    queryKey: ["because-you-watched", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get user's recently viewed content
      const { data: recentViews, error: viewsError } = await supabase
        .from("content_views")
        .select("content_id, content_items(tags, content_type)")
        .eq("user_id", user.id)
        .order("viewed_at", { ascending: false })
        .limit(5);

      if (viewsError || !recentViews || recentViews.length === 0) return [];

      // Extract tags from viewed content
      const viewedTags = recentViews
        .flatMap((v: any) => v.content_items?.tags || [])
        .filter(Boolean);
      
      const uniqueTags = [...new Set(viewedTags)];
      const viewedIds = recentViews.map((v) => v.content_id);

      if (uniqueTags.length === 0) return [];

      // Find similar content not yet viewed
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("is_published", true)
        .not("id", "in", `(${viewedIds.join(",")})`)
        .overlaps("tags", uniqueTags)
        .limit(12);

      if (error) throw error;
      return data as ContentItem[];
    },
    enabled: !!user,
  });

  return {
    similarContent,
    becauseYouWatched,
    isLoading: similarLoading || historyLoading,
  };
};
