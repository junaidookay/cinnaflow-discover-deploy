import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Play } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContentCard from "@/components/ContentCard";
import WatchlistButton from "@/components/WatchlistButton";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const MyList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { watchlist, isLoading } = useWatchlist();

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-8 h-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-display text-foreground">My List</h1>
            </div>
            <p className="text-muted-foreground">
              Your saved movies, shows, and more
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-lg" />
              ))}
            </div>
          ) : watchlist.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="p-6 rounded-full bg-card border border-border mb-6">
                <Heart className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Your list is empty
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Start adding movies and shows to your list by clicking the heart icon on any content
              </p>
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                <Play className="w-5 h-5" />
                Browse Content
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
            >
              {watchlist.map((item: any) => (
                <div key={item.id} className="relative group">
                  <ContentCard
                    title={item.content_items?.title || "Untitled"}
                    image={item.content_items?.thumbnail_url || "/placeholder.svg"}
                    onClick={() => navigate(`/content/${item.content_id}`)}
                  />
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <WatchlistButton contentId={item.content_id} size="sm" />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default MyList;
