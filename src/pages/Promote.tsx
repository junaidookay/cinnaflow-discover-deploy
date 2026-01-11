import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PromotionPackages from '@/components/PromotionPackages';
import { Music, Video, Sparkles, Zap, Shield, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Promote = () => {
  const [activeTab, setActiveTab] = useState<'artist' | 'creator'>('artist');

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Reach Thousands',
      description: 'Get your content in front of our engaged audience actively discovering new entertainment.',
    },
    {
      icon: Zap,
      title: 'Instant Visibility',
      description: 'Featured placements on homepage and category pages for maximum exposure.',
    },
    {
      icon: Shield,
      title: 'Trusted Platform',
      description: 'Sponsored content is clearly labeled, building trust with viewers.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Grow Your Audience
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold cinna-gold-text mb-6">
              Promote on CinnaFlow
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Reach thousands of viewers looking for fresh content. Get featured on our platform with transparent pricing and guaranteed placement.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* Pricing Tabs */}
          <div className="max-w-5xl mx-auto">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'artist' | 'creator')} className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12 h-14">
                <TabsTrigger value="artist" className="text-base gap-2 h-full">
                  <Music className="w-5 h-5" />
                  For Artists
                </TabsTrigger>
                <TabsTrigger value="creator" className="text-base gap-2 h-full">
                  <Video className="w-5 h-5" />
                  For Creators
                </TabsTrigger>
              </TabsList>

              <TabsContent value="artist" className="mt-0">
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-semibold text-foreground mb-2">Artist Promotion Packages</h2>
                  <p className="text-muted-foreground">Showcase your music videos and reach new fans</p>
                </div>
                <PromotionPackages type="artist" />
              </TabsContent>

              <TabsContent value="creator" className="mt-0">
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-semibold text-foreground mb-2">Creator Promotion Packages</h2>
                  <p className="text-muted-foreground">Drive traffic to your streaming channel</p>
                </div>
                <PromotionPackages type="creator" />
              </TabsContent>
            </Tabs>
          </div>

          {/* FAQ / Trust section */}
          <div className="max-w-2xl mx-auto mt-20 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-4">Questions?</h3>
            <p className="text-muted-foreground mb-6">
              Need a custom package or have questions about promotion options? We're here to help.
            </p>
            <a
              href="mailto:promote@cinnaflow.com"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              promote@cinnaflow.com
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Promote;
