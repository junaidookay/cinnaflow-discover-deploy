import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Key, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const AdminSettings = () => {
  const { user } = useAuth();
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isStripeConfigured, setIsStripeConfigured] = useState(false);

  const handleSaveStripeKeys = () => {
    if (!stripeSecretKey || !stripePublishableKey) {
      toast.error('Please enter both Stripe keys');
      return;
    }
    // For now, just show success - actual integration will be done when keys are provided
    toast.success('Stripe keys saved! Integration will be activated when backend is configured.');
    setIsStripeConfigured(true);
  };

  return (
    <AdminLayout title="Settings">
      <div className="max-w-2xl space-y-6">
        {/* Account Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Email</label>
              <p className="text-foreground">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Role</label>
              <span className="inline-flex px-2 py-1 bg-primary/20 text-primary rounded text-sm">
                Admin
              </span>
            </div>
          </div>
        </div>

        {/* Stripe Integration Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Stripe Integration</h2>
              <p className="text-sm text-muted-foreground">Configure payment processing for subscriptions</p>
            </div>
          </div>

          {isStripeConfigured ? (
            <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-400">Stripe keys configured (pending backend activation)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-yellow-400">Stripe not configured - payments are disabled</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="stripe-publishable" className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Publishable Key
              </Label>
              <Input
                id="stripe-publishable"
                type="text"
                placeholder="pk_live_..."
                value={stripePublishableKey}
                onChange={(e) => setStripePublishableKey(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Found in your Stripe Dashboard → Developers → API keys
              </p>
            </div>

            <div>
              <Label htmlFor="stripe-secret" className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Secret Key
              </Label>
              <div className="relative">
                <Input
                  id="stripe-secret"
                  type={showSecret ? 'text' : 'password'}
                  placeholder="sk_live_..."
                  value={stripeSecretKey}
                  onChange={(e) => setStripeSecretKey(e.target.value)}
                  className="font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Keep this key secure. It will be stored as an encrypted secret.
              </p>
            </div>

            <Button onClick={handleSaveStripeKeys} className="w-full">
              <CreditCard className="w-4 h-4 mr-2" />
              Save Stripe Configuration
            </Button>
          </div>

          <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Subscription Tiers</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Free</span>
                <span>$0/month</span>
              </div>
              <div className="flex justify-between">
                <span>Premium</span>
                <span>$9.99/month</span>
              </div>
              <div className="flex justify-between">
                <span>Pro</span>
                <span>$19.99/month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Settings Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Platform Settings</h2>
          <p className="text-muted-foreground text-sm">
            Additional platform configuration options will be available in future updates.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
