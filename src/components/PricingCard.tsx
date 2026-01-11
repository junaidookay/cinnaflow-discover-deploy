import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  popular?: boolean;
  onSelect: () => void;
  buttonText?: string;
  disabled?: boolean;
}

const PricingCard = ({
  name,
  price,
  period = '/week',
  description,
  features,
  popular = false,
  onSelect,
  buttonText = 'Get Started',
  disabled = false,
}: PricingCardProps) => {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border p-8 transition-all duration-300',
        popular
          ? 'border-primary bg-gradient-to-b from-primary/10 to-transparent scale-105 shadow-xl shadow-primary/20'
          : 'border-border bg-card hover:border-primary/50'
      )}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4" />
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">{name}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-bold text-foreground">{price}</span>
        {period && <span className="text-muted-foreground">{period}</span>}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <span className="text-foreground text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={onSelect}
        disabled={disabled}
        className={cn(
          'w-full',
          popular
            ? 'bg-primary hover:bg-primary/90'
            : 'bg-secondary hover:bg-secondary/80 text-foreground'
        )}
        size="lg"
      >
        {buttonText}
      </Button>
    </div>
  );
};

export default PricingCard;
