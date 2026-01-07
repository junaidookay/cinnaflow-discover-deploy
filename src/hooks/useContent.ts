import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type ContentItem = Tables<"content_items">;
type ArtistPromotion = Tables<"artist_promotions">;
type CreatorPromotion = Tables<"creator_promotions">;

// Fetch hero slider content
export const useHeroContent = () => {
  return useQuery({
    queryKey: ["hero-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("is_published", true)
        .not("hero_order", "is", null)
        .order("hero_order", { ascending: true });

      if (error) throw error;
      return data as ContentItem[];
    },
  });
};

// Fetch content by section
export const useContentBySection = (section: "trending" | "recently_added" | "editor_picks") => {
  return useQuery({
    queryKey: ["content", section],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("is_published", true)
        .contains("section_assignments", [section])
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data as ContentItem[];
    },
  });
};

// Fetch approved artists
export const useApprovedArtists = () => {
  return useQuery({
    queryKey: ["approved-artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_promotions")
        .select("*")
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data as ArtistPromotion[];
    },
  });
};

// Fetch approved creators
export const useApprovedCreators = () => {
  return useQuery({
    queryKey: ["approved-creators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_promotions")
        .select("*")
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data as CreatorPromotion[];
    },
  });
};
