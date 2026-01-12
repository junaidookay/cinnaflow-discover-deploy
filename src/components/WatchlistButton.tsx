import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WatchlistButtonProps {
  contentId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-3",
};

const iconSizes = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const WatchlistButton = ({ contentId, className, size = "md" }: WatchlistButtonProps) => {
  const { user } = useAuth();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const isAdded = isInWatchlist(contentId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to add to your list");
      return;
    }
    
    toggleWatchlist(contentId);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className={cn(
        "rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors",
        sizeClasses[size],
        className
      )}
      aria-label={isAdded ? "Remove from My List" : "Add to My List"}
    >
      <Heart
        className={cn(
          iconSizes[size],
          isAdded ? "fill-primary text-primary" : "text-foreground"
        )}
      />
    </motion.button>
  );
};

export default WatchlistButton;
