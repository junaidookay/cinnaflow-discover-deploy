import { Rocket, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PromotionPackages from '@/components/PromotionPackages';

interface QuickPromotionProps {
  type: 'artist' | 'creator';
}

const QuickPromotion = ({ type }: QuickPromotionProps) => {
  return (
    <div className="bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
          <Rocket className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Boost Your Reach</h3>
          <p className="text-sm text-muted-foreground">Get featured with our Pro package</p>
        </div>
      </div>

      <PromotionPackages type={type} showQuickPurchase />

      <div className="mt-4 pt-4 border-t border-border">
        <Link to="/promote">
          <Button variant="ghost" className="w-full justify-between text-muted-foreground hover:text-foreground">
            View all packages
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default QuickPromotion;
