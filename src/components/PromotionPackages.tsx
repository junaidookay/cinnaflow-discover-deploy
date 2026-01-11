import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import PricingCard from './PricingCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

interface Package {
  id: string;
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  popular?: boolean;
}

interface PromotionPackagesProps {
  type: 'artist' | 'creator';
  showQuickPurchase?: boolean;
}

const artistPackages: Package[] = [
  {
    id: 'artist-starter',
    name: 'Starter',
    price: '$29',
    period: '/week',
    description: 'Perfect for emerging artists',
    features: [
      'Featured Artists section placement',
      'Sponsored badge on content',
      '7-day promotion period',
      'External link to YouTube/Spotify',
    ],
  },
  {
    id: 'artist-pro',
    name: 'Pro',
    price: '$79',
    period: '/week',
    description: 'Maximum exposure for your music',
    features: [
      'Everything in Starter',
      'Homepage hero rotation',
      'Priority placement in feed',
      '14-day promotion period',
      'Analytics dashboard access',
    ],
    popular: true,
  },
  {
    id: 'artist-enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For labels and agencies',
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'Custom promotion duration',
      'Multi-artist campaigns',
      'Advanced analytics & reports',
    ],
  },
];

const creatorPackages: Package[] = [
  {
    id: 'creator-starter',
    name: 'Starter',
    price: '$39',
    period: '/week',
    description: 'Boost your channel visibility',
    features: [
      'Featured Creators section placement',
      'Platform badge display',
      '7-day promotion period',
      'Direct channel link',
    ],
  },
  {
    id: 'creator-pro',
    name: 'Pro',
    price: '$99',
    period: '/week',
    description: 'Go live with maximum impact',
    features: [
      'Everything in Starter',
      'Live Now section priority',
      'Homepage featured slot',
      '14-day promotion period',
      'Real-time stream notifications',
    ],
    popular: true,
  },
  {
    id: 'creator-enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For agencies and networks',
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'Custom promotion duration',
      'Multi-creator campaigns',
      'API access for stream status',
    ],
  },
];

const PromotionPackages = ({ type, showQuickPurchase = false }: PromotionPackagesProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);

  const packages = type === 'artist' ? artistPackages : creatorPackages;

  const handleSelectPackage = (pkg: Package) => {
    if (!user) {
      toast.error('Please sign in to purchase a promotion package');
      navigate('/auth');
      return;
    }

    if (pkg.price === 'Custom') {
      setSelectedPackage(pkg);
      setShowContactDialog(true);
      return;
    }

    // TODO: When Stripe is enabled, this will trigger checkout
    // For now, show contact dialog
    setSelectedPackage(pkg);
    setShowContactDialog(true);
  };

  return (
    <>
      <div className={`grid gap-6 ${showQuickPurchase ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
        {(showQuickPurchase ? packages.filter(p => p.popular) : packages).map((pkg) => (
          <PricingCard
            key={pkg.id}
            name={pkg.name}
            price={pkg.price}
            period={pkg.period}
            description={pkg.description}
            features={pkg.features}
            popular={pkg.popular}
            onSelect={() => handleSelectPackage(pkg)}
            buttonText={pkg.price === 'Custom' ? 'Contact Us' : 'Request Promotion'}
          />
        ))}
      </div>

      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Promotion</DialogTitle>
            <DialogDescription>
              {selectedPackage?.price === 'Custom'
                ? 'Contact us for a custom promotion package tailored to your needs.'
                : `You've selected the ${selectedPackage?.name} package (${selectedPackage?.price}${selectedPackage?.period}).`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Stripe payments are coming soon! For now, please contact us to set up your promotion.
            </p>
            
            <div className="flex flex-col gap-3">
              <Button asChild className="w-full">
                <a href={`mailto:promote@cinnaflow.com?subject=Promotion Request: ${selectedPackage?.name} Package&body=Hi, I'm interested in the ${selectedPackage?.name} package for ${type === 'artist' ? 'artist' : 'creator'} promotion.%0D%0A%0D%0APackage: ${selectedPackage?.name}%0D%0APrice: ${selectedPackage?.price}${selectedPackage?.period}%0D%0A%0D%0APlease contact me to proceed.`}>
                  <Mail className="w-4 h-4 mr-2" />
                  Contact via Email
                </a>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setShowContactDialog(false);
                  navigate(type === 'artist' ? '/submit/artist' : '/submit/creator');
                }}
              >
                Submit Content First
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PromotionPackages;
