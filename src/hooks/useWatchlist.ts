import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const useWatchlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: watchlist = [], isLoading } = useQuery({
    queryKey: ["watchlist", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("watchlist")
        .select("*, content_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: watchlistIds = [] } = useQuery({
    queryKey: ["watchlist-ids", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("watchlist")
        .select("content_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data?.map((item) => item.content_id) || [];
    },
    enabled: !!user,
  });

  const addToWatchlist = useMutation({
    mutationFn: async (contentId: string) => {
      if (!user) throw new Error("Must be logged in");
      
      const { error } = await supabase
        .from("watchlist")
        .insert({ user_id: user.id, content_id: contentId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["watchlist-ids"] });
      toast.success("Added to My List");
    },
    onError: () => {
      toast.error("Failed to add to list");
    },
  });

  const removeFromWatchlist = useMutation({
    mutationFn: async (contentId: string) => {
      if (!user) throw new Error("Must be logged in");
      
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("content_id", contentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["watchlist-ids"] });
      toast.success("Removed from My List");
    },
    onError: () => {
      toast.error("Failed to remove from list");
    },
  });

  const toggleWatchlist = (contentId: string) => {
    if (watchlistIds.includes(contentId)) {
      removeFromWatchlist.mutate(contentId);
    } else {
      addToWatchlist.mutate(contentId);
    }
  };

  const isInWatchlist = (contentId: string) => watchlistIds.includes(contentId);

  return {
    watchlist,
    watchlistIds,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isInWatchlist,
  };
};
