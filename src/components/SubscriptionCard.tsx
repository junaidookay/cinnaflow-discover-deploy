import { Check, Crown, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SubscriptionTier, subscriptionTiers } from "@/hooks/useSubscription";

interface SubscriptionCardProps {
  tier: SubscriptionTier;
  currentTier: SubscriptionTier;
  onSelect: (tier: SubscriptionTier) => void;
  isLoading?: boolean;
}

const tierIcons = {
  free: Zap,
  premium: Crown,
  pro: Sparkles,
};

const SubscriptionCard = ({ tier, currentTier, onSelect, isLoading }: SubscriptionCardProps) => {
  const tierInfo = subscriptionTiers[tier];
  const Icon = tierIcons[tier];
  const isCurrentTier = tier === currentTier;
  const isPremiumTier = tier !== "free";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 transition-all duration-300",
        isPremiumTier && tier === "premium"
          ? "border-primary bg-gradient-to-b from-primary/10 to-transparent scale-105 shadow-xl shadow-primary/20"
          : "border-border bg-card hover:border-primary/50",
        isCurrentTier && "ring-2 ring-primary"
      )}
    >
      {tier === "premium" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
            <Sparkles className="w-3 h-3" />
            Best Value
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "p-2 rounded-lg",
          isPremiumTier ? "bg-primary/20" : "bg-secondary"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            isPremiumTier ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{tierInfo.name}</h3>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-foreground">{tierInfo.price}</span>
            <span className="text-muted-foreground text-sm">{tierInfo.period}</span>
          </div>
        </div>
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {tierInfo.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className={cn(
              "w-4 h-4 shrink-0 mt-0.5",
              isPremiumTier ? "text-primary" : "text-muted-foreground"
            )} />
            <span className="text-sm text-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => onSelect(tier)}
        disabled={isCurrentTier || isLoading}
        className={cn(
          "w-full",
          isCurrentTier
            ? "bg-secondary text-foreground cursor-not-allowed"
            : isPremiumTier
            ? "bg-primary hover:bg-primary/90"
            : "bg-secondary hover:bg-secondary/80 text-foreground"
        )}
      >
        {isCurrentTier ? "Current Plan" : isPremiumTier ? "Upgrade Now" : "Downgrade"}
      </Button>
    </div>
  );
};

export default SubscriptionCard;
