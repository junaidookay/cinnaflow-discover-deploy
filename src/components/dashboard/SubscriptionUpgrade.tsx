import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, subscriptionTiers, SubscriptionTier } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionUpgradeProps {
  variant?: 'compact' | 'full';
}

const SubscriptionUpgrade = ({ variant = 'full' }: SubscriptionUpgradeProps) => {
  const { user } = useAuth();
  const { currentTier, isPremium, isPro } = useSubscription();
  const [isLoading, setIsLoading] = useState<SubscriptionTier | null>(null);

  const handleCheckout = async (tier: 'premium' | 'pro') => {
    if (!user) {
      toast.error('Please sign in to upgrade');
      return;
    }

    setIsLoading(tier);

    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          tier,
          userId: user.id,
          email: user.email,
          successUrl: `${window.location.origin}/dashboard?success=true&tier=${tier}`,
          cancelUrl: `${window.location.origin}/subscription?canceled=true`,
        },
      });

      if (error) throw error;

      if (data.error) {
        if (data.error === 'Stripe not configured') {
          toast.error('Payment system is being set up. Please try again later.');
        } else {
          toast.error(data.error);
        }
        return;
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  // Already on Pro - no upgrade needed
  if (isPro) {
    return (
      <div className="bg-gradient-to-r from-primary/20 to-amber-500/10 border border-primary/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Crown className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-semibold">Pro Member</h3>
        </div>
        <p className="text-muted-foreground text-sm">
          You have access to all premium features. Thank you for your support!
        </p>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        {!isPremium && (
          <Button
            onClick={() => handleCheckout('premium')}
            disabled={isLoading !== null}
            className="gap-2"
          >
            {isLoading === 'premium' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Upgrade to Premium - $5/mo
          </Button>
        )}
        <Button
          onClick={() => handleCheckout('pro')}
          disabled={isLoading !== null}
          variant={isPremium ? 'default' : 'outline'}
          className="gap-2"
        >
          {isLoading === 'pro' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Crown className="w-4 h-4" />
          )}
          {isPremium ? 'Upgrade to Pro - $19.99/mo' : 'Go Pro - $19.99/mo'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        Upgrade Your Experience
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Premium Card */}
        {!isPremium && (
          <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">{subscriptionTiers.premium.name}</h4>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">$5</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>
            </div>
            
            <ul className="space-y-2 mb-4">
              {subscriptionTiers.premium.features.slice(0, 4).map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleCheckout('premium')}
              disabled={isLoading !== null}
              className="w-full gap-2"
            >
              {isLoading === 'premium' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Get Premium
            </Button>
          </div>
        )}

        {/* Pro Card */}
        <div className={`bg-gradient-to-br from-primary/10 to-amber-500/5 border border-primary/30 rounded-xl p-5 ${isPremium ? 'md:col-span-2 max-w-md' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{subscriptionTiers.pro.name}</h4>
              <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                Best Value
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">$19.99</span>
              <span className="text-muted-foreground text-sm">/mo</span>
            </div>
          </div>
          
          <ul className="space-y-2 mb-4">
            {subscriptionTiers.pro.features.slice(0, 5).map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          <Button
            onClick={() => handleCheckout('pro')}
            disabled={isLoading !== null}
            className="w-full gap-2 bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90"
          >
            {isLoading === 'pro' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Crown className="w-4 h-4" />
            )}
            {isPremium ? 'Upgrade to Pro' : 'Go Pro'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Secure payment powered by Stripe. Cancel anytime.
      </p>
    </div>
  );
};

export default SubscriptionUpgrade;
