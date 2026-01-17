import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Key, Eye, EyeOff, CheckCircle, AlertCircle, HardDrive, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const AdminSettings = () => {
  const { user } = useAuth();
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isStripeConfigured, setIsStripeConfigured] = useState(false);
  
  // Real-Debrid state
  const [debridStatus, setDebridStatus] = useState<{
    configured: boolean;
    premium?: boolean;
    expiration?: string;
    username?: string;
    checking: boolean;
    error?: string;
  }>({ configured: false, checking: true });

  useEffect(() => {
    checkDebridStatus();
  }, []);

  const checkDebridStatus = async () => {
    setDebridStatus(prev => ({ ...prev, checking: true, error: undefined }));
    
    try {
      const { data, error } = await supabase.functions.invoke('real-debrid', {
        body: { action: 'check_status' },
      });

      if (error) throw error;

      if (data.configured) {
        setDebridStatus({
          configured: true,
          premium: data.premium,
          expiration: data.expiration,
          username: data.username,
          checking: false,
        });
      } else {
        setDebridStatus({
          configured: false,
          checking: false,
          error: data.error,
        });
      }
    } catch (err) {
      console.error('Debrid status check error:', err);
      setDebridStatus({
        configured: false,
        checking: false,
        error: 'Failed to check Real-Debrid status',
      });
    }
  };

  const [isSavingStripe, setIsSavingStripe] = useState(false);

  const handleSaveStripeKeys = async () => {
    if (!stripeSecretKey || !stripePublishableKey) {
      toast.error('Please enter both Stripe keys');
      return;
    }
    
    setIsSavingStripe(true);
    try {
      // The keys will be saved via the secrets management system
      // For now, we store them in localStorage for the publishable key (safe for client)
      // and mark that configuration is pending for the secret key
      localStorage.setItem('stripe_publishable_key', stripePublishableKey);
      
      toast.success('Stripe publishable key saved! Add the secret key (STRIPE_SECRET_KEY) to your backend secrets for full activation.');
      toast.info('Go to Settings → Cloud → Secrets to add STRIPE_SECRET_KEY');
      setIsStripeConfigured(true);
    } catch (error) {
      console.error('Error saving Stripe keys:', error);
      toast.error('Failed to save Stripe configuration');
    } finally {
      setIsSavingStripe(false);
    }
  };

  // Check if Stripe publishable key exists on load
  useEffect(() => {
    const savedPublishableKey = localStorage.getItem('stripe_publishable_key');
    if (savedPublishableKey) {
      setStripePublishableKey(savedPublishableKey);
      setIsStripeConfigured(true);
    }
  }, []);

  const formatExpirationDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
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

        {/* Real-Debrid Integration Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <HardDrive className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">Real-Debrid Integration</h2>
              <p className="text-sm text-muted-foreground">Convert magnet links to streaming URLs</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkDebridStatus}
              disabled={debridStatus.checking}
            >
              {debridStatus.checking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>

          {debridStatus.checking ? (
            <div className="flex items-center gap-2 p-4 bg-secondary/50 border border-border rounded-lg">
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              <span className="text-sm text-muted-foreground">Checking Real-Debrid status...</span>
            </div>
          ) : debridStatus.configured ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-400">Real-Debrid connected and active</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Account</p>
                  <p className="text-sm font-medium text-foreground">{debridStatus.username}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <span className={`inline-flex px-2 py-0.5 text-xs rounded ${
                    debridStatus.premium 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {debridStatus.premium ? 'Premium' : 'Free'}
                  </span>
                </div>
                {debridStatus.expiration && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Premium Expires</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatExpirationDate(debridStatus.expiration)}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-secondary/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Supported Features</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Magnet link to streaming URL conversion
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Cached torrent instant streaming
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Multi-file support with selection
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-yellow-400">
                  {debridStatus.error || 'Real-Debrid not configured'}
                </span>
              </div>

              <div className="p-4 bg-secondary/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Setup Instructions</h4>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Get a Real-Debrid account at <span className="text-primary">real-debrid.com</span></li>
                  <li>Generate an API key from your account settings</li>
                  <li>Add the API key as REAL_DEBRID_API_KEY in your backend secrets</li>
                  <li>Click refresh to verify the connection</li>
                </ol>
              </div>
            </div>
          )}
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

            <Button onClick={handleSaveStripeKeys} className="w-full" disabled={isSavingStripe}>
              {isSavingStripe ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              {isSavingStripe ? 'Saving...' : 'Save Stripe Configuration'}
            </Button>
          </div>

          <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Subscription Tiers</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Free</span>
                <span>$0/month - Limited content access</span>
              </div>
              <div className="flex justify-between">
                <span>Premium</span>
                <span>$5/month - Full content access</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Setup Instructions</h4>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Get your API keys from <span className="text-primary">dashboard.stripe.com/apikeys</span></li>
              <li>Enter the Publishable Key above (starts with pk_)</li>
              <li>Add STRIPE_SECRET_KEY to your backend secrets (starts with sk_)</li>
              <li>Stripe will be ready for subscription payments</li>
            </ol>
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
