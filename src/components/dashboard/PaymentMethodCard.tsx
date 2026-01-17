import { useState } from "react";
import { CreditCard, Plus, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface PaymentMethodCardProps {
  showUpgradePrompt?: boolean;
}

const PaymentMethodCard = ({ showUpgradePrompt = false }: PaymentMethodCardProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isStripeReady, setIsStripeReady] = useState(false);

  // Check if Stripe is configured
  useState(() => {
    const publishableKey = localStorage.getItem('stripe_publishable_key');
    setIsStripeReady(!!publishableKey);
  });

  const handleAddPaymentMethod = () => {
    if (!isStripeReady) {
      toast.error("Payment system not configured yet. Please contact support.");
      return;
    }
    
    // In a real implementation, this would open Stripe's payment element
    toast.info("Payment integration coming soon! Stripe checkout will be available once configured by admin.");
  };

  const handleRemovePaymentMethod = (id: string) => {
    setPaymentMethods(methods => methods.filter(m => m.id !== id));
    toast.success("Payment method removed");
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(methods => 
      methods.map(m => ({ ...m, isDefault: m.id === id }))
    );
    toast.success("Default payment method updated");
  };

  const getCardIcon = (brand: string) => {
    // Could add specific card brand icons here
    return <CreditCard className="w-6 h-6 text-primary" />;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Payment Methods</h3>
            <p className="text-sm text-muted-foreground">Manage your payment options</p>
          </div>
        </div>
      </div>

      {!isStripeReady ? (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-400 font-medium">Payment System Setup Required</p>
              <p className="text-xs text-muted-foreground mt-1">
                The payment system is being configured. You'll be able to add payment methods soon.
              </p>
            </div>
          </div>
        </div>
      ) : paymentMethods.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border rounded-lg mb-4">
          <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">No payment methods added</p>
          <Button onClick={handleAddPaymentMethod} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                method.isDefault ? 'border-primary bg-primary/5' : 'border-border bg-secondary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {getCardIcon(method.brand)}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {method.brand} •••• {method.last4}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires {method.expMonth.toString().padStart(2, '0')}/{method.expYear}
                  </p>
                </div>
                {method.isDefault && (
                  <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                    Default
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!method.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(method.id)}
                  >
                    Set Default
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove this payment method? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRemovePaymentMethod(method.id)}>
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          
          <Button
            onClick={handleAddPaymentMethod}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Card
          </Button>
        </div>
      )}

      {showUpgradePrompt && (
        <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm text-foreground font-medium mb-1">
            Unlock Premium Features
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Add a payment method to subscribe to Premium ($5/month) for full content access.
          </p>
          <Button size="sm" className="w-full" onClick={handleAddPaymentMethod}>
            <CreditCard className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodCard;
