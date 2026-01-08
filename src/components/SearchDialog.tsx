import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Play, Film, Tv, Trophy, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

type ContentItem = Tables<"content_items">;

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const contentTypeIcons: Record<string, React.ReactNode> = {
  movie: <Film className="w-4 h-4" />,
  tv: <Tv className="w-4 h-4" />,
  sports: <Trophy className="w-4 h-4" />,
  clip: <Video className="w-4 h-4" />,
};

const SearchDialog = ({ open, onOpenChange }: SearchDialogProps) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const navigate = useNavigate();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("is_published", true)
        .ilike("title", `%${debouncedQuery}%`)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as ContentItem[];
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleSelect = (id: string) => {
    onOpenChange(false);
    setQuery("");
    navigate(`/content/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="sr-only">Search Content</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search movies, TV shows, sports, clips..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 text-lg border-0 focus-visible:ring-0 bg-transparent"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="p-4 pt-2 max-h-[60vh] overflow-y-auto">
          {query.length < 2 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Type at least 2 characters to search
            </p>
          ) : isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                  <div className="w-16 h-10 bg-secondary rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-secondary rounded w-1/2" />
                    <div className="h-3 bg-secondary rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : results && results.length > 0 ? (
            <div className="space-y-1">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                >
                  <div className="w-16 h-10 rounded overflow-hidden bg-secondary flex-shrink-0">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {contentTypeIcons[item.content_type]}
                      <span className="capitalize">{item.content_type}</span>
                    </div>
                  </div>
                  {item.badges && item.badges.length > 0 && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {item.badges[0]}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          ) : debouncedQuery.length >= 2 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No results found for "{debouncedQuery}"
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;
