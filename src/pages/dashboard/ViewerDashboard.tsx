import { Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentMethodCard from "@/components/dashboard/PaymentMethodCard";
import SubscriptionUpgrade from "@/components/dashboard/SubscriptionUpgrade";
import { Play, Heart, TrendingUp, Crown, CheckCircle, List } from "lucide-react";
import { toast } from "sonner";

const ViewerDashboard = () => {
  const { user } = useAuth();
  const { currentTier, isPremium, isPro, tierDetails } = useSubscription();
  const [searchParams] = useSearchParams();

  // Handle successful checkout redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const tier = searchParams.get('tier');
    
    if (success === 'true' && tier) {
      toast.success(`Welcome to ${tier.charAt(0).toUpperCase() + tier.slice(1)}! Your subscription is now active.`);
      // Clear the URL params
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

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

          {/* Subscription Status Card */}
          <div className={`mb-8 rounded-xl p-6 border ${
            isPro 
              ? 'bg-gradient-to-r from-primary/20 to-amber-500/10 border-primary/30' 
              : isPremium 
                ? 'bg-gradient-to-r from-primary/15 to-primary/5 border-primary/20'
                : 'bg-card border-border'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-full ${isPremium ? 'bg-primary/20' : 'bg-secondary'}`}>
                  <Crown className={`w-5 h-5 ${isPremium ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{tierDetails.name} Plan</h3>
                    {isPremium && (
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isPro 
                      ? 'Full access to all premium features' 
                      : isPremium 
                        ? 'Ad-free viewing with HD streaming'
                        : 'Basic access with ads'}
                  </p>
                </div>
              </div>
            </div>

            {/* Current tier features */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex flex-wrap gap-3">
                {tierDetails.features.slice(0, 3).map((feature, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-primary" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upgrade Section - only show if not Pro */}
          {!isPro && (
            <div className="mb-8">
              <SubscriptionUpgrade />
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <Link
              to="/my-list"
              className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-colors group"
            >
              <List className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                My Watchlist
              </h3>
              <p className="text-sm text-muted-foreground">
                Your saved content
              </p>
            </Link>

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
          </div>

          {/* Payment Methods & Account Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PaymentMethodCard showUpgradePrompt={!isPremium} />
            
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ViewerDashboard;