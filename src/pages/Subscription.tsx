import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, Shield, Zap, Play, Download, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscriptionCard from "@/components/SubscriptionCard";
import { useSubscription, SubscriptionTier } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const benefits = [
  {
    icon: Play,
    title: "Ad-Free Viewing",
    description: "Enjoy uninterrupted streaming without any ads",
  },
  {
    icon: Zap,
    title: "Early Access",
    description: "Be the first to watch new releases and exclusive content",
  },
  {
    icon: Download,
    title: "Offline Downloads",
    description: "Download your favorites and watch anywhere",
  },
  {
    icon: Star,
    title: "Premium Quality",
    description: "Stream in stunning HD and 4K Ultra HD",
  },
];

const Subscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTier, createSubscription, isLoading } = useSubscription();

  const handleSelectTier = (tier: SubscriptionTier) => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      navigate("/auth");
      return;
    }

    // For now, directly update subscription (Stripe integration can be added later)
    if (tier === "free") {
      createSubscription.mutate(tier);
    } else {
      // Show coming soon for paid tiers until Stripe is connected
      toast.info("Payment integration coming soon! For now, enjoy your current tier.");
      // When Stripe is ready: createSubscription.mutate(tier);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-primary font-medium">Premium Memberships</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display text-foreground mb-4">
              Unlock the Full <span className="cinna-gold-text">Experience</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that's right for you. Upgrade anytime to enjoy ad-free streaming,
              early access, and exclusive content.
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
          >
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-4 rounded-xl bg-card border border-border"
              >
                <div className="p-3 rounded-full bg-primary/10 mb-3">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{benefit.title}</h3>
                <p className="text-xs text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </motion.div>

          {/* Pricing Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16"
          >
            <SubscriptionCard
              tier="free"
              currentTier={currentTier}
              onSelect={handleSelectTier}
              isLoading={createSubscription.isPending}
            />
            <SubscriptionCard
              tier="premium"
              currentTier={currentTier}
              onSelect={handleSelectTier}
              isLoading={createSubscription.isPending}
            />
            <SubscriptionCard
              tier="pro"
              currentTier={currentTier}
              onSelect={handleSelectTier}
              isLoading={createSubscription.isPending}
            />
          </motion.div>

          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-6 text-muted-foreground text-sm"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>Satisfaction guaranteed</span>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default Subscription;
