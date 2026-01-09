import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Play, Clock, Heart, TrendingUp } from "lucide-react";

const ViewerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold cinna-gold-text mb-2">
              Welcome back!
            </h1>
            <p className="text-muted-foreground">
              {user?.email}
            </p>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <Link
              to="/movies"
              className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-colors group"
            >
              <Play className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                Browse Movies
              </h3>
              <p className="text-sm text-muted-foreground">
                Discover new films
              </p>
            </Link>

            <Link
              to="/tv"
              className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-colors group"
            >
              <TrendingUp className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                TV Shows
              </h3>
              <p className="text-sm text-muted-foreground">
                Catch up on series
              </p>
            </Link>

            <Link
              to="/artists"
              className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-colors group"
            >
              <Heart className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                Music Artists
              </h3>
              <p className="text-sm text-muted-foreground">
                Find new music
              </p>
            </Link>

            <Link
              to="/creators"
              className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-colors group"
            >
              <Clock className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                Creators
              </h3>
              <p className="text-sm text-muted-foreground">
                Watch streams
              </p>
            </Link>
          </div>

          {/* Upgrade prompt */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Are you an artist or creator?</h3>
            <p className="text-muted-foreground mb-4">
              Switch to an artist or creator account to access promotion tools and reach a wider audience.
            </p>
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Update Account Type
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ViewerDashboard;