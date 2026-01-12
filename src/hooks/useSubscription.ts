import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type SubscriptionTier = "free" | "premium" | "pro";

interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  is_active: boolean;
  started_at: string;
  expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export const subscriptionTiers = {
  free: {
    name: "Free",
    price: "$0",
    period: "/month",
    features: [
      "Access to all content with ads",
      "Standard quality streaming",
      "Basic watchlist",
    ],
  },
  premium: {
    name: "Premium",
    price: "$9.99",
    period: "/month",
    features: [
      "Ad-free viewing experience",
      "HD quality streaming",
      "Early access to new releases",
      "Priority watchlist",
      "Download for offline viewing",
    ],
  },
  pro: {
    name: "Pro",
    price: "$19.99",
    period: "/month",
    features: [
      "Everything in Premium",
      "4K Ultra HD streaming",
      "Exclusive behind-the-scenes content",
      "Creator early access",
      "VIP support",
      "Multiple profiles",
    ],
  },
};

export const useSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user,
  });

  const createSubscription = useMutation({
    mutationFn: async (tier: SubscriptionTier) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          tier,
          is_active: true,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast.success(`Upgraded to ${subscriptionTiers[data.tier as SubscriptionTier].name}!`);
    },
    onError: () => {
      toast.error("Failed to update subscription");
    },
  });

  const currentTier = subscription?.tier || "free";
  const isPremium = currentTier === "premium" || currentTier === "pro";
  const isPro = currentTier === "pro";

  return {
    subscription,
    currentTier,
    isPremium,
    isPro,
    isLoading,
    createSubscription,
    tierDetails: subscriptionTiers[currentTier],
  };
};
